
// Verify checkout and update user consultation credits
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.25.0";
import Stripe from "https://esm.sh/stripe@12.16.0";

// Constants
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize Stripe and Supabase clients
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
};

// Main function handler
serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Parse request
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Session ID is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify payment status
    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment not completed",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user ID and quantity from session
    const userId = session.client_reference_id || session.metadata?.user_id;
    const quantity = parseInt(session.metadata?.quantity || "0");

    if (!userId || !quantity) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid session data",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get current user data
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate new consultation total
    const currentTotal = userData.user.user_metadata?.consultations_total || 0;
    const newTotal = currentTotal + quantity;

    // Update user metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...userData.user.user_metadata,
        consultations_total: newTotal,
      },
    });

    if (updateError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update user data",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: "Credits updated successfully",
        credits_added: quantity,
        total_credits: newTotal,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error verifying checkout:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to verify checkout session",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
