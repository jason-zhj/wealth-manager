-- ============================================================
-- Wealth Manager - Supabase Database Setup
-- Run this in: https://supabase.com/dashboard/project/rhkmxuzulivcyrknbfan
-- SQL Editor > New query > paste > Run
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS record_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SGD',
  place_type TEXT NOT NULL,
  place TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  name TEXT DEFAULT '',
  expected_annual_yield NUMERIC(5,2) DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  details TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS custom_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  value TEXT NOT NULL,
  UNIQUE(user_id, field_name, value)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_records_user_id ON records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_user_date ON records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_record_items_record_id ON record_items(record_id);
CREATE INDEX IF NOT EXISTS idx_custom_options_user_field ON custom_options(user_id, field_name);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_records_updated_at ON records;
CREATE TRIGGER set_records_updated_at
  BEFORE UPDATE ON records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_options ENABLE ROW LEVEL SECURITY;

-- records: users can only access their own records
DROP POLICY IF EXISTS "Users manage own records" ON records;
CREATE POLICY "Users manage own records"
  ON records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- record_items: accessible if the parent record belongs to the user
DROP POLICY IF EXISTS "Users manage own record items" ON record_items;
CREATE POLICY "Users manage own record items"
  ON record_items FOR ALL
  USING (
    record_id IN (SELECT id FROM records WHERE user_id = auth.uid())
  )
  WITH CHECK (
    record_id IN (SELECT id FROM records WHERE user_id = auth.uid())
  );

-- custom_options: users can only access their own options
DROP POLICY IF EXISTS "Users manage own custom options" ON custom_options;
CREATE POLICY "Users manage own custom options"
  ON custom_options FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- DONE
-- After running this SQL, configure Google OAuth:
-- 1. Go to Authentication > Providers > Google
-- 2. Enable it and add your Google OAuth client ID & secret
-- 3. Add redirect URL: https://<your-github-username>.github.io/wealth-manager/
-- ============================================================
