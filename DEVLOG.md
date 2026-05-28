# 🛒 Smart Grocery Savings — Development Log

A running record of engineering decisions, challenges, and lessons learned building this project.

---

## April 17, 2026 — Project Kickoff & Static Site Setup

**What I did:**
- Set up GitHub repo: `hashtags2023/smart-grocery-savings`
- Built static HTML/CSS/JS site with 12 blog posts
- Configured custom domain `smartgrocerysavings.com` via Namecheap
- Deployed to GitHub Pages with automatic CI/CD via GitHub Actions
- Added affiliate disclosure page per FTC requirements
- Added privacy policy, contact form via Web3Forms, and newsletter signup
- Configured `robots.txt` and `sitemap.xml` for SEO

**Decisions made:**
- Chose static HTML over WordPress for simplicity, speed, and zero hosting cost
- Used Web3Forms for contact/newsletter to avoid managing a backend
- Added FTC-compliant affiliate disclosure on all monetized content

**Monetization set up:**
- Amazon Associates approved (Store ID: smartgrocerys-20)
- Applied to Google AdSense, Thrive Market, Instacart, Walmart, HelloFresh affiliates

---

## April 27, 2026 — Sprint 1: Full-Stack Foundation

**What I did:**
- Created React frontend with Vite inside `/frontend` folder
- Set up Supabase project for PostgreSQL database + auth
- Connected React app to Supabase using `@supabase/supabase-js`
- Created database schema with 5 tables: `stores`, `items`, `prices`, `grocery_lists`, `list_items`
- Enabled Row Level Security (RLS) on all tables
- Seeded database with 6 stores and 8 starter grocery items
- Built first working page — fetching and displaying items from database

**Technical decisions:**
- Chose Supabase over building custom auth — saves weeks of work, built-in JWT handling
- Chose Vite over Create React App — faster builds, better developer experience
- Used Vercel serverless functions instead of separate Express server — simpler architecture, same JS ecosystem
- Kept static HTML site at root alongside React app in `/frontend` (monorepo approach)

**Challenges:**
- `npm warn EBADENGINE` warnings on install — resolved by confirming they were harmless ESLint version mismatches, not blocking errors
- Dashboard.jsx parse error on first deploy — caused by smart quotes being substituted during copy/paste; fixed by rewriting the file

---

## April 27, 2026 — Sprint 2: User Authentication

**What I did:**
- Built Login, Signup, and Dashboard pages in React
- Implemented Supabase Auth (email/password)
- Added protected routes — unauthenticated users redirected to login
- Built Navbar component with dynamic auth state (shows user email + logout when logged in)
- Added React Router for client-side navigation
- Installed and configured `react-router-dom`

**Technical decisions:**
- Used Supabase Auth instead of custom JWT — eliminates password hashing, token management, and security risks
- Disabled email confirmation during development for faster testing iteration
- Used `onAuthStateChange` listener to keep auth state in sync across the app

**Challenges:**
- Duplicate "My Lists" link appeared in navbar — caused by adding the link twice during iterative edits; fixed by auditing Navbar.jsx with grep
- Pages folder not created by earlier touch command — recreated manually with mkdir -p

---

## May 2026 — Sprint 3: Kroger API Integration & Price Search

**What I did:**
- Registered for Kroger Developer API (certification environment)
- Built 3 Vercel serverless functions:
  - `api/kroger-token.js` — OAuth2 client credentials flow
  - `api/kroger-search.js` — product search with real-time pricing
  - `api/kroger-locations.js` — find nearby stores by zip code
- Found 3 Foods Co (Kroger-family) locations in Sacramento area
- Built Price Search page with product cards, images, prices, sale prices, and fulfillment badges
- Added "Add to List" functionality — saves Kroger products directly to user's Supabase grocery list
- Added Vite proxy config so local dev routes `/api` calls to `vercel dev`

**Technical decisions:**
- Used Vercel serverless functions as API proxy — keeps Kroger credentials server-side, never exposed to browser
- Used certification environment (`api-ce.kroger.com`) for development — avoids hitting production rate limits
- Filtered search results to only show products with prices — Kroger API returns products without prices when no location is specified

**Challenges:**
- Search returned "Unexpected token '<'" error in production — caused by Vite serving HTML 404 page instead of routing to API; fixed by adding proxy config to `vite.config.js`
- `kroger-locations.js` didn't get created by touch command — file was missing silently; caught by running `ls api/`
- Kroger API returns no prices without a `locationId` — had to implement location lookup first before prices would appear

**Lesson learned:**
- Always verify files were actually created after touch commands — the shell doesn't error if touch succeeds on a file that already exists or fails silently

---

## May 2026 — Security Hardening

**What I did:**
- Ran vulnerability scan on `smartgrocerysavings.com` using WebSecMonitor
- Found 2 HIGH, 3 MEDIUM, 6 INFO severity issues
- Added security headers to `vercel.json`:
  - `Strict-Transport-Security` — prevents SSL stripping attacks
  - `Content-Security-Policy` — restricts resource loading, reduces XSS risk
  - `X-Frame-Options: SAMEORIGIN` — prevents clickjacking
  - `X-Content-Type-Options: nosniff` — prevents MIME sniffing
  - `Referrer-Policy` — controls referrer header leakage
  - `Permissions-Policy` — restricts browser API access
- Fixed Supabase Security Advisor warnings about `rls_auto_enable()` function:
  - First fix: `REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated`
  - Final fix: `ALTER FUNCTION public.rls_auto_enable() SECURITY INVOKER` — cleaner solution

