import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import * as XLSX from "https://esm.sh/xlsx@0.18.5?no-check";
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

    return jsonResponse({
      error: "Route not found",
      available_routes: [
        "POST /admin-onboard",
        "POST /login",
        "POST /request-otp",
        "POST /verify-otp",
        "POST /staff",
        "POST /staff/bulk-upload"
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
  const session = await requireAdminSession(req, supabase);
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
  const session = await requireAdminSession(req, supabase);
  if (!session?.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return jsonResponse({ error: "Bulk upload requires multipart/form-data with a file field" }, 400);
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonResponse({ error: "File field is required" }, 400);
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) {
    return jsonResponse({ error: "No sheet found in workbook" }, 400);
  }

  const worksheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

  const results: Array<Record<string, unknown>> = [];

  for (const row of rows) {
    const normalized = normalizeRow(row);
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
    total_rows: rows.length,
    results
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
  const ip = req.headers.get("x-forwarded-for") ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  await supabase
    .from("organization_user_sessions")
    .insert({
      user_id: user.id,
      organization_id: user.organization_id,
      role: user.role,
      session_token: token,
      expires_at: expiresAt.toISOString(),
      ip_address: ip ?? null,
      user_agent: userAgent ?? null
    });

  return {
    token,
    expires_at: expiresAt.toISOString(),
    organization_id: user.organization_id,
    role: user.role
  };
}

async function requireAdminSession(req: Request, supabase: SupabaseClient) {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return null;
  }

  const { data, error } = await supabase
    .from("organization_user_sessions")
    .select("id, user_id, role, organization_id, expires_at, revoked_at, user:organization_users(id, email, first_name, last_name, role, organization_id)")
    .eq("session_token", token)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data || data.role !== "admin" || !data.user || data.user.role !== "admin") {
    return null;
  }

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
  if (OTP_TEMPLATE_KEY) {
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
    return;
  }

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
}

async function sendPasswordResetEmail(user: any, resetLink: string, expiresAt?: string) {
  const recipient = recipientFromUser(user);
  if (RESET_TEMPLATE_KEY) {
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
    return;
  }

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
