# Production Cloud Deployment Guide — Virtual-Trail

This runbook documents step-by-step instructions for launching the **Virtual-Trail AI Try-On Platform** to a secure, enterprise-grade production environment.

---

## 🏗️ 1. Infrastructure Architecture Overview

Our stack operates entirely on **highly performant managed serverless tiers**, allowing you to deploy the platform 100% for free or at a minimal fixed overhead:

*   **API & Background Worker:** Co-hosted inside a single Render Web Service container or dual Railway dynamic containers.
*   **Serverless Database:** Neon PostgreSQL (zero-cold-start scaling).
*   **Atomic Queue & Throttler:** Upstash Redis (Serverless cluster, HTTP + Redis protocol).
*   **Object Storage:** Cloudflare R2 (100% free egress bandwidth, S3-compatible SDK).
*   **Storefront Widget Delivery:** Cloudflare Pages CDN (Vite static assets).
*   **AI Engine API integrations:** Segmind fashion model compute + Google Gemini Flash API.
*   **Application Monitoring:** Sentry (global exception capturing across all code bases).

---

## 🛠️ 2. Core Accounts Setup & API Keys

### A. Neon Database (Serverless PostgreSQL)
1. Register at [neon.tech](https://neon.tech) and create a new project.
2. Retrieve your **Connection String** from the dashboard.
3. Configure the environment string:
   `DATABASE_URL="postgresql://neondb_owner:***@ep-***.us-east-2.aws.neon.tech/neondb?sslmode=require"`

### B. Upstash (Serverless Redis)
1. Register at [upstash.com](https://upstash.com) and create a Redis database.
2. Select your closest AWS region for minimum latency.
3. Copy the **Redis URL** from the dashboard (enable TLS/SSL):
   `REDIS_URL="rediss://default:***@us1-***.upstash.io:6379"`

### C. Cloudflare R2 (S3-Compatible Object Storage)
1. Log in to [cloudflare.com](https://cloudflare.com) and open the **R2 Object Storage** tab.
2. Create a bucket named `virtual-trail-assets`.
3. In Cloudflare Account Settings → **Manage API Tokens**, create a new Token with **R2 Read & Write permissions**.
4. Retrieve the three variables:
   *   `R2_ACCOUNT_ID="your-cloudflare-account-id"`
   *   `R2_ACCESS_KEY_ID="your-token-access-key"`
   *   `R2_SECRET_ACCESS_KEY="your-token-secret-key"`
   *   `R2_PUBLIC_URL="https://pub-***.r2.dev"` (or bind your custom domain).

### D. Segmind & Google Gemini (AI Computes)
1. Create a Segmind account at [segmind.com](https://segmind.com), acquire credits, and retrieve your API key:
   `SEGMIND_API_KEY="SG_***"`
2. Get your Gemini Flash key at [aistudio.google.com](https://aistudio.google.com) (completely free, no billing card required):
   `GEMINI_API_KEY="AIzaSy***"`

### E. Sentry (Error Tracking & APM)
1. Register at [sentry.io](https://sentry.io) and create a new Project (select **NestJS / Node**).
2. Copy your Project **DSN URL**:
   `SENTRY_DSN="https://***@o***.ingest.us.sentry.io/***"`

---

## 🚀 3. Host API & Worker Container on Render / Railway

Because the monorepo API and worker can run as concurrent background processes in Node.js, you can bundle them into a single cost-effective Render/Railway service!

### Environment Variables Matrix
Set the following properties inside your Cloud hosting dashboard:

```env
# Database & Core
DATABASE_URL=postgresql://neondb_owner:***@ep-***.neon.tech/neondb?sslmode=require
REDIS_URL=rediss://default:***@us1-***.upstash.io:6379

# Cloudflare R2 object store
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=virtual-trail-assets
R2_PUBLIC_URL=https://pub-***.r2.dev

# AI integrations
SEGMIND_API_KEY=SG_***
GEMINI_API_KEY=AIzaSy***

# API Security configuration
ADMIN_API_KEY=your-super-secure-admin-secret-key
JWT_SECRET=your-secure-jwt-signing-secret

# Application Error Monitoring
SENTRY_DSN=https://***@o***.ingest.us.sentry.io/***

# CORS & Deploy Properties
PORT=10000
NODE_ENV=production
```

### Build & Start Directives
*   **Build Command:** `pnpm install && pnpm build`
*   **Start Command:** `pnpm start` (Runs both NestJS API server and queue worker concurrently out of a single process container, fitting completely inside free tier CPU limits!).

---

## 🌐 4. Deploying the Storefront Widget CDN

The CDN widget is built using Vite and deployed to Cloudflare Pages (or Vercel / Netlify):

1. Link your GitHub repository to [Cloudflare Pages](https://pages.cloudflare.com/).
2. Select root directory as: `apps/widget`.
3. Configure Environment Variables for the build stage:
   `VITE_API_URL="https://virtual-trail-worker.onrender.com"` (Points to your live API instance!)
4. **Build Settings:**
   *   **Framework Preset:** Vite
   *   **Build Command:** `vite build`
   *   **Output Directory:** `dist`
5. Click **Save and Deploy**. Cloudflare will compile the storefront script and distribute it globally on the edge!

---

## 🔒 5. Production CORS & Security Checks

Verify that your Render/Railway API strictly validates the CORS rules:
1. Try fetching the `/v1/tenant/:id/config` endpoint from a random browser domain. It must throw an standard CORS blocks.
2. Webhook triggers targeting `/shopify/webhooks` must have valid `X-Shopify-Hmac-SHA256` signatures to bypass timing-safe filters.
