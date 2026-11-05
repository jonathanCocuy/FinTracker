-- Tracks which budget alert emails have already been sent to avoid duplicates.
-- A unique constraint on (budget_id, threshold, month) means an email is sent
-- at most once per budget per threshold per calendar month.

CREATE TABLE IF NOT EXISTS budget_alert_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id  UUID        NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  threshold  INTEGER     NOT NULL,  -- 80 or 100
  month      DATE        NOT NULL,  -- first day of the month
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (budget_id, threshold, month)
);

ALTER TABLE budget_alert_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alert logs"
  ON budget_alert_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
