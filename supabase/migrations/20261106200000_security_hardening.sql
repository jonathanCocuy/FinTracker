-- ================================================================
-- SECURITY HARDENING
-- ================================================================

-- ── 1. STORAGE: avatars bucket ───────────────────────────────────

-- Remove the dangerous anonymous-upload policy
DROP POLICY IF EXISTS "Allow anonymous uploads 1oj01fe_0" ON storage.objects;

-- File-size cap (2 MB) + images only
UPDATE storage.buckets
SET
  file_size_limit    = 2097152,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
WHERE id = 'avatars';

-- Only authenticated users may upload
CREATE POLICY "avatars_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Only the file owner may replace it
CREATE POLICY "avatars_update"
ON storage.objects FOR UPDATE TO authenticated
USING  (bucket_id = 'avatars' AND owner = auth.uid())
WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

-- Only the file owner may delete it
CREATE POLICY "avatars_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

-- Public read (bucket is intentionally public — profile photos)
CREATE POLICY "avatars_select"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');


-- ── 2. RLS: explicit WITH CHECK + TO authenticated ───────────────

-- accounts
DROP POLICY IF EXISTS "Usuarios solo ven sus propias cuentas" ON accounts;
CREATE POLICY "accounts_policy" ON accounts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- transactions
DROP POLICY IF EXISTS "Usuarios solo ven sus propias transacciones" ON transactions;
CREATE POLICY "transactions_policy" ON transactions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- notifications: add DELETE
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);


-- ── 3. FIX SECURITY DEFINER FUNCTIONS ────────────────────────────
-- Add auth.uid() = p_user_id check so callers cannot impersonate others.
-- Pattern: IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() → deny.
-- (auth.uid() IS NULL = service-role call; allowed to pass through.)

