# 📈 Development Workflow & Guide: StockPulse

This document outlines the end-to-end development process, sprint plan, and operational guidelines for building StockPulse.

## 1. Development Workflow

### Version Control Strategy (GitHub Flow)
- Main branch (`main`) is always deployable.
- Development happens on feature branches.
- **Branch Naming:**
  - `feature/description-of-feature`
  - `bugfix/issue-description`
  - `hotfix/critical-issue`

### Commits & PRs
- **Commit Messages:** Follow [Conventional Commits](https://www.conventionalcommits.org/). Examples: `feat: add stock chart`, `fix: auth redirect loop`.
- **Pull Requests:** 
  - Must use the project PR template.
  - Require at least 1 approval (or self-review checklist completed if solo).
  - CI (lint, test, build) must pass before merging.

---

## 2. Sprint Plan (4 Weeks)

### Week 1: Foundation
*Goal: Project scaffolding, DB setup, and basic API communication.*
- **Day 1-2:** Project scaffolding. 
  - *Tasks:* Next.js App Router init, FastAPI setup, Tailwind + shadcn/ui config.
  - *Verification:* `npm run dev` and `uvicorn main:app --reload` start successfully.
- **Day 3-4:** Database schema & Supabase setup.
  - *Tasks:* Create Users, Watchlists, and StockCache tables. Setup Supabase local dev.
- **Day 5:** Core API endpoints.
  - *Tasks:* `/health`, `/api/stocks/search`, `/api/stocks/quote`.
  - *Verification:* Hit endpoints via Swagger UI or curl.
- **Day 6-7:** Basic dashboard UI layout.
  - *Tasks:* Setup Navbar, Sidebar, and basic layout shell using Magic UI.

### Week 2: Core Features
*Goal: Data visualization and real-time feel.*
- **Day 1-2:** Stock detail page with charts.
  - *Tasks:* Integrate `Recharts` for historical data visualization.
- **Day 3-4:** Watchlist functionality.
  - *Tasks:* UI for adding/removing stocks, connect to Supabase backend.
- **Day 5:** Auto-refresh & polling mechanism.
  - *Tasks:* Setup React Query polling (`refetchInterval: 5000`) for active stock quotes.
- **Day 6-7:** Price cards with real-time updates.
  - *Tasks:* Flash green/red on price changes using Tailwind transitions.

### Week 3: Polish & Auth
*Goal: User accounts and UX improvements.*
- **Day 1-2:** Google OAuth integration.
  - *Tasks:* Implement Supabase Auth (Google provider). Protect frontend routes.
- **Day 3-4:** Dark/Light mode & responsive design.
  - *Tasks:* Configure `next-themes`. Ensure mobile layout works.
- **Day 5:** Price alerts (basic).
  - *Tasks:* Backend cron job (or simple check on polling) to trigger alert logic.
- **Day 6-7:** Performance optimization.
  - *Tasks:* Lighthouse audit, code splitting, API response caching.

### Week 4: Deploy & Test
*Goal: Production readiness.*
- **Day 1-2:** Docker + Cloud Run deployment.
  - *Tasks:* Write `Dockerfile` for backend. Manual deploy test to GCP.
- **Day 3-4:** CI/CD pipeline setup.
  - *Tasks:* Write `.github/workflows/deploy.yml`.
- **Day 5:** Testing & bug fixes.
  - *Tasks:* E2E tests, unit tests, squash bugs.
- **Day 6-7:** Documentation & launch prep.
  - *Tasks:* Update README, record demo video.

---

## 3. CI/CD Pipeline

The project utilizes GitHub Actions for automation.

### Workflow Steps (on push to `main`):
1. **Lint Check:** `eslint` for frontend, `ruff` or `flake8` for backend.
2. **Type Check:** `tsc --noEmit` and `mypy`.
3. **Unit Tests:** Run Vitest and Pytest.
4. **Build Verification:** `npm run build`.
5. **Docker Build & Push:** Build backend image, push to Google Artifact Registry.
6. **Cloud Run Deploy:** Deploy the new image to Cloud Run using `google-github-actions/deploy-cloudrun`.
7. **Vercel Auto-deploy:** Vercel handles frontend deployment automatically via GitHub integration.

---

## 4. Environment Setup Guide

### Prerequisites
- Node.js 20+
- Python 3.10+
- Docker Desktop
- Supabase CLI

### Setup Steps
1. **Clone repo:** `git clone <repo>`
2. **Frontend:** 
   - `cd frontend && npm install`
   - Copy `.env.example` to `.env.local`
3. **Backend:**
   - `cd backend`
   - `python -m venv venv && source venv/bin/activate`
   - `pip install -r requirements.txt`
   - Copy `.env.example` to `.env`
4. **Database:**
   - `supabase start`

---

## 5. Deployment Checklist

### Pre-deployment
- [ ] All tests passing locally.
- [ ] Environment variables updated in Vercel and GCP Secret Manager.
- [ ] Database migrations applied to production Supabase.

### Post-deployment
- [ ] Verify `/health` endpoint on Cloud Run.
- [ ] Verify frontend login flow.
- [ ] Check console for CORS or mixed-content errors.

---

## 6. Monitoring & Maintenance

- **Health Checks:** A dedicated `/health` endpoint on the backend returns status 200.
- **Logs:** GCP Cloud Logging for backend. Vercel Logs for frontend.
- **Incidents:** If Cloud Run crashes, check logs for OOM (Out of Memory) issues. If Vercel fails, check build logs for TypeScript errors.
