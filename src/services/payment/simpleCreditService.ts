
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
      .select('balance, expires_at')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error("Error fetching credits:", error);
      
      // If no record exists, create one with 0 balance
      if (error.code === 'PGRST116') {
        // Set expiration to 1 year from now
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        
        await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            balance: 0,
            total_earned: 0,
            total_used: 0,
            expires_at: expiresAt.toISOString()
          });
        
        return { success: true, balance: 0 };
      }
      
      return { success: false, error: "Failed to fetch credit balance" };
    }

    // Check if credits have expired
    const now = new Date();
    const expiresAt = data?.expires_at ? new Date(data.expires_at) : null;
    
    if (expiresAt && expiresAt < now) {
      // Credits have expired, return 0 balance
      return { success: true, balance: 0 };
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
    
    // Use the increment function to update total_used
    try {
      const { error: incrementError } = await supabase.rpc(
        'increment',
        { 
          row_id: user.id, 
          increment_amount: amount,
          table_name: 'user_credits',
          column_name: 'total_used' 
        }
      );
      
      if (incrementError) {
        console.error("Error incrementing total_used:", incrementError);
      }
    } catch (err) {
      console.error("Error calling increment function:", err);
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

export interface CreditInfo {
  balance: number;
  totalUsed: number;
  totalEarned: number;
  expiresAt: Date | null;
}

/**
 * Get detailed credit information from the user_credits table
 */
export const getCreditInfo = async (): Promise<{
  success: boolean;
  data?: CreditInfo;
  error?: string;
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
        .from('user_credits')
        .select('balance, total_earned, total_used, expires_at')
        .eq('user_id', user.id)
        .single();

    if (error) {
      console.error("Error fetching credit info:", error);

      // If the record doesn't exist, return zeros
      if (error.code === 'PGRST116') {
        return {
          success: true,
          data: {
            balance: 0,
            totalEarned: 0,
            totalUsed: 0,
            expiresAt: null
          }
        };
      }

      return { success: false, error: "Failed to fetch credit info" };
    }

    // Check if credits have expired
    const now = new Date();
    const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
    let balance = data.balance || 0;

    if (expiresAt && expiresAt < now) {
      // Credits have expired, set balance to 0 but keep the other stats
      balance = 0;
    }

    return {
      success: true,
      data: {
        balance: balance,
        totalEarned: data.total_earned || 0,
        totalUsed: data.total_used || 0,
        expiresAt: expiresAt
      }
    };
  } catch (error) {
    console.error("Error in getCreditInfo:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};

/**
 * Format expiration date for display
 */
export const formatExpiryDate = (date: Date | null): string => {
  if (!date) return 'Never';

  const now = new Date();

  // If expired
  if (date < now) {
    return 'Expired';
  }

  // Format date as MMM DD, YYYY
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculate days remaining until expiry
 */
export const getDaysRemaining = (date: Date | null): number | null => {
  if (!date) return null;

  const now = new Date();

  // If expired
  if (date < now) {
    return 0;
  }

  // Calculate days remaining
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Check if credits are almost expired (within 7 days)
 */
export const isAlmostExpired = (date: Date | null): boolean => {
  const daysRemaining = getDaysRemaining(date);
  return daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
};
