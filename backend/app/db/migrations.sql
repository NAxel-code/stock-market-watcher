-- StockPulse Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (mirrors Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security Master (US, SGX, IDX Unified Universe)
CREATE TABLE IF NOT EXISTS public.security_master (
    ticker VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    exchange VARCHAR(20) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    asset_type VARCHAR(20) DEFAULT 'EQUITY',
    sector VARCHAR(100),
    industry VARCHAR(100),
    isin VARCHAR(50),
    cik VARCHAR(20),
    is_primary BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock metadata (optional cache)
CREATE TABLE IF NOT EXISTS public.stocks (
    ticker VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    industry VARCHAR(100)
);

-- Watchlists
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, ticker)
);

-- Price Alerts
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ticker VARCHAR(10) NOT NULL,
    target_price DECIMAL(14, 4) NOT NULL,
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('ABOVE', 'BELOW')),
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMPTZ,
    triggered_price DECIMAL(14, 4),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paper Trading Accounts (Multi-device sync)
CREATE TABLE IF NOT EXISTS public.paper_accounts (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    cash_balance_usd DECIMAL(16, 4) NOT NULL DEFAULT 100000.0,
    initial_capital_usd DECIMAL(16, 4) NOT NULL DEFAULT 100000.0,
    positions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    trades_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.paper_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "paper_accounts_user_policy"
    ON public.paper_accounts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_active ON public.alerts(user_id, is_active);

-- Row Level Security
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "watchlist_user_policy"
    ON public.watchlists FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "alerts_user_policy"
    ON public.alerts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Portfolio Holdings (Multi-asset lots, cost bases, and fees)
CREATE TABLE IF NOT EXISTS public.portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ticker VARCHAR(20) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    exchange VARCHAR(20) NOT NULL,
    asset_type VARCHAR(20) DEFAULT 'EQUITY',
    shares DECIMAL(16, 4) NOT NULL,
    lot_size INT DEFAULT 1,
    cost_basis DECIMAL(16, 4) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    purchase_date DATE,
    sector VARCHAR(100),
    country VARCHAR(10),
    fees DECIMAL(12, 2) DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON public.portfolio_holdings(user_id);

ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "portfolio_user_policy"
    ON public.portfolio_holdings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
