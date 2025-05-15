
-- Create a table for consultation purchases
CREATE TABLE IF NOT EXISTS public.consultation_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  package_id UUID REFERENCES public.consultation_packages(id),
  quantity INTEGER NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_provider VARCHAR NOT NULL,
  payment_provider_reference VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for user subscriptions if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  subscription_tier VARCHAR NOT NULL DEFAULT 'free',
  is_annual_billing BOOLEAN NOT NULL DEFAULT false,
  consultations_total INTEGER NOT NULL DEFAULT 10,
  consultations_used INTEGER NOT NULL DEFAULT 0,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for consultation_purchases
ALTER TABLE public.consultation_purchases ENABLE ROW LEVEL SECURITY;

-- Add policy to allow users to view their own purchases
CREATE POLICY IF NOT EXISTS "Users can view their own purchases" 
  ON public.consultation_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add RLS policies for user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Add policy to allow users to view their own subscription
CREATE POLICY IF NOT EXISTS "Users can view their own subscription" 
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add policy to allow system to update subscriptions
CREATE POLICY IF NOT EXISTS "System can update subscriptions" 
  ON public.user_subscriptions
  FOR UPDATE
  USING (true);

-- Add policy to allow system to insert subscriptions
CREATE POLICY IF NOT EXISTS "System can insert subscriptions" 
  ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (true);
