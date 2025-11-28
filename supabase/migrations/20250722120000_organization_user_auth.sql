-- Organization-specific user roles, OTP auth, and session tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'organization_user_role'
  ) THEN
    CREATE TYPE public.organization_user_role AS ENUM ('admin', 'staff');
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.organization_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  password_hash text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role public.organization_user_role NOT NULL DEFAULT 'staff',
  department text,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT organization_users_email_check CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  CONSTRAINT organization_users_unique_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS organization_users_org_id_idx ON public.organization_users(organization_id);
CREATE INDEX IF NOT EXISTS organization_users_role_idx ON public.organization_users(role);

CREATE TRIGGER set_organization_users_updated_at
BEFORE UPDATE ON public.organization_users
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TABLE IF NOT EXISTS public.organization_user_otps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.organization_users(id) ON DELETE CASCADE,
  otp_hash text NOT NULL,
  purpose text NOT NULL DEFAULT 'login',
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organization_user_otps_user_idx ON public.organization_user_otps(user_id);
CREATE INDEX IF NOT EXISTS organization_user_otps_expiry_idx ON public.organization_user_otps(expires_at);

CREATE TABLE IF NOT EXISTS public.organization_user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.organization_users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.organization_user_role NOT NULL,
  session_token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  last_accessed_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  ip_address inet,
  user_agent text
);

CREATE INDEX IF NOT EXISTS organization_user_sessions_user_idx ON public.organization_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS organization_user_sessions_org_idx ON public.organization_user_sessions(organization_id);
CREATE INDEX IF NOT EXISTS organization_user_sessions_active_idx
ON public.organization_user_sessions(user_id, expires_at)
WHERE revoked_at IS NULL;

CREATE TRIGGER set_organization_user_sessions_updated_at
BEFORE UPDATE ON public.organization_user_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TABLE IF NOT EXISTS public.organization_user_password_resets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.organization_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  purpose text NOT NULL DEFAULT 'reset',
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  request_ip inet,
  user_agent text,
  redirect_url text
);

CREATE INDEX IF NOT EXISTS organization_user_password_resets_user_idx ON public.organization_user_password_resets(user_id);
CREATE INDEX IF NOT EXISTS organization_user_password_resets_expiry_idx ON public.organization_user_password_resets(expires_at);

ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_user_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_user_password_resets ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.organization_users TO anon;
GRANT ALL ON TABLE public.organization_users TO authenticated;
GRANT ALL ON TABLE public.organization_users TO service_role;

GRANT ALL ON TABLE public.organization_user_otps TO anon;
GRANT ALL ON TABLE public.organization_user_otps TO authenticated;
GRANT ALL ON TABLE public.organization_user_otps TO service_role;

GRANT ALL ON TABLE public.organization_user_sessions TO anon;
GRANT ALL ON TABLE public.organization_user_sessions TO authenticated;
GRANT ALL ON TABLE public.organization_user_sessions TO service_role;
GRANT ALL ON TABLE public.organization_user_password_resets TO anon;
GRANT ALL ON TABLE public.organization_user_password_resets TO authenticated;
GRANT ALL ON TABLE public.organization_user_password_resets TO service_role;
