# Agent Instructions — AI Virtual Try-On SaaS

> Read this file completely before writing any code.

---

## What you are building

A multi-tenant SaaS platform that adds an AI Virtual Try-On widget to Shopify fashion stores.

Customer visits a product page → clicks "Try it on" → uploads a photo → AI generates an image of them wearing the product → they see a compliment and style score.

There is also a "Size Intelligence" feature (separate spec) that shares the same infrastructure but has zero shared pipeline logic.

---

## Repository structure

```
tryon-saas/
├── apps/api/        NestJS HTTP API
├── apps/worker/     BullMQ AI processor (standalone Node process)
├── apps/widget/     React widget bundle (Vite, IIFE output)
├── libs/db/         Prisma schema + repository functions
├── libs/queue/      BullMQ queue + job type definitions
├── libs/ai/         Segmind client, Gemini client, image utils
├── libs/storage/    Cloudflare R2 wrapper
├── libs/config/     Typed env var reader (single source of truth)
└── libs/tenant/     Tenant resolution + caching logic
```

All packages use TypeScript strict mode. Package manager is pnpm with workspaces.

---

## Non-negotiable rules

### 1. Never write Docker files
The developer cannot run Docker. Do not create `Dockerfile`, `docker-compose.yml`, or any container configuration. All services run as plain Node processes.

### 2. No OpenAI. Use Gemini Flash
The project does not have an OpenAI account. Do not install the `openai` npm package. Do not reference OpenAI APIs anywhere. The compliment generator uses `@google/generative-ai` with `gemini-2.0-flash`. This is free up to 1,500 requests/day — no billing setup required.

### 3. Never put AI keys in frontend code
`SEGMIND_API_KEY` and `GEMINI_API_KEY` are server-side only. They live in the worker process. They must never appear in the widget bundle, API responses, logs, or error messages.

### 4. Never process AI inside an HTTP request
The API receives the request, validates it, saves it, enqueues a job, and returns a `jobId`. All Segmind and Gemini calls happen exclusively in `apps/worker`. Violating this blocks the API server and makes retries impossible.

### 5. Always scope database queries by tenantId
Every query touching tenant data must include `WHERE tenant_id = ?`. Use the typed repository functions in `libs/db` — never write raw queries in app code.

### 6. Type everything
No `any`. No implicit `any`. Use `unknown` and narrow. Every function has an explicit return type. Every external API response (Segmind, Gemini, Shopify) is validated with zod before use.

### 7. One file, one responsibility
Each file does one thing. A processor file only processes. A client file only makes HTTP calls. A repository file only talks to the database. If you feel like adding a helper to a module file, put it in a `utils.ts` in that module.

### 8. Cache compliments aggressively
The compliment (Gemini call) is cached per `{tenantId}:{productId}:{tone}` for 24 hours. Many customers will try the same garment — the second customer gets the cached result with zero AI cost. This is a hard requirement, not optional.

### 9. Compress images before Segmind
Always run `compressForTryOn()` from `libs/ai/src/image.utils.ts` before uploading user images and before calling Segmind. Smaller images = faster calls = fewer timeouts = fewer retries = lower cost.

### 10. Widget polls at 3-second intervals, not 2
The free Upstash Redis tier allows 10,000 commands per day. 2-second polling would exhaust this faster than 3-second polling. Use 3000ms.

---

## How to receive a task

Tasks are written in `development-plan.md` as `AGENT_TASK_XXX` blocks. Each block has a description, files to create or modify, typed interfaces, and a checkpoint.

When assigned a task, output:
1. Files you will create or modify
2. Any blocking questions (ask only if genuinely ambiguous — one question maximum)
3. Then implement

---

## Code patterns

### Config access

```typescript
// libs/config/src/index.ts
// This is the ONLY place process.env is read. All other code imports from here.

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  database: { url: requireEnv('DATABASE_URL') },
  redis:    { url: requireEnv('REDIS_URL') },
  r2: {
    accountId:       requireEnv('R2_ACCOUNT_ID'),
    accessKeyId:     requireEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    bucketName:      requireEnv('R2_BUCKET_NAME'),
    publicUrl:       requireEnv('R2_PUBLIC_URL'),
  },
  segmind: { apiKey: requireEnv('SEGMIND_API_KEY') },
  gemini:  { apiKey: requireEnv('GEMINI_API_KEY') },  // NOT openai
  shopify: {
    apiKey:    requireEnv('SHOPIFY_API_KEY'),
    apiSecret: requireEnv('SHOPIFY_API_SECRET'),
  },
  jwt:   { secret: requireEnv('JWT_SECRET') },
  admin: { apiKey: requireEnv('ADMIN_API_KEY') },
};
```

### NestJS module layout

