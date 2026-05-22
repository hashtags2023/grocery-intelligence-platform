# 🛒 Smart Grocery Savings

> A full-stack grocery cost optimization platform helping everyday shoppers find the lowest prices across stores, build smart grocery lists, and save more money every week.

**Live App:** [smart-grocery-savings.vercel.app](https://smart-grocery-savings.vercel.app)  
**Content Site:** [www.smartgrocerysavings.com](https://www.smartgrocerysavings.com)

---

## 🚀 What It Does

Smart Grocery Savings started as a static content blog and evolved into a full-stack web application. Users can:

- **Search real-time grocery prices** from Kroger-family stores via the official Kroger API
- **Build and manage grocery lists** with checkboxes and progress tracking
- **Add items directly** from live search results into personal lists
- **Create an account** and have all data saved securely to the cloud
- **Read in-depth guides** on saving money at every major grocery chain

---

## 🏗️ Architecture

This is a monorepo containing both the static content site and the full-stack React application.

```
smart-grocery-savings/
├── frontend/                  # React application (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx          # User authentication
│   │   │   ├── Signup.jsx         # Account creation
│   │   │   ├── Dashboard.jsx      # User dashboard
│   │   │   ├── PriceSearch.jsx    # Real-time Kroger price search
│   │   │   └── GroceryList.jsx    # List builder and manager
│   │   ├── components/
│   │   │   └── Navbar.jsx         # Navigation with auth state
│   │   └── lib/
│   │       └── supabase.js        # Supabase client
│   ├── api/                       # Vercel serverless functions
│   │   ├── kroger-token.js        # Kroger OAuth token handler
│   │   ├── kroger-search.js       # Product search with pricing
│   │   └── kroger-locations.js    # Store location lookup
│   └── vercel.json                # Vercel routing + security headers
├── css/style.css              # Static site stylesheet
├── index.html                 # Static site homepage
├── post_1.html → post_12.html # Blog posts
└── DEVLOG.md                  # Engineering decisions and challenges
```

---

## 🛠️ Tech Stack

| Layer        | Technology                  | Purpose                                      |
| ------------ | --------------------------- | -------------------------------------------- |
| Frontend     | React + Vite                | Component-based UI                           |
| Auth         | Supabase Auth               | User signup, login, sessions                 |
| Database     | PostgreSQL (Supabase)       | Grocery lists, items, prices                 |
| API Layer    | Vercel Serverless Functions | Kroger API proxy (keeps secrets server-side) |
| Price Data   | Kroger Developer API        | Real-time product prices                     |
| Hosting      | Vercel                      | Frontend + serverless functions              |
| Content Site | GitHub Pages → Vercel       | Static HTML/CSS/JS blog                      |
| Domain       | Namecheap                   | Custom domain DNS                            |
| Analytics    | Mixpanel                    | User behavior tracking                       |

---

## 🗄️ Database Schema

```sql
stores          -- Grocery store locations
items           -- Grocery product catalog (grows via user searches)
prices          -- Price records per item per store
grocery_lists   -- User-owned shopping lists
list_items      -- Items within each list with quantity + checked state
```

Row Level Security (RLS) enabled on all tables — users can only access their own data.

---

## 🔐 Security

- **Row Level Security** on all Supabase tables
- **Serverless API proxy** keeps Kroger credentials server-side only
- **Security headers** via `vercel.json`:
  - `Strict-Transport-Security` — prevents SSL stripping
  - `X-Frame-Options: SAMEORIGIN` — prevents clickjacking
  - `X-Content-Type-Options: nosniff` — prevents MIME sniffing
  - `Referrer-Policy` — controls referrer leakage
- **Environment variables** never committed to Git
- `.env`, `.env.local`, `node_modules/` all gitignored

---

## 🌐 API Integration

### Kroger Developer API

The app integrates with the official Kroger API to fetch real-time product prices from Kroger-family stores (Foods Co, Fred Meyer, King Soopers, etc.).

```
Browser → Vercel Serverless Function → Kroger API → Browser
```

Secrets stay server-side. The frontend never touches the Kroger credentials directly.

**Endpoints built:**

- `GET /api/kroger-token` — OAuth2 client credentials flow
- `GET /api/kroger-search?query=milk&locationId=xxx` — Product search with prices
- `GET /api/kroger-locations?zip=95814` — Find nearby stores by zip code

---

## 📦 Local Development

```bash
# Clone the repo
git clone https://github.com/hashtags2023/smart-grocery-savings.git
cd smart-grocery-savings

# Install Vercel CLI
npm install -g vercel

# Link to Vercel project
vercel link

# Create .env.local with your credentials
cp .env.example .env.local
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
#          KROGER_CLIENT_ID, KROGER_CLIENT_SECRET, VITE_MIXPANEL_TOKEN

# Run locally (frontend + API together)
vercel dev

# Or run just the React frontend
cd frontend && npm run dev
```

---

## 🚢 Deployment

Auto-deploys to Vercel on every push to `main`.

```bash
# Manual production deploy
vercel --prod
```

Environment variables are set in Vercel dashboard → Settings → Environment Variables.

---

## 💰 Monetization

| Program                          | Status                                 |
| -------------------------------- | -------------------------------------- |
| Amazon Associates                | ✅ Active — Store ID: smartgrocerys-20 |
| Google AdSense                   | 🔄 Pending approval                    |
| Thrive Market Affiliate          | 🔄 In review                           |
| Instacart Affiliate (Impact.com) | 🔄 In review                           |
| Walmart Affiliate (Impact.com)   | 🔄 Pending                             |
| HelloFresh (CJ Affiliate)        | 🔄 Submitted                           |

---

## 📝 Content

**12 published blog posts** covering:

- Grocery delivery service comparisons (Instacart, Walmart+, Amazon Fresh)
- Cashback app reviews (Ibotta, Fetch Rewards, Rakuten)
- Store price comparisons (Aldi vs Walmart, Costco savings guide)
- Meal planning on a budget
- Health-conscious shopping tips

---

## 🗺️ Roadmap

- [ ] Walmart API integration for expanded store coverage
- [ ] Store price comparison page (side-by-side)
- [ ] List optimization engine (cheapest store combination)
- [ ] Price drop email alerts (Resend API)
- [ ] Spending tracker and budget dashboard
- [ ] Crowdsourced prices for stores without APIs
- [ ] Mobile PWA support

---

## 📬 Contact

**Email:** smartgrocerysavings2026@gmail.com  
**Website:** [smartgrocerysavings.com/contact.html](https://www.smartgrocerysavings.com/contact.html)

---

## 📄 License

Proprietary. Content, design, and code are the property of Smart Grocery Savings.

---

_Built by Lori — software developer turning a content site into a real product, one sprint at a time._
