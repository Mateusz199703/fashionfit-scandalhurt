# FashionFit AI — Brand Guidelines

Source reference: `docs/reference/ fashionfit-landing-reference.html` (landing visual identity).

## 1) Brand Style

FashionFit AI brand language is:
- premium, modern, AI-native
- fashion-forward but trustworthy for commerce
- high-contrast, clean, confident
- expressive through glow, gradients and glass surfaces, but never noisy

Core feeling:
- intelligent assistant + luxury commerce UX
- "precision and confidence" over playful or generic SaaS look

## 2) Color System

### Core brand accents
- `--accent`: `#7B61FF`
- `--accent2`: `#4F46E5`
- `--violet`: `#8B5CFF`
- `--orange`: `#FFB15C`

Use accents mainly for:
- primary CTA
- focus/active states
- key metrics and highlights
- controlled glows and gradient emphasis

### Dark theme tokens (primary mode)
- `--bg`: `#0B0B0B`
- `--bg-deep`: `#050505`
- `--surface`: `rgba(255,255,255,.03)`
- `--surface-2`: `rgba(255,255,255,.05)`
- `--glass`: `rgba(20,20,24,.55)`
- `--text`: `#FFFFFF`
- `--text-dim`: `rgba(255,255,255,.55)`
- `--text-faint`: `rgba(255,255,255,.48)`
- `--border`: `rgba(255,255,255,.08)`
- `--border-strong`: `rgba(255,255,255,.14)`
- `--glow`: `rgba(123,97,255,.45)`

### Light theme tokens (supported variant)
- `--bg`: `#F5F5F7`
- `--bg-deep`: `#FFFFFF`
- `--surface`: `rgba(11,11,11,.025)`
- `--surface-2`: `rgba(11,11,11,.04)`
- `--glass`: `rgba(255,255,255,.7)`
- `--text`: `#0B0B0B`
- `--text-dim`: `rgba(11,11,11,.6)`
- `--text-faint`: `rgba(11,11,11,.52)`
- `--border`: `rgba(11,11,11,.1)`
- `--border-strong`: `rgba(11,11,11,.16)`
- `--glow`: `rgba(123,97,255,.28)`

### Semantic UI colors (for product UI consistency)
- Success: prefer emerald/lime accent (example from ref KPI): `#4ade80`
- Error: use clear red on same neutral surfaces (recommended product token: `#ef4444`)
- Warning: use warm accent family anchored in brand orange (`#FFB15C`)
- Info: brand accent (`#7B61FF`)

## 3) Typography

Primary typefaces:
- Headings/display: `Space Grotesk` (600–700)
- Body/UI text: `Inter` (400–600)

Typography rules:
- headings: tight tracking (`~ -0.02em`), compact line-height (`~1.05`)
- body copy: readable (`~1.5–1.6`)
- UI labels: restrained uppercase only for micro labels/eyebrows
- avoid decorative/novel fonts outside this pair

## 4) UI Principles

- Contrast first: content must remain readable over glass/gradient backgrounds.
- Controlled motion: subtle reveal, hover lift, glow pulse; never distract from task.
- Layer clarity: base background -> surface -> elevated glass panel -> interactive control.
- Accent discipline: purple/indigo/orange are highlights, not full-page fills.
- Rounded geometry: soft radii on cards, pills, inputs, CTA.
- Data confidence: metrics and recommendations should look precise, not playful.

## 5) Dashboard Style Rules

Layout and surfaces:
- use dark-first neutral canvas with bordered panels
- cards: subtle glass/surface + 1px border + mild shadow/glow on interaction
- keep dense information inside clearly segmented cells/sections

Components:
- KPI tiles: bold numeric values (`Space Grotesk`), muted labels (`Inter`)
- charts: brand gradient bars/lines on quiet background
- insights: highlighted panel with accent border/background tint

Interaction:
- hover: slight `translateY` and border emphasis
- focus-visible: visible accent ring (`2px` minimum)
- transitions: cubic-bezier easing similar to landing (`.16,1,.3,1`)

## 6) Widget Style Rules

- preserve compact, conversion-first UX
- high contrast and fast scanability on product pages
- cards and bubbles should use neutral surfaces with accent highlights
- CTA must be obvious but not oversized relative to product content
- recommendation visuals: clean image block, concise metadata, one clear action
- do not overload widget with heavy glow/noise effects; keep performance-friendly

## 7) Component State Guidance

### Buttons
- Primary:
  - filled gradient (`accent -> accent2`)
  - white text
  - hover: small lift + glow/shadow
- Secondary/outline:
  - surface background + border
  - hover: stronger border, slight bg elevation
- Disabled:
  - lower contrast, no lift, no glow, no ambiguous click affordance

### Cards/Panels
- Default:
  - rounded corners (14–26px depending on scale)
  - thin border (`--border`)
  - surface/glass background
- Hover/elevated:
  - `--border-strong` or accent border for featured card
  - slight upward movement only

### Inputs
- Default:
  - surface background
  - `--border-strong`
  - `Inter` body size
- Focus:
  - accent border + visible focus ring
- Placeholder:
  - `--text-faint`

### Locked state
- Must be explicit and calm:
  - locked badge/pill
  - short message + upgrade CTA
  - keep feature visible but disabled/read-only
- Styling:
  - subdued surface with accent border/label, not hidden silently

### Error state
- clear message near action area
- do not rely on color only (icon/text prefix helpful)
- keep retry path obvious
- avoid exposing technical backend details to users

### Loading state
- use compact spinner/skeleton with contextual text
- preserve layout to avoid jumps
- disable conflicting actions while request in flight

## 8) Things to Avoid

- Generic SaaS look (flat white + random blue + no identity)
- Overusing gradients/glow on every element
- Low-contrast text on glass backgrounds
- Multiple competing accent colors outside defined palette
- Large motion/animation in dense task flows (dashboard/widget)
- Inconsistent component radii, borders, and spacing across modules
- Hidden locked states (must be visible with clear upgrade path)
- Silent failures without error or retry guidance

## 9) Practical Implementation Notes

- Use tokenized CSS variables for colors and states; avoid hardcoded one-off values.
- Reuse component patterns across dashboard/widget for familiarity.
- Keep dark and light theme parity for readability and state semantics.
- Respect reduced-motion preferences for all animated UI.

