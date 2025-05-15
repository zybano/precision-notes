-- Check if user_credits table exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_credits'
  ) THEN
    CREATE TABLE public.user_credits (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      balance INTEGER NOT NULL DEFAULT 0,
      total_earned INTEGER NOT NULL DEFAULT 0,
      total_used INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE (user_id)
    );

    -- Add RLS policies
    ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

    -- Create policy to allow users to view only their own credits
    CREATE POLICY "Users can view their own credits" 
      ON public.user_credits 
      FOR SELECT USING (auth.uid() = user_id);

    -- Create policy to allow users to update only their own credits
    CREATE POLICY "Users can update their own credits" 
      ON public.user_credits 
      FOR UPDATE USING (auth.uid() = user_id);

    -- Create policy to allow system to insert credits for any user
    CREATE POLICY "System can insert credits" 
      ON public.user_credits 
      FOR INSERT WITH CHECK (true);
  END IF;

  -- Check if transaction_history table exists and create it if not
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transaction_history'
  ) THEN
    CREATE TABLE public.transaction_history (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'CREDITS',
      payment_provider TEXT NOT NULL DEFAULT 'system',
      transaction_type TEXT NOT NULL,
      status TEXT NOT NULL,
      reference_id TEXT,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Add RLS policies
    ALTER TABLE public.transaction_history ENABLE ROW LEVEL SECURITY;

    -- Create policy to allow users to view only their own transactions
    CREATE POLICY "Users can view their own transactions" 
      ON public.transaction_history 
      FOR SELECT USING (auth.uid() = user_id);

    -- Create policy to allow system to insert transactions for any user
    CREATE POLICY "System can insert transactions" 
      ON public.transaction_history 
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;