# 📈 StockPulse — Real-Time Equity & Quant Intelligence Terminal

<div align="center">

🌐 **Language / Bahasa:** **English** | [Bahasa Indonesia](./README.id.md)

</div>

> **StockPulse** is an institutional-grade real-time equity market terminal and quantitative analytics suite covering United States (US) and Indonesian (IDX / BEI) equities. Built with an Awwwards-inspired minimalist *Obsidian Vault* design system, serverless-ready architecture (*100% free tier*), TradingView-grade Lightweight Charts with a 1-click Technical Indicator Tray, an interactive Paper Trading Simulator with official BEI Fraksi Harga auto-snapping, Stan Weinstein 4-Stage Technical Desk analytics, and Almgren-Chriss market impact execution modeling.

---

[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016%20(Turbopack)-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Styling](https://img.shields.io/badge/Design-Obsidian%20Vault%20Minimalist-07080A)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Charts](https://img.shields.io/badge/Charts-Lightweight--Charts%20v5-blue?logo=tradingview)](https://tradingview.github.io/lightweight-charts/)
[![Vitest](https://img.shields.io/badge/Vitest-90%20Passed%20(100%25)-green?logo=vitest)](https://vitest.dev)
[![Pytest](https://img.shields.io/badge/Pytest-57%20Passed%20(100%25)-green?logo=pytest)](https://pytest.org)
[![E2E Testing](https://img.shields.io/badge/Playwright-5%20Stages%20Passed-45ba4b?logo=playwright)](https://playwright.dev)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel%20Production-success?logo=vercel&logoColor=white)](https://stock-market-watcher-lemon.vercel.app)
[![AI-Assisted](https://img.shields.io/badge/Development-AI--Assisted-8A2BE2)](#-ai-assisted-development)

---

## 📸 Latest Terminal UI Showcase & Live Captures

Below are authentic screenshot captures from the live StockPulse interface:

### 1. 🕯️ Technical Indicator Tray & Dynamic Price Lines (TradingView Canvas)
Interactive charting featuring a 1-click **Indicator Tray** (**EMA 9**, **EMA 21**, **SMA 20**, **EMA 50**, **EMA 200**, **Bollinger Bands**, **VWAP**, **Volume**), expanded theater canvas mode, and dynamic horizontal price lines for active simulated orders (**Entry**, **Take Profit**, **Stop Loss**).

| Indicator Tray & Candlestick Canvas | Dynamic Price Lines Overlay (TP / SL) |
| :---: | :---: |
| ![Indicators Chart](./docs/screenshots/webapp_test_indicators_chart.png) | ![Simulated Lines Chart](./docs/screenshots/webapp_test_chart_with_sim_lines.png) |

---

### 2. 💼 Paper Trading Execution Desk & Portfolio Telemetry
Simulated execution environment with real-time portfolio telemetry, market & limit order tickets, BEI Fraksi Harga auto-snapping, 1-click target import from the Technical Desk, and position trimming.

![Paper Trading Desk](./docs/screenshots/webapp_test_paper_trading.png)

---

### 3. 🌟 Interactive Spotlight Tour & Onboarding
Live in-DOM guided walkthrough anchored dynamically over active elements via React Portals, featuring a true cutout spotlight, floating popover cards, and full keyboard navigation (<kbd>Esc</kbd>, <kbd>→</kbd>, <kbd>←</kbd>).

| Step 1: Real-Time Market Status Ribbon | Step 2: Command Palette Ticker Search |
| :---: | :---: |
| ![Spotlight Tour - Step 1](./docs/screenshots/spotlight-tour.png) | ![Spotlight Tour - Step 2](./docs/screenshots/spotlight-tour-step2.png) |

---

### 4. 🔍 Instant Command Palette (<kbd>Cmd+K</kbd> / <kbd>Ctrl+K</kbd>)
Fast keyboard-first search with auto-complete, exchange badges, and instant detection of US vs IDX (.JK) equities.

![Command Palette](./docs/screenshots/command-palette.png)

---

## ⚡ Core Features

### 💼 1. Paper Trading Simulator Desk
Zero-risk execution suite designed to test real-market strategies with authentic exchange mechanics:
- **Virtual Account Telemetry**: Starting capital of **Rp 100,000,000** for Indonesian stocks and **$10,000** for US equities, tracking Portfolio Equity, Available Cash, Unrealized P&L, and Realized P&L.
- **Order Execution Ticket**: Supports **BUY (Long)** and **SELL (Short / Exit)** with **Market Orders** and **Limit Orders**.
- **BEI Fraksi Harga Snapping**: Automatically snaps order prices to official Bursa Efek Indonesia tick sizes (Rp 1, 2, 5, 10, 25/tick) with 1-click `-1T` / `+1T` stepping buttons.
- **Quick Lot Allocation**: 1-click presets for lot sizing (1, 5, 10, 25, 50, 100 Lots) and portfolio cash allocation (`25% Cash`, `50% Cash`).
- **Risk Management Brackets**: Take Profit (TP) and Stop Loss (SL) controls with percentage quick presets (+5%, +10%, +15% / -3%, -5%, -7%).
- **✨ Import Desk Targets**: 1-click button to automatically populate optimal Target 1 and Stop-Loss levels directly from the *Stan Weinstein Technical Desk*.
- **Position Trimming & Short Collateral Accounting**: Automatically handles closing long positions, partial trimming, and exact short selling collateral release with broker fee deductions (0.15% buy, 0.25% sell).
- **Client-Side Persistence**: Preserves portfolio balances, open positions, and complete trade history in browser `localStorage`.

---

### 🕯️ 2. Professional Financial Charting & Quick Indicator Tray
Powered by TradingView's high-performance HTML5 canvas engine (`lightweight-charts` v5.2) with sub-millisecond redraws:
- **Chart Presentation Modes**:
  - **Candlestick (`Candle`)**: Crisp wicks and bodies in Neo-Emerald (`#00E599`) and Crimson (`#FF3B56`).
  - **OHLC Bar (`Bar`)**: Classic Wall Street bar representation with left open and right close ticks.
  - **Value at Risk Distribution (`VaR Risk`)**: Quantitative risk distribution calculating **1-Day 95% VaR**, **1-Day 99% Tail Risk**, **Conditional VaR (CVaR 95%)**, **Annualized Volatility**, and daily return histograms.
  - **Area Trend (`Area`)**: Smooth price curves with adaptive linear gradient fills.
- **Institutional Technical Indicator Tray**: 1-click toggle bar with colored signal dots directly above the chart:
  - **EMA 9** (Cyan `#00B2FF`): Short-term momentum trigger.
  - **EMA 21** (Neo-Emerald `#00E599`): Swing trend baseline.
  - **SMA 20** (Royal Blue `#3B82F6`): Mean reversion indicator.
  - **EMA 50** (Amber `#FFB800`): Medium-term institutional trendline.
  - **EMA 200** (Purple `#A855F7`): Macro bull/bear boundary.
  - **Bollinger Bands (20, 2)**: Upper band, 20 SMA middle line, and lower band.
  - **VWAP (Volume-Weighted Average Price)** (Gold `#FACC15`): Cumulative intraday volume-weighted benchmark.
  - **Volume Histogram**: Synchronized volume overlay with directional color-coding.
- **Visual Trading Price Lines**: Projects horizontal dashed lines directly onto the chart canvas when simulated positions are open (`SIM ENTRY`, `SIM TP`, `SIM SL`).
- **Expanded Theater Canvas Mode**: 1-click button to expand chart canvas height from 340px to 520px for high-density technical analysis.

---

### 🏛️ 3. Institutional Technical Analysis Desk (PRO Tab)
Algorithmic technical intelligence engine built on classical quantitative trading principles:
- **Stan Weinstein 4-Stage Analysis**: Classifies market phases into **Stage 1 (Accumulation / Base)**, **Stage 2 (Markup / Bull Run)**, **Stage 3 (Distribution / Top)**, or **Stage 4 (Capitulation / Downtrend)** with directional bias and confidence score.
- **Market Structure & Swing Pivots**: Identifies higher highs / higher lows (HH-HL) vs lower highs / lower lows (LH-LL), nearest dynamic support & resistance levels, 300-day peak drawdown, and 20/50/200-day Moving Average stack alignment.
- **Volume Spread Analysis (VSA)**: Detects institutional footprint including 20-day up/down volume participation ratio, volume surge multipliers, selling climaxes, stopping volume, and supply absorption.
- **Momentum Suite**: Combines RSI (14-period), MACD (line, signal, histogram), Average Directional Index (ADX 14 trend strength), Stochastic Oscillator (%K, %D), and Chaikin Money Flow (CMF 20 institutional accumulation/distribution).
- **Probabilistic Scenario Projections**: Calculates mathematical probabilities for **Bullish Breakout**, **Base Case Consolidation**, and **Bearish Breakdown** with specific trigger conditions and price targets.
- **Actionable Institutional Trade Plan**: Produces clear verdicts (**Buy on Breakout**, **Buy on Weakness**, **Take Profit**, **Hold**, **Avoid**) alongside calculated buy zones, stop-loss levels, Target 1 & Target 2 milestones, Risk/Reward ratios, and psychological guardrails.

---

### 🇮🇩 4. Indonesian Stock Exchange (IDX / BEI) Mechanics
- **IDX Lot Calculator**: Realistic trade simulation based on the 1 lot = 100 shares standard, Buy/Sell toggles, quick-select chips (1, 5, 10, 50, 100 lots), broker fee estimation (0.15% buy, 0.25% sell), exchange levies, and final withholding tax.
- **Symmetric Auto Rejection Limits (ARA & ARB)**: Calculates official upper (*Auto Rejection Atas*) and lower (*Auto Rejection Bawah*) percentage limits according to IDX price fraction rules.
- **Standardized Ticker Format**: Seamless `.JK` suffix support across all IDX counters (e.g., `BBCA.JK`, `BBRI.JK`, `TLKM.JK`, `GOTO.JK`).
- **Live WIB Ticking Clock**: Real-time Jakarta market clock updating every second without requiring page reloads.

---

### 🔬 5. Quantitative Finance & Algorithmic Execution Suite
- **Almgren-Chriss (2000) Optimal Execution Simulator**: Models non-linear market impact ($I \propto \sigma \sqrt{\text{Order} / \text{ADV}}$) and True Cost of Execution (TCO) inside the IDX Lot Calculator. Offers interactive urgency profiles (**Aggressive**, **Balanced**, **Passive TWAP**), participation rate analysis, and scheduled 4-slice execution schedules to minimize liquidity friction.
- **Kalman Filter Dynamic Beta & Drift**: Replaces static CAPM regression with a 1D state-space Kalman filter estimating time-varying systematic beta ($\beta_t$), market decoupling indices ($1 - R^2$), and dynamic drift states (`BETA_EXPANDING`, `BETA_DEFENSIVE`, `STABLE`).
- **Marchenko-Pastur Random Matrix Theory (RMT) Correlation Denoising**: Removes empirical sample noise from portfolio correlation matrices by filtering eigenvalues below the theoretical Marchenko-Pastur upper bound ($\lambda_+ = \sigma^2(1 + \sqrt{N/T})^2$). Shrinks pure noise factors into constant trace while isolating true macroeconomic signal drivers.
- **Interactive Portfolio Correlation Heatmap**: Live correlation matrix on the Watchlist page featuring 1-click toggles between Denoised (RMT) and Raw Empirical views, spectral diagnostic counters, and comparative cell hover inspect.

---

### 🌟 6. Minimalist Obsidian Vault Design System & Onboarding
- **Awwwards-Caliber Aesthetic**: Deep Obsidian Void (`#07080A`), Monolith containers (`#0D0F14`), architectural hairline frames (`#161C26`), Neo-Emerald (`#00E599`), and Crimson Laser (`#FF3B56`).
- **Brand Identity**: Custom vector geometric *Dynamic Aperture Vector* logo mark and multi-resolution SVG browser tab favicon (`favicon.svg` & `icon.svg`).
- **5-Step Live Element Spotlight Tour**: Dynamically targets active DOM elements with smooth scrolling and true cutout masks:
  1. `tour-market-status`: Trading hours for IDX (09:00 - 16:00 WIB) & US Wall Street (21:30 - 04:00 WIB).
  2. `tour-search-command`: Global shortcut <kbd>Cmd+K</kbd> / <kbd>Ctrl+K</kbd> and `.JK` suffix conventions.
  3. `tour-market-summary`: 4 benchmark indices (S&P 500, Nasdaq, Dow Jones, IHSG) with mini sparklines.
  4. `tour-sector-filter`: Instant filters for exchange (**All**, **US**, **IDX**) and sector categories.
  5. `tour-stock-grid`: Real-time stock cards, charts, lot calculators, and price alerts.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | **Next.js 16.3.8 (App Router)** | Fullstack React framework with ultra-fast Turbopack bundler |
| **UI Library** | **React 19** & **Tailwind CSS v4** | Modern component styling with minimalist Obsidian Vault theme tokens |
| **Chart Engines** | **TradingView Lightweight Charts v5.2** & **Recharts v3** | Canvas Candlestick, OHLC Bar, Area, Indicator Tray, and VaR return distribution |
| **Trading Simulation** | **Custom Paper Trading Engine** & **BEI Fraksi Snapper** | Virtual equity portfolio with order execution, bracket TP/SL, and localStorage sync |
| **Primitives & Icons** | **Radix UI**, **CMDK**, **Lucide React** | Accessible dialogs, popovers, keyboard-first command palette, and vector icons |
| **State Management** | **TanStack Query v5** & **Zustand v5** | Server-state caching and centralized client store with `localStorage` persistence |
| **Backend API** | **FastAPI (Python 3.12)** | Asynchronous Python REST API with Pydantic v2 validation and technical desk math |
| **Data Provider** | **yfinance (Yahoo Finance)** + **cachetools** | Zero-cost market data provider with in-memory TTL caching |
| **Database & Auth** | **Supabase (PostgreSQL)** | Persistent watchlist, price alerts, and auth-ready schema |
| **Testing** | **Vitest** (90 tests), **Pytest** (57 tests), **Playwright** | 100% test pass rate across unit, service, and E2E browser automation (147+ tests total) |
| **Deployment** | [**Vercel Serverless**](https://stock-market-watcher-lemon.vercel.app) | Live production monorepo deployment with serverless routing |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v20+ and npm
- **Python** 3.12+

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

This project follows rigorous *Test-Driven Development (TDD)* to guarantee stability across components, chart series, trading simulator math, and financial calculators.

### Frontend Unit & Component Tests (Vitest)
```bash
cd frontend
npm test
```
> **Latest Test Run**: **90 / 90 tests passed (100% PASS)** across 18 test suites:
> - `PaperTradingDesk.test.tsx` (4 tests) - *Order ticket, desk target import, BUY/SELL side toggle*
> - `PriceChart.test.tsx` (5 tests) - *Candlestick, OHLC Bar, VaR Risk, Indicator Tray, Theater Mode*
> - `usePaperTradingStore.test.ts` (8 tests) - *Order accounting, fees, position trimming, short collateral*
> - `indicators.test.ts` (4 tests) - *EMA 9/21, SMA 20, Bollinger Bands, and VWAP math*
> - `formatters.test.ts` (12 tests) - *BEI Fraksi Harga tick sizes, stepping, lot values, currency*
> - `StockCard.test.tsx` (9 tests)
> - `AnalysisDeskTab.test.tsx` (3 tests)
> - `IdxLotCalculator.test.tsx` (3 tests)
> - `SpotlightTour.test.tsx` (5 tests)
> - `TutorialModal.test.tsx` (5 tests)
> - `DenoisedCorrelationHeatmap.test.tsx` (4 tests)
> - `MarketStatusRibbon.test.tsx` (1 test)
> - `SectorFilterBar.test.tsx` (3 tests)
> - `FiftyTwoWeekRangeBar.test.tsx` (2 tests)
> - `MultiHorizonReturns.test.tsx` (2 tests)
> - `Sparkline.test.tsx` (4 tests)
> - `api.test.ts` (9 tests)
> - `useUIStore.test.ts` (7 tests)

### Backend Unit & Service Tests (Pytest)
```bash
cd backend
.\venv\Scripts\pytest -v
```
> **Latest Test Run**: **57 / 57 tests passed (100% PASS)**:
> - `test_technical_desk.py` (12 tests) - *Stage analysis, VSA, CMF, momentum & scenarios*
> - `test_api.py` (15 tests) - *Endpoints, error handling, batch & validation*
> - `test_idx_rules.py` (9 tests) - *ARA/ARB, tick sizes & trading sessions*
> - `test_yahoo_finance_service.py` (9 tests) - *Quotes, history & caching*
> - `test_schemas.py` (4 tests) - *Pydantic data models*
> - `test_coingecko_features.py` (3 tests) - *52-week distances & sparklines*
> - `test_alerts.py` (3 tests) - *Price alert triggers*

### End-to-End Browser Automation (Playwright)
```bash
python scripts/test_webapp_playwright.py
```
> **Latest Test Run**: **5 / 5 stages passed**:
> 1. Home Dashboard initial load and WIB clock telemetry.
> 2. Stock Detail page navigation (`/stocks/BBCA.JK`).
> 3. Technical Indicator Tray activation (EMA 9, EMA 21, BB, VWAP).
> 4. Paper Trading order execution and balance deduction.
> 5. Canvas horizontal trading price lines verification (`SIM ENTRY`, `SIM TP`, `SIM SL`).

---

## 📁 Monorepo Structure

```
stock-market-watcher/
├── package.json               # Root monorepo npm workspaces
├── vercel.json                # Vercel deployment & serverless proxy routing
├── docs/                      # PRD, architectural diagrams, visual assets
│   └── screenshots/           # UI, chart indicators, and paper trading captures
├── frontend/                  # Next.js 16 App Router
│   ├── public/
│   │   ├── favicon.svg        # Vector Dynamic Aperture browser favicon
│   │   └── icon.svg           # High-resolution vector PWA app icon
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     # Root layout with dark mode & query client
│   │   │   ├── page.tsx       # Main dashboard page
│   │   │   ├── stocks/[ticker]# Dynamic stock detail & analytics page
│   │   │   └── watchlist/     # Dedicated watchlist manager page
│   │   ├── components/
│   │   │   ├── features/      # PriceChart, PaperTradingDesk, AnalysisDeskTab, IdxLotCalculator, etc.
│   │   │   ├── layout/        # Navbar, MarketStatusRibbon, ThemeToggle
│   │   │   └── ui/            # StockPulseLogo, Button, Dialog, Badge, Skeleton
│   │   ├── hooks/             # TanStack Query custom hooks
│   │   ├── lib/               # indicators, formatters, api client, utilities
│   │   ├── stores/            # usePaperTradingStore, useUIStore
│   │   └── types/             # TypeScript interfaces (StockQuote, Returns, StageInfo, etc.)
│   └── next.config.ts         # Turbopack configuration & API proxy rewrites
└── backend/                   # FastAPI Python backend
    ├── pyproject.toml         # PEP 621 packaging standard (uv/hatchling)
    ├── app/
    │   ├── api/v1/            # Endpoints: stocks, market, watchlist, alerts
    │   ├── core/              # App config, exceptions, structured logging
    │   ├── models/            # Pydantic schemas (StockQuote, AnalysisDeskResponse, etc.)
    │   ├── services/          # yfinance provider, technical desk calculations, caching
    │   └── db/                # Supabase PostgreSQL migrations
    └── tests/                 # Pytest test suite (57 tests)
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
| [**#9**](https://github.com/NAxel-code/stock-market-watcher/issues/9) | `feat(ui): Complete UI/UX redesign to Awwwards standards with minimalist Obsidian Vault theme, new vector logo & tab favicon` | `enhancement` | [`41ca752`](https://github.com/NAxel-code/stock-market-watcher/commit/41ca752) |
| [**#10**](https://github.com/NAxel-code/stock-market-watcher/issues/10) | `feat(trading): Paper Trading Simulator desk, institutional Indicator Tray, and IDX fraksi harga snapping` | `enhancement` | [`59bd86a`](https://github.com/NAxel-code/stock-market-watcher/commit/59bd86a) & [`42bc6e9`](https://github.com/NAxel-code/stock-market-watcher/commit/42bc6e9) |

---

## 🤖 AI-Assisted Development

This project was engineered using *AI-assisted pair programming* (Google DeepMind Antigravity) for system architecture, component design, and test-driven verification (*Test-Driven Development*), guided by human software engineering principles focusing on clean code, zero speculative abstractions, and financial domain precision.

---

## 📄 License

Distributed under the **MIT** License. See [LICENSE](./LICENSE) for full terms.
