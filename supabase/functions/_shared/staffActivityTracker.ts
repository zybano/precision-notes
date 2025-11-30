// Shared utility for tracking staff activity across B2B functions
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface StaffActivityParams {
  userId: string;
  organizationId: string;
  activityType: 'transcription' | 'document_generation' | 'combined_request';
  creditsUsed: number;
  requestId?: string;
  documentFormat?: string;
  transcriptionProvider?: string;
  modelUsed?: string;
  processingTimeMs?: number;
  metadata?: Record<string, any>;
}

/**
 * Records staff activity in the database
 * This function is called from B2B edge functions to track individual staff usage
 */
export async function recordStaffActivity(
  supabase: SupabaseClient,
  params: StaffActivityParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('record_staff_activity', {
      p_user_id: params.userId,
      p_organization_id: params.organizationId,
      p_activity_type: params.activityType,
      p_credits_used: params.creditsUsed,
      p_request_id: params.requestId || null,
      p_document_format: params.documentFormat || null,
      p_transcription_provider: params.transcriptionProvider || null,
      p_model_used: params.modelUsed || null,
      p_processing_time_ms: params.processingTimeMs || null,
      p_metadata: params.metadata || {}
    });

    if (error) {
      console.error('Failed to record staff activity:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception recording staff activity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extracts user_id from session token
 * Used by B2B functions to identify which staff member made the request
 */
export async function getUserIdFromSessionToken(
  supabase: SupabaseClient,
  sessionToken: string
): Promise<{ userId: string | null; organizationId: string | null; error?: string }> {
  try {
    if (!sessionToken) {
      return { userId: null, organizationId: null, error: 'No session token provided' };
    }

    const { data, error } = await supabase
      .from('organization_user_sessions')
      .select('user_id, organization_id')
      .eq('session_token', sessionToken)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) {
      return { userId: null, organizationId: null, error: 'Invalid or expired session' };
    }

    return {
      userId: data.user_id,
      organizationId: data.organization_id
    };
  } catch (error) {
    console.error('Exception getting user from session:', error);
    return {
      userId: null,
      organizationId: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
