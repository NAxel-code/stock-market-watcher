# 📈 StockPulse — Real-Time Stock Market Watcher

> Dashboard analitik saham real-time untuk pasar US & IDX (Indonesia). 100% free tier stack.

[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016-black?logo=next.js)](https://nextjs.org)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel%20%2B%20Cloud%20Run-blue)](https://vercel.com)
[![AI-Assisted](https://img.shields.io/badge/Development-AI--Assisted-8A2BE2)](#-ai-assisted-development)

## Features

- 📊 Real-time stock quotes (US markets + Indonesian IDX)
- 🔍 Ticker search with Cmd+K command palette
- 📉 Interactive price charts (1D, 1W, 1M, 3M, 1Y) via Recharts
- 💾 Persistent watchlist stored in localStorage (anonymous)
- 🌙 Dark mode default, light mode toggle
- 🇮🇩 Supports both USD and IDR denominated stocks
- ⚡ Smart polling — 1min during market hours, 15min after close
- 🔄 Stale cache fallback with circuit breaker pattern

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| UI | shadcn/ui, Lucide React |
| Charts | Recharts |
| State | TanStack Query (server state) + Zustand (client state) |
| Backend | Python 3.11, FastAPI |
| Data | yfinance (Yahoo Finance) |
| Database | Supabase (PostgreSQL + Auth) |
| Hosting | Vercel (frontend) + Google Cloud Run (backend) |

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker Desktop (for deployment)

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd stock-market-watcher
```

### 2. Backend

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`  
API docs available at `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Frontend runs at `http://localhost:3000`

### 4. Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste contents of `backend/app/db/migrations.sql` → Run
3. Copy **Project URL** and **Anon Key** from Settings → API
4. Add to `frontend/.env.local` and `backend/.env`

## Project Structure

```
stock-market-watcher/
├── frontend/          # Next.js 14 App Router
│   └── src/
│       ├── app/       # Pages (App Router)
│       ├── components/# React components
│       ├── hooks/     # TanStack Query hooks
│       ├── lib/       # API client, formatters, utils
│       ├── stores/    # Zustand stores
│       └── types/     # TypeScript interfaces
├── backend/           # FastAPI Python backend
│   ├── app/
│   │   ├── api/       # Route handlers
│   │   ├── core/      # Config, exceptions
│   │   ├── models/    # Pydantic schemas
│   │   ├── services/  # yfinance + Supabase
│   │   └── db/        # SQL migrations
│   └── tests/         # Pytest suite
├── docs/              # Architecture, PRD, Design docs
└── .github/workflows/ # CI/CD pipelines
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/stocks/search?q={query}` | Ticker search |
| GET | `/api/v1/stocks/{ticker}/quote` | Real-time quote |
| GET | `/api/v1/stocks/{ticker}/history?period={p}` | Historical data (1d/1w/1m/3m/1y) |
| GET | `/api/v1/stocks/batch?tickers={CSV}` | Batch quotes |
| GET | `/api/v1/market/summary` | Indices + top movers |
| GET | `/api/v1/watchlist/default` | Pre-seeded tickers |
| POST | `/api/v1/watchlist/validate` | Validate ticker exists |

## Running Tests

```bash
# Backend
cd backend
pytest --cov=app

# Frontend
cd frontend
npm run test        # Vitest unit tests
npx playwright test # E2E tests (needs both servers running)
```

## Deployment

### Backend → Google Cloud Run
```bash
cd backend
docker build -t stockpulse-api .
gcloud run deploy stockpulse-api \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated
```

### Frontend → Vercel
Connect your GitHub repo to Vercel. It auto-deploys on push to `main`.

Set these environment variables in Vercel:
```
NEXT_PUBLIC_API_URL=https://your-cloud-run-url
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🤖 AI-Assisted Development

This project was built with **AI-assisted pair programming** (Google DeepMind Antigravity) for architectural design, feature scaffolding, and test-driven verification (TDD), strictly guided by human engineering decisions to avoid over-engineering and ensure lean, production-ready code.

## Contributing

See [AGENTS.md](./AGENTS.md) for coding conventions and architecture rules.

## License

MIT
