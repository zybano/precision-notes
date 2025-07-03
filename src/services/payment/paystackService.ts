import { supabase } from "@/integrations/supabase/client";
import { SubscriptionTier } from "@/services/subscriptionService";

// Function to create a Paystack checkout session for plan subscription
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
          billing_cycle: params.isAnnual ? 'annual' : 'monthly'
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
          quantity
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
