import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { AssemblyAI } from "https://esm.sh/assemblyai@4.0.0";
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

    let expiresIn = 60;
    try {
      const body = await req.json();
      if (body?.expires_in && Number.isFinite(body.expires_in)) {
        const requested = Number(body.expires_in);
        expiresIn = Math.max(30, Math.min(1800, Math.floor(requested)));
      }
    } catch {
      // Ignore JSON parse errors – default expiry will be used
    }

    const client = new AssemblyAI({ apiKey });
    const token = await client.realtime.createTemporaryToken({ expires_in: expiresIn });

    return new Response(
      JSON.stringify({
        success: true,
        token,
        expires_in: expiresIn,
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
