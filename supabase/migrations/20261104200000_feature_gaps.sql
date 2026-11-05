-- ─── 1. Recurring transactions: auto-execute function ─────────────────────────

CREATE OR REPLACE FUNCTION process_recurring_transactions(p_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  t recurring_templates%ROWTYPE;
  today DATE := CURRENT_DATE;
  should_generate BOOLEAN;
  generated INTEGER := 0;
BEGIN
  FOR t IN
    SELECT * FROM recurring_templates
    WHERE user_id = p_user_id AND is_active = TRUE
  LOOP
    should_generate := FALSE;

    IF t.interval = 'monthly' AND t.day_of_month IS NOT NULL THEN
      -- Generate if we haven't generated this month yet and today >= scheduled day
      IF (t.last_generated_date IS NULL
          OR t.last_generated_date < DATE_TRUNC('month', today)::DATE)
         AND EXTRACT(DAY FROM today)::INTEGER >= t.day_of_month
      THEN
        should_generate := TRUE;
      END IF;

    ELSIF t.interval = 'weekly' AND t.day_of_week IS NOT NULL THEN
      -- Generate if today is the right weekday and we haven't done it this week
      IF (t.last_generated_date IS NULL
          OR t.last_generated_date < (today - ((EXTRACT(DOW FROM today)::INTEGER - t.day_of_week + 7) % 7)::INTEGER))
         AND EXTRACT(DOW FROM today)::INTEGER = t.day_of_week
      THEN
        should_generate := TRUE;
      END IF;
    END IF;

    IF should_generate THEN
      INSERT INTO transactions (
        user_id, account_id, description, icon, amount, category, type, date, currency, exchange_rate
      ) VALUES (
        p_user_id, t.account_id, t.description, t.icon, t.amount,
        t.category, t.type, today, t.currency, 1.0
      );

      UPDATE recurring_templates SET last_generated_date = today WHERE id = t.id;
      generated := generated + 1;
    END IF;
  END LOOP;

  RETURN generated;
END;
$$;


-- ─── 2. Net worth history ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE        NOT NULL,
  net_worth   NUMERIC     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own net worth snapshots"
  ON net_worth_snapshots FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── 3. Budget rollover ────────────────────────────────────────────────────────

ALTER TABLE budgets ADD COLUMN IF NOT EXISTS rollover_enabled BOOLEAN NOT NULL DEFAULT FALSE;
