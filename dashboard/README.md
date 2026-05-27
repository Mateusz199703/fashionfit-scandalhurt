# FashionFit Dashboard

React + TypeScript client panel for FashionFit shop owners. Provides
authentication, shop management, product sync, install onboarding, analytics
and Stripe billing.

## Stack

- Create React App (TypeScript)
- React Router v6
- Tailwind CSS (design tokens: primary `#534AB7`, secondary `#0F6E56`, Inter font)
- axios (JWT auth via interceptors), react-hot-toast, recharts, lucide-react

> This app is standalone (not part of the root npm workspaces) because CRA does
> not scaffold cleanly inside an npm workspace. Install its dependencies from
> within this folder.

## Setup

```bash
cd dashboard
npm install
```

Configure the API base URL (defaults to `http://localhost:3001`):

```bash
echo "REACT_APP_API_URL=http://localhost:3001" > .env.local
```

## Scripts

- `npm start` — dev server at http://localhost:3000
- `npm run build` — production build
- `npm test` — test runner
