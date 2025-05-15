
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
    const amount = params.isAnnual 
      ? (regionalPricing?.price_annual || plan.price_annual) 
      : (regionalPricing?.price_monthly || plan.price_monthly);

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

// Function to verify a completed purchase
export const verifyPaystackPurchase = async (reference: string): Promise<boolean> => {
  try {
    // Verify the session via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('verify-paystack-checkout', {
      body: JSON.stringify({ reference })
    });

    if (error) {
      console.error("Error verifying Paystack purchase:", error);
      return false;
    }

    return data?.success === true;
  } catch (error) {
    console.error("Error verifying Paystack purchase:", error);
    return false;
  }
};
