import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { sendHtmlEmail, sendTemplateEmail } from "./zeptomail.ts";

type SupabaseClient = ReturnType<typeof createClient>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

const PASSWORD_RESET_URL = Deno.env.get("PASSWORD_RESET_URL");
const OTP_TEMPLATE_KEY = Deno.env.get("ZEPTOMAIL_OTP_TEMPLATE_KEY");
const RESET_TEMPLATE_KEY = Deno.env.get("ZEPTOMAIL_RESET_TEMPLATE_KEY");
const PRODUCT_NAME = Deno.env.get("PRODUCT_NAME") ?? "Precision Notes";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const baseIndex = pathSegments.indexOf("organization-auth");
  const routeSegments = baseIndex >= 0 ? pathSegments.slice(baseIndex + 1) : [];
  const primaryRoute = routeSegments[0] ?? "";
  const secondaryRoute = routeSegments[1] ?? "";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    if (req.method === "POST" && primaryRoute === "admin-onboard") {
      return await handleAdminOnboard(req, supabase);
    }

    if (req.method === "POST" && primaryRoute === "login") {
      return await handlePasswordLogin(req, supabase);
    }

    if (req.method === "POST" && primaryRoute === "request-otp") {
      return await handleOtpRequest(req, supabase);
    }

    if (req.method === "POST" && primaryRoute === "verify-otp") {
      return await handleOtpVerification(req, supabase);
    }

    if (req.method === "POST" && primaryRoute === "request-password-reset") {
      return await handlePasswordResetRequest(req, supabase);
    }

    if (req.method === "POST" && primaryRoute === "reset-password") {
      return await handlePasswordResetConfirmation(req, supabase);
    }

    if (req.method === "POST" && primaryRoute === "staff" && secondaryRoute === "bulk-upload") {
      return await handleBulkStaffUpload(req, supabase);
    }

    if (req.method === "POST" && primaryRoute === "staff") {
      return await handleStaffCreate(req, supabase);
    }

    if (req.method === "GET" && primaryRoute === "organization") {
      return await handleOrganizationDetails(req, supabase);
    }

    if (req.method === "GET" && primaryRoute === "staff") {
      return await handleStaffList(req, supabase);
    }

    if (req.method === "GET" && primaryRoute === "usage") {
      return await handleUsageSummary(req, supabase);
    }

    if (req.method === "GET" && primaryRoute === "staff" && secondaryRoute === "utilization") {
      return await handleStaffUtilization(req, supabase);
    }

    if (req.method === "GET" && primaryRoute === "staff" && secondaryRoute === "activity") {
      return await handleStaffActivityLog(req, supabase);
    }

    if (req.method === "GET" && primaryRoute === "organization" && secondaryRoute === "staff-utilization") {
      return await handleOrganizationStaffUtilization(req, supabase);
    }

    return jsonResponse({
      error: "Route not found",
      available_routes: [
        "POST /admin-onboard",
        "POST /login",
        "POST /request-otp",
        "POST /verify-otp",
        "POST /staff",
        "POST /staff/bulk-upload",
        "GET /organization",
        "GET /staff",
        "GET /usage",
        "GET /staff/utilization",
        "GET /staff/activity",
        "GET /organization/staff-utilization"
      ]
    }, 404);
  } catch (error) {
    console.error("organization-auth error", error);
    return jsonResponse({
      error: "Internal server error",
      details: error?.message ?? String(error)
    }, 500);
  }
});

