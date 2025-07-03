import { supabase } from "@/integrations/supabase/client";

// Define SubscriptionTier type for backward compatibility
export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface CheckoutParams {
  tier: SubscriptionTier;
  isAnnual: boolean;
  successUrl?: string;
  cancelUrl?: string;
  regionCode?: string;
}

export const createPlanCheckout = async (params: CheckoutParams): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Set default success/cancel URLs if not provided
    const successUrl = params.successUrl || `${window.location.origin}/payment-success`;
    const cancelUrl = params.cancelUrl || `${window.location.origin}/payment-canceled`;

    // Call the edge function to create a checkout session
    const { data, error } = await supabase.functions.invoke('create-plan-checkout', {
      body: {
        tier: params.tier,
        isAnnual: params.isAnnual,
        successUrl,
        cancelUrl,
        regionCode: params.regionCode || 'US' // Include region code for pricing adjustment
      }
    });

    if (error) throw new Error(error.message);

    return { success: true, url: data.url };
  } catch (error) {
    console.error("Error creating plan checkout:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create checkout" };
  }
};

export const verifySubscription = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // Call the edge function to verify subscription status
    const { data, error } = await supabase.functions.invoke('verify-subscription');

    if (error) throw new Error(error.message);

    return { success: true, data };
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to verify subscription" };
  }
};

// New functions to work with our database tables

export const fetchSubscriptionPlans = async (regionCode?: string): Promise<{ success: boolean; plans?: any[]; error?: string }> => {
  try {
    const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');

    if (error) throw new Error(error.message);

    // If a region code is provided, fetch regional pricing
    if (regionCode) {
      const { data: regionalPricing, error: regionalError } = await supabase
          .from('regional_pricing')
          .select('*')
          .eq('country_code', regionCode)
          .eq('is_active', true);

      if (regionalError) throw new Error(regionalError.message);

      // Combine plans with regional pricing
      if (regionalPricing && regionalPricing.length > 0) {
        const plansWithRegionalPricing = data.map(plan => {
          const regionalPrice = regionalPricing.find(rp => rp.plan_id === plan.id);
          if (regionalPrice) {
            return {
              ...plan,
              currency: regionalPrice.currency,
              currency_symbol: regionalPrice.currency_symbol,
              price_monthly: regionalPrice.price_monthly,
              price_annual: regionalPrice.price_annual
            };
          }
          return plan;
        });

        return { success: true, plans: plansWithRegionalPricing };
      }
    }

    return { success: true, plans: data };
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch subscription plans" };
  }
};

export const fetchConsultationPackages = async (regionCode?: string): Promise<{ success: boolean; packages?: any[]; error?: string }> => {
  try {
    const { data, error } = await supabase
        .from('consultation_packages')
        .select('*')
        .eq('is_active', true)
        .order('quantity');

    if (error) throw new Error(error.message);

    // If a region code is provided, fetch regional pricing
    if (regionCode) {
      const { data: regionalPricing, error: regionalError } = await supabase
          .from('regional_consultation_pricing')
          .select('*')
          .eq('country_code', regionCode)
          .eq('is_active', true);

      if (regionalError) throw new Error(regionalError.message);

      // Combine packages with regional pricing
      if (regionalPricing && regionalPricing.length > 0) {
        const packagesWithRegionalPricing = data.map(pkg => {
          const regionalPrice = regionalPricing.find(rp => rp.package_id === pkg.id);
          if (regionalPrice) {
            return {
              ...pkg,
              currency: regionalPrice.currency,
              currency_symbol: regionalPrice.currency_symbol,
              price: regionalPrice.price
            };
          }
          return pkg;
        });

        return { success: true, packages: packagesWithRegionalPricing };
      }
    }

    return { success: true, packages: data };
  } catch (error) {
    console.error("Error fetching consultation packages:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch consultation packages" };
  }
};

export const fetchUserSubscription = async (userId: string): Promise<{ success: boolean; subscription?: any; error?: string }> => {
  try {
    const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);

    return { success: true, subscription: data || null };
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch user subscription" };
  }
};

export const fetchConsultationPurchases = async (userId: string): Promise<{ success: boolean; purchases?: any[]; error?: string }> => {
  try {
    const { data, error } = await supabase
        .from('consultation_purchases')
        .select('*, consultation_packages(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return { success: true, purchases: data || [] };
  } catch (error) {
    console.error("Error fetching consultation purchases:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch consultation purchases" };
  }
};

export default {
  createPlanCheckout,
  verifySubscription,
  fetchSubscriptionPlans,
  fetchConsultationPackages,
  fetchUserSubscription,
  fetchConsultationPurchases
};
