# Virtual-Trail AI Try-On — SaaS API Catalog

This document specifies all endpoints, request bodies, response models, rate limits, and secure headers for the Virtual-Trail platform.

---

## 🔒 Authentication & Headers

1.  **Public Endpoints:** Require no authentication headers. Rate limited by standard burst/try-on Redis limits based on IP/Tenant rules.
2.  **Shopify Webhooks:** Require a timing-safe `X-Shopify-Hmac-SHA256` payload verification header to bypass secure checks.
3.  **Admin APIs Suite:** Protected by `AdminGuard` and require the following header:
    *   `X-Admin-Api-Key: <your-configured-admin-secret-key>`
4.  **Admin Visual Dashboards:** Secured with Express Basic Auth credentials:
    *   **Username:** `admin`
    *   **Password:** `<your-configured-admin-secret-key>`

---

## 🛒 1. Public Widget API Endpoints

### A. Initialize Try-On Job
Registers a new customer virtual try-on task in the worker pipeline.
*   **Path:** `POST /v1/tryon`
*   **Rate Limits:** Enforced Redis-backed `tryon` limits (max 3/min per IP/Tenant).
*   **Payload Schema:**
    ```json
    {
      "tenantId": "boutique-1",
      "productId": "shopify-prod-100",
      "userImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      "signature": "38a8f9cd...", // Optional: HMAC signature
      "timestamp": 178239023000  // Optional: replay check unix timestamp
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "jobId": "48b78a14-7629-4d6c-b2e5-f27ec2b33522"
    }
    ```
*   **Errors:**
    *   `400 Bad Request` (Malformed base64, missing fields, or binary validation mismatch).
    *   `429 Too Many Requests` (Rate limit threshold exceeded).

---

### B. Poll Try-On Job Status
Fetches the current status or completed styling scores and image URLs.
*   **Path:** `GET /v1/tryon/:jobId/status?tenantId=boutique-1`
*   **Caching:** Fully cached in Redis for 180s on complete/fail. Subsequent calls bypass the database completely.
*   **Response (200 OK):**
    ```json
    {
      "status": "completed",
      "imageUrl": "https://pub-***.r2.dev/boutique-1/generated/48b78a14...",
      "compliment": "This denim jacket complements your classic style beautifully!",
      "styleScore": 9.2,
      "complimentCached": true
    }
    ```

---

### C. Resolve Tenant Configuration
Serves branding rules, color schemes, and custom widget settings to the storefront script.
*   **Path:** `GET /v1/tenant/:tenantId/config`
*   **Caching:** Cached in Redis for 5 minutes (`300s`).
*   **Response (200 OK):**
    ```json
    {
      "id": "boutique-1",
      "primaryColor": "#ff007f",
      "complimentTone": "luxury",
      "logoUrl": "https://pub-***.r2.dev/boutique-1/logo.png",
      "buttonStyle": "capsule",
      "widgetTheme": "glass"
    }
    ```

---

## 🛡️ 2. Secure SaaS Admin API Suite

All administrative routes require the header `X-Admin-Api-Key: <key>`.

### A. List & Onboard Tenants
*   **Path:** `POST /admin/tenants`
*   **Payload Schema:**
    ```json
    {
      "id": "boutique-2",
      "name": "Luxury Boutique",
      "shopifyDomain": "luxury-boutique.myshopify.com",
      "features": ["tryon"],
      "config": {
        "primaryColor": "#000000",
        "complimentTone": "luxury",
        "buttonStyle": "square",
        "widgetTheme": "dark"
      }
    }
    ```

---

### B. Operational SaaS Analytics
*   **Path:** `GET /admin/analytics`
*   **Response (200 OK):**
    ```json
    {
      "totalRequests": 1420,
      "completedRequests": 1395,
      "failedRequests": 25,
      "cacheHitRate": 76.4
    }
    ```

---

### C. Live Compute Cost Matrix
*   **Path:** `GET /admin/costs`
*   **Response (200 OK):**
    ```json
    {
      "totalCostUSD": 28.45,
      "averageCostPerRequestUSD": 0.02,
      "savingsUSD": 14.20
    }
    ```

---

## 🔌 3. Shopify Webhook Endpoint

Endpoint triggered by Shopify event buses.
*   **Path:** `POST /shopify/webhooks`
*   **Auth:** Requires valid Shopify event payload signature validated via timing-safe HMAC-SHA256 check on the payload.
