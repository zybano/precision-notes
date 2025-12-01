const EDGE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : "https://api.precisionnote.com/functions/v1";
const ORG_AUTH_BASE = `${EDGE_URL}/organization-auth`;
const UTILIZATION_BASE = `${EDGE_URL}/staff-utilization`;

export type OrganizationUserRole = "admin" | "staff";

export interface OrganizationUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: OrganizationUserRole;
  organization_id: string;
  department?: string | null;
  last_login_at?: string | null;
  created_at?: string;
  is_active?: boolean;
}

export interface OrgSession {
  token: string;
  expires_at: string;
  organization_id: string;
  role: OrganizationUserRole;
}

interface AdminOnboardPayload {
  organizationId: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  department?: string;
}

export interface StaffBulkEntry {
  email: string;
  first_name: string;
  last_name: string;
  department?: string | null;
}

export interface OrganizationDetailsResponse {
  organization: {
    id: string;
    name: string;
    contact_email?: string;
    contact_name?: string;
    industry?: string;
    credits?: number;
    rate_limit_per_hour?: number;
    total_requests?: number;
    total_transcriptions?: number;
    total_documents_generated?: number;
    created_at?: string;
  };
  staffCount: number;
}

export interface UsageSummaryResponse {
  organizationUsage: {
    credits: number;
    totalRequests: number;
    totalTranscriptions: number;
    totalDocumentsGenerated: number;
    rateLimitPerHour: number;
    remainingRequests: number;
  };
  userUsage: {
    lastLogin?: string | null;
    sessionCount: number;
  };
}

async function postJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  const response = await fetch(`${ORG_AUTH_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

  const data = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? "Request failed");
  }

  return data as T;
}

async function getJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${ORG_AUTH_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? "Request failed");
  }

  return data as T;
}

async function safeParseJson(response: Response) {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
}

export async function adminOnboard(payload: AdminOnboardPayload) {
  return postJson<{ organization: { id: string; name: string }; admin: OrganizationUser; session: OrgSession }>(
    "/admin-onboard",
    payload
  );
}

export async function loginWithPassword(email: string, password: string) {
  return postJson<{ session: OrgSession; user: OrganizationUser }>("/login", { email, password });
}

export async function requestOtp(email: string) {
  return postJson<{ message: string; expires_at: string }>("/request-otp", { email });
}

export async function verifyOtp(email: string, otp: string) {
  return postJson<{ session: OrgSession; user: OrganizationUser }>("/verify-otp", { email, otp });
}

export async function requestPasswordReset(email: string, redirectUrl?: string) {
  return postJson<{ message: string; expires_at?: string }>("/request-password-reset", { email, redirectUrl });
}

export async function resetPassword(email: string, token: string, newPassword: string) {
  return postJson<{ message: string }>("/reset-password", { email, token, newPassword });
}

export async function createStaff(
  token: string,
  payload: { firstName: string; lastName: string; email: string; department?: string; password?: string }
) {
  return postJson<{ staff: OrganizationUser; temporary_password?: string }>("/staff", payload, token);
}

export async function bulkUploadStaff(token: string, entries: StaffBulkEntry[]) {
  return postJson<{ total_rows: number; results: Array<Record<string, unknown>> }>(
    "/staff/bulk-upload",
    { staff: entries },
    token
  );
}

export async function fetchOrganizationDetails(token: string) {
  return getJson<OrganizationDetailsResponse>("/organization", token);
}

export async function fetchStaffList(token: string) {
  return getJson<{ staff: OrganizationUser[] }>("/staff", token);
}

export async function fetchUsageSummary(token: string) {
  return getJson<UsageSummaryResponse>("/usage", token);
}

// Staff Utilization endpoints
async function getJsonWithParams<T>(path: string, token: string, params?: Record<string, string>, baseUrl = ORG_AUTH_BASE): Promise<T> {
  const queryParams = new URLSearchParams(params || {});
  const queryString = queryParams.toString();
  const url = `${baseUrl}${path}${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? "Request failed");
  }

  return data as T;
}

export async function fetchStaffUtilization(
  token: string,
  userId?: string,
  startDate?: string,
  endDate?: string
) {
  const params: Record<string, string> = {};
  if (userId) params.user_id = userId;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  return getJsonWithParams<{
    user_id: string;
    daily_utilization: Array<{
      date: string;
      credits_used: number;
      documents_generated: number;
      transcriptions_completed: number;
      metadata: Record<string, any>;
    }>;
    totals: {
      total_credits: number;
      total_documents: number;
      total_transcriptions: number;
    };
  }>("/user", token, params, UTILIZATION_BASE);
}

export async function fetchStaffActivityLog(
  token: string,
  userId?: string,
  startDate?: string,
  endDate?: string,
  limit?: number
) {
  const params: Record<string, string> = {};
  if (userId) params.user_id = userId;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (limit) params.limit = limit.toString();

  return getJsonWithParams<{
    activities: Array<{
      id: string;
      activity_type: 'transcription' | 'document_generation' | 'combined_request';
      credits_used: number;
      document_format?: string;
      processing_time_seconds?: string;
      created_at: string;
    }>;
    count: number;
  }>("/activity", token, params, UTILIZATION_BASE);
}

export async function fetchOrganizationStaffUtilization(
  token: string,
  startDate?: string,
  endDate?: string
) {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  return getJsonWithParams<{
    staff_utilization: Array<{
      user_id: string;
      user_email: string;
      user_name: string;
      user_role: string;
      user_department?: string;
      total_credits_used: number;
      total_documents_generated: number;
      total_transcriptions_completed: number;
      last_activity_date?: string;
    }>;
    totals: {
      total_credits: number;
      total_documents: number;
      total_transcriptions: number;
      active_staff: number;
    };
    total_staff: number;
    date_range: {
      start_date?: string;
      end_date?: string;
    };
  }>("/organization", token, params, UTILIZATION_BASE);
}
