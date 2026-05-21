# Shopify Integration Setup Guide — Virtual-Trail

This document provides setup instructions, required scopes, webhook configurations, and verification checklists to integrate the Virtual-Trail SaaS platform with Shopify.

---

## ⚙️ 1. Shopify App Configuration (Shopify Partners Portal)

When creating your Custom or Public App inside the Shopify Partners Dashboard, configure the following values:

| Setting | Value | Why |
|---|---|---|
| **App URL** | `https://<YOUR_API_DOMAIN>/shopify/install` | The entry point for merchants clicking "Install" |
| **Allowed redirection URL(s)** | `https://<YOUR_API_DOMAIN>/shopify/callback` | The OAuth redirect URI for authorization code exchange |
| **API Version** | `2024-01` (or latest stable release) | Standard API version used by Virtual-Trail services |

---

## 🔑 2. Required Scopes

Ensure the app is configured with the following access scopes:
- `read_products`: Required to read product catalogs, variants, and product images for selection and syncing.
- `write_script_tags`: Required to inject the storefront `widget.js` loader dynamically without manual liquid file modifications.

Add the scopes to your `.env` configuration file:
```env
SHOPIFY_SCOPES=read_products,write_script_tags
```

---

## 🪝 3. Webhook Subscriptions

Virtual-Trail utilizes Shopify webhooks to automatically keep store catalogs and widget configurations synchronized with merchant changes.

### Webhook URL Endpoint:
`POST https://<YOUR_API_DOMAIN>/shopify/webhooks`

### Required Event Topics:
1.  **`app/uninstalled`**
    - *Purpose*: Triggered when the merchant uninstalls the app. Cleans up Redis access token cache, deactivates features for the tenant, and removes storefront scripts.
2.  **`products/create`**
    - *Purpose*: Triggered when a new product is added to the Shopify catalog. Imports product details and executes the Smart Garment Image Selection System to find the best try-on image.
3.  **`products/update`**
    - *Purpose*: Triggered when product details or image collections are updated. Automatically re-evaluates the best garment image based on updated images/tags.
4.  **`products/delete`**
    - *Purpose*: Triggered when a product is deleted. Purges local product entries to maintain catalog synchronization.

---

## 🧪 4. Offline Development & Testing Mock Mode

Since real merchant credentials might not be available during local development, Virtual-Trail has an offline mock testing layer.

### How to trigger mock mode:
Ensure your `.env` contains:
```env
MOCK_SHOPIFY=true
```
Or use the default placeholder client credentials in `.env`:
`SHOPIFY_API_KEY=mock_client_id_placeholder`
`SHOPIFY_API_SECRET=mock_client_secret_placeholder`

### Run Offline E2E Tests:
Run the offline integration test suite using:
```bash
npx tsx apps/api/src/modules/shopify/shopify-mock.ts
```
This script runs a complete simulated cycle of onboarding, Redis token storage, product syncing with image selection heuristics, webhook creation/deletion/update, and app uninstallation, validating results directly against Neon Database and Upstash Redis.

---

## 📋 5. Staging/Production Verification Checklist

Once client store access is available, perform the following validation steps:

- [ ] **Install Flow Redirect**: Navigate to `GET /shopify/install?shop=your-store.myshopify.com`. Verify redirection to Shopify's oauth confirmation dialog.
- [ ] **State Security Verification**: Intercept callback URL parameter modification and ensure the system throws an `UnauthorizedException` if state values do not match.
- [ ] **Token Expiry**: Verify the token is stored in Redis under the key `shopify:your-store.myshopify.com:token` with a TTL of 86400 (24 hours).
- [ ] **ScriptTag Injection**: Verify the ScriptTag is registered via Shopify REST API and loads `widget.js` on the storefront.
- [ ] **storefront Auto-Bootstrap**: Open a product page on the store storefront, inspect the browser console, and verify:
  - `TryOnWidget: Auto-bootstrap triggered for shop: ...` logs are present.
  - The floating launcher button "Try it on" renders in the bottom-right corner of the page.
- [ ] **webhook HMAC Validation**: Send a mock webhook request with an altered `X-Shopify-Hmac-SHA256` header and confirm that the API returns `401 Unauthorized`.
- [ ] **Uninstall Cleanup**: Uninstall the app from the store. Verify the tenant's features lists are cleared in the PostgreSQL database and Redis tokens are deleted.
