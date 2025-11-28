import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    // Create Supabase client
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: "Missing Authorization header"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({
        error: "Authentication failed",
        details: userError?.message
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const user = userData.user;
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16"
    });
    // Check if a Stripe customer exists for this user
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });
    if (customers.data.length === 0) {
      // No customer found, update user metadata to ensure subscription is 'free'
      await supabaseClient.auth.updateUser({
        data: {
          subscription_tier: 'free',
          annual_billing: false
        }
      });
      return new Response(JSON.stringify({
        tier: 'free',
        isAnnualBilling: false,
        status: 'no_subscription'
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const customerId = customers.data[0].id;
    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });
    if (subscriptions.data.length === 0) {
      // No active subscription, update user metadata to 'free'
      await supabaseClient.auth.updateUser({
        data: {
          subscription_tier: 'free',
          annual_billing: false
        }
      });
      return new Response(JSON.stringify({
        tier: 'free',
        isAnnualBilling: false,
        status: 'no_active_subscription'
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // We have an active subscription
    const subscription = subscriptions.data[0];
    // Determine tier from metadata
    let tier = subscription.metadata.tier || 'free';
    // Determine if annual billing
    let isAnnual = subscription.items.data[0].plan.interval === 'year';
    // Calculate next billing date
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    // Update user metadata with subscription info
    await supabaseClient.auth.updateUser({
      data: {
        subscription_tier: tier,
        annual_billing: isAnnual,
        next_billing_date: currentPeriodEnd.toISOString()
      }
    });
    return new Response(JSON.stringify({
      tier,
      isAnnualBilling: isAnnual,
      status: 'active',
      currentPeriodEnd: currentPeriodEnd.toISOString()
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return new Response(JSON.stringify({
      error: error.message || "Failed to verify subscription"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
