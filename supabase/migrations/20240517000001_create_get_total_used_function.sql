-- Create or replace the get_total_used function to safely retrieve the total_used column
CREATE OR REPLACE FUNCTION get_total_used(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT total_used INTO total FROM user_credits WHERE user_id = $1;
  RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;