```
modules/tryon/
  tryon.module.ts       imports, providers, controllers
  tryon.controller.ts   HTTP routes only — no business logic
  tryon.service.ts      business logic — calls repos, enqueues jobs
  tryon.dto.ts          request/response DTOs with class-validator
  tryon.types.ts        TypeScript interfaces for this module
```

### Controller pattern

```typescript
@Post()
async createTryOn(@Body() dto: CreateTryOnDto): Promise<CreateTryOnResponseDto> {
  return this.tryonService.create(dto);
}
```

### Service pattern

```typescript
async create(dto: CreateTryOnDto): Promise<CreateTryOnResponseDto> {
  const imageBuffer  = this.image.decode(dto.userImage);
  this.image.validate(imageBuffer);                         // magic bytes + size
  const compressed   = await compressForTryOn(imageBuffer); // always compress
  const tenant       = await this.tenantService.resolve(dto.tenantId);
  const product      = await this.productRepo.findByTenantAndShopifyId(tenant.id, dto.productId);
  const request      = await this.tryonRepo.create({ tenantId: tenant.id, productId: product.id });
  const imageKey     = await this.storage.upload(tenant.id, request.id, compressed);
  await this.tryonRepo.update(request.id, { userImageKey: imageKey });
  await this.queue.add(QUEUE_NAMES.TRYON, buildJobPayload(request, tenant, product));
  return { jobId: request.id };
}
```

### Worker processor pattern

```typescript
async function processTryOn(job: Job<TryonJobPayload>): Promise<void> {
  const start = Date.now();
  const { requestId, tenantId, productId, productImageUrl, userImageKey, config } = job.data;

  await db.updateTryonRequest(requestId, { status: 'processing' });

  // Step 1: get user image URL
  const userImageUrl = await r2.getSignedUrl(userImageKey);

  // Step 2: check compliment cache BEFORE Segmind (don't waste Segmind calls if we can avoid it)
  const cacheKey = `compliment:${tenantId}:${productId}:${config.complimentTone}`;
  const cached = await redis.get(cacheKey);
  let complimentResult = cached ? JSON.parse(cached) : null;
  const complimentCached = !!cached;

  // Step 3: call Segmind
  const { imageBuffer } = await segmind.generateTryOn({
    userImageUrl,
    garmentImageUrl: productImageUrl,
    model: config.segmindModel,
  });

  // Step 4: upload result
  const generatedKey = `${tenantId}/generated/${requestId}`;
  await r2.upload(generatedKey, imageBuffer, 'image/jpeg');

  // Step 5: generate compliment (only if not cached)
  if (!complimentResult) {
    complimentResult = await gemini.generateCompliment({ tone: config.complimentTone });
    await redis.set(cacheKey, JSON.stringify(complimentResult), 'EX', 86400);
  }

  // Step 6: save results
  const elapsed = Date.now() - start;
  await db.updateTryonRequest(requestId, {
    status: 'completed',
    generatedImageKey: generatedKey,
    compliment: complimentResult.compliment,
    styleScore: complimentResult.score,
    processingTimeMs: elapsed,
    complimentCached,
  });

  await redis.set(`tryon:${requestId}:status`, 'completed', 'EX', 180);
  logger.info({ requestId, tenantId, elapsed, complimentCached }, 'tryon_completed');
}
```

### Gemini compliment — never throw

```typescript
// The compliment is cosmetic. A bad compliment must NEVER fail the job.
// Always catch, always return a fallback.
try {
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text().trim());
} catch {
  return { compliment: '✨ This outfit looks amazing on you!', score: 8.0 };
}
```

### Zod validation for external APIs

```typescript
// Always validate Segmind and Gemini responses before trusting them.
const SegmindResponseSchema = z.object({
  image: z.string().min(1),
  status: z.literal('success'),
});

const raw = await axios.post(url, payload, { timeout: 60000 });
const parsed = SegmindResponseSchema.safeParse(raw.data);
if (!parsed.success) {
  throw new SegmindError(`Unexpected response: ${parsed.error.message}`);
}
```

### Error classes — one per domain

```typescript
export class TenantNotFoundError extends Error {
  constructor(id: string) { super(`Tenant not found: ${id}`); this.name = 'TenantNotFoundError'; }
}
export class SegmindError extends Error {
  constructor(msg: string) { super(msg); this.name = 'SegmindError'; }
}
export class ImageValidationError extends Error {
  constructor(msg: string) { super(msg); this.name = 'ImageValidationError'; }
}
```

---

## Queue job type

