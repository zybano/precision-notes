-- Fix for admin authentication without anonymous auth requirement
-- Run this script to update the admin session handling

-- Update the admin_user_sessions table to handle placeholder auth user IDs
ALTER TABLE public.admin_user_sessions 
ALTER COLUMN auth_user_id TYPE TEXT;

-- Drop and recreate the create_admin_session function
DROP FUNCTION IF EXISTS create_admin_session(UUID, UUID, TEXT, INET, TEXT);

-- Function to create admin session (updated)
CREATE OR REPLACE FUNCTION create_admin_session(
    p_admin_user_id UUID,
    p_auth_user_id TEXT, -- Changed to TEXT to accept placeholder IDs
    p_session_token TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Set session to expire in 24 hours
    v_expires_at := NOW() + INTERVAL '24 hours';
    
    -- Clean up expired sessions for this admin user
    DELETE FROM admin_user_sessions 
    WHERE admin_user_id = p_admin_user_id 
    AND expires_at < NOW();
    
    -- Also clean up any existing sessions for this admin user to enforce single session
    DELETE FROM admin_user_sessions 
    WHERE admin_user_id = p_admin_user_id;
    
    -- Create new session
    INSERT INTO admin_user_sessions (
        admin_user_id, 
        auth_user_id, 
        session_token, 
        expires_at,
        ip_address,
        user_agent
    )
    VALUES (
        p_admin_user_id, 
        p_auth_user_id, 
        p_session_token, 
        v_expires_at,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_session_id;
    
    -- Update last login time
    UPDATE admin_users 
    SET last_login_at = NOW(), updated_at = NOW()
    WHERE id = p_admin_user_id;
    
    RETURN v_session_id;
END;
$$;

-- Update RLS policies to work with TEXT auth_user_id
DROP POLICY IF EXISTS "Users can only see their own sessions" ON public.admin_user_sessions;

-- Create simplified RLS policy for sessions (since we're not using real Supabase auth)
CREATE POLICY "Admin sessions are accessible" ON public.admin_user_sessions
    FOR ALL USING (true); -- This is less secure but works without Supabase auth

-- Update RLS policies for admin_users
DROP POLICY IF EXISTS "Admin users can view their own data" ON public.admin_users;

-- Simplified RLS policy for admin users
CREATE POLICY "Admin users accessible" ON public.admin_users
    FOR ALL USING (true); -- This is less secure but works without Supabase auth

-- Note: In a production environment, you might want to implement custom RLS logic
-- or use a different authentication mechanism for better security

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_admin_session TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin_session TO anon;

COMMENT ON FUNCTION create_admin_session IS 'Creates admin session without requiring Supabase auth (updated for anonymous auth disabled)';
