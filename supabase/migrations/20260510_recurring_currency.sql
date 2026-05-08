ALTER TABLE public.recurring_templates
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'COP';
