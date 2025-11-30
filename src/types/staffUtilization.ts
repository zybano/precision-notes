// Types for staff utilization tracking

export interface StaffUtilizationDaily {
  date: string;
  credits_used: number;
  documents_generated: number;
  transcriptions_completed: number;
  metadata: Record<string, any>;
}

export interface StaffUtilizationTotals {
  total_credits: number;
  total_documents: number;
  total_transcriptions: number;
}

export interface StaffUtilizationResponse {
  user_id: string;
  daily_utilization: StaffUtilizationDaily[];
  totals: StaffUtilizationTotals;
}

export interface StaffActivity {
  id: string;
  activity_type: 'transcription' | 'document_generation' | 'combined_request';
  credits_used: number;
  request_id?: string;
  document_format?: string;
  transcription_provider?: string;
  model_used?: string;
  processing_time_ms?: number;
  created_at: string;
  metadata: Record<string, any>;
}

export interface StaffActivityLogResponse {
  user_id: string;
  activities: StaffActivity[];
  count: number;
}

export interface OrganizationStaffUtilization {
  user_id: string;
  user_email: string;
  user_name: string;
  total_credits_used: number;
  total_documents_generated: number;
  total_transcriptions_completed: number;
  last_activity_date?: string;
}

export interface OrganizationStaffUtilizationTotals {
  total_credits: number;
  total_documents: number;
  total_transcriptions: number;
  active_staff: number;
}

export interface OrganizationStaffUtilizationResponse {
  organization_id: string;
  staff_utilization: OrganizationStaffUtilization[];
  totals: OrganizationStaffUtilizationTotals;
  total_staff: number;
}