**What I ignored (intentionally):**
- `sitemap.xml` and `robots.txt` flagged as "exposed" — these are intentionally public for SEO
- `X-XSS-Protection` header — deprecated, modern browsers ignore it
- `Server: GitHub.com` header — can't control GitHub Pages headers; will resolve after Vercel migration

**Lesson learned:**
- Security scanners flag everything including intentional configurations — always evaluate findings in context rather than blindly fixing all of them

---

## May 2026 — Credential Security Incident & Recovery

**What happened:**
- Accidentally shared Supabase anon key and Kroger client secret in chat during debugging
- Immediately rotated all exposed credentials

**Response steps taken:**
1. Generated new Kroger client secret via developer.kroger.com
2. Created new Supabase publishable API key
3. Attempted to rotate Supabase legacy anon key (JWT) — discovered no direct rotation option in new Supabase UI
4. Deleted and recreated Supabase project to fully invalidate exposed anon key
5. Re-ran complete database schema SQL on new project
6. Updated credentials in all locations: `.env`, `.env.local`, `frontend/.env`, Vercel dashboard
7. Added `.env.local` to `.gitignore`

**Lesson learned:**
- Never paste API keys or secrets into any chat interface, even for debugging
- Use `cat .env` output only to verify key *names* are present, never paste the values
- Sensitive Vercel environment variables can't be pulled to local `.env` via `vercel env pull` — must be added to `.env.local` manually
- Always rotate credentials immediately when exposed — don't wait

---

## May 2026 — Vercel Deployment Challenges

**What happened:**
Deploying the React app to Vercel was more complex than expected due to the monorepo structure (static HTML site at root + React app in `/frontend`).

**Problems encountered:**
1. Vercel kept serving root `index.html` (static site) instead of React app
2. Build was completing in 3-4 seconds — too fast, not actually running Vite
3. `vercel.json` in root wasn't being picked up when Root Directory was set to `frontend`
4. API functions in `/api` weren't accessible after setting root to `frontend`

**Solutions tried:**
- Setting Root Directory to `frontend` in Vercel dashboard ✅
- Adding `buildCommand` and `outputDirectory` to `vercel.json` ✅
- Moving `vercel.json` into `frontend/` folder (required when Root Directory is set) ✅
- Moving `api/` folder into `frontend/api/` so serverless functions are inside root directory ✅

**Final working structure:**
```
smart-grocery-savings/
├── index.html              ← static site (root)
├── frontend/               ← Vercel root directory
│   ├── api/                ← serverless functions
│   ├── src/                ← React app
│   ├── vercel.json         ← must be inside root directory
│   └── package.json
```

**Key insight:**
When using a subdirectory as Vercel's Root Directory, `vercel.json` and all serverless functions must live inside that subdirectory — not at the repo root.

---

## May 2026 — Database RLS & Permissions Fixes

**Issues encountered after deployment:**
- "permission denied for table items" when adding items from price search
- "new row violates row-level security policy" on insert

**Root cause:**
RLS policies were created but GRANT statements were missing — PostgreSQL requires both RLS policies AND explicit GRANT permissions.

**Fix applied:**
```sql
GRANT SELECT, INSERT, UPDATE ON public.items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.list_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grocery_lists TO authenticated;
GRANT SELECT ON public.stores TO authenticated;
GRANT SELECT ON public.prices TO authenticated;
```

**Lesson learned:**
In PostgreSQL with RLS enabled, you need two layers of access control:
1. RLS policies — define row-level rules (which rows a user can see/edit)
2. GRANT statements — define table-level permissions (which operations are allowed at all)
Both are required. RLS policies alone are not enough.

---

## May 2026 — Homepage Updates & App Integration

**What I did:**
- Added "🛒 Price Tool" link to static site navbar pointing to Vercel app
- Added "Compare Prices Free" CTA button to hero section
- Added app banner below hero highlighting the new price comparison tool
- Added app promotion widget to sidebar
- Updated copyright from 2025 → 2026
- Updated article titles from 2025 → 2026
- Fixed missing separator before Affiliate Disclosure in footer
- Added source attribution to "Did You Know?" stats

**Goal:**
Bridge the gap between the static content site and the React app so visitors can discover and use the price comparison tool.

---

## Roadmap — What's Next

### Phase 4 — Store Expansion & Intelligence
- [ ] Walmart Open API integration for expanded store coverage
- [ ] Zip code based store search (user enters their zip, finds nearby stores)
- [ ] Store price comparison page (side-by-side price breakdown)
- [ ] List optimization engine — finds cheapest store combination for a full grocery list
- [ ] Price history tracking in database

### Phase 5 — User Engagement
- [ ] Price drop email alerts via Resend API
- [ ] Spending tracker (log shopping trips, track budget over time)
- [ ] User preferences (preferred stores, dietary restrictions, weekly budget)
- [ ] Mixpanel analytics integration
- [ ] Improved Dashboard with real stats and recent activity

### Phase 6 — Growth & Monetization
- [ ] Crowdsourced price submissions for stores without APIs (Safeway, Raley's, Nugget)
- [ ] Affiliate deep links in price search results
- [ ] SEO optimization for React app pages
- [ ] Mobile responsive polish
- [ ] PWA support (installable as mobile app)
- [ ] Point `smartgrocerysavings.com` domain to Vercel app
- [ ] Migrate blog content into React app

---

*This log is maintained by Lori — documenting the journey of turning a static blog into a real product.*
