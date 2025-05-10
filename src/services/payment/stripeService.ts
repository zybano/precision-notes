
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

    // Get the package ID based on the quantity
    const { data: packages, error: packagesError } = await supabase
        .from('consultation_packages')
        .select('id, price')
        .eq('quantity', quantity)
        .eq('is_active', true)
        .single();

    if (packagesError) {
      console.error("Error fetching package:", packagesError);
      // If no exact match, continue without package ID
    }

    // Create a checkout session via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        quantity,
        packageId: packages?.id,
        amount: packages?.price, // Use the price from the database if available
        successUrl,
        cancelUrl,
        metadata: {
          user_id: user.id,
          product_type: 'consultation',
          package_id: packages?.id
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

    // If verification successful, record the purchase in our new table
    if (data?.success && data?.session) {
      const session = data.session;
      const userId = session.metadata?.user_id;
      const packageId = session.metadata?.package_id;
      const quantity = session.metadata?.quantity || 0;

      if (userId) {
        await supabase.from('consultation_purchases').insert({
          user_id: userId,
          package_id: packageId || null,
          quantity: Number(quantity),
          amount_paid: session.amount_total || 0,
          stripe_payment_id: session.id
        });

        // Also update the user's consultation total
        await addConsultationsToUser(userId, Number(quantity));
      }
    }

    return data?.success === true;
  } catch (error) {
    console.error("Error verifying purchase:", error);
    return false;
  }
};

// Helper function to update user's consultations
const addConsultationsToUser = async (userId: string, quantity: number): Promise<void> => {
  try {
    // Get current subscription
    const { data: subscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('consultations_total')
        .eq('user_id', userId)
        .single();

    if (fetchError) {
      console.error("Error fetching subscription:", fetchError);
      return;
    }

    const newTotal = (subscription?.consultations_total || 0) + quantity;

    // Update user_subscriptions table
    const { error } = await supabase
        .from('user_subscriptions')
        .update({
          consultations_total: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    if (error) {
      console.error("Error updating consultations:", error);
    }
  } catch (error) {
    console.error("Error adding consultations to user:", error);
  }
};

export default {
  createConsultationCheckout,
  verifyTopupPurchase
};