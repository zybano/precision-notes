
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCallback } from "react";

// Define subscription tiers
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

// Define subscription info interface
export interface SubscriptionInfo {
  tier: SubscriptionTier;
  consultationsRemaining: number;
  consultationsTotal: number;
  nextBillingDate: Date | null;
  isAnnualBilling: boolean;
}

// Create a hook for managing consultations
export const useConsultation = () => {
  // Update the user's consultation count
  const updateConsultations = useCallback(async (consultationCount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Authentication required");
        return false;
      }
      
      // In a real implementation, this would update the user's consultation count in the database
      // For now, we'll just show a success message
      toast.success(`Added ${consultationCount} consultations to your account!`);
      return true;
    } catch (error) {
      console.error("Error updating consultations:", error);
      toast.error("Failed to update consultations");
      return false;
    }
  }, []);
  
  return { updateConsultations };
};

// This exported function allows for use outside of React components
export async function updateConsultations(consultationCount: number): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Authentication required");
      return false;
    }
    
    // In a real implementation, this would update the user's consultation count in the database
    // For now, we'll just show a success message
    toast.success(`Added ${consultationCount} consultations to your account!`);
    return true;
  } catch (error) {
    console.error("Error updating consultations:", error);
    toast.error("Failed to update consultations");
    return false;
  }
}

// Get subscription info for the current user
export async function getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    // In a real implementation, this would fetch the user's subscription info from the database
    // For now, we'll return mock data based on the user's metadata
    const userTier = user.user_metadata?.subscription_tier || 'free';
    
    // Define consultation limits based on tier
    const tierConsultations = {
      free: 5,
      basic: 20,
      pro: 50,
      enterprise: 100
    };
    
    // Mock remaining consultations (between 20% and 90% of total)
    const total = tierConsultations[userTier as SubscriptionTier];
    const remaining = Math.floor(total * (0.2 + Math.random() * 0.7));
    
    // Mock next billing date (1-28 days in the future)
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + Math.floor(Math.random() * 28) + 1);
    
    // Mock annual billing status
    const isAnnualBilling = Math.random() > 0.5;
    
    return {
      tier: userTier as SubscriptionTier,
      consultationsRemaining: remaining,
      consultationsTotal: total,
      nextBillingDate,
      isAnnualBilling
    };
  } catch (error) {
    console.error("Error getting subscription info:", error);
    return null;
  }
}

// Get a user-friendly name for a subscription tier
export function getSubscriptionTierName(tier: SubscriptionTier): string {
  switch (tier) {
    case 'free':
      return 'Free';
    case 'basic':
      return 'Basic';
    case 'pro':
      return 'Professional';
    case 'enterprise':
      return 'Enterprise';
    default:
      return 'Unknown';
  }
}

// Check if a user has access to features of a specific tier
export function hasSubscriptionAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  const tierLevels: Record<SubscriptionTier, number> = {
    free: 0,
    basic: 1,
    pro: 2,
    enterprise: 3
  };
  
  return tierLevels[userTier] >= tierLevels[requiredTier];
}
