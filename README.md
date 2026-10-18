# 📈 StockPulse — Real-Time Stock Market Watcher

<div align="center">

🌐 **Language / Bahasa:** **English** | [Bahasa Indonesia](./README.id.md)

</div>

> **StockPulse** is a real-time stock market analytics and monitoring platform covering United States (US) and Indonesian (IDX / BEI) equities. Built with a high-density modern terminal aesthetic, serverless-ready architecture (*100% free tier*), CoinGecko/TradingView-style performance visualizations, and Indonesian Stock Exchange exchange mechanics calculators.

---

[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016%20(Turbopack)-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Styling](https://img.shields.io/badge/CSS-Tailwind%20v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/Vitest-57%20Passed%20(100%25)-green?logo=vitest)](https://vitest.dev)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel%20%2B%20Cloud%20Run-blue?logo=vercel)](https://vercel.com)
[![AI-Assisted](https://img.shields.io/badge/Development-AI--Assisted-8A2BE2)](#-ai-assisted-development)

---

## 📸 Latest UI Showcase & Live Captures

Below are authentic screenshot captures from the live StockPulse interface:

### 1. 🌟 Interactive Spotlight Tour (Steps 1 & 2)
Live in-DOM guided walkthrough anchored dynamically over active elements featuring a luminous spotlight ring (`ring-2 ring-blue-500 shadow-[0_0_60px_rgba(59,130,246,0.45)]`), backdrop darkening, floating popover cards, and full keyboard navigation (<kbd>Esc</kbd>, <kbd>→</kbd>, <kbd>←</kbd>).

| Step 1: Real-Time Market Status Ribbon | Step 2: Command Palette Ticker Search |
| :---: | :---: |
| ![Spotlight Tour - Step 1](./docs/screenshots/spotlight-tour.png) | ![Spotlight Tour - Step 2](./docs/screenshots/spotlight-tour-step2.png) |

---

### 2. 📊 Stock Detail, IDX Mechanics, & Multi-Horizon Performance
Comprehensive analytics page for any equity (e.g., `BBCA.JK` - Bank Central Asia), featuring Auto Rejection thresholds (ARA/ARB), 52-week price range bar, IDX Lot Calculator, and multi-horizon return matrix.

![Stock Detail Full](./docs/screenshots/stock-detail-full.png)

---

### 3. 🧭 Tutorial Guide & Popular Tickers Cheat Sheet Modal
Dual-tab modal featuring a 4-step interactive feature tour and a curated cheat sheet of popular US & IDX tickers with 1-click clipboard copying.

![Tutorial Modal](./docs/screenshots/tutorial-modal.png)

---

### 4. 🔍 Instant Command Palette (<kbd>Cmd+K</kbd> / <kbd>Ctrl+K</kbd>)
Fast keyboard-first search with auto-complete, exchange badges, and instant detection of US vs IDX (.JK) equities.

![Command Palette](./docs/screenshots/command-palette.png)

---

## ⚡ Core Features

### 🌟 1. Onboarding & Interactive Spotlight Tour
- **5-Step Live Element Spotlight**: Dynamically targets real DOM elements via `getBoundingClientRect()` with smooth scrolling:
  1. `tour-market-status`: Trading hours for IDX (09:00 - 16:00 WIB) & US Wall Street (21:30 - 04:00 WIB).
  2. `tour-search-command`: Global shortcut <kbd>Cmd+K</kbd> / <kbd>Ctrl+K</kbd> and `.JK` suffix conventions.
  3. `tour-market-summary`: 4 benchmark indices (S&P 500, Nasdaq, Dow Jones, IHSG) with mini sparklines.
  4. `tour-sector-filter`: Instant filters for exchange (**All**, **US**, **IDX**) and sector categories.
  5. `tour-stock-grid`: Real-time stock cards, Recharts chart links, lot calculators, and price alerts.
- **Homepage Onboarding Banner**: Dismissible welcome card with persistent state stored in `localStorage`.
- **Keyboard Accessible**: Full keyboard navigation (<kbd>Esc</kbd> to exit, Arrow keys to navigate).

### 🇮🇩 2. Indonesian Stock Exchange (IDX / BEI) Mechanics
- **IDX Lot Calculator**: Realistic trade simulation based on the 1 lot = 100 shares standard, Buy/Sell toggles, quick-select chips (1, 5, 10, 50, 100 lots), broker fee estimation (0.15%), exchange levy, and final income tax.
- **Symmetric Auto Rejection Limits (ARA & ARB)**: Calculates official upper (*Auto Rejection Atas*) and lower (*Auto Rejection Bawah*) limits according to IDX price fraction rules.
- **Standardized Ticker Format**: Seamless `.JK` suffix support across all IDX counters (e.g., `BBCA.JK`, `BBRI.JK`, `TLKM.JK`).

### 📈 3. CoinGecko & TradingView-Style Financial Analytics
- **7-Day Sparkline SVG**: Cubic Bezier mini trendlines with dynamic emerald/rose gradients on each stock card.
- **Multi-Horizon Returns**: Performance percentage table across standard periods: **1D (24 Hours)**, **1W (7 Days)**, **1M (30 Days)**, **1Y (1 Year)**, and **YTD**.
- **52-Week Range Bar**: Visual indicator showing current price position between 52-week low and high, with percentage drawdown from all-time peak.

### 🎯 4. Strict Index Points vs Dual-Currency Formatting
- **Market Index Points**: Global indices (`^GSPC`, `^IXIC`, `^DJI`) and IDX Composite (`^JKSE`) strictly formatted in index points (`pts`), never falsely prepended with currency symbols.
- **Dual-Currency Support**: Clean USD (`$`) formatting for Wall Street stocks and integer Rupiah (`Rp`) without misleading decimals for Indonesian equities.

### 🏷️ 5. Sector Filters & 32 Pre-Seeded Bluechip Equities
- Quick categorization by exchange (**All**, **US**, **IDX**) or sector (**Technology**, **Financial Services**, **Energy**, **Consumer Cyclical**, **Healthcare**).
- Pre-seeded watchlist of 32 mega-cap, high-liquidity stocks across both markets.

### ⏱️ 6. Smart Polling & Resilient Caching
- **Adaptive Polling**: Auto-refreshes every 1 minute during active market sessions and throttles down to 15 minutes off-hours.
- **Resilient Fallback Cache**: Backend TTL caching ensures high uptime even during Yahoo Finance rate limits.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | **Next.js 16.3.8 (App Router)** | Fullstack React framework with ultra-fast Turbopack bundler |
| **UI Library** | **React 19** & **Tailwind CSS v4** | Modern component styling with utility-first classes and zinc-950 dark theme tokens |
| **Primitives & Icons** | **Radix UI**, **CMDK**, **Lucide React** | Accessible dialogs, popovers, keyboard-first command palette, and SVG icons |
| **State Management** | **TanStack Query v5** & **Zustand v5** | Automatic server-state synchronization with persistent local storage |
| **Chart Engine** | **Recharts** & **Custom SVG Bezier** | Multi-timeframe interactive charts (1D/1W/1M/3M/1Y) + mini sparklines |
| **Backend API** | **FastAPI (Python 3.11)** | Asynchronous Python REST API with Pydantic v2 validation |
| **Data Provider** | **yfinance (Yahoo Finance)** + **cachetools** | Free-tier market data provider with in-memory TTL caching |
| **Database & Auth** | **Supabase (PostgreSQL)** | Persistent watchlist, price alerts, and auth-ready schema |
| **Testing** | **Vitest** (Unit/Integration) & **Playwright** (E2E) | 57 unit tests with 100% pass rate |
| **Deployment** | **Vercel** (Serverless Monorepo) / **Cloud Run** | Monorepo configuration with zero-config serverless rewrites |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v20+ and npm
- **Python** 3.11+

---

### 1. Clone the Repository
```bash
git clone https://github.com/NAxel-code/stock-market-watcher.git
cd stock-market-watcher
```

---

### 2. Start Backend (FastAPI)
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Run development server
uvicorn app.main:app --reload --port 8000
```
- Backend API running at: `http://localhost:8000`
- Interactive Swagger / OpenAPI docs: `http://localhost:8000/docs`

---

### 3. Start Frontend (Next.js 16)
Open a new terminal tab at the project root:
```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```
- Open browser at: `http://localhost:3000`

---

## 🧪 Automated Testing

This project follows rigorous *Test-Driven Development (TDD)* to guarantee stability across components and financial calculators.

### Frontend Unit & Component Tests (Vitest)
```bash
cd frontend
npm test
```
> **Latest Test Run**: **57 / 57 tests passed (100% PASS)** across 11 test suites:
> - `SpotlightTour.test.tsx` (5 tests)
> - `TutorialModal.test.tsx` (5 tests)
> - `SectorFilterBar.test.tsx` (3 tests)
> - `Sparkline.test.tsx` (4 tests)
> - `FiftyTwoWeekRangeBar.test.tsx` (2 tests)
> - `MultiHorizonReturns.test.tsx` (2 tests)
> - `IdxLotCalculator.test.tsx` (2 tests)
> - `StockCard.test.tsx` (9 tests)
> - `formatters.test.ts` (11 tests)
> - `api.test.ts` (8 tests)
> - `useUIStore.test.ts` (6 tests)

### Backend Unit & Service Tests (Pytest)
```bash
cd backend
pytest -v
```

---

## 📁 Monorepo Structure

```
stock-market-watcher/
├── package.json               # Root monorepo npm workspaces
├── vercel.json                # Vercel deployment & serverless proxy routing
├── docs/                      # PRD, architectural diagrams, visual assets
│   └── screenshots/           # UI & spotlight tour screenshot evidence
├── frontend/                  # Next.js 16 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     # Root layout with dark mode & query client
│   │   │   ├── page.tsx       # Main dashboard page
│   │   │   ├── stocks/[ticker]# Dynamic stock detail & analytics page
│   │   │   └── watchlist/     # Dedicated watchlist manager page
│   │   ├── components/
│   │   │   ├── features/      # SpotlightTour, TutorialModal, IdxLotCalculator, etc.
│   │   │   ├── layout/        # Navbar, MarketStatusRibbon, ThemeToggle
│   │   │   └── ui/            # Primitive UI components (Button, Dialog, Badge, Skeleton)
│   │   ├── hooks/             # TanStack Query custom hooks
│   │   ├── lib/               # API client, currency/index formatters, utilities
│   │   └── stores/            # Zustand stores (useUIStore)
│   │   └── types/             # TypeScript interfaces (StockQuote, Returns, etc.)
│   └── next.config.ts         # Turbopack configuration & API proxy rewrites
└── backend/                   # FastAPI Python backend
    ├── pyproject.toml         # PEP 621 packaging standard (uv/hatchling)
    ├── app/
    │   ├── api/v1/            # Endpoints: stocks, market, watchlist, alerts
    │   ├── core/              # App config, exceptions, structured logging
    │   ├── models/            # Pydantic schemas (StockQuote, AutoRejection, etc.)
    │   ├── services/          # yfinance provider, multi-period return calculators
    │   └── db/                # Supabase PostgreSQL migrations
    └── tests/                 # Pytest test suite
```

---

## 📌 Issue Tracking & Fix History (GitHub Issues)

All architectural enhancements and bug fixes are comprehensively documented in the repository's GitHub Issue Tracker:

| Issue | Title & Scope | Labels | Resolution Commit |
| :---: | :--- | :--- | :--- |
| [**#1**](https://github.com/NAxel-code/stock-market-watcher/issues/1) | `feat(tutorial): Interactive Spotlight Tour with live DOM element highlighting` | `enhancement`, `accessibility` | [`9dd1236`](https://github.com/NAxel-code/stock-market-watcher/commit/9dd1236) |
| [**#2**](https://github.com/NAxel-code/stock-market-watcher/issues/2) | `feat(tutorial): Interactive feature guide and ticker cheat sheet modal` | `enhancement`, `documentation` | [`67936c5`](https://github.com/NAxel-code/stock-market-watcher/commit/67936c5) |
| [**#3**](https://github.com/NAxel-code/stock-market-watcher/issues/3) | `fix(currency): Market indices formatted as currency and USD/IDR inconsistency across views` | `bug` | [`628c04a`](https://github.com/NAxel-code/stock-market-watcher/commit/628c04a) |
| [**#4**](https://github.com/NAxel-code/stock-market-watcher/issues/4) | `refactor(ui): UI/UX audit for financial terminal aesthetic and contrast compliance` | `enhancement` | [`666d010`](https://github.com/NAxel-code/stock-market-watcher/commit/666d010) |
| [**#5**](https://github.com/NAxel-code/stock-market-watcher/issues/5) | `feat(watchlist): Sector and market filter explorer for US & IDX bluechip tickers` | `enhancement` | [`7c9e456`](https://github.com/NAxel-code/stock-market-watcher/commit/7c9e456) |
| [**#6**](https://github.com/NAxel-code/stock-market-watcher/issues/6) | `feat(analytics): 7-day sparklines, multi-horizon returns, and 52-week peak distance` | `enhancement` | [`cb16a4a`](https://github.com/NAxel-code/stock-market-watcher/commit/cb16a4a) |
| [**#7**](https://github.com/NAxel-code/stock-market-watcher/issues/7) | `fix(deploy): Vercel monorepo configuration, python uv packaging, and serverless routing` | `bug` | [`26788c2`](https://github.com/NAxel-code/stock-market-watcher/commit/26788c2) |
| [**#8**](https://github.com/NAxel-code/stock-market-watcher/issues/8) | `fix(nextjs16): Next.js 16 dynamic route params Promise and CommandDialog context wrap` | `bug` | [`36b919d`](https://github.com/NAxel-code/stock-market-watcher/commit/36b919d) |

---

## 🤖 AI-Assisted Development

This project was engineered using *AI-assisted pair programming* (Google DeepMind Antigravity) for system architecture, component design, and test-driven verification (*Test-Driven Development*), guided by human software engineering principles focusing on clean code, zero speculative abstractions, and financial domain precision.

---

## 📄 License

Distributed under the **MIT** License. See [LICENSE](./LICENSE) for full terms.
