// Unified webhook handler for both Stripe and Paystack
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
// Initialize services
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16"
});
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
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
    const rawBody = await req.text();
    // Determine webhook provider based on headers
    const stripeSignature = req.headers.get("stripe-signature");
    const paystackSignature = req.headers.get("x-paystack-signature");
    if (stripeSignature) {
      return await handleStripeWebhook(rawBody, stripeSignature);
    } else if (paystackSignature) {
      return await handlePaystackWebhook(rawBody, paystackSignature);
    } else {
      return new Response(JSON.stringify({
        error: "Unknown webhook provider"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
async function handleStripeWebhook(rawBody, signature) {
  const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    switch(event.type){
      case 'checkout.session.completed':
        await handleStripeCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleStripeSubscriptionCancelled(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleStripeSubscriptionUpdated(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleStripeInvoicePaymentFailed(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleStripeInvoicePaymentSucceeded(event.data.object);
        break;
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
    return new Response(JSON.stringify({
      received: true
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
}
async function handlePaystackWebhook(rawBody, signature) {
  const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY not configured");
  }
  // Verify signature
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
    throw new Error("Invalid signature");
  }
  const payload = JSON.parse(rawBody);
  if (payload.event === "charge.success") {
    await handlePaystackChargeSuccess(payload.data);
  }
  return new Response(JSON.stringify({
    success: true
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
// Stripe event handlers
async function handleStripeCheckoutCompleted(session) {
  const userId = session.metadata?.user_id;
  if (!userId) return;
  if (session.mode === 'subscription') {
    await processSubscriptionPurchase(userId, session);
  } else if (session.mode === 'payment') {
    await processConsultationPurchase(userId, session);
  }
}
async function handleStripeSubscriptionCancelled(subscription) {
  const { error } = await supabase.from('user_subscriptions').update({
    subscription_tier: 'free',
    status: 'canceled',
    updated_at: new Date().toISOString()
  }).eq('payment_provider_subscription_id', subscription.id);
  if (error) {
    console.error("Error handling subscription cancellation:", error);
  }
}
async function handleStripeSubscriptionUpdated(subscription) {
  const { error } = await supabase.from('user_subscriptions').update({
    next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
    status: subscription.status,
    updated_at: new Date().toISOString()
  }).eq('payment_provider_subscription_id', subscription.id);
  if (error) {
    console.error("Error updating subscription:", error);
  }
}
async function handleStripeInvoicePaymentFailed(invoice) {
  if (!invoice.subscription) return;
  const { error } = await supabase.from('user_subscriptions').update({
    status: 'past_due',
    updated_at: new Date().toISOString()
  }).eq('payment_provider_subscription_id', invoice.subscription);
  if (error) {
    console.error("Error handling payment failure:", error);
  }
}
async function handleStripeInvoicePaymentSucceeded(invoice) {
  if (!invoice.subscription) return;
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const { error } = await supabase.from('user_subscriptions').update({
    status: 'active',
    next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }).eq('payment_provider_subscription_id', invoice.subscription);
  if (error) {
    console.error("Error updating subscription after payment:", error);
  }
}
// Paystack event handlers
async function handlePaystackChargeSuccess(data) {
  const metadata = data.metadata || {};
  const userId = metadata.user_id;
  const productType = metadata.product_type;
  if (!userId) return;
  if (productType === 'subscription') {
    await processSubscriptionPurchase(userId, {
      metadata
    });
  } else if (productType === 'consultation') {
    await processConsultationPurchase(userId, {
      metadata
    });
  }
}
// Shared processing functions
async function processSubscriptionPurchase(userId, sessionData) {
  const metadata = sessionData.metadata || {};
  const tier = metadata.tier || 'free';
  const isAnnual = metadata.is_annual === 'true' || metadata.billing_cycle === 'annual';
  const planId = metadata.plan_id;
  // Calculate next billing date
  const nextBillingDate = new Date();
  if (isAnnual) {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  } else {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  }
  // Update or create subscription
  const { error } = await supabase.from('user_subscriptions').upsert({
    user_id: userId,
    subscription_tier: tier,
    is_annual_billing: isAnnual,
    next_billing_date: nextBillingDate.toISOString(),
    plan_id: planId,
    consultations_total: getConsultationsByTier(tier),
    consultations_used: 0,
    status: 'active',
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'user_id'
  });
  if (error) {
    console.error("Error processing subscription purchase:", error);
  }
  // Add subscription credits if specified
  const creditsToAdd = parseInt(metadata.credits_to_add || '0');
  if (creditsToAdd > 0) {
    await supabase.rpc('add_user_credits', {
      p_user_id: userId,
      p_amount: creditsToAdd,
      p_source: 'subscription'
    });
  }
}
async function processConsultationPurchase(userId, sessionData) {
  const metadata = sessionData.metadata || {};
  const quantity = parseInt(metadata.quantity || '0');
  const packageId = metadata.package_id;
  const creditsToAdd = parseInt(metadata.credits_to_add || quantity.toString());
  if (creditsToAdd > 0) {
    // Add credits using the atomic function
    await supabase.rpc('add_user_credits', {
      p_user_id: userId,
      p_amount: creditsToAdd,
      p_source: 'consultation_purchase'
    });
  }
  // Record the purchase if packageId is provided
  if (packageId) {
    await supabase.from('consultation_purchases').insert({
      user_id: userId,
      package_id: packageId,
      quantity: quantity,
      amount_paid: sessionData.amount_total || 0,
      payment_provider: sessionData.mode ? 'stripe' : 'paystack',
      payment_provider_reference: sessionData.id || sessionData.reference
    });
  }
  // Upgrade user to starter tier if they're on free tier
  await upgradeUserTierIfNeeded(userId);
}
async function upgradeUserTierIfNeeded(userId) {
  const { data: subscription } = await supabase.from('user_subscriptions').select('subscription_tier').eq('user_id', userId).single();
  if (!subscription || subscription.subscription_tier === 'free') {
    await supabase.from('user_subscriptions').upsert({
      user_id: userId,
      subscription_tier: 'starter',
      is_annual_billing: false,
      consultations_total: 50,
      consultations_used: 0,
      status: 'active',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
  }
}
function getConsultationsByTier(tier) {
  const tierMap = {
    'free': 10,
    'starter': 50,
    'professional': 200,
    'enterprise': 500
  };
  return tierMap[tier] || 10;
}
