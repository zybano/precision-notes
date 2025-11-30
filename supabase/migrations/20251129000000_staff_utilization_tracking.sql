-- Staff Utilization Tracking Migration
-- This migration adds tables and functions to track staff usage of credits and document generation

-- Create staff_utilization table to track individual staff usage
CREATE TABLE IF NOT EXISTS public.staff_utilization (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.organization_users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Usage metrics
  credits_used integer NOT NULL DEFAULT 0,
  documents_generated integer NOT NULL DEFAULT 0,
  transcriptions_completed integer NOT NULL DEFAULT 0,

  -- Activity tracking
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),

  -- Metadata for detailed tracking
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Unique constraint to ensure one record per user per day
  CONSTRAINT staff_utilization_unique_user_date UNIQUE (user_id, date)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS staff_utilization_user_id_idx ON public.staff_utilization(user_id);
CREATE INDEX IF NOT EXISTS staff_utilization_org_id_idx ON public.staff_utilization(organization_id);
CREATE INDEX IF NOT EXISTS staff_utilization_date_idx ON public.staff_utilization(date);
CREATE INDEX IF NOT EXISTS staff_utilization_user_date_idx ON public.staff_utilization(user_id, date);

-- Trigger to update updated_at timestamp
CREATE TRIGGER set_staff_utilization_updated_at
BEFORE UPDATE ON public.staff_utilization
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Create staff_activity_log table for detailed activity tracking
CREATE TABLE IF NOT EXISTS public.staff_activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.organization_users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Activity details
  activity_type text NOT NULL, -- 'transcription', 'document_generation', 'combined_request'
  credits_used integer NOT NULL DEFAULT 0,

  -- Request details
  request_id text,
  document_format text,
  transcription_provider text,
  model_used text,

  -- Timing
  processing_time_ms integer,
  created_at timestamptz NOT NULL DEFAULT NOW(),

  -- Additional metadata
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT staff_activity_log_activity_type_check
    CHECK (activity_type IN ('transcription', 'document_generation', 'combined_request'))
);

-- Indexes for activity log
CREATE INDEX IF NOT EXISTS staff_activity_log_user_id_idx ON public.staff_activity_log(user_id);
CREATE INDEX IF NOT EXISTS staff_activity_log_org_id_idx ON public.staff_activity_log(organization_id);
CREATE INDEX IF NOT EXISTS staff_activity_log_created_at_idx ON public.staff_activity_log(created_at);
CREATE INDEX IF NOT EXISTS staff_activity_log_activity_type_idx ON public.staff_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS staff_activity_log_request_id_idx ON public.staff_activity_log(request_id);

-- Enable Row Level Security
ALTER TABLE public.staff_utilization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_activity_log ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE public.staff_utilization TO anon;
GRANT ALL ON TABLE public.staff_utilization TO authenticated;
GRANT ALL ON TABLE public.staff_utilization TO service_role;

GRANT ALL ON TABLE public.staff_activity_log TO anon;
GRANT ALL ON TABLE public.staff_activity_log TO authenticated;
GRANT ALL ON TABLE public.staff_activity_log TO service_role;

