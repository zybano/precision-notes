
import { supabase } from "@/integrations/supabase/client";

// Function to create a Stripe checkout session for consultation top-up
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
    
    // Create a checkout session via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        quantity,
        successUrl,
        cancelUrl,
        metadata: {
          user_id: user.id,
          product_type: 'consultation'
        }
      })
    });
    
    if (error) throw error;
    
    if (!data?.url) {
      throw new Error("No checkout URL returned");
    }
    
    return { success: true, url: data.url };
  } catch (error) {
    console.error("Error creating checkout:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
};

// Function to verify a completed purchase
export const verifyTopupPurchase = async (sessionId: string): Promise<boolean> => {
  try {
    // Verify the session via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('verify-checkout', {
      body: JSON.stringify({ sessionId })
    });
    
    if (error) throw error;
    
    return data?.success === true;
  } catch (error) {
    console.error("Error verifying purchase:", error);
    return false;
  }
};

export default {
  createConsultationCheckout,
  verifyTopupPurchase
};
