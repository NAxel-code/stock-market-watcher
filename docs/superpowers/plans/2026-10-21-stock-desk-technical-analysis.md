# Implementation Plan: Institutional "Stock Desk" Technical Analysis

**Date:** 2026-10-21  
**Feature:** Institutional Stock Desk Technical Analysis Report & Engine  
**Target:** StockPulse (`stock-market-watcher`)  
**Methodology:** Stan Weinstein 4-Stage Analysis, Market Structure (HH-HL / LH-LL), Volume Spread Analysis (VSA), Chaikin Money Flow (CMF), 3 Conditional Scenarios (20-bar forecast), Trade Plan & Risk Psychology Guardrails.

---

## 1. Scope & Architecture

### Backend
- **Data Models** (`backend/app/models/schemas.py`):
  - `StageInfo`: stage number (1-4), name, bias, confidence, description.
  - `TradePlan`: verdict (`AVOID`, `BUY ON BREAKOUT`, `BUY ON WEAKNESS`, `TAKE PROFIT`), buy_area, stop_loss, target_1, target_2, risk_reward_ratio, notes.
  - `ScenarioProjection`: scenario (`BULLISH`, `BEARISH`, `SIDEWAYS`), probability_pct, trigger_level, target_level, supporting_factors, opposing_factors.
  - `MarketStructure`: trend_label (`HH-HL`, `LH-LL`, `CONSOLIDATION`), support_pivot, resistance_pivot, drawdown_300d_pct, ma_stack_status.
  - `VsaMetrics`: up_down_volume_ratio_20d, participation_status, climax_detected, stopping_volume_detected, absorption_detected.
  - `MomentumMetrics`: rsi_14, macd_histogram, macd_signal_cross, adx_14, stochastic_k, stochastic_d.
  - `RelativeStrengthMetrics`: benchmark_ticker, stock_1m_return_pct, benchmark_1m_return_pct, alpha_pct, rating (`OUTPERFORMING`, `IN_LINE`, `UNDERPERFORMING`).
  - `AnalysisDeskResponse`: aggregates all above components, ticker, as_of_date, mindset_guardrail.

- **Analytical Engine** (`backend/app/services/technical_desk.py`):
  - Pure, vectorized/iterative indicator calculation functions (SMA, Slope, RSI, MACD, ADX, Stoch, CMF, local swing pivots).
  - Weinstein stage classification logic.
  - VSA analyzer.
  - 3-scenario conditional projection scoring.
  - Trade plan generation with strict risk:reward and level calculation.
  - 300s TTL cache.

- **API Route** (`backend/app/api/v1/stocks.py`):
  - `GET /api/v1/stocks/{ticker}/desk` returning `AnalysisDeskResponse`.

### Frontend
- **Types & Client** (`frontend/src/lib/types.ts`, `frontend/src/lib/api.ts`):
  - TypeScript types and React Query hook `useStockDesk(ticker)`.
- **Component** (`frontend/src/components/features/AnalysisDeskTab.tsx`):
  - High-density institutional terminal design.
  - Stage badge with visual cycle indicator.
  - Trade Plan card with exact Buy / Stop / Target / R:R.
  - 3-column scenario forecast cards with checklist chips.
  - 4-quadrant technical intelligence grid (Structure, VSA, Momentum, Relative Strength).
  - Psychology & Mindset warning callout.
- **Integration** (`frontend/src/components/features/StockDetailClient.tsx`):
  - Tab button and view switching.

---

## 2. Test-Driven Development Plan

### Task 1: Backend Schemas
- Add Pydantic schemas in `backend/app/models/schemas.py`.
- Verify with existing schema tests in `backend/tests/test_schemas.py`.

### Task 2: Backend Unit Tests (Red)
- Create `backend/tests/test_technical_desk.py` covering:
  - Indicator math (MA20/50/200, MA200 slope, CMF, Wilder RSI, MACD, ADX, Swing Pivots).
  - Stage classification (Stage 4 markdown, Stage 2 markup, Stage 1 base, Stage 3 top).
  - VSA calculations (up/down volume ratio, climax flags).
  - Conditional 3-scenario generation (supporting vs opposing factors, sum of probabilities = 100%).
  - Trade plan rules (Stop loss below support, Take profit targets, R:R calculation).
  - Edge cases (short history <200 bars, zero volume, flat price).
- Run `pytest` &rarr; observe failures (Red).

### Task 3: Backend Implementation (Green)
- Implement `backend/app/services/technical_desk.py`.
- Run `pytest` &rarr; verify all tests pass (Green).

### Task 4: API Endpoint & Integration
- Register route `GET /api/v1/stocks/{ticker}/desk` in `backend/app/api/v1/stocks.py`.
- Add test in `backend/tests/test_api.py`.
- Verify all 42+ backend tests pass.

### Task 5: Frontend Types & API Client
- Add TypeScript interfaces in `frontend/src/lib/types.ts`.
- Add `fetchStockDesk` and `useStockDesk` in `frontend/src/lib/api.ts`.

### Task 6: Frontend Unit Tests (Red)
- Create `frontend/src/components/features/AnalysisDeskTab.test.tsx`.
- Mock API data and test rendering of all sections, verdict colors, badges, and scenario chips.
- Run `vitest` &rarr; observe failure (Red).

### Task 7: Frontend Component Implementation (Green)
- Build `AnalysisDeskTab.tsx` with anti-AI slop dark terminal styling.
- Run `vitest` &rarr; verify all tests pass (Green).

### Task 8: Integration & End-to-End Verification
- Mount tab into `StockDetailClient.tsx`.
- Run full frontend tests (`npm test`) and backend tests (`pytest`).
- Verify production build (`npm run build`).
