# Wealth Manager

A personal wealth tracking web portal. Record snapshots of your assets over time, monitor your portfolio performance, and plan for your financial goals.

## Features

### Records
- Create dated wealth snapshots, each containing one or more assets
- Assets carry: category, currency, place type, place, amount, name, expected annual yield, risk level, and optional notes
- Dropdown options are pre-filtered by category (e.g. selecting "Bank Account" only shows "Bank" as a place type)
- Add custom categories, place types, and places inline

### Record Detail
- View a record in a clean read-only card layout, grouped by asset category
- Asset breakdown charts: by category (with drill-down to place type or place), by currency, and by risk level
- Click **Edit** to enter edit mode — make changes across all assets, then **Save** or **Discard**
- Adding a new asset auto-scrolls to it and briefly highlights it

### Dashboard (Home)
- Total wealth with change vs previous record and vs one year ago
- Asset breakdown charts: by category, by currency, and by risk level
- **30-year wealth projection** line chart — each asset compounds at its own expected annual yield; hover to see the year and projected value
- **Financial goal calculator** — set a target amount and number of years, and get:
  - Years to reach goal at current yields
  - Required annual yield to hit the goal on time
  - Extra monthly savings needed
  - Suggestions based on simple rules (Rule of 72, gap analysis, on-track confirmation)
  - Goal inputs are saved to `localStorage` and persist between sessions

## How to Run Locally

### Prerequisites

- Node.js 18+ (use `nvm use` if you have [nvm](https://github.com/nvm-sh/nvm))
- A [Supabase](https://supabase.com) project with the schema from `supabase-setup.sql`

### Setup

```bash
# Install dependencies
npm install

# Create your local env file
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from Supabase Settings → API>
```

### Database

Run `supabase-setup.sql` in the Supabase SQL Editor to create all tables (`records`, `record_items`, `custom_options`), indexes, Row Level Security policies, and triggers.

### Start the dev server

```bash
npm run dev
```

The app runs at [http://localhost:5173/wealth-manager/](http://localhost:5173/wealth-manager/) and supports Google OAuth sign-in via Supabase.

### Build for production

```bash
npm run build
```

## Deployment

Push to `main` — GitHub Actions builds and deploys to GitHub Pages automatically.

**Required GitHub repository secrets** (Settings → Secrets and variables → Actions):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

GitHub Pages must be configured to use **GitHub Actions** as the source (Settings → Pages).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite 5 |
| Routing | react-router-dom v6 (SPA, `basename="/wealth-manager"`) |
| Charts | Recharts |
| Backend / Auth | Supabase (Postgres + Google OAuth) |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |
