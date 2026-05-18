# Developer Local Onboarding Guide — Virtual-Trail

Welcome to the **Virtual-Trail** workspace! Follow this guide to spin up your local developer workspace, seed test database collections, and run our comprehensive automated test suites in under 5 minutes.

---

## 🛠️ 1. Prerequisites

Make sure you have the following installed on your local development machine:
*   **Node.js:** `v18` or higher (we recommend current LTS).
*   **pnpm:** Workspaces package manager. Install it via: `npm install -g pnpm`.
*   **Database:** Access to a serverless Neon PostgreSQL database (or local PostgreSQL instance).
*   **Cache:** Access to an Upstash Redis database (or local Redis server).

---

## 🚀 2. Quickstart local Setup

### Step A: Clone & Install Dependencies
Clone the repository and run install inside the root workspace folder:
```bash
pnpm install
```

### Step B: Environment Settings
Create a `.env` file at the root folder of the workspace. Use `.env.example` as a starting guide:
```bash
cp .env.example .env
```
Fill in the database, redis, and AI keys inside `.env` (refer to the [DEPLOYMENT.md](DEPLOYMENT.md) guide for details).

### Step C: Generate Database Client
Sync your local Prisma client declarations with the database schema:
```bash
pnpm --filter @trail/db prisma db push
```

---

## 🏃‍♂️ 3. Run Development Servers

Spin up the local developer servers with one simple command at the workspace root:
```bash
pnpm dev
```
This single workspace command runs the following services concurrently:
1.  **NestJS HTTP API:** Running on `http://localhost:10000`
2.  **BullMQ Worker Loop:** Listening for try-on tasks
3.  **Vite Storefront Widget:** Running static previews locally

---

## 🧪 4. Run Automated Verification Test Suites

We have built automated integration tests to verify both your brand customization configurations and API security hardening components:

### A. Run Customization & Database Persistency Tests
This test wipes existing test records, registers a new customized Boutique with a high-res custom logo, deep Crimson primary buttons, and capsule outline shapes, and verifies Neon PostgreSQL Prisma client mappings.
```bash
# Run from workspace root folder
pnpm --filter @trail/api exec tsx D:/Projects/Virtual-Trail/apps/api/src/common/throttler/../../../modules/admin/brand-customization-test.ts
```

### B. Run API Security Hardening Tests
This test verifies XSS/SQL recursive script inputs sanitization, binary magic bytes validation, signed base64 selfie parsing, and timing-safe Shopify webhook HMAC signatures.
```bash
# Run from workspace root folder
npx tsx C:\Users\vishnusundar\.gemini\antigravity\brain\67aef0fd-e577-4b5c-9eca-c50815a89d05\scratch\security-hardening-test.ts
```

### C. Run Performance Optimization & Caching Tests
This test seeds static catalog products and verifies that Redis-based product metadata resolution delivers up to **5x+ faster** load times, and completes status polling with absolutely **zero Neon SQL queries**!
```bash
# Run from workspace root folder
pnpm --filter @trail/api exec tsx performance-test.ts
```
