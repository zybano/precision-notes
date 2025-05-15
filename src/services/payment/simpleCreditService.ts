import { supabase } from "@/integrations/supabase/client";

/**
 * A simplified, direct approach to handling credits
 */

/**
 * Get the current user's credit balance
 */
export const getCredits = async (): Promise<{
  success: boolean;
  balance?: number;
  error?: string;
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error("Error fetching credits:", error);
      
      // If no record exists, create one with 0 balance
      if (error.code === 'PGRST116') {
        await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            balance: 0,
            total_earned: 0,
            total_used: 0
          });
        
        return { success: true, balance: 0 };
      }
      
      return { success: false, error: "Failed to fetch credit balance" };
    }

    return { success: true, balance: data?.balance || 0 };
  } catch (error) {
    console.error("Error in getCredits:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};

/**
 * Check if user has sufficient credits
 */
export const hasEnoughCredits = async (required: number = 1): Promise<boolean> => {
  const { success, balance } = await getCredits();
  return success && (balance || 0) >= required;
};

/**
 * Deduct credits from the user's balance - simplified version
 */
export const deductCredits = async (amount: number = 1): Promise<{
  success: boolean;
  balance?: number;
  error?: string;
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // First check if user has enough credits
    const { success, balance, error } = await getCredits();
    
    if (!success) {
      return { success: false, error };
    }
    
    if ((balance || 0) < amount) {
      return { 
        success: false, 
        error: `Insufficient credits. You have ${balance} credits but need ${amount}.` 
      };
    }

    // Calculate new balance
    const newBalance = (balance || 0) - amount;
    
    // Update just the balance - keep it simple
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
      
    if (updateError) {
      console.error("Error updating credits balance:", updateError);
      return { success: false, error: "Failed to update credit balance" };
    }
    
    // Record transaction - do this after the update succeeds
    try {
      await supabase.from('transaction_history').insert({
        user_id: user.id,
        amount: -amount, // Negative amount for deduction
        currency: 'CREDITS',
        payment_provider: 'system',
        transaction_type: 'usage',
        status: 'completed',
        metadata: {
          action: 'document_creation'
        }
      });
    } catch (err) {
      console.error("Error recording transaction:", err);
      // Continue execution, as the balance update was successful
    }

    return { success: true, balance: newBalance };
  } catch (error) {
    console.error("Error in deductCredits:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};