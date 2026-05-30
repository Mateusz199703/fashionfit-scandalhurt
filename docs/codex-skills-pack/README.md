# Codex Fashion AI Skills Pack

This pack contains 5 Codex skills designed for building fashion AI, e-commerce SaaS, WooCommerce integrations, modern SaaS dashboards, and safer MVP workflows.

## Included skills

1. `fashion-ai-app-architect`
   - Plans fashion/e-commerce AI applications before coding.
   - Best for AI stylist, virtual shopping assistant, WooCommerce SaaS, product recommendation systems.

2. `woocommerce-integration-builder`
   - Helps build safe WooCommerce integrations.
   - Best for REST API connection, product sync, credentials, variants, categories, webhooks, sync logs.

3. `saas-ui-builder`
   - Helps build premium SaaS/admin UI.
   - Best for dashboard screens, settings pages, tables, onboarding, loading/empty/error states.

4. `strict-code-reviewer`
   - Reviews code strictly before acceptance.
   - Best for diff review, security, missing tests, regressions, overengineering.

5. `mvp-scope-guardian`
   - Controls scope and prevents overengineering.
   - Best for large app ideas, roadmap, MVP planning, deciding what to build now vs later.

## Recommended repo installation

Copy the `.agents` folder into the root of your project repository:

```bash
cp -R .agents /path/to/your/project/
```

Your project should then look like this:

```text
your-project/
  AGENTS.md
  .agents/
    skills/
      fashion-ai-app-architect/
        SKILL.md
      woocommerce-integration-builder/
        SKILL.md
      saas-ui-builder/
        SKILL.md
      strict-code-reviewer/
        SKILL.md
      mvp-scope-guardian/
        SKILL.md
```

Then open Codex in your project root:

```bash
cd /path/to/your/project
codex
```

In Codex, run:

```text
/skills
```

or invoke skills explicitly by typing:

```text
$fashion-ai-app-architect
$woocommerce-integration-builder
$saas-ui-builder
$strict-code-reviewer
$mvp-scope-guardian
```

If Codex does not detect new skills, restart the Codex session.

## Recommended global installation

Use this if you want the skills available in every project:

```bash
mkdir -p "$HOME/.agents/skills"
cp -R .agents/skills/* "$HOME/.agents/skills/"
```

Then restart Codex.

## Best workflow for Mateusz-style projects

For a new fashion AI / WooCommerce / SaaS project, use this order:

```text
$mvp-scope-guardian
Cut this idea down to the smallest MVP. Define the core user flow, must-have features, later features, and first implementation task. Do not write code yet.
```

Then:

```text
$fashion-ai-app-architect
Plan the architecture for the MVP. Include frontend, backend, database, AI layer, WooCommerce integration, API routes, user flows, and implementation milestones. Do not write code yet.
```

Then:

```text
$woocommerce-integration-builder
Implement only the WooCommerce connection settings screen and backend test-connection endpoint. Do not implement product sync yet. Protect credentials and run lint/typecheck/build.
```

Then:

```text
$saas-ui-builder
Improve the settings screen so it looks like a premium SaaS dashboard. Add loading, success, error, and mobile states. Do not change backend logic.
```

Finally:

```text
$strict-code-reviewer
Review the current diff before I accept it. Focus on security, WooCommerce credential handling, missing tests, regressions, and overengineering.
```

## Important notes

- These skills are instruction-only. They do not run scripts or install dependencies.
- Keep tasks small and reviewable.
- Use `AGENTS.md` for always-on project rules.
- Use skills for repeatable workflows.
- Use MCP/plugins when Codex needs external tools or documentation.
