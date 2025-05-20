
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionTier } from "@/services/subscriptionService";
import { addCredits } from "./paymentService";



/**
 * Create Stripe checkout for subscription plans
 */
export const createPlanCheckout = async (params: {
  tier: SubscriptionTier;
  isAnnual: boolean;
  successUrl?: string;
  cancelUrl?: string;
  regionCode?: string;
}): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Set default success/cancel URLs if not provided
    const successUrl = params.successUrl || `${window.location.origin}/payment-success`;
    const cancelUrl = params.cancelUrl || `${window.location.origin}/payment-canceled`;

    // Determine how many credits to give based on tier
    let creditsToAdd = 0;
    if (params.tier === 'starter') creditsToAdd = 30;
    else if (params.tier === 'professional') creditsToAdd = 100;
    else if (params.tier === 'enterprise') creditsToAdd = 200;

    // Call the edge function to create a checkout session
    const { data, error } = await supabase.functions.invoke('create-plan-checkout', {
      body: JSON.stringify({
        tier: params.tier,
        isAnnual: params.isAnnual,
        successUrl,
        cancelUrl,
        regionCode: params.regionCode || 'US', // Include region code for pricing adjustment
        metadata: {
          credits_to_add: creditsToAdd // Explicitly pass credits to add
        }
      })
    });

    if (error) throw new Error(error.message);

    return { success: true, url: data.url };
  } catch (error) {
    console.error("Error creating plan checkout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create checkout"
    };
  }
};


/**
 * Create a Paystack checkout session for plan subscription
 */
export const createPaystackCheckout = async (params: {
  tier: SubscriptionTier;
  isAnnual: boolean;
  successUrl?: string;
  cancelUrl?: string;
  regionCode?: string;
}): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Set default success/cancel URLs if not provided
    const successUrl = params.successUrl || `${window.location.origin}/payment-success`;
    const cancelUrl = params.cancelUrl || `${window.location.origin}/payment-canceled`;

    // Get plan details from the database
    const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('tier', params.tier)
        .single();

    if (planError) {
      console.error("Error fetching plan:", planError);
      return { success: false, error: "Could not find the selected plan" };
    }

    // Get regional pricing if available
    const { data: regionalPricing } = await supabase
        .from('regional_pricing')
        .select('*')
        .eq('country_code', params.regionCode || 'NG')
        .eq('plan_id', plan.id)
        .single();

    // Use regional pricing if available, otherwise use the default plan pricing
    let amount = params.isAnnual
        ? (regionalPricing?.price_annual || plan.price_annual)
        : (regionalPricing?.price_monthly || plan.price_monthly);

    amount = amount / 100;

    // Determine how many credits to give based on tier
    let creditsToAdd = 0;
    if (params.tier === 'starter') creditsToAdd = 30;
    else if (params.tier === 'professional') creditsToAdd = 100;
    else if (params.tier === 'enterprise') creditsToAdd = 200;

    // Call the edge function to create a Paystack checkout
    const { data, error } = await supabase.functions.invoke('create-paystack-checkout', {
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        amount,
        successUrl,
        cancelUrl,
        metadata: {
          user_id: user.id,
          product_type: 'subscription',
          tier: params.tier,
          billing_cycle: params.isAnnual ? 'annual' : 'monthly',
          plan_id: plan.id,
          credits_to_add: creditsToAdd // Explicitly pass credits to add
        }
      })
    });

    if (error) {
      console.error("Error creating Paystack checkout:", error);
      return { success: false, error: "Failed to create checkout session" };
    }

    if (!data?.url) {
      return { success: false, error: "No checkout URL returned" };
    }

    return { success: true, url: data.url };
  } catch (error) {
    console.error("Error creating Paystack checkout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create checkout"
    };
  }
};

/**
 * Create a Paystack checkout session for consultation top-up
 */
