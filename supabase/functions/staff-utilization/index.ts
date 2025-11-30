import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type SupabaseClient = ReturnType<typeof createClient>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const baseIndex = pathSegments.indexOf("staff-utilization");
  const routeSegments = baseIndex >= 0 ? pathSegments.slice(baseIndex + 1) : [];
  const primaryRoute = routeSegments[0] ?? "";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    if (req.method === "GET" && primaryRoute === "organization") {
      return await handleOrganizationStaffUtilization(req, supabase);
    }

    if (req.method === "GET" && primaryRoute === "user") {
      return await handleUserUtilization(req, supabase);
    }

    if (req.method === "GET" && primaryRoute === "activity") {
      return await handleActivityLog(req, supabase);
    }

    return jsonResponse({
      error: "Route not found",
      available_routes: [
        "GET /organization - Get organization-wide staff utilization",
        "GET /user - Get individual user utilization",
        "GET /activity - Get user activity log"
      ]
    }, 404);
  } catch (error) {
    console.error("staff-utilization error", error);
    return jsonResponse({
      error: "Internal server error",
      details: error?.message ?? String(error)
    }, 500);
  }
});

async function handleOrganizationStaffUtilization(req: Request, supabase: SupabaseClient) {
  const session = await requireSession(req, supabase, { adminOnly: true });
  if (!session?.user) {
    return jsonResponse({ error: "Unauthorized - Admin access required" }, 401);
  }

  const url = new URL(req.url);
  const startDate = url.searchParams.get("start_date");
  const endDate = url.searchParams.get("end_date");

  console.log("=== Organization Staff Utilization ===");
  console.log("Organization ID:", session.user.organization_id);
  console.log("Date Range:", startDate, "to", endDate);

  // Get all organization users
  const { data: orgUsers, error: usersError } = await supabase
    .from("organization_users")
    .select("id, email, first_name, last_name, role, department")
    .eq("organization_id", session.user.organization_id)
    .eq("is_active", true)
    .order("first_name", { ascending: true });

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return jsonResponse({ error: "Failed to load organization users" }, 500);
  }

  console.log("Found users:", orgUsers?.length || 0);

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
    console.error("Error fetching utilization:", utilizationError);
    return jsonResponse({ error: "Failed to load utilization data" }, 500);
  }

  console.log("Found utilization records:", utilizationData?.length || 0);

  // Aggregate data by user
  const userUtilizationMap = new Map();

  // Initialize all users with zero values
  (orgUsers || []).forEach((user: any) => {
    const userName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.email;
    userUtilizationMap.set(user.id, {
      user_id: user.id,
      user_email: user.email,
      user_name: userName,
      user_role: user.role,
      user_department: user.department,
      total_credits_used: 0,
      total_documents_generated: 0,
      total_transcriptions_completed: 0,
      last_activity_date: null
    });
  });

  // Aggregate utilization data
  (utilizationData || []).forEach((record: any) => {
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
    .sort((a: any, b: any) => b.total_credits_used - a.total_credits_used);

  // Calculate organization-wide totals
  const totals = staffUtilization.reduce(
    (acc: any, staff: any) => ({
      total_credits: acc.total_credits + staff.total_credits_used,
      total_documents: acc.total_documents + staff.total_documents_generated,
      total_transcriptions: acc.total_transcriptions + staff.total_transcriptions_completed,
      active_staff: acc.active_staff + (staff.last_activity_date ? 1 : 0)
    }),
    { total_credits: 0, total_documents: 0, total_transcriptions: 0, active_staff: 0 }
  );

  console.log("Totals:", totals);
  console.log("Staff with activity:", staffUtilization.filter((s: any) => s.total_credits_used > 0).length);

  return jsonResponse({
    staff_utilization: staffUtilization,
    totals,
    total_staff: staffUtilization.length,
    date_range: {
      start_date: startDate,
      end_date: endDate
    }
  });
}

async function handleUserUtilization(req: Request, supabase: SupabaseClient) {
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
    (acc: any, record: any) => ({
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

async function handleActivityLog(req: Request, supabase: SupabaseClient) {
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
    .select("id, activity_type, credits_used, document_format, processing_time_ms, created_at")
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

  // Convert processing time from ms to seconds
  const formattedActivities = (data || []).map((activity: any) => ({
    id: activity.id,
    activity_type: activity.activity_type,
    credits_used: activity.credits_used,
    document_format: activity.document_format,
    processing_time_seconds: activity.processing_time_ms ? (activity.processing_time_ms / 1000).toFixed(2) : null,
    created_at: activity.created_at
  }));

  return jsonResponse({
    activities: formattedActivities,
    count: formattedActivities.length
  });
}

interface RequireSessionOptions {
  adminOnly?: boolean;
}

async function requireSession(req: Request, supabase: SupabaseClient, options: RequireSessionOptions = {}) {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    console.log("ERROR: No Bearer token in header");
    return null;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    console.log("ERROR: Token is empty after extraction");
    return null;
  }

  const { data, error } = await supabase
    .from("organization_user_sessions")
    .select(
      "id, user_id, role, organization_id, expires_at, revoked_at, user:organization_users(id, email, first_name, last_name, role, organization_id, department, last_login_at)"
    )
    .eq("session_token", token)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) {
    console.log("ERROR: Session validation failed");
    return null;
  }

  let userRecord = data.user;
  if (!userRecord) {
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
  }

  // Check admin requirement
  if (options.adminOnly && userRecord.role !== "admin") {
    console.log("ERROR: Admin access required but user role is:", userRecord.role);
    return null;
  }

  await supabase
    .from("organization_user_sessions")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", data.id);

  return data;
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
