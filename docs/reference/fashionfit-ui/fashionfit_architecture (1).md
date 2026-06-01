# FashionFit AI — Architektura wdrożenia (graficzna + kodowa)

> Wersja: czerwiec 2026 · Adresat: tech lead, architekt, lead designer, frontend/backend
> Dokumenty towarzyszące: `build_playbook.md` (kiedy), `visual_spec.md` (jak wygląda), `fashionfit_app.html` / `fashionfit_auth.html` (mockupy).
> Ten dokument odpowiada na jedno pytanie: **jak technicznie zbudować to tak, żeby warstwa graficzna i kodowa były jednym organizmem.**

---

## Spis treści

1. [Model dwuwarstwowy — jak grafika łączy się z kodem](#1-model-dwuwarstwowy)
2. [Architektura graficzna (design → token → kod)](#2-architektura-graficzna)
3. [Architektura kodowa (monorepo, apps, packages, services)](#3-architektura-kodowa)
4. [Architektura danych i kontrakty API](#4-architektura-danych-i-api)
5. [Architektura warstwy AI](#5-architektura-warstwy-ai)
6. [Architektura widgetu (embed w cudzym sklepie)](#6-architektura-widgetu)
7. [Architektura wdrożenia (infra, środowiska, CI/CD)](#7-architektura-wdrożenia)
8. [Vertical slice — jedna funkcja od piksela do bazy](#8-vertical-slice)
9. [Stos technologiczny — decyzje i alternatywy](#9-stos-technologiczny)
10. [Kolejność wdrożenia (graf zależności)](#10-kolejność-wdrożenia)
11. [Integralność pomiaru — jak liczyć dane, żeby były prawdziwe](#11-integralność-pomiaru)

---

## 1. Model dwuwarstwowy

Cały produkt to **dwie warstwy spięte jednym łącznikiem — design tokens**.

```
┌─────────────────────────────────────────────────────────────────┐
│                     WARSTWA GRAFICZNA                            │
│                                                                 │
│   Figma  ──►  design-tokens (tokens.json)  ──►  komponenty UI    │
│   (źródło     (single source of truth)         (React + CSS)    │
│    prawdy                                                        │
│    wizualnej)         ▲                                          │
└───────────────────────┼─────────────────────────────────────────┘
                        │  TOKENY = KONTRAKT
                        │  (kolor, font, radius, spacing, motion)
┌───────────────────────┼─────────────────────────────────────────┐
│                       ▼          WARSTWA KODOWA                  │
│                                                                 │
│   apps (landing/studio/widget) ──► packages (ui/sdk/db)         │
│        │                                                         │
│        └──► services (conversation/catalog/analytics) ──► dane  │
└─────────────────────────────────────────────────────────────────┘
```

### Zasada wiążąca

> **Grafika nie żyje w kodzie jako wartości — żyje jako tokeny.**
> Designer zmienia `--accent` w jednym miejscu → zmienia się landing, Studio, widget, e-maile, wykresy. Bez tej zasady masz 5 produktów, które z czasem się rozjeżdżają.

Praktycznie: **zakaz literałów** (`#7B61FF`, `16px`, `cubic-bezier(...)`) w kodzie komponentów. Wszystko przez `var(--token)` / `theme.token`. Egzekwowane lintem (sekcja 3.4).

---

## 2. Architektura graficzna

### 2.1 Pipeline: od projektu do pikseli w przeglądarce

```
[1] Figma (biblioteka + Figma Tokens plugin)
        │  export
        ▼
[2] tokens.json  (format W3C Design Tokens)
        │  build (Style Dictionary)
        ├──► css/variables.css      (dla wszystkich apps)
        ├──► tailwind.preset.js     (dla Tailwind apps)
        ├──► tokens.ts              (typowane stałe TS)
        └──► tokens.figma.json      (powrót do Figmy — round-trip)
        │
        ▼
[3] packages/ui  (komponenty czytają TYLKO tokeny)
        │
        ▼
[4] apps/*  (składają ekrany z komponentów)
```

**Narzędzie spinające:** [Style Dictionary](https://amzn.github.io/style-dictionary/) (Amazon) — bierze `tokens.json` i generuje wszystkie formaty. Jeden commit tokenów = przebudowa wszystkich targetów w CI.

### 2.2 Struktura tokenów (3 poziomy)

Tokeny mają **trzy poziomy abstrakcji** — to klucz do skalowalnego theming:

```jsonc
{
  // POZIOM 1: PRIMITIVE (surowe wartości, nigdy nie używane bezpośrednio w UI)
  "primitive": {
    "violet": { "500": "#7B61FF", "600": "#4F46E5", "400": "#8B5CFF" },
    "amber":  { "400": "#FFB15C" },
    "green":  { "400": "#3ECF8E" },
    "rose":   { "400": "#FB7185" },
    "neutral":{ "0": "#FFFFFF", "950": "#0B0B0F", "900": "#111118" }
  },
  // POZIOM 2: SEMANTIC (rola, theme-aware — TO używają komponenty)
  "semantic": {
    "color": {
      "accent":      { "value": "{primitive.violet.500}" },
      "accent2":     { "value": "{primitive.violet.600}" },
      "bg":          { "light": "#F4F4F8", "dark": "{primitive.neutral.950}" },
      "panel":       { "light": "{primitive.neutral.0}", "dark": "{primitive.neutral.900}" },
      "text":        { "light": "#14141C", "dark": "{primitive.neutral.0}" },
      "success":     { "value": "{primitive.green.400}" },
      "danger":      { "value": "{primitive.rose.400}" }
    }
  },
  // POZIOM 3: COMPONENT (opcjonalne, dla złożonych komponentów)
  "component": {
    "button": { "primary": { "bg": "{semantic.color.accent}", "radius": "{radius.pill}" } },
    "kpiCard":{ "radius": "{radius.lg}", "padding": "{spacing.5}" }
  }
}
```

**Dlaczego 3 poziomy:**
- Primitive zmieniasz raz, gdy zmienia się paleta marki.
- Semantic daje theming (light/dark) i czytelność (`accent`, nie `violet.500`).
- Component pozwala wyjątki bez rozsypywania systemu.

### 2.3 Theming (light/dark/brand-override widgetu)

```css
/* generated: css/variables.css */
:root[data-theme="dark"]  { --color-bg:#0B0B0F; --color-panel:#111118; --color-text:#fff; ... }
:root[data-theme="light"] { --color-bg:#F4F4F8; --color-panel:#fff;    --color-text:#14141C; ... }

/* widget w cudzym sklepie — nadpisanie akcentu przez operatora */
.ff-widget[data-brand-accent] { --color-accent: attr(data-brand-accent); }
```

Theming = wyłącznie zamiana wartości `--color-*`. **Żaden komponent nie wie, w jakim jest motywie** — czyta semantyczny token. To czyni dodanie np. „high contrast" kwestią jednego nowego bloku zmiennych.

### 2.4 Atomic design — warstwy komponentów

```
ATOMY        Button, Input, Pill, Icon, Avatar, Spinner, Swatch
   │
MOLEKUŁY     Field(label+Input+error), KpiCard, ChatBubble, ProductCard,
   │         StoreSwitcher, PasswordMeter, NavItem
   │
ORGANIZMY    KpiGrid, ConversionChart, ConversationTable, ChatStream,
   │         TryOnStage, FitBreakdown, AuthForm, Sidebar
   │
SZABLONY     DashboardLayout, AuthLayout(split), WidgetLayout, LandingLayout
   │
EKRANY       Pulpit, Logowanie, CzatLume, Przymierzalnia, Onboarding
```

Reguła: **organizm nie zawiera surowego CSS layoutu strony** — to robi szablon. Atom nie wie nic o domenie (Button nie wie, że istnieje „rozmiar M"). To pozwala testować każdą warstwę osobno w Storybook.

### 2.5 Asset pipeline (ikony, ilustracje, AI Core)

| Asset | Format | Gdzie | Jak |
|---|---|---|---|
| Ikony UI | inline SVG (stroke `currentColor`) | `packages/ui/icons` | sprite + tree-shaking, stroke 1.8–2 |
| AI Core (logo żywe) | inline SVG + CSS animacje | `packages/ui/AICore` | jeden komponent, props `size` |
| Ilustracje (Journey, garments) | inline SVG | `packages/ui/illustrations` | bez zależności od plików zewn. |
| Zdjęcia produktów | WebP/AVIF | object storage (R2/S3) | `next/image`, lazy, `sizes` |
| Wygenerowane try-on | WebP | object storage, TTL | generowane on-demand, cache |

**Zasada:** wszystko, co dekoracyjne i małe — inline SVG (zero requestów, theme-aware przez `currentColor`). Wszystko, co duże i fotograficzne — zewnętrzne, lazy, zoptymalizowane.

### 2.6 Storybook jako „żywa biblioteka"

```
packages/ui/
├─ src/
│  ├─ atoms/Button/Button.tsx + Button.stories.tsx + Button.test.tsx
│  ├─ molecules/KpiCard/...
│  └─ organisms/ConversionChart/...
└─ .storybook/
```

Każdy komponent ma **3 pliki obok siebie**: implementacja + story (wszystkie warianty/stany) + test. CI uruchamia Chromatic (visual regression) — zmiana piksela bez intencji = czerwony PR. To **kontrakt wizualny w CI**.

---

## 3. Architektura kodowa

### 3.1 Monorepo (Turborepo + pnpm)

```
fashionfit/
├─ apps/
│  ├─ landing/              # Astro (statyczny, SEO, szybki)
│  ├─ studio/               # Next.js 15 App Router (dashboard operatora)
│  └─ widget/               # Vite + React (embed dla klientów sklepu)
│
├─ packages/
│  ├─ design-tokens/        # tokens.json + Style Dictionary build
│  ├─ ui/                   # komponenty (atomy→organizmy) + Storybook
│  ├─ sdk/                  # typowany klient API (fetch + zod), wspólny dla studio i widget
│  ├─ db/                   # Prisma schema + migracje + seed
│  ├─ prompts/              # prompty Lume wersjonowane (md + testy)
│  ├─ fit-engine/           # czysta logika rekomendacji rozmiaru + testy
│  ├─ config/               # eslint, tsconfig, tailwind preset (współdzielone)
│  └─ analytics/            # typy eventów + klient (PostHog wrapper)
│
├─ services/
│  ├─ conversation/         # orchestracja LLM (Node + Anthropic SDK), SSE
│  ├─ catalog-sync/         # worker BullMQ (import + embedding)
│  └─ webhooks/             # odbiór zdarzeń ze sklepów (order, refund)
│
├─ infra/                   # IaC (Terraform / docker-compose / k8s manifests)
├─ turbo.json               # pipeline budowania (cache, zależności)
└─ pnpm-workspace.yaml
```

**Dlaczego monorepo:** `packages/ui` i `packages/sdk` są współdzielone przez `studio` i `widget` — jeden komponent `ChatBubble`, jeden typ `Product`, zero duplikacji. Turborepo cache'uje buildy (zmiana w widget nie przebudowuje landing).

### 3.2 Granica apps — różne strategie renderowania (świadomie)

| App | Framework | Render | Dlaczego |
|---|---|---|---|
| **landing** | Astro | SSG (statyczny) | SEO + Core Web Vitals; zero JS domyślnie, „islands" tylko gdzie trzeba |
| **studio** | Next.js 15 | RSC + Server Actions | dane za auth, SSR dla świeżości, streaming UI |
| **widget** | Vite + React | SPA w iframe | izolacja od sklepu hosta, mały bundle, własny lifecycle |

To nie przypadek, że to trzy różne podejścia — **każda powierzchnia ma inny priorytet** (SEO / dane / izolacja). Łączy je `packages/ui`.

### 3.3 Architektura wewnątrz Studio (Next.js App Router)

```
apps/studio/
├─ app/
│  ├─ (auth)/
│  │  ├─ login/page.tsx           # AuthLayout + AuthForm
│  │  └─ register/page.tsx
│  ├─ (dashboard)/
│  │  ├─ layout.tsx               # Sidebar + AppBar (Server Component)
│  │  ├─ page.tsx                 # Pulpit
│  │  ├─ rozmowy/page.tsx
│  │  ├─ katalog/page.tsx
│  │  ├─ przymierzalnia/page.tsx
│  │  └─ ustawienia/page.tsx
│  ├─ api/
│  │  ├─ chat/route.ts            # proxy SSE do conversation service
│  │  ├─ fit/route.ts             # wywołanie fit-engine
│  │  └─ webhooks/woo/route.ts
│  └─ globals.css                 # import variables.css
├─ lib/
│  ├─ auth.ts                     # NextAuth config
│  ├─ tenant.ts                   # rozwiązanie tenant_id z sesji
│  └─ data/                       # funkcje danych (getKpis, getConversations)
└─ middleware.ts                  # auth guard + tenant resolution
```

**Kluczowy wzorzec — Server Components dla danych, Client dla interakcji:**

```tsx
// app/(dashboard)/page.tsx  — Server Component (czyta dane na serwerze)
import { getKpis, getConversionSeries } from '@/lib/data/dashboard';
import { KpiGrid, ConversionChart, ConversationTable } from '@fashionfit/ui';
import { resolveTenant } from '@/lib/tenant';

export default async function Pulpit() {
  const tenant = await resolveTenant();           // z sesji, RLS context
  const [kpis, series] = await Promise.all([
    getKpis(tenant.id, '30d'),
    getConversionSeries(tenant.id, '30d'),
  ]);
  return (
    <>
      <KpiGrid data={kpis} />                       {/* czysty render, zero fetch w kliencie */}
      <ConversionChart series={series} />           {/* animacja w kliencie, dane z serwera */}
      <ConversationTable tenantId={tenant.id} live  /> {/* live = client island z SSE */}
    </>
  );
}
```

Dane lecą na serwerze (bezpiecznie, z RLS), komponent UI tylko renderuje. Interaktywne wyspy (`live` tabela, suwak try-on) to `'use client'`.

### 3.4 Egzekwowanie spójności (lint jako architektura)

```js
// packages/config/eslint-preset.js
module.exports = {
  rules: {
    // ZAKAZ literałów koloru w stylach
    'no-restricted-syntax': ['error', {
      selector: "Literal[value=/#[0-9a-fA-F]{3,8}/]",
      message: 'Użyj tokenu z @fashionfit/design-tokens zamiast literału hex.'
    }],
    // ZAKAZ importu z apps do packages (kierunek zależności)
    'import/no-restricted-paths': ['error', { zones: [
      { target: './packages', from: './apps', message: 'packages nie mogą zależeć od apps.' }
    ]}],
  }
};
```

Architektura, która nie jest egzekwowana, gnije. Lint pilnuje **kierunku zależności** (apps→packages→nigdy odwrotnie) i **zakazu literałów**.

---

## 4. Architektura danych i API

### 4.1 Model multi-tenant z izolacją (RLS)

```
Każdy wiersz „należy" do tenanta. Izolacja na poziomie bazy, nie aplikacji.

Request ──► middleware ustala tenant_id z sesji
        ──► SET app.tenant_id = '<uuid>'  (na początku transakcji)
        ──► zapytanie ──► Postgres RLS filtruje automatycznie
```

```sql
-- packages/db — przykład polityki
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Nawet jeśli kod ma bug i zapomni filtra WHERE tenant_id —
-- baza i tak zwróci tylko wiersze właściwego sklepu.
```

**To jest fundament bezpieczeństwa.** Test E2E: zaloguj jako tenant A, spróbuj pobrać produkt tenanta B przez ID → musi zwrócić 404, nie dane.

### 4.2 Schemat (bounded contexts → tabele)

```
CATALOG          products, product_variants, product_embeddings(vector), size_tables
CONVERSATION     conversations, messages, tool_calls
FIT              fit_sessions(TTL), fit_recommendations
ANALYTICS        events(partycjonowane), insights, kpi_daily(materialized view)
IDENTITY         users, tenants, memberships, integrations
SECURITY         audit_logs, safety_events
BILLING          subscriptions, usage_counters
```

Każdy kontekst = osobny plik schematu w `packages/db/schema/`, osobny właściciel. Komunikacja między kontekstami **przez API/eventy**, nie cross-joiny — to pozwala później wydzielić mikroserwis bez przepisywania.

### 4.3 Kontrakty API (typowane end-to-end przez Zod)

```ts
// packages/sdk/contracts/fit.ts  — JEDEN typ, używany przez serwer i klienta
import { z } from 'zod';

export const FitRequest = z.object({
  productId: z.string().uuid(),
  measurements: z.object({ bust: z.number(), waist: z.number(), hips: z.number() }),
});
export const FitResponse = z.object({
  recommended: z.string(),                 // "M"
  confidence: z.number().min(0).max(1),    // 0.92
  breakdown: z.record(z.object({ value: z.number(), easeCm: z.number(), label: z.string() })),
  alternatives: z.array(z.object({ size: z.string(), reason: z.string() })),
});
export type FitResponse = z.infer<typeof FitResponse>;
```

Ten sam schemat **waliduje request na serwerze** i **typuje odpowiedź w kliencie**. Niemożliwe, żeby UI i API się rozjechały — TypeScript wykrzyczy na buildzie.

### 4.4 Strategia danych: kiedy real-time, kiedy batch

| Dane | Tryb | Mechanizm |
|---|---|---|
| KPI pulpitu | Batch (1×/h) | materialized view `kpi_daily`, refresh cronem |
| Tabela rozmów „live" | Real-time | SSE z conversation service → client island |
| Insighty AI | Batch (1×/dzień) | pipeline offline (Opus), zapis do `insights` |
| Czat z Lume | Real-time stream | SSE token-by-token z Anthropic |
| Fit recommendation | On-demand | sync call do fit-engine (<50ms, rule-based) |
| Synchronizacja katalogu | Async queue | BullMQ worker, webhook delta + nocny full sync |

**Zasada:** real-time tylko tam, gdzie użytkownik tego oczekuje (czat, live tabela). Reszta batch — taniej, prościej, wystarczająco świeże.

---

## 5. Architektura warstwy AI

### 5.1 Conversation Service — przepływ jednej wiadomości

```
Klient pisze ──► POST /api/chat (SSE)
   │
   ▼
[1] Rate limit (Redis: 20 msg/min/sesja)
[2] Klasyfikacja intencji (Haiku, ~30ms) → {okazja, styl, czy size-query}
[3] RAG: embedding pytania ──► pgvector similarity ──► top-K produktów tenanta
[4] Złóż prompt: system(Lume, cached) + kontekst sklepu(cached) + historia + RAG
[5] Claude Sonnet 4.6 stream + tools:
       searchProducts() · recommendSize() · buildLook() · getReturnPolicy()
[6] Każdy token ──► przez GUARDRAIL (Haiku supervisor) ──► do klienta (SSE)
[7] Zapis: messages, tool_calls, events(chat_message)
```

```ts
// services/conversation/handlers/chat.ts (szkielet)
export async function handleChat(req: ChatRequest, res: SSEStream) {
  await rateLimit(req.session);
  const intent = await classify(req.message);                 // Haiku
  const ctx = await rag.retrieve(req.tenantId, req.message);   // pgvector
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    system: [
      { type: 'text', text: lumePrompt, cache_control: { type: 'ephemeral' } },     // cached
      { type: 'text', text: storeContext(req.tenantId), cache_control: { type: 'ephemeral' } },
    ],
    tools: [searchProducts, recommendSize, buildLook],
    messages: [...history, { role: 'user', content: req.message }],
  });
  for await (const chunk of stream) {
    const safe = await guardrail(chunk);          // supervisor
    res.send(safe);
  }
  await persist(req, stream.finalMessage());
}
```

**Prompt caching** (system + kontekst sklepu) = ~70% taniej przy aktywnej sesji. To architektoniczna decyzja, nie optymalizacja na później.

### 5.2 Fit Engine — czysta funkcja (testowalna, deterministyczna)

```ts
// packages/fit-engine/src/recommend.ts — ZERO zależności, czysta logika
export function recommendSize(input: FitInput): FitResponse {
  const scored = input.sizeTable.map(size => ({
    size: size.label,
    score: scoreSize(input.measurements, size, input.fit, input.stretch),
    breakdown: computeEase(input.measurements, size),
  }));
  const best = scored.sort((a,b) => b.score - a.score)[0];
  return {
    recommended: best.size,
    confidence: scoreToConfidence(best.score),   // ≥85→0.9, 70-85→0.75...
    breakdown: best.breakdown,
    alternatives: scored.slice(1,2).map(toAlt),
  };
}
```

Fit Engine jest **pakietem, nie serwisem** — czysta funkcja bez I/O. Można ją wywołać z API Studio, z widgetu, z testu. 100% pokrycie testami na zbiorze historycznych transakcji. v2 (ML) podmienia implementację za tym samym kontraktem.

### 5.3 Guardrails jako warstwa, nie feature

```
Każdy output Lume ──► Haiku supervisor sprawdza:
   ✓ brak obietnicy "100% dopasowania"
   ✓ ceny tylko z kontekstu (nie zmyślone)
   ✓ on-topic (moda)
   ✓ brak prompt injection w odpowiedzi
   ──► pass? wyślij : wyślij fixed/fallback + log do safety_events
```

To **architektoniczna warstwa przelotowa** (middleware na strumieniu), nie opcja do wyłączenia. Operator nie może jej zdjąć — chroni markę.

---

## 6. Architektura widgetu

### 6.1 Dwustopniowy embed (loader + app)

```
Sklep hosta wkleja JEDEN tag:
<script src="https://widget.fashionfit.ai/loader.js" data-tenant="abc" async></script>
        │
        ▼
loader.js (<5KB, vanilla):
   • tworzy <iframe> z widget.fashionfit.ai/app?tenant=abc
   • iframe = IZOLACJA (CSS sklepu nie psuje widgetu i odwrotnie)
   • postMessage most: launcher ↔ iframe (open/close, resize, events)
   • nasłuchuje zdarzeń sklepu (add-to-cart) i przekazuje do analytics
        │
        ▼
widget/app (Vite + React SPA):
   • czat Lume / try-on / fit card
   • własny ThemeProvider (brand-accent z konfiguracji tenanta)
   • SDK ──► api.fashionfit.ai
```

**Dlaczego iframe, nie Shadow DOM:** sklepy mają agresywny CSS (`!important`, resety). Iframe to twarda granica — gwarancja, że widget wygląda identycznie w każdym sklepie. Koszt (komunikacja przez postMessage) jest tego wart.

### 6.2 Izolacja stylów + brand override

```
iframe ładuje variables.css FashionFit ──► widget zawsze spójny
        +
data-brand-accent="#C0006B" (ustawione przez operatora w Studio)
        ──► nadpisuje TYLKO --color-accent
        ──► struktura, radiusy, typografia, guardrails BEZ ZMIAN
```

Operator dostosowuje akcent do brandu sklepu, ale **nie może zepsuć jakości** — system pozwala zmienić jedną zmienną, resztę trzyma.

---

## 7. Architektura wdrożenia

### 7.1 Topologia (rekomendacja MVP — UE/RODO)

```
                        ┌─────────────────────────────┐
   Cloudflare (CDN+WAF) │  landing (Astro SSG)        │  → Cloudflare Pages
        │               └─────────────────────────────┘
        ├──────────────► studio (Next.js)               → Vercel (region fra1) lub VPS
        ├──────────────► widget app (Vite SPA)          → Cloudflare Pages / R2
        ├──────────────► loader.js                      → R2 + CDN (cache długi)
        │
   api.fashionfit.ai ──► API Gateway (Next route / Node)
        │
        ├──► conversation service (Node)   ┐
        ├──► catalog-sync worker (Node)     ├─ kontenery (Fly.io / Hetzner + Docker)
        ├──► webhooks service (Node)        ┘
        │
        ├──► Postgres + pgvector            → Supabase EU / Hetzner Managed PG (FSN1)
        ├──► Redis                          → Upstash EU
        ├──► Object Storage                 → Cloudflare R2 (lub S3 eu-central-1)
        │
        └──► Anthropic API (ZDR/DPA)        → Claude Sonnet/Opus/Haiku
```

**Lokalizacja danych:** PG i Redis w UE (RODO). Anthropic z umową DPA + Zero Data Retention.

### 7.2 Środowiska

| Środowisko | Branch | Dane | Cel |
|---|---|---|---|
| local | dowolny | seed (docker-compose) | dev |
| preview | każdy PR | seed | review per-PR (Vercel/CF preview) |
| staging | main | testowe | E2E, demo sprzedażowe |
| production | tag `v*` | produkcja | klienci |

### 7.3 CI/CD (GitHub Actions + Turborepo)

```
on: pull_request
  ├─ turbo lint            (eslint + zakaz literałów)
  ├─ turbo typecheck       (tsc — kontrakty API/UI)
  ├─ turbo test            (vitest — fit-engine, ui, prompts golden set)
  ├─ turbo build           (cache; buduje tylko zmienione apps)
  ├─ chromatic             (visual regression UI)
  └─ deploy preview        (ephemeral URL)

on: push main
  ├─ wszystko powyżej
  ├─ db migrate (staging)  (tylko forward, z dry-run)
  ├─ deploy staging
  └─ smoke tests (Playwright na staging)

on: tag v*
  └─ promote staging → production (manual approval)
```

**Migracje bazy:** tylko forward, każda z przetestowanym `down` lokalnie, zakaz `DROP` w produkcji bez 2 approvali. Turbo cache = PR dotykający tylko widgetu nie przebudowuje Studio (szybsze CI).

### 7.4 Observability (od dnia 1, nie „później")

```
Sentry        → błędy (frontend + backend), source maps
OpenTelemetry → traces; każda rozmowa = span tree (klasyfikacja→RAG→LLM→guardrail)
PostHog       → eventy produktowe (chat_open, fit_size_chosen, purchase)
Grafana       → dashboardy infra (latencja API, koszt tokenów/tenant)
Statuspage    → publiczny status dla klientów
GrowthBook    → feature flags + A/B (nowy prompt Lume za flagą)
```

---

## 8. Vertical slice

> Jak JEDNA funkcja — **„rekomendacja rozmiaru w czacie"** — przechodzi przez obie warstwy od piksela do bazy. To wzorzec dla każdej kolejnej funkcji.

```
KROK 1 — DESIGN (Figma)
   Designer projektuje komponent FitBreakdown (paski biust/talia/biodra).
   Tokeny: używa semantic.color.accent, radius.md, spacing.4.
        ▼
KROK 2 — TOKEN
   Żadnych nowych tokenów — komponent korzysta z istniejących. (gdyby trzeba → PR do design-tokens)
        ▼
KROK 3 — KOMPONENT UI (packages/ui)
   <FitBreakdown breakdown={...} /> — molekuła, czyta tokeny, ma story + test + a11y.
   Storybook: warianty (wysoka/średnia/niska pewność). Chromatic snapshot.
        ▼
KROK 4 — KONTRAKT (packages/sdk)
   FitRequest / FitResponse (Zod) — jeden typ dla serwera i klienta.
        ▼
KROK 5 — LOGIKA (packages/fit-engine)
   recommendSize(input): FitResponse — czysta funkcja + testy na danych historycznych.
        ▼
KROK 6 — API (apps/studio/app/api/fit + services lub route)
   POST /api/fit → waliduje FitRequest → fit-engine → FitResponse.
   RLS: produkt i tabela rozmiarów tylko z właściwego tenanta.
        ▼
KROK 7 — INTEGRACJA W CZACIE (services/conversation)
   Lume wywołuje tool recommendSize() → wynik renderowany jako FitBreakdown w bąblu.
        ▼
KROK 8 — DANE/ANALYTICS (packages/analytics)
   event: fit_size_chosen { product, size, ai_recommended, confidence }.
   Po 30 dniach: webhook refund → attribution (czy zwrot z powodu rozmiaru?).
        ▼
KROK 9 — PĘTLA ZWROTNA
   kpi_daily agreguje trafność rozmiaru → KPI „96%" na pulpicie → InsightBanner.
```

Każda nowa funkcja idzie **tą samą ścieżką**: design→token→komponent→kontrakt→logika→API→integracja→analytics→pętla. Spójność architektury = przewidywalność wdrożeń.

---

## 9. Stos technologiczny

| Warstwa | Wybór | Alternatywa | Dlaczego ten |
|---|---|---|---|
| Monorepo | Turborepo + pnpm | Nx | prostszy, świetny cache, mniej konfiguracji |
| Tokeny | Style Dictionary | Theo, własny | standard branżowy, wiele targetów |
| Landing | Astro | Next static | zero-JS domyślnie, najlepsze CWV/SEO |
| Studio | Next.js 15 (App Router) | Remix | RSC + Server Actions, ekosystem |
| Widget | Vite + React | Preact | mały bundle, szybki dev, izolacja iframe |
| UI styling | CSS variables + Tailwind preset | CSS-in-JS | tokeny natywnie, zero runtime |
| Komponenty headless | Radix UI | Headless UI | dostępność out-of-the-box |
| DB | Postgres + pgvector | Postgres + Pinecone | jedna baza, RLS, wektory razem |
| ORM | Prisma | Drizzle | DX, migracje, typy |
| Kolejki | BullMQ (Redis) | SQS | self-host, proste |
| LLM | Anthropic (Claude) | OpenAI | jakość tonu, tool use, ZDR/DPA, prompt caching |
| Embeddingi | Voyage `voyage-3` | OpenAI ada | jakość retrieval w e-commerce |
| Auth | NextAuth (magic link) | Clerk | kontrola, koszt, magic-link-first |
| Płatności | Stripe | Paddle | standard, PL/EU |
| Analytics | PostHog | Mixpanel | self-host EU, eventy + flags |
| Hosting | Vercel/CF + Hetzner/Fly | AWS | szybki start, koszt, EU |
| IaC | Terraform | Pulumi | standard |
| Observability | Sentry + OTel + Grafana | Datadog | koszt, otwartość |

---

## 10. Kolejność wdrożenia

Graf zależności — co musi powstać przed czym:

```
design-tokens ──┬──► packages/ui ──┬──► apps/landing
                │                  ├──► apps/studio ──┐
                │                  └──► apps/widget ──┤
packages/db ────┼──► sdk/contracts ───────────────────┤
                │                                      │
                ├──► fit-engine ───────────────────────┤
                ├──► prompts ──► services/conversation ─┤
                └──► services/catalog-sync ─────────────┘
                                                        │
                                            infra + CI/CD (równolegle od startu)
```

**Reguła kolejności:** nic nie zaczyna się przed `design-tokens` i `packages/ui` (Faza 0 z playbooka). Bez fundamentu wizualnego każdy ekran to osobna improwizacja, a produkt rozjeżdża się w 3 miesiące.

**Pierwsze trzy rzeczy do zbudowania (w tej kolejności):**
1. `design-tokens` + Style Dictionary build → `variables.css`.
2. `packages/ui` z 10 komponentami w Storybook (Button, Input, KpiCard, ChatBubble, ProductCard, AICore, Chart.Line, Chart.Donut, Pill, Avatar).
3. `apps/studio` szkielet z AuthLayout + DashboardLayout zbudowany **wyłącznie** z komponentów z (2).

Gdy to działa — reszta to dokładanie ekranów i serwisów po znanej ścieżce z sekcji 8.

---

## 11. Integralność pomiaru

> Sekcje 4 i 7.4 opisują **gdzie** dane lecą i **jak** są technicznie agregowane. Ta sekcja odpowiada na inne, ważniejsze pytanie: **dlaczego te liczby miałyby być prawdziwe.** Dla produktu, którego obietnicą sprzedażową jest „96% trafności rozmiaru" i „−40% zwrotów", to nie jest dodatek — to fundament. Liczba policzona naiwnie nie jest mniejszym problemem niż liczba zmyślona: jedna i druga niszczy zaufanie, gdy klient ją sprawdzi.

### 11.1 Zasada nadrzędna: klient mierzy intencję, serwer mierzy prawdę

```
┌──────────────────────────────────────────────────────────────────┐
│  WARSTWA INTENCJI (przeglądarka / widget)                          │
│  chat_open, size_card_viewed, size_chosen, add_to_cart_clicked     │
│  → szybkie, bogate, ALE: adblock, boty, podwójne strzały, brak     │
│    gwarancji dostarczenia. NIGDY nie liczy się z tego pieniędzy.   │
└───────────────────────────┬──────────────────────────────────────┘
                            │  event tylko SYGNALIZUJE
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│  WARSTWA PRAWDY (serwer: webhooki sklepu + Stripe + zwroty)        │
│  order.created, order.paid, refund.created{reason}, exchange       │
│  → wolniejsze, uboższe, ALE: autorytatywne, idempotentne,          │
│    uzgadnialne. TYLKO stąd liczymy konwersję, przychód, zwroty.    │
└──────────────────────────────────────────────────────────────────┘
```

> **Reguła:** żaden KPI pieniężny ani „trafność" nie może być policzony z eventu klienckiego. Event kliencki służy do atrybucji (kto był wystawiony na AI), nie do orzekania o wyniku. Wynik orzeka serwer.

### 11.2 Kontrakt metryki — żadna liczba bez definicji

Każda metryka na pulpicie ma **wpis w rejestrze metryk** (`packages/analytics/metrics/*.ts`). Bez wpisu metryka nie może trafić na UI. To samo, czym lint jest dla literałów hex — tu egzekwujemy, że nie ma „liczb znikąd".

```ts
// packages/analytics/metrics/size-accuracy.ts
export const sizeAccuracy = defineMetric({
  id: 'size_accuracy',
  label: 'Trafność rozmiaru',
  question: 'Jaki % zakupów z rekomendacją AI NIE wrócił z powodu złego rozmiaru?',

  // LICZNIK i MIANOWNIK jawne — to jest sedno
  numerator:   'zamówienia z ai_recommended=true, opłacone, BEZ zwrotu z reason="size" w oknie',
  denominator: 'wszystkie zamówienia z ai_recommended=true, opłacone, z zamkniętym oknem zwrotu',

  source: 'server',                 // NIGDY 'client'
  truthTable: ['orders', 'refunds'],// z czego liczymy prawdę
  attributionWindow: '30d',         // zwrot możliwy do 30 dni → metryka dojrzewa 30 dni
  excludes: ['internal_traffic', 'test_orders', 'bot_sessions', 'unpaid'],
  holdout: true,                    // raportowana RAZEM z grupą kontrolną (11.5)
  minSample: 100,                   // poniżej 100 zamówień: pokaż "za mało danych", nie %
});
```

**Pięć rzeczy, które każda metryka musi mieć jawnie** (i których brakowało wcześniej):

| Element | Pytanie, na które odpowiada | Konsekwencja braku |
|---|---|---|
| Definicja słowna | „Co dokładnie liczymy?" | „trafność" znaczy 4 różne rzeczy dla 4 osób |
| Licznik + **mianownik** | „96% z czego?" | procent bez mianownika jest bez znaczenia |
| Źródło (`server`/`client`) | „Skąd prawda?" | mylenie kliknięcia z zakupem zawyża wynik |
| Okno atrybucji | „Kiedy wynik jest pewny?" | chwalenie się liczbą, zanim zwroty wrócą |
| Wykluczenia + minSample | „Kogo nie liczymy i ile to za mało?" | boty i N=7 udające 96% |

### 11.3 Model danych: events → facts → metrics (trzy warstwy, nie jedna)

```
events (surowe, NIEZMIENNE)        facts (uzgodnione ze źródłem prawdy)     kpi_daily (agregat)
─────────────────────────          ──────────────────────────────────      ─────────────────
chat_message, size_chosen,    ──►  order_fact { order_id, tenant_id,   ──►  materialized view
add_to_cart  (append-only,         ai_attributed, paid_amount,              po faktach, nie eventach
 idempotency_key, ts UTC)          returned, return_reason, settled_at }    refresh po zamknięciu okna
```

- **`events`** — append-only, nigdy UPDATE/DELETE. Każdy event ma `idempotency_key` (dedup) i znacznik czasu w UTC. To dziennik, nie stan.
- **`facts`** — to, co zostało **uzgodnione** z webhookiem sklepu i Stripe. `order_fact.ai_attributed` powstaje przez join eventu `size_chosen` z `order.paid` po `session_id` w oknie atrybucji. Dopiero gdy `settled_at` (koniec okna zwrotu) minie — fakt jest „dojrzały".
- **`kpi_daily`** — agreguje **fakty, nie eventy**. Dlatego pokazuje prawdę, a nie ruch.

> Korekta wobec sekcji 4.2/8: KPI „96%" liczy się z tabeli `facts` po dojrzeniu okna, nie z `events(fit_size_chosen)`. Event mówi tylko „AI coś poleciło i klient to wybrał" — to intencja, nie wynik.

### 11.4 Deduplikacja, boty, strefy czasowe — higiena, bez której liczby kłamią

```ts
// pipeline events → facts: cztery filtry zanim cokolwiek policzymy
const clean = rawEvents
  .dedupeBy('idempotency_key')              // podwójny strzał SSE / retry sieci = 1 event
  .reject(e => isBot(e.ua, e.ipReputation)) // boty i crawlery
  .reject(e => e.tenantStaff.has(e.userId)) // ruch wewnętrzny operatora (testuje własny widget)
  .map(e => ({ ...e, ts: toUTC(e.ts) }));   // wszystko w UTC; dzień KPI = dzień w strefie tenanta
```

Bez tych czterech kroków „liczba rozmów" rośnie od własnych testów operatora, „konwersja" skacze od retry, a dzienny wykres ma garby na granicach stref czasowych. To nie detale — to różnica między dashboardem a fikcją.

### 11.5 Grupa kontrolna (holdout) — jedyny sposób na PRAWDZIWY uplift

To jest brakujący element, bez którego całe „−40% zwrotów" jest nieweryfikowalne:

```
Przy wejściu na produkt: deterministyczny bucket po hash(user_id) →
   ├─ 90% → grupa AI       (widzi rekomendację Lume)
   └─ 10% → grupa holdout   (NIE widzi — kupuje „jak zwykle")

Uplift = zwroty(holdout) − zwroty(AI)        ← to jest PRAWDZIWY efekt produktu
NIE: zwroty(AI) vs "średnia z internetu"     ← to jest marketing
```

Bez holdoutu nie wiesz, czy „96% trafności" to zasługa AI, czy po prostu ludzie i tak zwykle trafiają w rozmiar. Holdout zamienia korelację („mamy AI i mamy mało zwrotów") w przyczynowość („AI obniża zwroty o X punktów, p<0.05"). 10% to koszt, który kupuje prawo do twierdzenia, że produkt działa.

### 11.6 Reconciliation — miesięczny audyt, który łapie rozjazd

```
Co miesiąc, automatycznie:
   events(purchase)   vs   Stripe(charges)   vs   sklep(orders)
        │                       │                      │
        └───────── porównaj liczby i sumy ─────────────┘
   Rozjazd > 0.5%  ──►  alarm do #data-integrity + wstrzymanie raportu
```

Trzy źródła muszą się zgadzać. Jeśli PostHog mówi 1000 zakupów, a Stripe 940 — coś gubimy lub liczymy podwójnie, i **żaden KPI z tego okresu nie jest wiarygodny, dopóki rozjazd nie jest wyjaśniony**. Reconciliation to wykrywacz dymu dla całej warstwy danych.

### 11.7 Anti-vanity — rozdzielenie metryk do chwalenia od metryk do decyzji

| Vanity (zakaz na pulpicie operatora jako KPI) | Metryka prawdziwa (decyzyjna) |
|---|---|
| „liczba wiadomości" | rozmowy zakończone wyborem rozmiaru / koszyk |
| „% pozytywnych reakcji na czacie" | zakupy opłacone, bez zwrotu z powodu rozmiaru |
| „średnia pewność AI" (model ocenia sam siebie) | trafność potwierdzona zwrotem/brakiem zwrotu |
| „trafność do dziś" (okno otwarte) | trafność po dojrzeniu okna 30 dni |

> **Reguła:** jeśli metryka rośnie, gdy produkt działa gorzej (np. „liczba wiadomości" rośnie, bo Lume nie potrafi pomóc i klient pyta 10 razy) — to vanity metric. Na pulpicie tylko metryki, które spadają, gdy produkt zawodzi.

### 11.8 Jak naprawdę policzyć „trafność rozmiaru" — krok po kroku

Domknięcie KROKU 8–9 z sekcji 8, tym razem uczciwie:

```
[1] size_chosen {session_id, product, size, ai_recommended:true, confidence}  → events
[2] order.paid {session_id, order_id, items}  (webhook sklepu)               → facts: ai_attributed
[3] czekaj do settled_at = paid_at + 30 dni   (okno zwrotu)                   → fakt dojrzewa
[4] refund.created {order_id, reason}  jeśli przyjdzie                        → facts: returned, reason
[5] trafny := opłacony AND (brak zwrotu OR reason ≠ "size")
[6] size_accuracy = trafne / wszystkie_dojrzałe_ai_attributed   (per tenant, 30d)
[7] obok pokaż holdout: ten sam wzór dla grupy bez AI → uplift
[8] jeśli mianownik < minSample(100) → UI pokazuje "zbieramy dane", NIE liczbę
```

Liczba, która z tego wychodzi, może być niższa niż wymarzone „96%" — i to jest dobre. **Prawdziwe 88% z jawnym mianownikiem i holdoutem sprzedaje się lepiej niż nieweryfikowalne 96%**, bo przetrwa pierwsze pytanie sceptycznego klienta: „a skąd to wiecie?".

---

## Zakończenie — sześć zasad, które trzymają architekturę

1. **Tokeny to kontrakt** — grafika żyje jako tokeny, nie literały. Jeden punkt zmiany.
2. **Kierunek zależności** — apps → packages → nigdy odwrotnie. Lint pilnuje.
3. **Izolacja tenantów w bazie** — RLS, nie tylko `WHERE`. Bezpieczeństwo nie zależy od pamięci programisty.
4. **Real-time tylko gdzie trzeba** — czat i live tabela; reszta batch.
5. **Każda funkcja tą samą ścieżką** — vertical slice z sekcji 8. Przewidywalność > spryt.
6. **Klient mierzy intencję, serwer mierzy prawdę** — żaden KPI bez kontraktu metryki, mianownika i holdoutu (sekcja 11). Liczba, której nie umiesz obronić pytaniem „skąd to wiecie?", nie trafia na pulpit.

Architektura, która jest egzekwowana (lintem, testami, CI), a nie tylko opisana — to jedyna, która przetrwa rok rozwoju.
