-- Create or replace the increment function for updating columns atomically
CREATE OR REPLACE FUNCTION increment(
  row_id UUID,
  increment_amount INT,
  table_name TEXT DEFAULT 'user_credits',
  column_name TEXT DEFAULT 'total_used'
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = %I + $1 WHERE user_id = $2',
    table_name,
    column_name,
    column_name
  ) USING increment_amount, row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;