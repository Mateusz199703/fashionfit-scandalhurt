---
name: saas-ui-builder
description: Build or improve modern SaaS UI, dashboards, admin panels, onboarding, settings pages, product tables, empty states, loading states, responsive layouts, Tailwind/shadcn components, and premium app interfaces. Use for frontend implementation and UX polish. Do not use for backend-only tasks.
---

# SaaS UI Builder

Use this skill when building or improving the frontend of a SaaS app, admin dashboard, customer portal, AI assistant interface, product catalog screen, settings page, onboarding flow, or e-commerce tool UI.

## Core mindset

Act as a senior product designer, frontend engineer, and UX strategist.

Prioritize clarity, hierarchy, conversion, trust, and maintainability. Build interfaces that look premium but do not become visually chaotic.

## When this skill should trigger

Use this skill for:

- SaaS dashboard UI.
- Admin panels.
- Settings screens.
- Product sync/product catalog UI.
- AI chat widgets.
- Onboarding flows.
- Billing/subscription UI.
- Tables, cards, forms, filters, navigation, sidebars.
- Tailwind, shadcn/ui, React, Next.js UI work.
- Mobile responsiveness.
- UI refactoring and visual polish.

Do not use for:

- Backend-only API work.
- Database migrations without UI.
- Security-only reviews.

## Design principles

Always follow these principles:

- Mobile-first responsive design.
- Clear information hierarchy.
- Strong but restrained visual style.
- Avoid clutter and visual noise.
- Make primary actions obvious.
- Use whitespace intentionally.
- Prefer reusable components.
- Keep UI consistent with the existing design system.
- Use accessible contrast and semantic elements.
- Every async state needs loading, empty, success, and error handling where relevant.

## SaaS dashboard structure

For admin dashboards, usually consider:

- Sidebar or top navigation.
- Current workspace/store indicator.
- Main page header with title, description, and primary CTA.
- Status cards/KPI cards.
- Main table/list/card grid.
- Filters/search.
- Empty states with next action.
- Error states with recovery path.
- Activity/logs where relevant.

## UI implementation workflow

Before changing code:

1. Inspect existing component patterns.
2. Identify the design system or styling convention.
3. Check if shadcn/ui, Tailwind, CSS modules, component library, or custom components are used.
4. Reuse existing components where possible.
5. Propose a small, reviewable UI scope.

When coding:

1. Implement the smallest complete UI slice.
2. Keep components readable.
3. Avoid huge files.
4. Extract reusable components only when reuse is real.
5. Add responsive behavior.
6. Add loading/empty/error states.
7. Avoid new dependencies unless necessary.
8. Run lint/typecheck/build if available.

## Visual quality checklist

For every UI change, check:

- Is the main action obvious within 3 seconds?
- Is the page readable on mobile?
- Is there enough spacing?
- Is there a clear title and supporting description?
- Are forms easy to understand?
- Are error messages useful and human-readable?
- Are loading states visible?
- Are empty states actionable?
- Are destructive actions protected?
- Is the design consistent with the rest of the app?

## AI/e-commerce UI rules

For fashion AI or e-commerce tools, consider:

- Product cards should include image, name, price, availability, and primary action.
- Product recommendation explanations should be short and useful.
- AI chat should not hide product results.
- Product sync screens should show progress, last sync time, and errors.
- Settings screens should clearly separate connection, AI behavior, billing, and account sections.
- User trust matters: show where data comes from and what the system can/cannot do.

## Recommended component patterns

Use these patterns when appropriate:

- `PageHeader`
- `StatCard`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `SettingsSection`
- `ProductCard`
- `DataTable`
- `StatusBadge`
- `PrimaryActionButton`
- `InlineHelpText`

Do not create these abstractions unless they fit the existing codebase or will clearly be reused.

## Output format

Final response after UI work should include:

- Files changed.
- UI changes made.
- Responsive behavior added.
- Loading/empty/error states covered.
- Commands run.
- Any visual or UX risks left.

## Example prompt

Use `$saas-ui-builder`.

Prompt example:

"Improve the WooCommerce settings page UI. Make it look like a premium SaaS dashboard, but do not change backend logic. Add loading, success, and error states, make it responsive, and run lint/typecheck/build."