export const createConsultationCheckout = async (
    quantity: number,
    successUrl: string,
    cancelUrl: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get the package info based on quantity
    const { data: packages, error: packagesError } = await supabase
        .from('consultation_packages')
        .select(`
        id, 
        price,
        regional_consultation_pricing(*)
      `)
        .eq('quantity', quantity)
        .eq('is_active', true)
        .single();

    if (packagesError && packagesError.code !== 'PGRST116') {
      console.error("Error fetching package:", packagesError);
      return { success: false, error: "Could not find the requested package" };
    }

    // Get Nigeria-specific pricing if available
    let packagePrice = packages?.price || 0;
    if (packages?.regional_consultation_pricing &&
        packages?.regional_consultation_pricing.length > 0 &&
        packages?.regional_consultation_pricing[0].country_code === 'NG') {
      packagePrice = packages.regional_consultation_pricing[0].price;
    }

    packagePrice = packagePrice / 100;

    // Create a checkout session via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-paystack-checkout', {
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        quantity,
        packageId: packages?.id,
        amount: packagePrice,
        successUrl,
        cancelUrl,
        metadata: {
          user_id: user.id,
          product_type: 'consultation',
          package_id: packages?.id,
          quantity,
          credits_to_add: quantity // Explicitly pass credits to add
        }
      })
    });

    if (error) throw error;

    const checkoutUrl = data.authorization_url || data.url;

    if (!checkoutUrl) {
      console.error("Unexpected response format:", data);
      return { success: false, error: "No checkout URL found in response" };
    }

    return { success: true, url: checkoutUrl };
  } catch (error) {
    console.error("Error creating Paystack checkout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/**
 * Verify a completed Paystack purchase
 */
export const verifyTopupPurchase = async (reference: string): Promise<boolean> => {
  try {
    // Check if we've already verified this transaction
    const verificationKey = `paystack_verification_${reference}`;
    if (localStorage.getItem(verificationKey) === 'verified') {
      console.log(`Using cached verification for Paystack reference ${reference}`);
      return true;
    }

    // Add debounce protection
    const inProgressKey = `paystack_verification_progress_${reference}`;
    if (localStorage.getItem(inProgressKey) === 'true') {
      console.log(`Verification already in progress for reference ${reference}`);
      return false;
    }

    // Mark verification as in progress
    localStorage.setItem(inProgressKey, 'true');

    try {
      // Verify the reference via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('verify-paystack-checkout', {
        body: JSON.stringify({ reference })
      });

      if (error) throw error;

      // If verification successful, process the payment
      if (data?.success && data?.transaction) {
        const transaction = data.transaction;
        const metadata = transaction.metadata || {};
        const userId = metadata.user_id;
        const productType = metadata.product_type || 'consultation';

        // Get credits amount - either from explicit credits_to_add field or fallback to quantity
        const creditsToAdd = parseInt(metadata.credits_to_add || '0') ||
            parseInt(metadata.quantity || '0');

        const tier = metadata.tier;
        const billingCycle = metadata.billing_cycle;
        const planId = metadata.plan_id;

        if (userId && creditsToAdd > 0) {
          console.log(`Adding ${creditsToAdd} credits for user ${userId}`);

          // Add credits to the user
          try {
            // Calculate expiration date - 30 days from now
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            // Check if user has existing credits
            const { data: existingCredits, error: creditsError } = await supabase
                .from('user_credits')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (!creditsError && existingCredits) {
              // Update existing credits
              const newBalance = existingCredits.balance + creditsToAdd;
              const newTotalEarned = existingCredits.total_earned + creditsToAdd;

              await supabase
                  .from('user_credits')
                  .update({
                    balance: newBalance,
                    total_earned: newTotalEarned,
                    expires_at: expiresAt.toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', userId);
            } else {
              // Create new credits record
              await supabase
                  .from('user_credits')
                  .insert({
                    user_id: userId,
                    balance: creditsToAdd,
                    total_earned: creditsToAdd,
                    total_used: 0,
                    expires_at: expiresAt.toISOString()
                  });
            }

            // Record transaction for the credits
            await supabase.from('transaction_history').insert({
              user_id: userId,
              amount: creditsToAdd,
              currency: 'CREDITS',
              payment_provider: 'paystack',
              payment_provider_reference: transaction.reference,
              transaction_type: productType === 'subscription' ? 'subscription_credits' : 'credit',
              status: 'completed',
              metadata: {
                action: productType === 'subscription' ? 'subscription_credits' : 'add_credits',
                credits: creditsToAdd,
                expires_at: expiresAt.toISOString()
              }
            });
          } catch (err) {
            console.error("Error adding credits:", err);
          }
        }

        // If this is a subscription purchase, update the subscription tier
        if (productType === 'subscription' && tier) {
          try {
            // Calculate next billing date
            const nextBillingDate = new Date();
            if (billingCycle === 'annual') {
              nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
            } else {
              nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            }

            // Determine consulations total based on tier
            let consultationsTotal = 10; // Default for free tier
            if (tier === 'starter') consultationsTotal = 50;
            else if (tier === 'professional') consultationsTotal = 200;
            else if (tier === 'enterprise') consultationsTotal = 500;

            // Check if user already has a subscription
            const { data: existingSub, error: subError } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (!subError && existingSub) {
              // Update existing subscription
              await supabase
                  .from('user_subscriptions')
                  .update({
                    subscription_tier: tier,
                    is_annual_billing: billingCycle === 'annual',
                    next_billing_date: nextBillingDate.toISOString(),
                    payment_provider: 'paystack',
                    payment_provider_subscription_id: transaction.reference,
                    consultations_total: consultationsTotal,
                    plan_id: planId || null,
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', userId);

              console.log(`Updated subscription to ${tier} tier (${billingCycle})`);
            } else {
              // Create new subscription record
              await supabase
                  .from('user_subscriptions')
                  .insert({
                    user_id: userId,
                    subscription_tier: tier,
                    is_annual_billing: billingCycle === 'annual',
                    next_billing_date: nextBillingDate.toISOString(),
                    consultations_total: consultationsTotal,
                    consultations_used: 0,
                    payment_provider: 'paystack',
                    payment_provider_subscription_id: transaction.reference,
                    plan_id: planId || null
                  });

              console.log(`Created new ${tier} subscription (${billingCycle})`);
            }
          } catch (subscriptionError) {
            console.error("Error updating subscription:", subscriptionError);
          }
        }
        // For consultation purchases, upgrade to at least starter tier if needed
        else if (productType === 'consultation') {
          try {
            // Get current subscription info
            const { data: subData, error: subError } = await supabase
                .from('user_subscriptions')
                .select('subscription_tier')
                .eq('user_id', userId)
                .single();

            if (!subError && subData && subData.subscription_tier === 'free') {
              // Update to starter tier if user has purchased credits
              await supabase
                  .from('user_subscriptions')
                  .update({
                    subscription_tier: 'starter',
                    consultations_total: 50, // Starter tier default
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', userId);

              console.log('Updated user subscription from free to starter');
            } else if (subError && subError.code === 'PGRST116') {
              // Create new subscription record if none exists
              await supabase
                  .from('user_subscriptions')
                  .insert({
                    user_id: userId,
                    subscription_tier: 'starter',
                    is_annual_billing: false,
                    consultations_total: 50, // Starter tier default
                    consultations_used: 0,
                    payment_provider: 'paystack',
                    payment_provider_subscription_id: transaction.reference
                  });

              console.log('Created new starter subscription for user');
            }
          } catch (subscriptionError) {
            console.error("Error updating subscription tier:", subscriptionError);
          }
        }

        // Mark as verified in local storage
        localStorage.setItem(verificationKey, 'verified');
      }

      const result = data?.success === true;

      // If successful, cache the result
      if (result) {
        localStorage.setItem(verificationKey, 'verified');
      }

      return result;
    } finally {
      // Clear in-progress flag
      localStorage.removeItem(inProgressKey);
    }
  } catch (error) {
    console.error("Error verifying Paystack purchase:", error);
    return false;
  }
};