CREATE OR REPLACE FUNCTION create_transfer(
  p_user_id   UUID,
  p_from_id   UUID,
  p_to_id     UUID,
  p_amount    NUMERIC,
  p_description TEXT,
  p_icon      TEXT,
  p_date      DATE
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tx_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = p_from_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Source account not found or access denied';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = p_to_id   AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Destination account not found or access denied';
  END IF;
  IF p_from_id = p_to_id THEN RAISE EXCEPTION 'Accounts must be different'; END IF;
  IF p_amount  <= 0        THEN RAISE EXCEPTION 'Amount must be positive';    END IF;

  INSERT INTO transactions (
    user_id, account_id, destination_account_id,
    description, icon, amount, category, type, date
  ) VALUES (
    p_user_id, p_from_id, p_to_id,
    p_description, p_icon, p_amount, 'transfer', 'transfer', p_date
  ) RETURNING id INTO v_tx_id;

  UPDATE accounts SET balance = balance - p_amount WHERE id = p_from_id;
  UPDATE accounts SET balance = balance + p_amount WHERE id = p_to_id;
  RETURN v_tx_id;
END;
$$;

CREATE OR REPLACE FUNCTION delete_transfer(p_tx_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_from UUID; v_to UUID; v_amount NUMERIC;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  SELECT account_id, destination_account_id, amount
    INTO v_from, v_to, v_amount
    FROM transactions
   WHERE id = p_tx_id AND user_id = p_user_id AND type = 'transfer';
  IF NOT FOUND THEN RAISE EXCEPTION 'Transfer not found or access denied'; END IF;

  DELETE FROM transactions WHERE id = p_tx_id AND user_id = p_user_id;
  UPDATE accounts SET balance = balance + v_amount WHERE id = v_from;
  UPDATE accounts SET balance = balance - v_amount WHERE id = v_to;
END;
$$;

CREATE OR REPLACE FUNCTION update_transfer(
  p_tx_id     UUID,
  p_user_id   UUID,
  p_from_id   UUID,
  p_to_id     UUID,
  p_amount    NUMERIC,
  p_description TEXT,
  p_icon      TEXT,
  p_date      DATE
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_old_from UUID; v_old_to UUID; v_old_amount NUMERIC;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  SELECT account_id, destination_account_id, amount
    INTO v_old_from, v_old_to, v_old_amount
    FROM transactions
   WHERE id = p_tx_id AND user_id = p_user_id AND type = 'transfer';
  IF NOT FOUND THEN RAISE EXCEPTION 'Transfer not found or access denied'; END IF;
  IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = p_from_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Source account not found or access denied';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = p_to_id   AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Destination account not found or access denied';
  END IF;
  IF p_from_id = p_to_id THEN RAISE EXCEPTION 'Accounts must be different'; END IF;
  IF p_amount  <= 0        THEN RAISE EXCEPTION 'Amount must be positive';    END IF;

  UPDATE accounts SET balance = balance + v_old_amount WHERE id = v_old_from;
  UPDATE accounts SET balance = balance - v_old_amount WHERE id = v_old_to;
  UPDATE accounts SET balance = balance - p_amount     WHERE id = p_from_id;
  UPDATE accounts SET balance = balance + p_amount     WHERE id = p_to_id;

  UPDATE transactions SET
    account_id             = p_from_id,
    destination_account_id = p_to_id,
    amount                 = p_amount,
    description            = p_description,
    icon                   = p_icon,
    date                   = p_date
  WHERE id = p_tx_id AND user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION process_recurring_transactions(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t recurring_templates%ROWTYPE;
  today DATE := CURRENT_DATE;
  should_generate BOOLEAN;
  generated INTEGER := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  FOR t IN
    SELECT * FROM recurring_templates WHERE user_id = p_user_id AND is_active = TRUE
  LOOP
    should_generate := FALSE;
    IF t.interval = 'monthly' AND t.day_of_month IS NOT NULL THEN
      IF (t.last_generated_date IS NULL OR t.last_generated_date < DATE_TRUNC('month', today)::DATE)
         AND EXTRACT(DAY FROM today)::INTEGER >= t.day_of_month
      THEN should_generate := TRUE; END IF;
    ELSIF t.interval = 'weekly' AND t.day_of_week IS NOT NULL THEN
      IF (t.last_generated_date IS NULL
          OR t.last_generated_date < (today - ((EXTRACT(DOW FROM today)::INTEGER - t.day_of_week + 7) % 7)::INTEGER))
         AND EXTRACT(DOW FROM today)::INTEGER = t.day_of_week
      THEN should_generate := TRUE; END IF;
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

-- create_notification: block unauthenticated callers entirely
-- (authenticated users CAN notify other users — needed for group invites)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type    TEXT,
  p_title   TEXT,
  p_body    TEXT,
  p_data    JSONB DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data);
END;
$$;

-- get_user_id_by_email: block unauthenticated lookup (email enumeration)
CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  RETURN (SELECT id FROM auth.users WHERE email = lower(p_email) LIMIT 1);
END;
$$;


-- ── 4. REVOKE from anon / PUBLIC, GRANT only to authenticated ────

REVOKE EXECUTE ON FUNCTION create_transfer(UUID,UUID,UUID,NUMERIC,TEXT,TEXT,TIMESTAMPTZ)      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_transfer(UUID,UUID,UUID,NUMERIC,TEXT,TEXT,TIMESTAMPTZ)      FROM anon;
REVOKE EXECUTE ON FUNCTION delete_transfer(UUID,UUID)                                          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION delete_transfer(UUID,UUID)                                          FROM anon;
REVOKE EXECUTE ON FUNCTION update_transfer(UUID,UUID,UUID,UUID,NUMERIC,TEXT,TEXT,TIMESTAMPTZ)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION update_transfer(UUID,UUID,UUID,UUID,NUMERIC,TEXT,TEXT,TIMESTAMPTZ)  FROM anon;
REVOKE EXECUTE ON FUNCTION process_recurring_transactions(UUID)                                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION process_recurring_transactions(UUID)                                FROM anon;
REVOKE EXECUTE ON FUNCTION create_notification(UUID,TEXT,TEXT,TEXT,JSONB)                      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_notification(UUID,TEXT,TEXT,TEXT,JSONB)                      FROM anon;
REVOKE EXECUTE ON FUNCTION get_user_id_by_email(TEXT)                                          FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_user_id_by_email(TEXT)                                          FROM anon;
REVOKE EXECUTE ON FUNCTION claim_pending_invitations()                                         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION claim_pending_invitations()                                         FROM anon;

GRANT EXECUTE ON FUNCTION create_transfer(UUID,UUID,UUID,NUMERIC,TEXT,TEXT,TIMESTAMPTZ)      TO authenticated;
GRANT EXECUTE ON FUNCTION delete_transfer(UUID,UUID)                                          TO authenticated;
GRANT EXECUTE ON FUNCTION update_transfer(UUID,UUID,UUID,UUID,NUMERIC,TEXT,TEXT,TIMESTAMPTZ)  TO authenticated;
GRANT EXECUTE ON FUNCTION process_recurring_transactions(UUID)                                TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID,TEXT,TEXT,TEXT,JSONB)                      TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT)                                          TO authenticated;
GRANT EXECUTE ON FUNCTION claim_pending_invitations()                                         TO authenticated;
