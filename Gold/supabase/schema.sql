-- ==============================================================================
-- Supabase Schema for Gold Trading Journal (XAU/USD)
-- Project: Trading Record (kicivrndnvbgyejdvgsh)
-- ==============================================================================

-- 1. Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLE: user_settings (Account configuration & starting balance)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    starting_balance NUMERIC(15, 2) NOT NULL DEFAULT 1000.00,
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'INR')),
    default_lot_size NUMERIC(8, 2) NOT NULL DEFAULT 0.01,
    default_risk_pct NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. TABLE: trades (Gold trade records)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
    trade_time TIME NULL,
    symbol TEXT NOT NULL DEFAULT 'XAUUSD',
    direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
    entry_price NUMERIC(12, 4) NOT NULL,
    tp NUMERIC(12, 4) NULL,
    sl NUMERIC(12, 4) NULL,
    exit_price NUMERIC(12, 4) NULL,
    lot_size NUMERIC(8, 2) NOT NULL DEFAULT 0.01,
    result TEXT NOT NULL CHECK (result IN ('PROFIT', 'LOSS', 'BREAKEVEN')),
    pl_amount NUMERIC(15, 2) NOT NULL,
    risk_reward_ratio NUMERIC(8, 2) NULL,
    notes TEXT NULL,
    tags TEXT[] NULL DEFAULT '{}',
    screenshot_url TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_trades_user_date ON public.trades(user_id, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_result ON public.trades(user_id, result);

-- ==============================================================================
-- 4. TABLE: balance_log (Deposits, Withdrawals, Starting Balance, Adjustments)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.balance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('starting_balance', 'deposit', 'withdrawal', 'trade_pl', 'adjustment')),
    amount NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NULL,
    ref_trade_id UUID NULL REFERENCES public.trades(id) ON DELETE SET NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_balance_log_user_date ON public.balance_log(user_id, created_at ASC);

-- ==============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_log ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 6. RLS POLICIES (Users can only access and modify their own records)
-- ==============================================================================

-- User Settings Policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trades Policies
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
CREATE POLICY "Users can view their own trades"
    ON public.trades FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trades" ON public.trades;
CREATE POLICY "Users can insert their own trades"
    ON public.trades FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
CREATE POLICY "Users can update their own trades"
    ON public.trades FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own trades" ON public.trades;
CREATE POLICY "Users can delete their own trades"
    ON public.trades FOR DELETE
    USING (auth.uid() = user_id);

-- Balance Log Policies
DROP POLICY IF EXISTS "Users can view their own balance logs" ON public.balance_log;
CREATE POLICY "Users can view their own balance logs"
    ON public.balance_log FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own balance logs" ON public.balance_log;
CREATE POLICY "Users can insert their own balance logs"
    ON public.balance_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own balance logs" ON public.balance_log;
CREATE POLICY "Users can update their own balance logs"
    ON public.balance_log FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own balance logs" ON public.balance_log;
CREATE POLICY "Users can delete their own balance logs"
    ON public.balance_log FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 7. TRIGGER: Auto-create user_settings on auth.users Signup
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings (user_id, starting_balance, currency)
    VALUES (NEW.id, 1000.00, 'USD')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger for auto updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_trades_updated_at ON public.trades;
CREATE TRIGGER set_trades_updated_at
    BEFORE UPDATE ON public.trades
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER set_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. REALTIME REPLICATION (For instant sync across all devices)
-- ==============================================================================
-- Enable realtime publication for all tables
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.trades, public.user_settings, public.balance_log;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN others THEN NULL;
    END;
END $$;