async function handleAdminOnboard(req: Request, supabase: SupabaseClient) {
  const body = await parseJson(req);
  const {
    organizationId,
    adminFirstName,
    adminLastName,
    adminEmail,
    adminPassword,
    department
  } = body ?? {};

  if (!organizationId || !adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
    return jsonResponse({ error: "Missing required fields" }, 400);
  }

  if (!validateEmail(adminEmail)) {
    return jsonResponse({ error: "Admin email is invalid" }, 400);
  }

  const normalizedAdminEmail = normalizeEmail(adminEmail);

  const existingAdmin = await getUserByEmail(supabase, normalizedAdminEmail);
  if (existingAdmin) {
    return jsonResponse({ error: "Admin email already exists" }, 409);
  }

  const { data: organization, error: orgFetchError } = await supabase
    .from("organizations")
    .select("id, name, is_active")
    .eq("id", organizationId)
    .maybeSingle();

  if (orgFetchError) {
    return jsonResponse({ error: "Failed to fetch organization" }, 500);
  }

  if (!organization) {
    return jsonResponse({ error: "Organization not found" }, 404);
  }

  if (organization.is_active === false) {
    return jsonResponse({ error: "Organization is inactive" }, 400);
  }

  const passwordHash = hashPassword(adminPassword);

  const { data: adminUser, error: adminInsertError } = await supabase
    .from("organization_users")
    .insert({
      organization_id: organizationId,
      email: normalizedAdminEmail,
      password_hash: passwordHash,
      first_name: adminFirstName,
      last_name: adminLastName,
      role: "admin",
      department: department ?? null
    })
    .select()
    .single();

  if (adminInsertError || !adminUser) {
    return jsonResponse({ error: adminInsertError?.message ?? "Failed to create admin user" }, 500);
  }

  const session = await createSessionForUser(supabase, adminUser, req);

  return jsonResponse({
    organization: {
      id: organization.id,
      name: organization.name
    },
    admin: {
      id: adminUser.id,
      email: adminUser.email,
      first_name: adminUser.first_name,
      last_name: adminUser.last_name
    },
    session
  }, 201);
}

