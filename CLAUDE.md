# Wealth Manager

Personal wealth tracking web portal. Records snapshots of assets over time, shows a dashboard with total wealth, historical comparisons, and asset breakdown charts.

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite 5
- **Routing**: react-router-dom v6 (SPA, `basename="/wealth-manager"`)
- **Charts**: Recharts (pie chart on dashboard)
- **Backend**: Supabase (Postgres DB + Google OAuth)
- **Hosting**: GitHub Pages (static SPA)
- **Deployment**: GitHub Actions → GitHub Pages

## Supabase Project

- **Project URL**: `https://rhkmxuzulivcyrknbfan.supabase.co`
- **Project ref**: `rhkmxuzulivcyrknbfan`
- **Dashboard**: https://supabase.com/dashboard/project/rhkmxuzulivcyrknbfan

## Environment Variables

Never commit `.env`. Copy `.env.example` and fill in values:

```
VITE_SUPABASE_URL=https://rhkmxuzulivcyrknbfan.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from Supabase Settings → API>
```

For production (GitHub Pages), these are set as **GitHub Repository Secrets** and injected at build time by the Actions workflow.

## Database Schema

Three tables, all with Row Level Security (users only access their own data):

- **`records`** — one row per wealth snapshot: `id, user_id, date, created_at, updated_at`
- **`record_items`** — individual assets within a record: `id, record_id, category, currency, place_type, place, amount, name, expected_annual_yield, risk_level, details`
- **`custom_options`** — user-defined dropdown values: `id, user_id, field_name (category|place_type|place), value`

Run `supabase-setup.sql` in the Supabase SQL Editor to (re)create all tables, indexes, RLS policies, and triggers.

## Project Structure

```
src/
  lib/
    types.ts          # TypeScript interfaces (WealthRecord, RecordItem, etc.)
    supabase.ts       # Supabase client (reads VITE_* env vars)
    constants.ts      # Default dropdown options, colors, fallback exchange rates
    currency.ts       # Exchange rate fetching (exchangerate-api.com, 1h cache, SGD base)
    api.ts            # All Supabase CRUD functions
  context/
    AuthContext.tsx   # Auth state + signInWithGoogle + signOut (also exports useAuth)
  hooks/
    useAuth.ts        # Re-exports useAuth from AuthContext
  components/
    Layout.tsx        # Sidebar + <Outlet /> wrapper
    Sidebar.tsx       # Nav: Home / Records / Add Record / Log out
    ProtectedRoute.tsx
    RecordForm.tsx    # Shared form used by NewRecord and RecordDetail
    AssetItemForm.tsx # Single asset card (collapsible), handles custom option creation
    AssetPieChart.tsx # Recharts donut chart grouped by category
    CurrencyToggle.tsx
    WealthSummary.tsx # Total wealth + diffs vs previous and 1-year-ago
  pages/
    Login.tsx
    Dashboard.tsx
    NewRecord.tsx
    RecordDetail.tsx  # Same as NewRecord but loads existing record; Save + Close buttons
    RecordsList.tsx
```

## Key Design Decisions

- **Record updates**: items are delete-and-reinserted on every save (no diffing)
- **Currency conversion**: fetches from `api.exchangerate-api.com/v4/latest/SGD`, caches in `sessionStorage` for 1 hour, falls back to hardcoded rates in `constants.ts`
- **Custom dropdowns**: stored in `custom_options` table per user; added inline via "Add custom..." option in selects
- **GitHub Pages SPA routing**: `public/404.html` redirects 404s to `/?p=<encoded-path>`, `main.tsx` restores the path on load
- **Node version**: requires Node 18+; `.nvmrc` set to `18`

## Development

```bash
# Use Node 18
nvm use

# Install deps
npm install

# Create local env file
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Run dev server
npm run dev

# Build for production
npm run build
```

## Deployment

Push to `main` → GitHub Actions builds and deploys automatically.

**Required GitHub Repository Secrets** (Settings → Secrets and variables → Actions):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**GitHub Pages** must be configured to use **GitHub Actions** as the source (Settings → Pages).

## Google OAuth Setup

1. In Google Cloud Console: set authorized redirect URI to `https://rhkmxuzulivcyrknbfan.supabase.co/auth/v1/callback`
2. In Supabase → Authentication → URL Configuration → Redirect URLs: add `https://<github-username>.github.io/wealth-manager/`
3. In Supabase → Authentication → Providers → Google: paste Client ID and Secret

## Pending / Known Issues

- The `description.txt` file in root is leftover from project creation — can be deleted
- `src/App.css` and `src/assets/react.svg` are Vite scaffold leftovers — can be deleted
- Exchange rates on the Records listing page are not converted (amounts shown in original currency); only the Dashboard converts to the selected display currency
