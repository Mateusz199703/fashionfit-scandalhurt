# FashionFit

**FashionFit** is a B2B SaaS virtual try-on solution for WooCommerce stores. It
lets online clothing shops embed an AI-powered "try it on" experience so that
customers can preview garments on a photo of themselves before buying.

## Architecture

This repository is a monorepo composed of the following packages:

| Folder        | Description                                              |
| ------------- | -------------------------------------------------------- |
| `backend/`    | Node.js + Express REST API (auth, try-on jobs, billing). |
| `widget/`     | Vanilla JS embeddable widget injected into the store.    |
| `plugin/`     | WordPress / WooCommerce plugin (PHP) that loads widget.  |
| `dashboard/`  | React client panel for shop owners.                      |
| `supabase/`   | SQL migrations and database schema.                      |

### Tech stack

- **API:** Node.js, Express, Supabase (Postgres), JWT auth, Stripe billing.
- **Try-on engine:** FASHN AI API.
- **Widget:** dependency-free Vanilla JS.
- **Plugin:** PHP for WooCommerce integration.
- **Dashboard:** React.

## Getting started

### Prerequisites

- Node.js >= 18
- npm >= 9
- A Supabase project, a Stripe account, and a FASHN API key.

### 1. Install dependencies

From the repository root (installs all workspaces):

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your secrets:

```bash
cp .env.example .env
```

| Variable                | Description                                   |
| ----------------------- | --------------------------------------------- |
| `SUPABASE_URL`          | Supabase project URL.                         |
| `SUPABASE_ANON_KEY`     | Supabase anon/public key.                     |
| `SUPABASE_SERVICE_KEY`  | Supabase service role key (server-side only). |
| `FASHN_API_KEY`         | FASHN AI try-on API key.                      |
| `STRIPE_SECRET_KEY`     | Stripe secret key.                            |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret.                |
| `STRIPE_PRICE_STARTER`  | Stripe price id for Starter plan.             |
| `STRIPE_PRICE_GROWTH`   | Stripe price id for Growth plan.              |
| `STRIPE_PRICE_SCALE`    | Stripe price id for Scale plan.               |
| `JWT_SECRET`            | Secret used to sign JWT access tokens.        |
| `PORT`                  | Backend port (default `3001`).                |
| `FRONTEND_URL`          | Dashboard origin (default `http://localhost:3000`). |

### 3. Run the backend

```bash
npm run dev:backend
```

The API will be available at `http://localhost:3001`.

## SaaS onboarding flow (recommended)

1. Customer registers in `/register` (trial account is created instantly).
2. Optional: a paid plan can be selected at registration, then backend returns a Stripe Checkout URL.
3. Optional `company_nip` can be provided at registration for invoice onboarding.
4. Customer tax ID is synchronized to Stripe when possible.
5. Stripe webhook (`/api/webhooks/stripe`) is the source of truth for activation.
6. On `checkout.session.completed` and subscription updates:
   - client status is activated/deactivated,
   - plan is synchronized from Stripe,
   - subscription period is stored in `subscriptions`,
   - duplicate webhook deliveries are ignored via `stripe_webhook_events`.

## Project layout

```
fashionfit/
├── backend/          # Node.js + Express API
├── widget/           # Vanilla JS embeddable widget
├── plugin/           # WordPress/WooCommerce plugin (PHP)
├── dashboard/        # React client panel
└── supabase/         # SQL migrations
```

## License

Proprietary — all rights reserved.
