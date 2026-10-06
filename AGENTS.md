# 🤖 StockPulse AI Agent Instructions (AGENTS.md)

Welcome, AI Coding Agents (Antigravity, Cursor, Claude Code, etc.)! This file outlines the conventions, rules, and architectures you must follow when contributing to **StockPulse**.

## 📌 Project Context
- **Project Name:** StockPulse
- **Type:** Serverless Real-Time Stock Market Watcher
- **Stack:** 
  - **Frontend:** Next.js (App Router), Tailwind CSS, React Query, shadcn/ui, Magic UI
  - **Backend:** Python (FastAPI), Pydantic
  - **Database:** Supabase (PostgreSQL)
  - **Hosting/Deployment:** Vercel (Frontend), Google Cloud Run (Backend)
- **Structure:** Monorepo containing `frontend/` and `backend/` directories.

## 📐 Code Conventions

### General
- **Frontend:** TypeScript in Strict Mode. Use `camelCase` for variables and functions, `PascalCase` for React components and types/interfaces.
- **Backend:** Python 3.10+ with strict type hinting. Use `snake_case` for variables and functions, `PascalCase` for classes.
- **Import Ordering:** 
  - 1. Standard libraries / React imports
  - 2. Third-party dependencies
  - 3. Internal absolute imports (`@/...` or `app/...`)
  - 4. Relative imports

### Frontend Specifics
- Use **Functional Components** with hooks.
- Use `shadcn/ui` components for ALL UI elements instead of raw HTML inputs/buttons.
- **File naming:** `kebab-case` for general files, `PascalCase.tsx` for components.

## 🏛️ Architecture Rules
1. **API Communication:** All data fetching from the backend MUST go through `@tanstack/react-query` (TanStack Query) on the frontend.
2. **Data Validation:** 
   - **Frontend:** Use `Zod` for form and schema validation.
   - **Backend:** Use `Pydantic` models for ALL API request/response schemas.
3. **Database:** All queries must go through the Supabase client or SQLAlchemy (if using Python ORM). Never hardcode SQL strings.
4. **Environment Variables:** 
   - Frontend: `.env.local`
   - Backend: `.env`
   - **CRITICAL:** NO hardcoded API keys, secrets, or URLs in code.

## 🧪 Testing Requirements
- **Frontend:** Vitest + React Testing Library. Files named `*.test.ts` or `*.test.tsx`.
- **Backend:** pytest + httpx for API testing. Files named `test_*.py`.
- **Coverage:** Minimum 80% coverage on new code.

## 🧩 Common Patterns

### Creating a New API Endpoint (Backend)
```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/stocks", tags=["stocks"])

class StockResponse(BaseModel):
    symbol: str
    price: float

@router.get("/{symbol}", response_model=StockResponse)
def get_stock(symbol: str, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.symbol == symbol).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock
```

### Creating a New Page Route (Frontend)
```tsx
import { useQuery } from '@tanstack/react-query'
import { fetchStock } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

export default function StockPage({ params }: { params: { symbol: string } }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stock', params.symbol],
    queryFn: () => fetchStock(params.symbol)
  })

  if (isLoading) return <Skeleton className="w-[200px] h-[50px] rounded-full" />
  if (error) return <div className="text-destructive">Failed to load</div>

  return <div>{data.price}</div>
}
```

## 🚨 Error Handling Patterns
- **Frontend:** Use React Error Boundaries for unexpected crashes. Use Toast notifications (`shadcn/ui` toast) for API errors.
- **Backend:** Raise `HTTPException` with clear, actionable `detail` messages.
- **Validation:** Always use Zod/Pydantic; never trust raw client input.

## 🚀 Deployment Notes
- **Frontend:** Vercel auto-deploys on push to `main`.
- **Backend:** GitHub Actions builds a Docker container and deploys to Google Cloud Run on push to `main`.
- **Database:** Supabase migrations are handled via the Supabase CLI (`supabase db push`).

## ✅ Do's and Don'ts
- **DO:** Write strict TS/Python, write unit tests, handle loading/error states gracefully.
- **DON'T:** Use `any` or `unknown`, hardcode API URLs, skip input validation, or use raw HTML forms.

## 🤖 Agent-Specific Instructions
- **Antigravity:** When generating features, use your tools efficiently and spin up subagents for parallelizing tasks if applicable.
- **Cursor:** Automatically reference `.cursorrules` (which should point to this file) for auto-completions and generation.
- **Claude Code:** Utilize memory patterns to recall past architectural decisions.
