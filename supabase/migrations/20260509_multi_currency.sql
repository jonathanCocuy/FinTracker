-- Migration: multi_currency
-- Adds base_currency to profiles and currency/exchange_rate to transactions.
-- Run in: Supabase Dashboard → SQL Editor, or via: supabase db push

-- 1. Base currency preference per user (default COP)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS base_currency VARCHAR(3) NOT NULL DEFAULT 'COP';

-- 2. Transaction currency code (ISO 4217, 3 chars)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'COP';

-- 3. Exchange rate at time of transaction (transaction currency → user base currency)
--    Example: amount=100 USD, exchange_rate=4200 → 420,000 COP equivalent
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC NOT NULL DEFAULT 1;
