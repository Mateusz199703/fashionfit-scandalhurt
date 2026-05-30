---
name: woocommerce-integration-builder
description: Build, debug, review, or plan WooCommerce integrations, product sync, REST API connections, webhooks, product catalog imports, variants, stock, pricing, categories, and secure credential handling. Use for WooCommerce plugin/app/backend tasks. Do not use for non-WooCommerce e-commerce platforms unless adapting the pattern.
---

# WooCommerce Integration Builder

Use this skill for building or debugging WooCommerce integrations in SaaS apps, plugins, internal tools, AI assistants, product sync systems, or admin dashboards.

## Core mindset

Act as a senior WooCommerce integration engineer and backend/API architect.

The goal is to build safe, reliable, debuggable, and maintainable WooCommerce connections, not a fragile demo that only works for one store.

## When this skill should trigger

Use this skill for:

- Connecting to WooCommerce REST API.
- Saving WooCommerce store URL, consumer key, and consumer secret.
- Product sync.
- Variants/attributes/categories/images sync.
- Webhooks.
- Stock and price updates.
- Sync logs and retry handling.
- AI assistants that need real product data from WooCommerce.
- Debugging failed WooCommerce API calls.
- WooCommerce plugin/app architecture.

Do not use this skill for:

- Generic UI work not related to WooCommerce.
- Shopify-only integrations.
- Ad copy, SEO copy, or product descriptions unless the task involves synced WooCommerce data.

## Security rules

Always enforce these rules:

- Never expose WooCommerce consumer secret to the frontend.
- Never commit credentials or `.env` values.
- Store credentials securely.
- Validate and normalize store URLs.
- Avoid logging secrets.
- Mask secrets in UI and logs.
- Use server-side API calls for WooCommerce credentials.
- Handle permission errors clearly.
- Handle rate limits, timeouts, and failed requests.

## Integration flow

For a new WooCommerce connection, implement in this order:

1. Settings UI:
   - store URL,
   - consumer key,
   - consumer secret,
   - test connection button,
   - loading/success/error states.
2. Backend validation:
   - required fields,
   - URL normalization,
   - credential presence,
   - basic format checks.
3. Test connection:
   - call a safe endpoint such as system/status or products with minimal request.
   - return clear errors.
4. Secure storage:
   - save encrypted or otherwise protected credentials when possible.
   - store per tenant/store account.
5. Product sync MVP:
   - fetch products paginated.
   - save normalized fields.
   - include external WooCommerce ID.
   - handle create/update by external ID.
   - record sync timestamp.
6. Product sync logs:
   - status,
   - started_at,
   - finished_at,
   - total fetched,
   - total saved,
   - errors.
7. Retry and error handling.
8. Webhooks after the basic sync is stable.

## Product normalization checklist

When importing products, consider:

- external_id / woo_product_id
- name
- slug
- description / short_description
- permalink
- status
- type: simple, variable, variation, grouped, external
- price
- regular_price
- sale_price
- currency if available
- stock_status
- stock_quantity
- manage_stock
- categories
- tags
- attributes
- variations
- images
- default image
- SKU
- dimensions and weight if useful
- created_at / updated_at from WooCommerce
- synced_at

## Pagination and sync rules

- Do not assume one API request fetches all products.
- Use pagination.
- Make sync idempotent.
- Use external WooCommerce IDs to upsert.
- Do not duplicate products on repeated sync.
- Handle deleted/unpublished products explicitly.
- For large stores, plan background jobs or queues.
- Store sync progress and show it in the UI.

## AI assistant rules for WooCommerce data

When WooCommerce data powers AI recommendations:

- The AI must only recommend products that exist in the synced catalog.
- If product data is incomplete, say so or ask for clarification.
- Prefer in-stock products.
- Include product ID/slug/permalink in internal outputs when useful.
- Do not invent colors, sizes, prices, stock, or materials.
- Use product metadata and attributes as the source of truth.

## Debugging checklist

For failed integrations, inspect:

1. Store URL format.
2. HTTPS availability.
3. REST API enabled.
4. Consumer key/secret permissions.
5. WordPress permalinks/API routes.
6. Firewall/WAF/Cloudflare blocking requests.
7. Authentication method.
8. Rate limits/timeouts.
9. Plugin conflicts.
10. Product endpoint pagination.
11. Response shape mismatch.
12. Server logs and request/response errors.

## Output format for implementation tasks

When implementing, final response should include:

- Files changed.
- What was implemented.
- How credentials are protected.
- How sync works.
- How errors are shown.
- Commands run.
- Remaining risks or next steps.

## Example prompt

Use `$woocommerce-integration-builder`.

Prompt example:

"Implement only the WooCommerce connection settings screen and backend test-connection endpoint. Do not implement product sync yet. Validate inputs, protect credentials, add loading/success/error states, and run lint/typecheck/build."
