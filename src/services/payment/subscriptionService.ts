
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionTier } from "@/services/subscriptionService";
import { toast } from "sonner";

export interface CheckoutParams {
  tier: SubscriptionTier;
  isAnnual: boolean;
  successUrl?: string;
  cancelUrl?: string;
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
        cancelUrl
      }
    });
    
    if (error) throw new Error(error.message);
    
    return { success: true, url: data.url };
  } catch (error) {
    console.error("Error creating plan checkout:", error);
    return { success: false, error: error.message || "Failed to create checkout" };
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
    return { success: false, error: error.message || "Failed to verify subscription" };
  }
};

export default {
  createPlanCheckout,
  verifySubscription
};
