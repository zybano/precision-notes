
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { tier, isAnnual, successUrl, cancelUrl } = await req.json();
    
    // Validate inputs
    if (!tier || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Authentication failed", details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.user;

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create a new customer if one doesn't exist
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      customerId = newCustomer.id;
    }

    // Set up subscription price IDs based on tier and billing cycle
    // These would be your actual Stripe price IDs in production
    const priceMap = {
      starter: {
        monthly: "price_starter_monthly", // Replace with actual price ID
        annual: "price_starter_annual"
      },
      professional: {
        monthly: "price_professional_monthly", // Replace with actual price ID
        annual: "price_professional_annual"
      }
    };

    const billingCycle = isAnnual ? "annual" : "monthly";
    const priceId = priceMap[tier][billingCycle];

    // For demo purposes, create prices if they don't exist
    // In production, you would use your pre-created price IDs
    let price;
    try {
      // Try to retrieve the price (this will fail in development because we're using dummy price IDs)
      price = await stripe.prices.retrieve(priceId);
    } catch (e) {
      // Create a temporary price for demonstration
      let amount;
      if (tier === 'starter') {
        amount = isAnnual ? 28500 : 2500;
      } else if (tier === 'professional') {
        amount = isAnnual ? 96900 : 8500;
      } else {
        throw new Error("Invalid tier");
      }

      const product = await stripe.products.create({
        name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan (${isAnnual ? 'Annual' : 'Monthly'})`,
        description: `Subscription for ${tier} tier with ${isAnnual ? 'annual' : 'monthly'} billing`,
      });

      price = await stripe.prices.create({
        product: product.id,
        unit_amount: amount,
        currency: "usd",
        recurring: {
          interval: isAnnual ? "year" : "month",
        },
      });
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          user_id: user.id,
          tier: tier,
          is_annual: isAnnual ? "true" : "false"
        }
      },
      metadata: {
        user_id: user.id,
        tier: tier
      }
    });

    // Return the session URL
    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create checkout session" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
