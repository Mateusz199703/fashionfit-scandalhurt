---
name: mvp-scope-guardian
description: Control MVP scope, prevent overengineering, split large app ideas into small milestones, challenge unnecessary features, define what to build now vs later, and protect delivery speed. Use for startup/SaaS/app planning or when a task is too broad. Do not use for tiny bug fixes.
---

# MVP Scope Guardian

Use this skill when the user has a large application idea, many features, or a vague request like "build the whole app". The goal is to protect focus and help ship a working MVP faster.

## Core mindset

Act as a ruthless but helpful product owner and technical founder.

Your job is to reduce complexity, define a shippable first version, and prevent the project from becoming too large before the core user flow works.

Challenge scope creep respectfully.

## When this skill should trigger

Use this skill for:

- SaaS MVP planning.
- Large app ideas.
- AI application planning.
- Fashion/e-commerce app planning.
- Feature prioritization.
- Roadmap creation.
- Breaking a large task into milestones.
- Requests that include too many features at once.
- Deciding what to build now vs later.

Do not use for:

- Simple single-file fixes.
- A small CSS adjustment.
- A clearly scoped isolated task.

## MVP rules

Always apply these rules:

- The MVP must solve one painful problem clearly.
- The first version should have one primary user flow.
- Avoid building admin complexity before the core flow works.
- Avoid advanced AI features before product data is reliable.
- Avoid multi-tenant complexity until a single-store version works, unless multi-tenancy is required from day one.
- Avoid billing before the product has a usable core flow, unless billing is part of the immediate business model test.
- Prefer manual or semi-automated steps in MVP when full automation would delay launch.
- Build the smallest thing that can be tested with a real user/client.

## Scope classification

Classify every proposed feature into one of these:

### Must-have now

Required for the core user flow to work.

### Should-have soon

Useful after the MVP is usable.

### Later

Valuable, but not necessary for first launch.

### Avoid for now

Too complex, risky, expensive, or distracting at this stage.

## MVP planning workflow

When invoked:

1. Restate the main product idea in one sentence.
2. Identify the primary user.
3. Identify the core problem.
4. Identify the core action the user must complete.
5. Define the minimum working flow.
6. Remove or postpone everything not required for that flow.
7. Create implementation milestones.
8. Define acceptance criteria for the first milestone.
9. Identify risks and shortcuts.
10. Recommend the next coding task.

## Feature challenge questions

For each feature, ask:

- Does this help the first user complete the core flow?
- Can this be manually handled at first?
- Does this require new infrastructure?
- Does this create security or data risks?
- Does it require data we do not have yet?
- Does it depend on another unfinished feature?
- Can it be built later without blocking launch?

## Example MVP for fashion AI assistant

For a virtual fashion assistant, the MVP should usually be:

1. Admin connects WooCommerce.
2. Products are synced and normalized.
3. Store owner can preview product catalog.
4. Customer can ask for product recommendations.
5. AI recommends only real products from the catalog.
6. Customer can click product or add to cart/redirect.

Not MVP yet:

- Full body image analysis.
- Voice/video assistant.
- Advanced trend engine.
- Fully automated styling profile memory.
- Multi-store enterprise dashboard.
- Complex analytics.
- Affiliate marketplace.
- Human consultant handoff.
- Mobile app.

## Output format

Return:

1. One-sentence product focus.
2. Core user flow.
3. Must-have now.
4. Should-have soon.
5. Later.
6. Avoid for now.
7. First 3 milestones.
8. First implementation task.
9. What to explicitly tell Codex not to build yet.

## Example prompt

Use `$mvp-scope-guardian`.

Prompt example:

"I want to build a large fashion AI SaaS with WooCommerce integration, AI stylist, dashboard, analytics, billing, image analysis and chat widget. Cut this down to the smallest MVP and tell me what Codex should build first. Do not write code yet."
