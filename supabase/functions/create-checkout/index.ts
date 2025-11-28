// Create Stripe Checkout Session for purchasing consultations
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.25.0";
import Stripe from "https://esm.sh/stripe@12.16.0";
// Constants
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
// Initialize Stripe and Supabase clients
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15"
});
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
// Handle CORS preflight requests
const handleCors = (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
};
// Main function handler
serve(async (req)=>{
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  try {
    // Parse request
    const { userId, email, quantity = 10, successUrl, cancelUrl, metadata } = await req.json();
    // Validate inputs
    if (!userId || !email || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required parameters"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Determine price based on quantity
    const unitPrice = quantity >= 50 ? 300 : 400; // $3 each for 50+ or $4 each for <50
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        "card"
      ],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${quantity} Consultation Credits`,
              description: `Purchase of ${quantity} consultations for PrecisionNote`
            },
            unit_amount: unitPrice
          },
          quantity: quantity
        }
      ],
      mode: "payment",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        quantity: quantity.toString(),
        ...metadata || {}
      }
    });
    // Return session URL
    return new Response(JSON.stringify({
      success: true,
      url: session.url
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Failed to create checkout session"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
