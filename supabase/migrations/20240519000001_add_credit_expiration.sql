
-- Add expires_at column to user_credits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_credits' 
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.user_credits
    ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    
    -- Set default expiration for existing credits (1 year from now)
    UPDATE public.user_credits
    SET expires_at = NOW() + INTERVAL '1 year'
    WHERE expires_at IS NULL;
  END IF;
END $$;
