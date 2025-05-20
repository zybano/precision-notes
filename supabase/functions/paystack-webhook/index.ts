
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests for the webhook
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  try {
    // Get the raw request body as text for signature validation
    const rawBody = await req.text();
    // Parse the JSON after getting the raw text
    const payload = JSON.parse(rawBody);
    console.log("Received Paystack webhook:", payload.event);

    // Get the Paystack signature from headers
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      console.error("Missing Paystack signature header");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Verify the signature
    const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY environment variable not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Create HMAC SHA512 hash
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", 
      encoder.encode(secretKey),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );
    const signature_bytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody)
    );

    // Convert to hex
    const hash = Array.from(new Uint8Array(signature_bytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Compare signatures
    if (hash !== signature) {
      console.error("Invalid signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Now we know this is a valid Paystack webhook
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process based on event type
    if (payload.event === "charge.success") {
      const metadata = payload.data.metadata || {};
      const productType = metadata.product_type || "";
      const userId = metadata.user_id;
      
      if (!userId) {
        throw new Error("No user ID found in metadata");
      }

      // Add transaction record
      await supabase.from("transaction_history").insert({
        user_id: userId,
        amount: payload.data.amount / 100, // Convert from kobo to naira
        currency: payload.data.currency || "NGN",
        payment_provider: "paystack",
        payment_provider_reference: payload.data.reference,
        transaction_type: productType === "consultation" ? "topup" : "subscription",
        status: "completed",
        metadata: metadata
      });

      // Process based on product type
      if (productType === "consultation") {
        // Handle consultation purchase (credit top-up)
        const quantity = metadata.quantity ? parseInt(metadata.quantity) : 1;
        
        // Get current user credits
        const { data: userData, error: userError } = await supabase
          .from("user_credits")
          .select("balance, total_earned")
          .eq("user_id", userId)
          .single();

        // Calculate new balance and total earned
        const currentBalance = userData?.balance || 0;
        const totalEarned = userData?.total_earned || 0;
        const newBalance = currentBalance + quantity;
        const newTotalEarned = totalEarned + quantity;
        
        // Set expiration date (credits expire in 1 year)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        if (userData) {
          // Update existing record
          await supabase
            .from("user_credits")
            .update({
              balance: newBalance,
              total_earned: newTotalEarned,
              expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);
        } else {
          // Create new record
          await supabase
            .from("user_credits")
            .insert({
              user_id: userId,
              balance: quantity,
              total_earned: quantity,
              total_used: 0,
              expires_at: expiresAt.toISOString()
            });
        }

        // Record consultation purchase
        if (metadata.package_id) {
          await supabase
            .from("consultation_purchases")
            .insert({
              user_id: userId,
              package_id: metadata.package_id,
              quantity,
              amount_paid: payload.data.amount / 100,
              payment_provider: "paystack",
              payment_provider_reference: payload.data.reference
            });
        }

      } else if (productType === "subscription") {
        // Handle subscription purchase
        const tier = metadata.tier || "free";
        const billingCycle = metadata.billing_cycle || "monthly";
        
        // Calculate next billing date
        const nextBillingDate = new Date();
        if (billingCycle === "annual") {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        } else {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }
        
        // Update or create subscription
        const { data: existingSub } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", userId)
          .single();
          
        if (existingSub) {
          // Update existing subscription
          await supabase
            .from("user_subscriptions")
            .update({
              subscription_tier: tier,
              is_annual_billing: billingCycle === "annual",
              next_billing_date: nextBillingDate.toISOString(),
              updated_at: new Date().toISOString(),
              payment_provider: "paystack",
              payment_provider_subscription_id: payload.data.reference
            })
            .eq("user_id", userId);
        } else {
          // Create new subscription
          const consultationsTotal = tier === "free" ? 10 : 
                                    tier === "starter" ? 50 : 
                                    tier === "professional" ? 200 : 500;
          
          await supabase
            .from("user_subscriptions")
            .insert({
              user_id: userId,
              subscription_tier: tier,
              is_annual_billing: billingCycle === "annual",
              next_billing_date: nextBillingDate.toISOString(),
              consultations_total: consultationsTotal,
              consultations_used: 0,
              payment_provider: "paystack",
              payment_provider_subscription_id: payload.data.reference
            });
        }
      }
    }

    // Always return a 200 response quickly to Paystack
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