-- Function to record staff activity
CREATE OR REPLACE FUNCTION public.record_staff_activity(
  p_user_id uuid,
  p_organization_id uuid,
  p_activity_type text,
  p_credits_used integer,
  p_request_id text DEFAULT NULL,
  p_document_format text DEFAULT NULL,
  p_transcription_provider text DEFAULT NULL,
  p_model_used text DEFAULT NULL,
  p_processing_time_ms integer DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_log_id uuid;
  v_today date;
  v_documents_increment integer;
  v_transcriptions_increment integer;
BEGIN
  v_today := CURRENT_DATE;

  -- Determine what to increment
  v_documents_increment := 0;
  v_transcriptions_increment := 0;

  IF p_activity_type = 'document_generation' THEN
    v_documents_increment := 1;
  ELSIF p_activity_type = 'transcription' THEN
    v_transcriptions_increment := 1;
  ELSIF p_activity_type = 'combined_request' THEN
    v_documents_increment := 1;
    v_transcriptions_increment := 1;
  END IF;

  -- Insert activity log
  INSERT INTO public.staff_activity_log (
    user_id,
    organization_id,
    activity_type,
    credits_used,
    request_id,
    document_format,
    transcription_provider,
    model_used,
    processing_time_ms,
    metadata
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_activity_type,
    p_credits_used,
    p_request_id,
    p_document_format,
    p_transcription_provider,
    p_model_used,
    p_processing_time_ms,
    p_metadata
  )
  RETURNING id INTO v_activity_log_id;

  -- Update or insert daily utilization record
  INSERT INTO public.staff_utilization (
    user_id,
    organization_id,
    date,
    credits_used,
    documents_generated,
    transcriptions_completed
  ) VALUES (
    p_user_id,
    p_organization_id,
    v_today,
    p_credits_used,
    v_documents_increment,
    v_transcriptions_increment
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    credits_used = staff_utilization.credits_used + p_credits_used,
    documents_generated = staff_utilization.documents_generated + v_documents_increment,
    transcriptions_completed = staff_utilization.transcriptions_completed + v_transcriptions_increment,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'activity_log_id', v_activity_log_id,
    'user_id', p_user_id,
    'credits_used', p_credits_used
  );
END;
$$;

-- Function to get staff utilization summary
CREATE OR REPLACE FUNCTION public.get_staff_utilization(
  p_user_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  date date,
  credits_used integer,
  documents_generated integer,
  transcriptions_completed integer,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    su.date,
    su.credits_used,
    su.documents_generated,
    su.transcriptions_completed,
    su.metadata
  FROM public.staff_utilization su
  WHERE su.user_id = p_user_id
    AND (p_start_date IS NULL OR su.date >= p_start_date)
    AND (p_end_date IS NULL OR su.date <= p_end_date)
  ORDER BY su.date DESC;
END;
$$;

-- Function to get organization-wide staff utilization
CREATE OR REPLACE FUNCTION public.get_organization_staff_utilization(
  p_organization_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  user_email text,
  user_name text,
  total_credits_used bigint,
  total_documents_generated bigint,
  total_transcriptions_completed bigint,
  last_activity_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ou.id as user_id,
    ou.email as user_email,
    CONCAT(ou.first_name, ' ', ou.last_name) as user_name,
    COALESCE(SUM(su.credits_used), 0) as total_credits_used,
    COALESCE(SUM(su.documents_generated), 0) as total_documents_generated,
    COALESCE(SUM(su.transcriptions_completed), 0) as total_transcriptions_completed,
    MAX(su.date) as last_activity_date
  FROM public.organization_users ou
  LEFT JOIN public.staff_utilization su ON ou.id = su.user_id
    AND (p_start_date IS NULL OR su.date >= p_start_date)
    AND (p_end_date IS NULL OR su.date <= p_end_date)
  WHERE ou.organization_id = p_organization_id
  GROUP BY ou.id, ou.email, ou.first_name, ou.last_name
  ORDER BY total_credits_used DESC;
END;
$$;

-- Function to get staff activity details
CREATE OR REPLACE FUNCTION public.get_staff_activity_details(
  p_user_id uuid,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  activity_type text,
  credits_used integer,
  request_id text,
  document_format text,
  transcription_provider text,
  model_used text,
  processing_time_ms integer,
  created_at timestamptz,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sal.id,
    sal.activity_type,
    sal.credits_used,
    sal.request_id,
    sal.document_format,
    sal.transcription_provider,
    sal.model_used,
    sal.processing_time_ms,
    sal.created_at,
    sal.metadata
  FROM public.staff_activity_log sal
  WHERE sal.user_id = p_user_id
    AND (p_start_date IS NULL OR sal.created_at >= p_start_date)
    AND (p_end_date IS NULL OR sal.created_at <= p_end_date)
  ORDER BY sal.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Comment on tables and functions
COMMENT ON TABLE public.staff_utilization IS 'Daily aggregated staff utilization metrics';
COMMENT ON TABLE public.staff_activity_log IS 'Detailed log of all staff activities';
COMMENT ON FUNCTION public.record_staff_activity IS 'Records a staff activity and updates daily utilization metrics';
COMMENT ON FUNCTION public.get_staff_utilization IS 'Retrieves staff utilization data for a specific user and date range';
COMMENT ON FUNCTION public.get_organization_staff_utilization IS 'Retrieves aggregated staff utilization for all users in an organization';
COMMENT ON FUNCTION public.get_staff_activity_details IS 'Retrieves detailed activity log for a specific user';
