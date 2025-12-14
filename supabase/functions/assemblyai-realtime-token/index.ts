import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { AssemblyAI } from "https://esm.sh/assemblyai@4.22.0";
import { getUserIdFromSessionToken } from "../_shared/staffActivityTracker.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionToken = authHeader.replace("Bearer ", "").trim();
    const { userId, organizationId, error: sessionError } = await getUserIdFromSessionToken(
      supabase,
      sessionToken,
    );

    if (sessionError || !userId || !organizationId) {
      return new Response(JSON.stringify({ error: sessionError || "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ASSEMBLYAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AssemblyAI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let expiresInSeconds = 60;
    let maxSessionDurationSeconds: number | undefined;
    let body: Record<string, unknown> | undefined;

    try {
      body = await req.json();
    } catch {
      // Ignore JSON parse errors – defaults will be used
    }

    const requestedExpiry = Number(body?.expires_in_seconds);
    if (Number.isFinite(requestedExpiry)) {
      expiresInSeconds = Math.max(30, Math.min(600, Math.floor(requestedExpiry)));
    }

    const requestedMaxSession = Number(body?.max_session_duration_seconds);
    if (Number.isFinite(requestedMaxSession)) {
      maxSessionDurationSeconds = Math.max(60, Math.min(10800, Math.floor(requestedMaxSession)));
    }

    const client = new AssemblyAI({ apiKey });
    const token = await client.streaming.createTemporaryToken({
      expires_in_seconds: expiresInSeconds,
      ...(maxSessionDurationSeconds
        ? { max_session_duration_seconds: maxSessionDurationSeconds }
        : {}),
    });

    return new Response(
      JSON.stringify({
        success: true,
        token,
        expires_in_seconds: expiresInSeconds,
        max_session_duration_seconds: maxSessionDurationSeconds,
        organization_id: organizationId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Realtime token error:", error);
    return new Response(JSON.stringify({ error: "Failed to create realtime token" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
