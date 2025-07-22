// Admin middleware for Supabase Edge Functions
// This code should be added to your existing B2B functions to validate admin sessions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AdminUser {
  admin_id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  permissions: Record<string, boolean>;
}

/**
 * Validates admin session token and returns admin user info
 */
export async function validateAdminSession(
  supabaseClient: any,
  sessionToken: string | null
): Promise<{ success: boolean; adminUser?: AdminUser; error?: string }> {
  if (!sessionToken) {
    return { success: false, error: 'No admin session token provided' };
  }

  try {
    // Call the validate_admin_session function
    const { data, error } = await supabaseClient.rpc('validate_admin_session', {
      p_session_token: sessionToken
    });

    if (error) {
      console.error('Session validation error:', error);
      return { success: false, error: 'Invalid session' };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Session expired or invalid' };
    }

    const adminData = data[0];
    return {
      success: true,
      adminUser: {
        admin_id: adminData.admin_id,
        name: adminData.name,
        email: adminData.email,
        role: adminData.role,
        permissions: adminData.permissions
      }
    };
  } catch (error) {
    console.error('Error validating admin session:', error);
    return { success: false, error: 'Session validation failed' };
  }
}

/**
 * Middleware function to protect admin endpoints
 */
export async function requireAdminAuth(
  request: Request,
  supabaseClient: any,
  requiredPermission?: string
): Promise<{ success: boolean; adminUser?: AdminUser; error?: string; response?: Response }> {
  // Get session token from header
  const sessionToken = request.headers.get('x-admin-session-token');
  
  const validation = await validateAdminSession(supabaseClient, sessionToken);
  
  if (!validation.success) {
    return {
      success: false,
      error: validation.error,
      response: new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-session-token'
          }
        }
      )
    };
  }

  const adminUser = validation.adminUser!;

  // Check specific permission if required
  if (requiredPermission) {
    // Super admins have all permissions
    if (adminUser.role !== 'super_admin' && !adminUser.permissions[requiredPermission]) {
      return {
        success: false,
        error: `Permission '${requiredPermission}' required`,
        response: new Response(
          JSON.stringify({ error: `Insufficient permissions: ${requiredPermission} required` }),
          { 
            status: 403,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-session-token'
            }
          }
        )
      };
    }
  }

  return { success: true, adminUser };
}

/**
 * Example usage in your B2B organization management function:
 * 
 * // In your existing function file (e.g., b2b-organization-management/index.ts)
 * 
 * import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
 * import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
 * import { requireAdminAuth } from './admin-middleware.ts'
 * 
 * serve(async (req) => {
 *   const supabaseClient = createClient(
 *     Deno.env.get('SUPABASE_URL') ?? '',
 *     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
 *   )
 * 
 *   // Validate admin session
 *   const authResult = await requireAdminAuth(req, supabaseClient, 'organizations')
 *   if (!authResult.success) {
 *     return authResult.response!
 *   }
 * 
 *   const adminUser = authResult.adminUser!
 *   
 *   // Your existing function logic here...
 *   // You can use adminUser.admin_id, adminUser.role, etc.
 *   
 *   return new Response(JSON.stringify({ success: true }), {
 *     headers: { 'Content-Type': 'application/json' }
 *   })
 * })
 */

/**
 * Alternative lightweight version for endpoints that just need to verify admin access
 */
export async function isValidAdminSession(
  supabaseClient: any,
  sessionToken: string | null
): Promise<boolean> {
  const result = await validateAdminSession(supabaseClient, sessionToken);
  return result.success;
}

/**
 * Get admin user from session token (returns null if invalid)
 */
export async function getAdminUser(
  supabaseClient: any,
  sessionToken: string | null
): Promise<AdminUser | null> {
  const result = await validateAdminSession(supabaseClient, sessionToken);
  return result.success ? result.adminUser! : null;
}
