-- Migration: budget_notifications
-- Adds email notification preference to profiles and a deduplication log table.
-- Run in: Supabase Dashboard → SQL Editor, or via: supabase db push

-- 1. Add email_notifications column to profiles (default true = opted-in)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true;

-- 2. Create notification_logs to prevent duplicate sends
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id  uuid        NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  threshold  integer     NOT NULL CHECK (threshold IN (80, 100)),
  month      text        NOT NULL,  -- YYYY-MM
  sent_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, budget_id, threshold, month)
);

-- 3. Enable RLS (service-role key bypasses it — no user-facing policies needed)
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
