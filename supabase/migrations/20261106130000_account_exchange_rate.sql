-- Add exchange_rate to accounts for multi-currency balance conversion
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC NOT NULL DEFAULT 1;
