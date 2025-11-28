import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16"
});
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
serve(async (req)=>{
  if (req.method === "POST") {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    let event;
    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed:`, err.message);
      return new Response(JSON.stringify({
        error: err.message
      }), {
        status: 400
      });
    }
    // Create Supabase client
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    // Handle the event
    switch(event.type){
      case 'checkout.session.completed':
        const session = event.data.object;
        if (session.mode === 'subscription') {
          await handleSubscriptionCheckout(session, supabaseClient);
        } else if (session.mode === 'payment') {
          await handleConsultationPurchase(session, supabaseClient);
        }
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object, supabaseClient);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabaseClient);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object, supabaseClient);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object, supabaseClient);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    return new Response(JSON.stringify({
      received: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } else {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
// Handler for subscription checkout completion
async function handleSubscriptionCheckout(session, supabaseClient) {
  try {
    console.log('Processing subscription checkout:', session.id);
    const userId = session.metadata?.user_id;
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    if (!userId) {
      console.error('No user ID found in session metadata');
      return;
    }
    // Get subscription metadata
    const tier = subscription.metadata?.tier || 'free';
    const isAnnual = subscription.metadata?.is_annual === 'true';
    const consultationsIncluded = parseInt(subscription.metadata?.consultations_included || '10', 10);
    // Update user subscription
    const { error } = await supabaseClient.from('user_subscriptions').update({
      subscription_tier: tier,
      is_annual_billing: isAnnual,
      stripe_subscription_id: subscription.id,
      consultations_total: consultationsIncluded,
      consultations_used: 0,
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      status: 'active',
      updated_at: new Date().toISOString()
    }).eq('user_id', userId);
    if (error) {
      console.error('Error updating user subscription:', error);
    }
  } catch (error) {
    console.error('Error handling subscription checkout:', error);
  }
}
// Handler for one-time consultation purchase
async function handleConsultationPurchase(session, supabaseClient) {
  try {
    console.log('Processing consultation purchase:', session.id);
    const userId = session.metadata?.user_id;
    const quantity = parseInt(session.metadata?.quantity || '0', 10);
    const packageId = session.metadata?.package_id;
    if (!userId || quantity <= 0) {
      console.error('Invalid user ID or quantity in session metadata');
      return;
    }
    // Record the purchase
    const { error: purchaseError } = await supabaseClient.from('consultation_purchases').insert({
      user_id: userId,
      package_id: packageId || null,
      quantity: quantity,
      amount_paid: session.amount_total || 0,
      stripe_payment_id: session.id
    });
    if (purchaseError) {
      console.error('Error recording consultation purchase:', purchaseError);
    }
    // Update user subscription with new consultations
    const { data: subscription, error: fetchError } = await supabaseClient.from('user_subscriptions').select('consultations_total').eq('user_id', userId).single();
    if (fetchError) {
      console.error('Error fetching user subscription:', fetchError);
      return;
    }
    const newTotal = (subscription?.consultations_total || 0) + quantity;
    const { error: updateError } = await supabaseClient.from('user_subscriptions').update({
      consultations_total: newTotal,
      updated_at: new Date().toISOString()
    }).eq('user_id', userId);
    if (updateError) {
      console.error('Error updating user consultations:', updateError);
    }
  } catch (error) {
    console.error('Error handling consultation purchase:', error);
  }
}
// Handler for subscription cancellation
async function handleSubscriptionCancelled(subscription, supabaseClient) {
  try {
    console.log('Processing subscription cancellation:', subscription.id);
    // Find the user with this subscription
    const { data, error } = await supabaseClient.from('user_subscriptions').select('user_id').eq('stripe_subscription_id', subscription.id).single();
    if (error) {
      console.error('Error finding user for subscription:', error);
      return;
    }
    // Update subscription status
    const { error: updateError } = await supabaseClient.from('user_subscriptions').update({
      status: 'canceled',
      subscription_tier: 'free',
      updated_at: new Date().toISOString()
    }).eq('stripe_subscription_id', subscription.id);
    if (updateError) {
      console.error('Error updating subscription status:', updateError);
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}
// Handler for subscription updates
async function handleSubscriptionUpdated(subscription, supabaseClient) {
  try {
    console.log('Processing subscription update:', subscription.id);
    // Update next billing date
    const { error } = await supabaseClient.from('user_subscriptions').update({
      status: subscription.status,
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }).eq('stripe_subscription_id', subscription.id);
    if (error) {
      console.error('Error updating subscription:', error);
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}
// Handler for failed invoice payments
async function handleInvoicePaymentFailed(invoice, supabaseClient) {
  try {
    console.log('Processing failed payment:', invoice.id);
    if (!invoice.subscription) return;
    // Update subscription status
    const { error } = await supabaseClient.from('user_subscriptions').update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    }).eq('stripe_subscription_id', invoice.subscription);
    if (error) {
      console.error('Error updating subscription after payment failure:', error);
    }
  } catch (error) {
    console.error('Error handling invoice payment failure:', error);
  }
}
// Handler for successful invoice payments
async function handleInvoicePaymentSucceeded(invoice, supabaseClient) {
  try {
    console.log('Processing successful payment:', invoice.id);
    if (!invoice.subscription) return;
    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    // Update user subscription
    const { error } = await supabaseClient.from('user_subscriptions').update({
      status: 'active',
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }).eq('stripe_subscription_id', invoice.subscription);
    if (error) {
      console.error('Error updating subscription after payment:', error);
    }
  } catch (error) {
    console.error('Error handling invoice payment:', error);
  }
}
