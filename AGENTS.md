# AGENTS.md Add-on for Fashion AI / WooCommerce SaaS Projects

Add this section to your project `AGENTS.md` if this repository is a fashion AI, WooCommerce, or e-commerce SaaS project.

## Product context

This project is a fashion/e-commerce AI application. It may include WooCommerce integration, product sync, AI product recommendations, a SaaS admin dashboard, and a customer-facing assistant/widget.

## Working rules

- Do not build the entire platform at once.
- Always split work into small, reviewable milestones.
- Before implementing large features, use the relevant skills:
  - `$mvp-scope-guardian` for scope control.
  - `$fashion-ai-app-architect` for architecture and milestones.
  - `$woocommerce-integration-builder` for WooCommerce integration.
  - `$saas-ui-builder` for dashboard/UI work.
  - `$strict-code-reviewer` before accepting larger changes.
- Protect WooCommerce credentials and never expose secrets to frontend code.
- AI recommendations must be grounded in real synced product data.
- Do not invent product prices, stock, colors, materials, or sizes.
- Add loading, empty, success, and error states for user-facing UI.
- Prefer a working MVP over advanced features.
- Run lint/typecheck/build/tests when available and report the results.

## Definition of done

A task is done only when:

- The requested feature works.
- The implementation is small and reviewable.
- No secrets are exposed.
- Errors are handled clearly.
- Relevant UI states are implemented.
- Commands/checks were run or clearly explained if unavailable.
- The final response lists changed files, verification, and remaining risks.

- ## Project source of truth

The main product brief is stored in PROJECT_BRIEF.md.

Before planning or implementing major features, always read PROJECT_BRIEF.md.

Fashion Fit AI is one modular SaaS platform for fashion ecommerce stores.

Do not create separate repositories or standalone apps for individual modules.

Core modules:
- AI Fashion Stylist Advisor
- Virtual Try-On
- Size Recommendation
- Product Recommendations
- Outfit Builder
- WooCommerce Integration
- Merchant Dashboard
- Storefront Widget
- Analytics
- Billing and subscription plans

Subscription plans control which modules are enabled for each store/account.

When adding features:
- Reuse existing backend, dashboard, widget, plugin and database patterns.
- Keep modules isolated internally but integrated into the same SaaS platform.
- Add module access checks for paid features.
- Show locked or upgrade states for unavailable modules.
- Do not build advanced PRO features before the MVP core flow works.
