// Enhanced Paystack webhook with comprehensive credit management
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  // Only allow POST requests for the webhook
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  try {
    // Get the raw request body as text for signature validation
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    console.log("Enhanced Paystack webhook received:", {
      event: payload.event,
      reference: payload.data?.reference,
      amount: payload.data?.amount,
      metadata: payload.data?.metadata
    });
    // Verify signature
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      console.error("Missing Paystack signature header");
      return new Response(JSON.stringify({
        error: "Missing signature"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY environment variable not set");
      return new Response(JSON.stringify({
        error: "Server configuration error"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Create HMAC SHA512 hash
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(secretKey), {
      name: "HMAC",
      hash: "SHA-512"
    }, false, [
      "sign"
    ]);
    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const hash = Array.from(new Uint8Array(signatureBytes)).map((b)=>b.toString(16).padStart(2, "0")).join("");
    if (hash !== signature) {
      console.error("Invalid signature");
      return new Response(JSON.stringify({
        error: "Invalid signature"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Process webhook using the comprehensive handler
    if (payload.event === "charge.success") {
      const metadata = payload.data.metadata || {};
      const userId = metadata.user_id;
      if (!userId) {
        console.error("No user ID found in metadata");
        return new Response(JSON.stringify({
          error: "No user ID found in metadata",
          metadata: metadata
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      // Use the comprehensive webhook handler
      const { data: result, error: webhookError } = await supabase.rpc('process_paystack_webhook', {
        p_event_type: payload.event,
        p_transaction_reference: payload.data.reference,
        p_user_id: userId,
        p_amount: payload.data.amount,
        p_currency: payload.data.currency || 'NGN',
        p_metadata: metadata
      });
      if (webhookError) {
        console.error("Error processing webhook:", webhookError);
        // Fallback to manual processing if the procedure fails
        await fallbackProcessing(payload, supabase);
        return new Response(JSON.stringify({
          success: true,
          fallback: true,
          error: webhookError.message
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      console.log("Webhook processed successfully:", result);
      return new Response(JSON.stringify({
        success: true,
        result: result
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Handle other event types
    console.log(`Unhandled event type: ${payload.event}`);
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Critical webhook error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
// Fallback processing if the main procedure fails
async function fallbackProcessing(payload, supabase) {
  try {
    const metadata = payload.data.metadata || {};
    const productType = metadata.product_type || "";
    const userId = metadata.user_id;
    const amount = payload.data.amount / 100; // Convert from kobo to naira
    console.log("Running fallback processing...");
    // Update transaction status first
    const { error: transactionError } = await supabase.from("transaction_history").update({
      status: "completed",
      updated_at: new Date().toISOString()
    }).eq("payment_provider_reference", payload.data.reference).eq("payment_provider", "paystack");
    if (transactionError) {
      console.error("Error updating transaction status:", transactionError);
    }
    if (productType === "consultation") {
      const quantity = metadata.quantity ? parseInt(metadata.quantity) : 1;
      const packageId = metadata.package_id;
      // Use record_consultation_purchase if available
      if (packageId) {
        const { error: purchaseError } = await supabase.rpc('record_consultation_purchase', {
          p_user_id: userId,
          p_package_id: packageId,
          p_quantity: quantity,
          p_amount_paid: amount * 100,
          p_payment_provider: 'paystack',
          p_payment_provider_reference: payload.data.reference
        });
        if (purchaseError) {
          console.error("Error in record_consultation_purchase:", purchaseError);
          // Manual credit addition as last resort
          await supabase.rpc('add_user_credits', {
            p_user_id: userId,
            p_amount: quantity,
            p_source: 'consultation_purchase',
            p_expiry_months: 0 // Consultation credits don't expire
          });
        }
      } else {
        // Direct credit addition if no package ID
        await supabase.rpc('add_user_credits', {
          p_user_id: userId,
          p_amount: quantity,
          p_source: 'consultation_purchase',
          p_expiry_months: 0
        });
      }
    } else if (productType === "subscription") {
      const tier = metadata.tier || "starter";
      const billingCycle = metadata.billing_cycle || "monthly";
      // Calculate subscription credits
      let subscriptionCredits = 0;
      if (tier === 'starter') subscriptionCredits = 30;
      else if (tier === 'professional') subscriptionCredits = 80;
      else if (tier === 'enterprise') subscriptionCredits = 0; // Custom
      // Add subscription credits
      if (subscriptionCredits > 0) {
        await supabase.rpc('record_subscription_credits', {
          p_user_id: userId,
          p_subscription_tier: tier,
          p_credit_amount: subscriptionCredits,
          p_expiry_months: billingCycle === 'annual' ? 12 : 1,
          p_billing_cycle: billingCycle
        });
      }
      // Update subscription
      await supabase.rpc('update_user_subscription', {
        p_user_id: userId,
        p_tier: tier,
        p_is_annual: billingCycle === "annual",
        p_payment_provider: "paystack",
        p_provider_subscription_id: payload.data.reference
      });
    }
    console.log("Fallback processing completed successfully");
  } catch (fallbackError) {
    console.error("Fallback processing also failed:", fallbackError);
  }
}
