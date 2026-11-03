-- Add initial_balance column to accounts
-- initial_balance stores the balance set at account creation and is never
-- modified by transaction triggers — only by explicit user edits.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS initial_balance NUMERIC DEFAULT 0;

-- Backfill existing accounts: treat their current balance as the initial one.
-- (They have no transaction history that would have shifted it from the true start.)
UPDATE accounts SET initial_balance = balance WHERE initial_balance = 0;