```typescript
// libs/queue/src/index.ts
export interface TryonJobPayload {
  requestId:       string;
  tenantId:        string;
  productId:       string;  // needed for compliment cache key
  productImageUrl: string;
  userImageKey:    string;  // R2 key — worker generates signed URL
  config: {
    segmindModel:   string;
    complimentTone: 'friendly' | 'luxury' | 'playful';
  };
}

export const QUEUE_NAMES = {
  TRYON:   'tryon-queue',
  CLEANUP: 'cleanup-queue',
} as const;

export const JOB_OPTIONS = {
  TRYON: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
};
```

---

## Tenant resolution flow

```
1. Extract tenantId from request body (POST) or query param (GET)
2. Check Redis: GET tenant:{tenantId}:config
   HIT  → parse, attach to req.tenant, continue
   MISS → step 3
3. Query DB: SELECT tenants JOIN tenant_configs WHERE id = tenantId
   NOT FOUND → throw TenantNotFoundError → 404
   FOUND     → SET tenant:{tenantId}:config EX 300, attach, continue
```

Implement as a NestJS `TenantGuard`. Apply to all `/v1/*` routes.

---

## Image handling

### Validation (API layer — before anything else)

```typescript
function validateUserImage(base64: string): Buffer {
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.length > 5 * 1024 * 1024) {
    throw new ImageValidationError('Image must be under 5MB');
  }

  const isJpg  = buffer[0] === 0xFF && buffer[1] === 0xD8;
  const isPng  = buffer[0] === 0x89 && buffer[1] === 0x50;
  const isWebp = buffer.slice(8, 12).toString() === 'WEBP';

  if (!isJpg && !isPng && !isWebp) {
    throw new ImageValidationError('Image must be JPG, PNG, or WebP');
  }

  return buffer;
}
```

### Compression (API layer — after validation, before upload)

```typescript
// Always compress. Never skip.
const compressed = await compressForTryOn(validatedBuffer);
// compressed is now max 1024px, JPEG 85% — typically 80-90% smaller
```

### R2 key structure

```
{tenantId}/uploads/{requestId}     compressed user photo  — deleted after 24h
{tenantId}/generated/{requestId}   AI result              — deleted after 7 days
```

Store only the key in the database. Generate signed URLs (1-hour expiry) at read time.

---

## Logging format

Use Pino. Every log must include:

```typescript
logger.info({
  requestId: string,
  tenantId:  string,
  event:     string,       // e.g. 'tryon_queued', 'tryon_completed', 'tryon_failed'
  durationMs?: number,
  complimentCached?: boolean,
  error?: string,          // message only — never full stack in production
}, 'human readable message');
```

Never log: API keys, base64 image data, Shopify access tokens.

---

## Widget-specific rules

### Bundle constraints

- Output format: IIFE — must work with a plain `<script>` tag, no module loader
- No external runtime dependencies except React (bundled in)
- Target: under 60kb gzip
- TailwindCSS with purge — include only classes used in widget components
- Prefix all CSS classes with `tryon-` to avoid collisions with the host page

### Global entry

```typescript
declare global {
  interface Window {
    TryOnWidget: { init(options: { tenantId: string; productId: string }): void };
  }
}

window.TryOnWidget = {
  init({ tenantId, productId }) {
    // 1. fetch config
    // 2. inject button
    // 3. mount React into isolated div
  },
};
```

### Polling — 3 seconds, not 2

```typescript
// usePolling.ts
const POLL_INTERVAL_MS = 3000;  // not 2000 — saves Upstash commands
const MAX_ATTEMPTS = 40;         // 2 minutes max
```

### Do not break the host page

- Never touch `document.body.style`
- Never intercept global events
- Never read or write `localStorage` or `sessionStorage`
- Render inside a `div` you create — never modify existing DOM outside it
- The modal overlay uses `position: fixed` (acceptable — widget creates its own stacking context)

---

## What agents must NOT do

- Create any Docker file or compose file
- Install or reference the `openai` npm package
- Call OpenAI APIs — use Gemini Flash only
- Process AI inside the HTTP request cycle
- Store image binary in PostgreSQL
- Skip image compression before Segmind
- Poll the DB on every widget poll — check Redis cache first
- Add new env vars without adding them to `libs/config/src/index.ts`
- Write a new endpoint without adding it to the routes table in `architecture.md`
- Use 2-second polling intervals in the widget

---

## Checkpoint protocol

After completing each `AGENT_TASK_XXX`, output exactly this:

```
✅ AGENT_TASK_XXX complete

Files created:
  - path/to/file.ts

Files modified:
  - path/to/existing.ts  (what changed)

Checkpoint:
  [exact command or action to verify the task works]

Blockers for developer:
  [anything only the developer can do — e.g. "add GEMINI_API_KEY to .env"]
```

---

## When blocked

Say immediately:

> "Blocked on [X] because [Y]. To unblock: [specific action]."

Do not write placeholder code, `// TODO` comments, or continue past a blocker silently.