async function handlePasswordLogin(req: Request, supabase: SupabaseClient) {
  const body = await parseJson(req);
  const { email, password } = body ?? {};

  if (!email || !password) {
    return jsonResponse({ error: "Email and password are required" }, 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await getUserByEmail(supabase, normalizedEmail);

  if (!user || !user.password_hash) {
    return jsonResponse({ error: "Invalid credentials" }, 401);
  }

  const matches = comparePassword(password, user.password_hash);
  if (!matches) {
    return jsonResponse({ error: "Invalid credentials" }, 401);
  }

  await updateLastLogin(supabase, user.id);
  const session = await createSessionForUser(supabase, user, req);

  return jsonResponse({
    session,
    user: sanitizeUser(user)
  });
}

async function handleOtpRequest(req: Request, supabase: SupabaseClient) {
  const body = await parseJson(req);
  const { email } = body ?? {};

  if (!email) {
    return jsonResponse({ error: "Email is required" }, 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await getUserByEmail(supabase, normalizedEmail);

  if (!user) {
    return jsonResponse({ error: "User not found" }, 404);
  }

  await purgeExpiredOtps(supabase, user.id);

  const otpCode = generateOtpCode();
  const hashed = hashPassword(otpCode);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const { data: otpRow, error: otpInsertError } = await supabase
    .from("organization_user_otps")
    .insert({
      user_id: user.id,
      otp_hash: hashed,
      expires_at: expiresAt.toISOString()
    })
    .select("id")
    .single();

  if (otpInsertError) {
    return jsonResponse({ error: "Failed to create OTP" }, 500);
  }

  try {
    await sendOtpEmail(user, otpCode);
  } catch (error) {
    await supabase
      .from("organization_user_otps")
      .delete()
      .eq("id", otpRow?.id ?? "");

    console.error("OTP email failed", error);
    return jsonResponse({ error: "Failed to deliver OTP email" }, 500);
  }

  return jsonResponse({
    message: "OTP sent",
    expires_at: expiresAt.toISOString()
  });
}

async function handleOtpVerification(req: Request, supabase: SupabaseClient) {
  const body = await parseJson(req);
  const { email, otp } = body ?? {};

  if (!email || !otp) {
    return jsonResponse({ error: "Email and OTP are required" }, 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await getUserByEmail(supabase, normalizedEmail);

  if (!user) {
    return jsonResponse({ error: "User not found" }, 404);
  }

  const { data: otpRecord, error: otpFetchError } = await supabase
    .from("organization_user_otps")
    .select("id, otp_hash, expires_at, attempts")
    .eq("user_id", user.id)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (otpFetchError) {
    return jsonResponse({ error: "Failed to verify OTP" }, 500);
  }

  if (!otpRecord) {
    return jsonResponse({ error: "No active OTP found" }, 400);
  }

  const isValid = comparePassword(String(otp), otpRecord.otp_hash);
  if (!isValid) {
    await supabase
      .from("organization_user_otps")
      .update({ attempts: (otpRecord.attempts ?? 0) + 1 })
      .eq("id", otpRecord.id);

    return jsonResponse({ error: "Invalid OTP" }, 401);
  }

  await supabase
    .from("organization_user_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", otpRecord.id);

  await updateLastLogin(supabase, user.id);
  const session = await createSessionForUser(supabase, user, req);

  return jsonResponse({
    session,
    user: sanitizeUser(user)
  });
}

async function handlePasswordResetRequest(req: Request, supabase: SupabaseClient) {
  const body = await parseJson(req);
  const { email, redirectUrl } = body ?? {};

  if (!email) {
    return jsonResponse({ error: "Email is required" }, 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const targetUrl = redirectUrl ?? PASSWORD_RESET_URL;

  if (!targetUrl) {
    return jsonResponse({ error: "redirectUrl or PASSWORD_RESET_URL must be provided" }, 400);
  }

  const user = await getUserByEmail(supabase, normalizedEmail);

  if (!user) {
    return jsonResponse({ message: "If the email exists, a reset link will be sent" });
  }

  await purgeExpiredPasswordResets(supabase, user.id);

  const token = generateResetToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const ip = getRequestIp(req);
  const userAgent = req.headers.get("user-agent") ?? null;

  const { data: resetRow, error: resetError } = await supabase
    .from("organization_user_password_resets")
    .insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      request_ip: ip ?? null,
      user_agent: userAgent,
      redirect_url: targetUrl
    })
    .select("id")
    .single();

  if (resetError) {
    return jsonResponse({ error: "Failed to create password reset request" }, 500);
  }

  let resetLink: string;
  try {
    resetLink = buildResetLink(targetUrl, {
      token,
      email: normalizedEmail
    });
  } catch (error) {
    return jsonResponse({ error: error?.message ?? "Invalid redirect URL" }, 400);
  }

  try {
    await sendPasswordResetEmail(user, resetLink, expiresAt.toISOString());
  } catch (error) {
    await supabase
      .from("organization_user_password_resets")
      .delete()
      .eq("id", resetRow?.id ?? "");

    console.error("Reset email failed", error);
    return jsonResponse({ error: "Failed to deliver reset email" }, 500);
  }

  return jsonResponse({
    message: "If the email exists, a reset link will be sent",
    expires_at: expiresAt.toISOString()
  });
}

async function handlePasswordResetConfirmation(req: Request, supabase: SupabaseClient) {
  const body = await parseJson(req);
  const { email, token, newPassword } = body ?? {};

  if (!email || !token || !newPassword) {
    return jsonResponse({ error: "Email, token, and newPassword are required" }, 400);
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return jsonResponse({ error: "Password must be at least 8 characters" }, 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await getUserByEmail(supabase, normalizedEmail);

  if (!user) {
    return jsonResponse({ error: "Invalid token or email" }, 400);
  }

  const tokenHash = await hashToken(token);
  const { data: resetRecord, error: resetFetchError } = await supabase
    .from("organization_user_password_resets")
    .select("id, expires_at, consumed_at")
    .eq("token_hash", tokenHash)
    .eq("user_id", user.id)
    .maybeSingle();

  if (resetFetchError) {
    return jsonResponse({ error: "Failed to verify reset token" }, 500);
  }

  if (!resetRecord) {
    return jsonResponse({ error: "Invalid or expired reset token" }, 400);
  }

  if (resetRecord.consumed_at) {
    return jsonResponse({ error: "Reset token already used" }, 400);
  }

  if (new Date(resetRecord.expires_at) < new Date()) {
    return jsonResponse({ error: "Reset token expired" }, 400);
  }

  const passwordHash = hashPassword(newPassword);

  const { error: updateError } = await supabase
    .from("organization_users")
    .update({ password_hash: passwordHash })
    .eq("id", user.id);

  if (updateError) {
    return jsonResponse({ error: "Failed to update password" }, 500);
  }

  await supabase
    .from("organization_user_password_resets")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", resetRecord.id);

  await supabase
    .from("organization_user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return jsonResponse({ message: "Password reset successful" });
}

async function handleStaffCreate(req: Request, supabase: SupabaseClient) {
  const session = await requireSession(req, supabase, { adminOnly: true });
  if (!session?.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const body = await parseJson(req);
  const { firstName, lastName, email, department, password } = body ?? {};

  if (!firstName || !lastName || !email) {
    return jsonResponse({ error: "Missing staff fields" }, 400);
  }

  if (!validateEmail(email)) {
    return jsonResponse({ error: "Invalid staff email" }, 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = await getUserByEmail(supabase, normalizedEmail);
  if (existing) {
    return jsonResponse({ error: "Staff email already exists" }, 409);
  }

  const staffPassword = password ?? generateRandomPassword();
  const passwordHash = hashPassword(staffPassword);

  const { data: staffUser, error: insertError } = await supabase
    .from("organization_users")
    .insert({
      organization_id: session.user.organization_id,
      email: normalizedEmail,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role: "staff",
      department: department ?? null
    })
    .select()
    .single();

  if (insertError || !staffUser) {
    return jsonResponse({ error: insertError?.message ?? "Failed to create staff" }, 500);
  }

  return jsonResponse({
    staff: sanitizeUser(staffUser),
    temporary_password: staffPassword
  }, 201);
}

async function handleBulkStaffUpload(req: Request, supabase: SupabaseClient) {
  const session = await requireSession(req, supabase, { adminOnly: true });
  if (!session?.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const body = await parseJson(req);
  let entries: Array<Record<string, unknown>> = [];

  if (Array.isArray(body)) {
    entries = body;
  } else if (body && Array.isArray(body.staff)) {
    entries = body.staff;
  } else if (body && Array.isArray(body.rows)) {
    entries = body.rows;
  } else {
    return jsonResponse({ error: "Provide a JSON array of staff entries" }, 400);
  }

  const results: Array<Record<string, unknown>> = [];

  for (const entry of entries) {
    const normalized = normalizeRow(entry ?? {});
    const email = normalized.email;
    const firstName = normalized.first_name;
    const lastName = normalized.last_name;
    const department = normalized.department ?? null;

    if (!email || !firstName || !lastName) {
      results.push({ email, status: "skipped", reason: "Missing required fields" });
      continue;
    }

    if (!validateEmail(email)) {
      results.push({ email, status: "skipped", reason: "Invalid email" });
      continue;
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await getUserByEmail(supabase, normalizedEmail);
    if (existing) {
      results.push({ email, status: "skipped", reason: "Email already exists" });
      continue;
    }

    const tempPassword = generateRandomPassword();
    const passwordHash = hashPassword(tempPassword);

    const { error: insertError } = await supabase
      .from("organization_users")
      .insert({
        organization_id: session.user.organization_id,
        email: normalizedEmail,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role: "staff",
        department
      });

    if (insertError) {
      results.push({ email, status: "failed", reason: insertError.message });
      continue;
    }

    results.push({ email, status: "created", temporary_password: tempPassword });
  }

  return jsonResponse({
    total_rows: entries.length,
    results
  });
}

async function handleOrganizationDetails(req: Request, supabase: SupabaseClient) {
  const session = await requireSession(req, supabase);
  if (!session?.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { data: organization, error } = await supabase
    .from("organizations")
    .select(
      "id, name, contact_email, contact_name, industry, credits, rate_limit_per_hour, total_requests, total_transcriptions, total_documents_generated, created_at"
    )
    .eq("id", session.user.organization_id)
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: "Failed to load organization info" }, 500);
  }

  if (!organization) {
    return jsonResponse({ error: "Organization not found" }, 404);
  }

  const { count: staffCount } = await supabase
    .from("organization_users")
    .select("id", { head: true, count: "exact" })
    .eq("organization_id", session.user.organization_id);

  return jsonResponse({
    organization,
    staffCount: staffCount ?? 0
  });
}

async function handleStaffList(req: Request, supabase: SupabaseClient) {
  const session = await requireSession(req, supabase, { adminOnly: true });
  if (!session?.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { data, error } = await supabase
    .from("organization_users")
    .select("id, first_name, last_name, email, role, department, last_login_at, created_at, is_active")
    .eq("organization_id", session.user.organization_id)
    .order("created_at", { ascending: true });

  if (error) {
    return jsonResponse({ error: "Failed to load staff" }, 500);
  }

  return jsonResponse({ staff: data ?? [] });
}

async function handleUsageSummary(req: Request, supabase: SupabaseClient) {
  const session = await requireSession(req, supabase);
  if (!session?.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { data: organization, error } = await supabase
    .from("organizations")
    .select("credits, total_requests, rate_limit_per_hour, total_transcriptions, total_documents_generated")
    .eq("id", session.user.organization_id)
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: "Failed to load usage" }, 500);
  }

  const { data: userSessions } = await supabase
    .from("organization_user_sessions")
    .select("id")
    .eq("user_id", session.user.id);

  const organizationUsage = {
    credits: organization?.credits ?? 0,
    totalRequests: organization?.total_requests ?? 0,
    totalTranscriptions: organization?.total_transcriptions ?? 0,
    totalDocumentsGenerated: organization?.total_documents_generated ?? 0,
    rateLimitPerHour: organization?.rate_limit_per_hour ?? 0,
    remainingRequests: Math.max(
      0,
      (organization?.rate_limit_per_hour ?? 0) - (organization?.total_requests ?? 0)
    )
  };

  const userUsage = {
    lastLogin: session.user.last_login_at,
    sessionCount: userSessions?.length ?? 0
  };

  return jsonResponse({ organizationUsage, userUsage });
}

async function handleStaffUtilization(req: Request, supabase: SupabaseClient) {
  const session = await requireSession(req, supabase);
  if (!session?.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id") || session.user.id;
  const startDate = url.searchParams.get("start_date");
  const endDate = url.searchParams.get("end_date");

  // If requesting another user's data, must be admin
  if (userId !== session.user.id && session.user.role !== "admin") {
    return jsonResponse({ error: "Unauthorized to view other staff utilization" }, 403);
  }

  // Verify user belongs to same organization
  if (userId !== session.user.id) {
    const { data: targetUser } = await supabase
      .from("organization_users")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle();

    if (!targetUser || targetUser.organization_id !== session.user.organization_id) {
      return jsonResponse({ error: "User not found in organization" }, 404);
    }
  }

  // Build query for staff utilization
  let utilizationQuery = supabase
    .from("staff_utilization")
    .select("date, credits_used, documents_generated, transcriptions_completed, metadata")
    .eq("user_id", userId);

  if (startDate) {
    utilizationQuery = utilizationQuery.gte("date", startDate);
  }
  if (endDate) {
    utilizationQuery = utilizationQuery.lte("date", endDate);
  }

  const { data, error } = await utilizationQuery.order("date", { ascending: false });

  if (error) {
    return jsonResponse({ error: "Failed to load staff utilization" }, 500);
  }

  // Calculate totals
  const totals = (data || []).reduce(
    (acc, record) => ({
      total_credits: acc.total_credits + (record.credits_used || 0),
      total_documents: acc.total_documents + (record.documents_generated || 0),
      total_transcriptions: acc.total_transcriptions + (record.transcriptions_completed || 0)
    }),
    { total_credits: 0, total_documents: 0, total_transcriptions: 0 }
  );

  return jsonResponse({
    user_id: userId,
    daily_utilization: data || [],
    totals
  });
}

async function handleStaffActivityLog(req: Request, supabase: SupabaseClient) {
  const session = await requireSession(req, supabase);
  if (!session?.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id") || session.user.id;
  const startDate = url.searchParams.get("start_date");
  const endDate = url.searchParams.get("end_date");
  const limit = parseInt(url.searchParams.get("limit") || "100");

  // If requesting another user's data, must be admin
  if (userId !== session.user.id && session.user.role !== "admin") {
    return jsonResponse({ error: "Unauthorized to view other staff activity" }, 403);
  }

  // Verify user belongs to same organization
  if (userId !== session.user.id) {
    const { data: targetUser } = await supabase
      .from("organization_users")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle();

    if (!targetUser || targetUser.organization_id !== session.user.organization_id) {
      return jsonResponse({ error: "User not found in organization" }, 404);
    }
  }

  // Build query for activity log
  let activityQuery = supabase
    .from("staff_activity_log")
    .select("id, activity_type, credits_used, request_id, document_format, transcription_provider, model_used, processing_time_ms, created_at, metadata")
    .eq("user_id", userId);

  if (startDate) {
    activityQuery = activityQuery.gte("created_at", startDate);
  }
  if (endDate) {
    activityQuery = activityQuery.lte("created_at", endDate);
  }

  const { data, error } = await activityQuery
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 1000));

  if (error) {
    return jsonResponse({ error: "Failed to load staff activity log" }, 500);
  }

  return jsonResponse({
    user_id: userId,
    activities: data || [],
    count: (data || []).length
  });
}

async function handleOrganizationStaffUtilization(req: Request, supabase: SupabaseClient) {
  const session = await requireSession(req, supabase, { adminOnly: true });
  if (!session?.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const startDate = url.searchParams.get("start_date");
  const endDate = url.searchParams.get("end_date");

  // Get all organization users
  const { data: orgUsers, error: usersError } = await supabase
    .from("organization_users")
    .select("id, email, first_name, last_name")
    .eq("organization_id", session.user.organization_id);

  if (usersError) {
    return jsonResponse({ error: "Failed to load organization users" }, 500);
  }

  // Build query for staff utilization
  let utilizationQuery = supabase
    .from("staff_utilization")
    .select("user_id, credits_used, documents_generated, transcriptions_completed, date")
    .eq("organization_id", session.user.organization_id);

  if (startDate) {
    utilizationQuery = utilizationQuery.gte("date", startDate);
  }
  if (endDate) {
    utilizationQuery = utilizationQuery.lte("date", endDate);
  }

  const { data: utilizationData, error: utilizationError } = await utilizationQuery;

  if (utilizationError) {
    return jsonResponse({ error: "Failed to load utilization data" }, 500);
  }

  // Aggregate data by user
  const userUtilizationMap = new Map();

  // Initialize all users with zero values
  (orgUsers || []).forEach((user) => {
    userUtilizationMap.set(user.id, {
      user_id: user.id,
      user_email: user.email,
      user_name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email,
      total_credits_used: 0,
      total_documents_generated: 0,
      total_transcriptions_completed: 0,
      last_activity_date: null
    });
  });

  // Aggregate utilization data
  (utilizationData || []).forEach((record) => {
    const existing = userUtilizationMap.get(record.user_id);
    if (existing) {
      existing.total_credits_used += record.credits_used || 0;
      existing.total_documents_generated += record.documents_generated || 0;
      existing.total_transcriptions_completed += record.transcriptions_completed || 0;

      // Update last activity date
      if (!existing.last_activity_date || record.date > existing.last_activity_date) {
        existing.last_activity_date = record.date;
      }
    }
  });

  const staffUtilization = Array.from(userUtilizationMap.values())
    .sort((a, b) => b.total_credits_used - a.total_credits_used);

  // Calculate organization-wide totals
  const totals = staffUtilization.reduce(
    (acc, staff) => ({
      total_credits: acc.total_credits + staff.total_credits_used,
      total_documents: acc.total_documents + staff.total_documents_generated,
      total_transcriptions: acc.total_transcriptions + staff.total_transcriptions_completed,
      active_staff: acc.active_staff + (staff.last_activity_date ? 1 : 0)
    }),
    { total_credits: 0, total_documents: 0, total_transcriptions: 0, active_staff: 0 }
  );

  return jsonResponse({
    organization_id: session.user.organization_id,
    staff_utilization: staffUtilization,
    totals,
    total_staff: staffUtilization.length
  });
}

function normalizeRow(row: Record<string, unknown>) {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, "_");
    normalized[normalizedKey] = String(value ?? "").trim();
  }
  return normalized;
}

async function parseJson(req: Request) {
  try {
    if (!req.headers.get("content-type")?.includes("application/json")) {
      return null;
    }
    return await req.json();
  } catch (_error) {
    return null;
  }
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function validateEmail(email: string) {
  const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return regex.test(email ?? "");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function getUserByEmail(supabase: SupabaseClient, email: string) {
  const { data } = await supabase
    .from("organization_users")
    .select("id, email, password_hash, first_name, last_name, role, department, organization_id, is_active")
    .eq("email", email)
    .maybeSingle();

  return data;
}

async function updateLastLogin(supabase: SupabaseClient, userId: string) {
  await supabase
    .from("organization_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", userId);
}

async function createSessionForUser(supabase: SupabaseClient, user: any, req: Request) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // Extract the first IP from the x-forwarded-for header (client IP)
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

  console.log("=== Creating Session ===");
  console.log("User ID:", user.id);
  console.log("Organization ID:", user.organization_id);
  console.log("Token length:", token.length);
  console.log("IP address:", ip);

  const { data, error } = await supabase
    .from("organization_user_sessions")
    .insert({
      user_id: user.id,
      organization_id: user.organization_id,
      role: user.role,
      session_token: token,
      expires_at: expiresAt.toISOString(),
      ip_address: ip,
      user_agent: userAgent ?? null
    })
    .select()
    .single();

  if (error) {
    console.error("ERROR: Failed to insert session:", error);
    throw new Error("Failed to create session: " + error.message);
  }

  if (!data) {
    console.error("ERROR: Session insert returned no data");
    throw new Error("Failed to create session: No data returned");
  }

  console.log("✓ Session created successfully:", data.id);

  return {
    token,
    expires_at: expiresAt.toISOString(),
    organization_id: user.organization_id,
    role: user.role
  };
}

interface RequireSessionOptions {
  adminOnly?: boolean;
}

async function requireSession(req: Request, supabase: SupabaseClient, options: RequireSessionOptions = {}) {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");

  console.log("=== Session Validation Debug ===");
  console.log("Auth header present:", !!authHeader);
  console.log("Auth header value:", authHeader?.substring(0, 20) + "...");

  if (!authHeader?.startsWith("Bearer ")) {
    console.log("ERROR: No Bearer token in header");
    return null;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    console.log("ERROR: Token is empty after extraction");
    return null;
  }

  console.log("Token extracted, length:", token.length);
  console.log("Current time:", new Date().toISOString());

  const { data, error } = await supabase
    .from("organization_user_sessions")
    .select(
      "id, user_id, role, organization_id, expires_at, revoked_at, user:organization_users(id, email, first_name, last_name, role, organization_id, department, last_login_at)"
    )
    .eq("session_token", token)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.log("ERROR: Database error fetching session:", error);
    return null;
  }

  if (!data) {
    console.log("ERROR: No session found for token");
    // Check if session exists but is expired or revoked
    const { data: anySession } = await supabase
      .from("organization_user_sessions")
      .select("id, expires_at, revoked_at")
      .eq("session_token", token)
      .maybeSingle();

    if (anySession) {
      console.log("Session exists but invalid:");
      console.log("- Expires at:", anySession.expires_at);
      console.log("- Revoked at:", anySession.revoked_at);
      console.log("- Is expired:", new Date(anySession.expires_at) <= new Date());
      console.log("- Is revoked:", !!anySession.revoked_at);
    } else {
      console.log("Session does not exist in database");
    }
    return null;
  }

  console.log("Session found:", {
    user_id: data.user_id,
    role: data.role,
    expires_at: data.expires_at
  });

  let userRecord = data.user;
  if (!userRecord) {
    console.log("User not populated, fetching separately...");
    const { data: fetchedUser } = await supabase
      .from("organization_users")
      .select("id, email, first_name, last_name, role, organization_id, department, last_login_at")
      .eq("id", data.user_id)
      .maybeSingle();
    if (!fetchedUser) {
      console.log("ERROR: User not found for user_id:", data.user_id);
      return null;
    }
    userRecord = fetchedUser as any;
    data.user = userRecord;
    console.log("User fetched:", userRecord.email);
  }


  console.log("Session validation successful!");

  await supabase
    .from("organization_user_sessions")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", data.id);

  return data;
}

function sanitizeUser(user: any) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

function generateOtpCode() {
  return ("" + Math.floor(100000 + Math.random() * 900000));
}

function generateRandomPassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@$!%*?&";
  let password = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    password += chars[idx];
  }
  return password;
}

async function purgeExpiredOtps(supabase: SupabaseClient, userId: string) {
  await supabase
    .from("organization_user_otps")
    .delete()
    .eq("user_id", userId)
    .lte("expires_at", new Date().toISOString());
}

function hashPassword(value: string) {
  return bcrypt.hashSync(value, 10);
}

function comparePassword(value: string, hashed: string) {
  return bcrypt.compareSync(value, hashed);
}

async function sendOtpEmail(user: any, otpCode: string) {
  const recipient = recipientFromUser(user);

  // Try template email first if template key is configured
  if (OTP_TEMPLATE_KEY) {
    try {
      await sendTemplateEmail({
        to: recipient,
        templateKey: OTP_TEMPLATE_KEY,
        parameters: {
          name: recipient.name ?? user.email,
          OTP: otpCode,
          product_name: PRODUCT_NAME
        },
        subject: "Your verification code"
      });
      console.log("OTP email sent successfully via template");
      return;
    } catch (templateError) {
      console.error("Template email failed, falling back to HTML email:", templateError);
      // Fall through to HTML email
    }
  }

  // Fallback to HTML email
  const html = `
    <p>Hello ${recipient.name ?? user.email},</p>
    <p>Your <strong>${PRODUCT_NAME}</strong> verification code is <strong>${otpCode}</strong>. It expires in 10 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
  `;

  await sendHtmlEmail({
    to: recipient,
    subject: "Your verification code",
    html
  });
  console.log("OTP email sent successfully via HTML");
}

async function sendPasswordResetEmail(user: any, resetLink: string, expiresAt?: string) {
  const recipient = recipientFromUser(user);

  // Try template email first if template key is configured
  if (RESET_TEMPLATE_KEY) {
    try {
      await sendTemplateEmail({
        to: recipient,
        templateKey: RESET_TEMPLATE_KEY,
        parameters: {
          "product name": PRODUCT_NAME,
          password_reset_link: resetLink,
          data_time: expiresAt ? new Date(expiresAt).toUTCString() : new Date().toUTCString()
        },
        subject: "Reset your password"
      });
      console.log("Password reset email sent successfully via template");
      return;
    } catch (templateError) {
      console.error("Template email failed, falling back to HTML email:", templateError);
      // Fall through to HTML email
    }
  }

  // Fallback to HTML email
  const html = `
    <p>Hello ${recipient.name ?? user.email},</p>
    <p>${PRODUCT_NAME} received a request to reset your password. Click the button below to continue.</p>
    <p><a href="${resetLink}" style="display:inline-block;padding:12px 16px;background:#111827;color:#fff;border-radius:6px;text-decoration:none">Reset Password</a></p>
    <p>This link will expire ${expiresAt ? `on ${new Date(expiresAt).toUTCString()}` : "soon"}. If you did not request a reset, ignore this email.</p>
  `;

  await sendHtmlEmail({
    to: recipient,
    subject: "Reset your password",
    html
  });
  console.log("Password reset email sent successfully via HTML");
}

function recipientFromUser(user: any) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return {
    email: user.email,
    name: name || undefined
  };
}

function generateResetToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashToken(token: string) {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function buildResetLink(baseUrl: string, params: Record<string, string>) {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch (_error) {
    throw new Error("Invalid redirect URL provided");
  }

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

function getRequestIp(req: Request) {
  const header = req.headers.get("x-forwarded-for") ?? req.headers.get("X-Forwarded-For");
  if (!header) return undefined;
  return header.split(",")[0]?.trim();
}

async function purgeExpiredPasswordResets(supabase: SupabaseClient, userId: string) {
  await supabase
    .from("organization_user_password_resets")
    .delete()
    .eq("user_id", userId)
    .or(`consumed_at.is.not.null,expires_at.lte.${new Date().toISOString()}`);
}
