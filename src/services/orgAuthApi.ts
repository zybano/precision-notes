const EDGE_URL = import.meta.env.VITE_SUPABASE_EDGE_URL ?? "https://rdjzeayewevditzekveb.supabase.co/functions/v1";
const ORG_AUTH_BASE = `${EDGE_URL}/organization-auth`;

export type OrganizationUserRole = "admin" | "staff";

export interface OrganizationUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: OrganizationUserRole;
  organization_id: string;
  department?: string | null;
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

export async function bulkUploadStaff(token: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${ORG_AUTH_BASE}/staff/bulk-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const data = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? "Bulk upload failed");
  }

  return data as { total_rows: number; results: Array<Record<string, unknown>> };
}
