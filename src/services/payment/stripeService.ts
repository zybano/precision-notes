import { supabase } from "@/integrations/supabase/client";
import { SubscriptionTier } from "@/services/subscriptionService";

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
        regionCode: params.regionCode || 'US',
        metadata: {
          credits_to_add: creditsToAdd
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
 * Create Stripe consultation checkout
 */
export const createConsultationCheckout = async (
    quantity: number,
    successUrl: string,
    cancelUrl: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-consultation-checkout', {
      body: {
        quantity,
        successUrl,
        cancelUrl,
        regionCode: 'US'
      }
    });

    if (error) throw error;

    return { success: true, url: data.url };
  } catch (error) {
    console.error("Error creating Stripe consultation checkout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/**
 * Verify a completed Stripe purchase
 */
export const verifyTopupPurchase = async (sessionId: string): Promise<boolean> => {
  try {
    // Check if we've already verified this transaction
    const verificationKey = `stripe_verification_${sessionId}`;
    if (localStorage.getItem(verificationKey) === 'verified') {
      console.log(`Using cached verification for Stripe session ${sessionId}`);
      return true;
    }

    // Add debounce protection
    const inProgressKey = `stripe_verification_progress_${sessionId}`;
    if (localStorage.getItem(inProgressKey) === 'true') {
      console.log(`Verification already in progress for session ${sessionId}`);
      return false;
    }

    // Mark verification as in progress
    localStorage.setItem(inProgressKey, 'true');

    try {
      // Verify the session via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('verify-checkout', {
        body: { sessionId }
      });

      if (error) throw error;

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
    console.error("Error verifying Stripe purchase:", error);
    return false;
  }
};
