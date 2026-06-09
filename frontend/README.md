# 🛒 Smart Grocery Intelligence Platform

[![Live Site](https://img.shields.io/badge/Live%20Site-smartgrocerysavings.com-2e7d32?style=for-the-badge)](https://www.smartgrocerysavings.com)
[![Price Tool](https://img.shields.io/badge/Price%20Tool-Vercel-black?style=for-the-badge&logo=vercel)](https://smart-grocery-savings.vercel.app)
[![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=for-the-badge&logo=github-actions)](https://github.com/hashtags2023/smart-grocery-savings/actions)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)]()

> A full-stack grocery cost optimization platform — built from a static content site into a real application with a PostgreSQL database, REST API, user authentication, and a real-time price comparison engine.

---

## 🎯 What It Does

Smart Grocery Intelligence Platform helps users **find the cheapest store combination** for their grocery list. Users build a list, the platform queries real-time prices across 8+ stores, and returns the optimal shopping strategy — single store or split across multiple stores for maximum savings.

**Key features:**

- 🔍 Real-time grocery price comparison across 8 stores
- 📋 Grocery list builder with cost optimization
- 👤 User accounts with personalized preferences
- 📉 Price history tracking and drop alerts
- 💸 Spending tracker with store-by-store breakdown
- 📰 12 published SEO-optimized editorial posts driving organic traffic

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend                            │
│          Static HTML/CSS/JS → React (in progress)       │
│          Hosted on Vercel + custom domain (Namecheap)   │
└────────────────────────┬────────────────────────────────┘
                         │ REST API calls
┌────────────────────────▼────────────────────────────────┐
│                   Backend API                           │
│              Node.js + Express                          │
│              Vercel Serverless Functions                │
│                                                         │
│  /api/auth    /api/items    /api/stores    /api/lists   │
└────────────────────────┬────────────────────────────────┘
                         │ PostgreSQL
┌────────────────────────▼────────────────────────────────┐
│                    Database                             │
│              Supabase (PostgreSQL)                      │
│   users · items · prices · price_history · lists        │
│   preferences · alerts · spending_history               │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology            | Purpose                                      |
| --------------------- | -------------------------------------------- |
| HTML5 / CSS3          | Responsive magazine-style layout             |
| Vanilla JavaScript    | Dynamic components, form handling            |
| React _(in progress)_ | Full app UI rewrite                          |
| CSS Grid + Flexbox    | Responsive layouts                           |
| Google Fonts          | Typography (Playfair Display, Source Sans 3) |

### Backend

| Technology         | Purpose                  |
| ------------------ | ------------------------ |
| Node.js + Express  | REST API server          |
| JWT (jsonwebtoken) | Stateless authentication |
| bcryptjs           | Password hashing         |
| express-validator  | Input validation         |
| Helmet             | HTTP security headers    |

### Infrastructure

| Technology            | Purpose                                       |
| --------------------- | --------------------------------------------- |
| Vercel                | Hosting + serverless functions + CI/CD        |
| Supabase (PostgreSQL) | Database + auth + row-level security          |
| GitHub Actions        | Automated build and deployment pipeline       |
| Namecheap             | Custom domain + DNS configuration             |
| Web3Forms             | Contact form + newsletter (no backend needed) |
| Resend _(planned)_    | Transactional email for price alerts          |
| Mixpanel _(planned)_  | User behavior analytics                       |

---

## 📁 Project Structure

```
grocery-intelligence-platform/
│
├── 📄 Static Site (live at smartgrocerysavings.com)
│   ├── index.html              # Magazine-style homepage
│   ├── blog.html               # Blog listing (12 posts)
│   ├── about.html / contact.html / privacy.html
│   ├── header.html             # Shared component (JS fetch include)
│   ├── post_1.html → post_12.html
│   ├── robots.txt + sitemap.xml
│   └── css/ + images/
│
└── 🔧 Backend API (Node.js + Express)
    ├── server.js               # Express app entry point
    ├── .env.example            # Environment variable template
    ├── db/
    │   ├── index.js            # PostgreSQL connection pool
    │   └── schema.sql          # Full DB schema + seed data
    ├── middleware/
    │   └── auth.js             # JWT verification middleware
    └── routes/
        ├── auth.js             # POST /signup, POST /login, GET /me
        ├── items.js            # GET /items, GET /items/:id, price queries
        ├── stores.js           # GET /stores, POST /stores/compare
        ├── lists.js            # CRUD + optimization engine (in progress)
        ├── alerts.js           # Price drop alerts (in progress)
        └── spending.js         # Spending tracker (in progress)
```

---

## 🗄️ Database Schema

10 tables covering the full data model:

```sql
users              -- accounts, auth, profile
stores             -- 8 grocery chains with location data
categories         -- 10 product categories
items              -- grocery items with UPC + unit
prices             -- current price per item per store (UNIQUE constraint)
price_history      -- time-series price tracking
grocery_lists      -- user-owned lists with estimated totals
grocery_list_items -- items in each list with quantity + checked state
user_preferences   -- preferred stores, dietary flags, weekly budget
price_alerts       -- target price triggers per item per user
spending_history   -- logged shopping trips with totals
```

---

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/signup     Create account, return JWT
POST   /api/auth/login      Verify credentials, return JWT
GET    /api/auth/me         Get current user profile (protected)
```

### Items

```
GET    /api/items           All items with cheapest price per store
                            Supports: ?category=produce&search=apple&limit=50
GET    /api/items/:id       Single item with all store prices + 30-day history
GET    /api/items/categories/all  All categories with item counts
```

### Stores

```
GET    /api/stores          All stores with price counts
GET    /api/stores/:id/prices     All prices at a specific store
POST   /api/stores/compare  KEY ENDPOINT: Send item_ids[], get back
                            each store's total sorted cheapest-first
                            + cheapest store per individual item
```

### Lists _(in progress)_

```
GET    /api/lists            User's grocery lists
POST   /api/lists            Create list
GET    /api/lists/:id        List with items + live prices
POST   /api/lists/:id/items  Add item to list
PUT    /api/lists/:id/items/:itemId  Update quantity/checked state
GET    /api/lists/:id/optimize  CORE FEATURE: cheapest store combo
```

---

## ✨ Engineering Highlights

- **Price comparison engine** — `POST /api/stores/compare` aggregates prices across 8 stores, calculates per-store totals, identifies cheapest store per item, and returns sorted recommendations in a single query
- **JWT authentication** — stateless auth with bcrypt password hashing, 7-day token expiry, protected route middleware
- **Shared header component** — single `header.html` file loaded via `fetch()` across all pages — update once, reflects everywhere
- **CI/CD pipeline** — auto-deploys to Vercel on every push to `main` via GitHub Actions
- **SEO architecture** — `robots.txt`, `sitemap.xml` with all 12 posts, meta descriptions, structured content
- **Security** — Content Security Policy headers, X-XSS-Protection, X-Content-Type-Options, HTTPS enforced, secrets in environment variables only
- **FTC compliant** — affiliate disclosure on all monetized content per FTC guidelines

---

## 🚀 Running Locally

```bash
# Clone
git clone https://github.com/hashtags2023/smart-grocery-savings.git
cd smart-grocery-savings

# Backend setup
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, SUPABASE keys

npm install
npm run dev        # API runs at http://localhost:3001

# Run schema in Supabase SQL Editor
# Paste contents of backend/db/schema.sql

# Test
curl http://localhost:3001/health
curl http://localhost:3001/api/stores
curl http://localhost:3001/api/items?category=produce
```

---

## 📊 Content & SEO

12 published posts with 800–2,000+ words each, targeting high-intent grocery search queries:

| Post    | Topic                           | Target Keywords                  |
| ------- | ------------------------------- | -------------------------------- |
| post_1  | Top 5 Grocery Delivery Services | grocery delivery comparison 2026 |
| post_2  | Walmart+ vs Instacart           | walmart plus vs instacart        |
| post_6  | Aldi vs Walmart                 | aldi vs walmart cheaper          |
| post_9  | How to Save at Costco           | costco savings tips              |
| post_10 | Amazon Fresh Closing            | amazon fresh stores closed 2026  |
| post_11 | Cheapest Avocados               | cheapest avocados grocery store  |
| post_12 | Less Microplastics              | food with less microplastics     |

---

## 💰 Monetization

| Channel                   | Status            |
| ------------------------- | ----------------- |
| Amazon Associates         | ✅ Active         |
| Google AdSense            | 🔄 Pending review |
| Thrive Market Affiliate   | 🔄 In review      |
| Instacart (Impact.com)    | 🔄 In review      |
| HelloFresh (CJ Affiliate) | 🔄 Submitted      |

---

## 🔒 Security

- HTTPS enforced (GitHub Pages + Vercel SSL)
- Content Security Policy meta tags
- JWT with bcrypt — no plaintext passwords stored
- Environment variables for all secrets — never committed to repo
- Input validation on all API endpoints via express-validator
- Helmet.js HTTP security headers on API

---

## 📬 Contact

**Website:** [smartgrocerysavings.com](https://www.smartgrocerysavings.com)
**Price Tool:** [smart-grocery-savings.vercel.app](https://smart-grocery-savings.vercel.app)
**Contact:** [smartgrocerysavings.com/contact.html](https://www.smartgrocerysavings.com/contact.html)

---

_Built by Lori — software developer. Grew from a static HTML/CSS site to a full-stack platform with PostgreSQL, REST API, JWT auth, and a real-time price comparison engine._
