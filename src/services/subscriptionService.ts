import {supabase} from "@/integrations/supabase/client";

// Define subscription tiers and their features
export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

// Subscription info interface
export interface SubscriptionInfo {
  tier: SubscriptionTier;
  isAnnualBilling: boolean;
  consultationsTotal: number;
  consultationsRemaining: number;
  nextBillingDate?: Date;
  features: string[];
}

// Get user's subscription info from the new database structure
export const getSubscriptionInfo = async (): Promise<SubscriptionInfo | null> => {
  try {
    console.log('🔄 Starting getSubscriptionInfo...');
    const { data: { user } } = await supabase.auth.getUser();

    console.log('🧑 User data:', user);

    if (!user) {
      console.log('❌ No user found');
      return null;
    }

    // Fetch user subscription from the new table
    const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error fetching subscription:', error);
      return null;
    }

    // If no subscription record found, use default free tier values
    if (!subscription) {
      console.log('⚠️ No subscription record found, using defaults');
      const tierDefaults = getTierDefaults('free');
      return {
        tier: 'free',
        isAnnualBilling: false,
        consultationsTotal: tierDefaults.consultationsTotal,
        consultationsRemaining: tierDefaults.consultationsTotal,
        features: tierDefaults.features
      };
    }

    // Get subscription details
    const subscriptionTier = subscription.subscription_tier as SubscriptionTier || 'free';
    const isAnnualBilling = subscription.is_annual_billing || false;
    const consultationsTotal = subscription.consultations_total || 10;
    const consultationsUsed = subscription.consultations_used || 0;
    const consultationsRemaining = Math.max(0, consultationsTotal - consultationsUsed);

    console.log('📊 Consultation stats:', {
      total: consultationsTotal,
      used: consultationsUsed,
      remaining: consultationsRemaining
    });

    // Get next billing date if available
    let nextBillingDate: Date | undefined;
    if (subscription.next_billing_date) {
      nextBillingDate = new Date(subscription.next_billing_date);
      console.log('📅 Next billing date:', nextBillingDate);
    }

    // Get features from the plan or defaults
    let features: string[] = [];
    if (subscription.subscription_plans && subscription.subscription_plans.features) {
      const planFeatures = subscription.subscription_plans.features;
      features = Array.isArray(planFeatures) ? (planFeatures as any[]).map(f => String(f)) : [];
    } else {
      features = getTierDefaults(subscriptionTier).features;
    }

    const subscriptionInfo = {
      tier: subscriptionTier,
      isAnnualBilling,
      consultationsTotal,
      consultationsRemaining,
      nextBillingDate,
      features
    };

    console.log('✅ Final subscription info:', subscriptionInfo);
    return subscriptionInfo;
  } catch (error) {
    console.error("❌ Error getting subscription info:", error);
    return null;
  }
};

// Get default values for each tier
const getTierDefaults = (tier: SubscriptionTier) => {
  switch (tier) {
    case 'starter':
      return {
        consultationsTotal: 50,
        features: [
          'Basic SOAP note generation',
          'Transcription service',
          'Up to 50 consultations per month',
          'Email support'
        ]
      };
    case 'professional':
      return {
        consultationsTotal: 200,
        features: [
          'Advanced SOAP note generation',
          'Premium transcription service',
          'Up to 200 consultations per month',
          'Priority email support',
          'Custom templates'
        ]
      };
    case 'enterprise':
      return {
        consultationsTotal: 500,
        features: [
          'Advanced SOAP note generation',
          'Premium transcription service',
          'Up to 500 consultations per month',
          'Dedicated support',
          'Custom templates',
          'Hospital system integration',
          'Admin dashboard'
        ]
      };
    case 'free':
    default:
      return {
        consultationsTotal: 10,
        features: [
          'Basic SOAP note generation',
          'Basic transcription service',
          'Up to 10 consultations per month'
        ]
      };
  }
};

// Update consultation count (e.g. after using a service)
export const updateConsultationUsage = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    // Update consultations_used in the user_subscriptions table
    const { data: subscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('consultations_used')
        .eq('user_id', user.id)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error fetching subscription:", fetchError);
      return false;
    }

    const consultationsUsed = ((subscription?.consultations_used) || 0) + 1;

    // Update the database record
    const { error } = await supabase
        .from('user_subscriptions')
        .update({
          consultations_used: consultationsUsed,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

    return !error;
  } catch (error) {
    console.error("Error updating consultation usage:", error);
    return false;
  }
};

// Add consultations (e.g. after purchase)
export const addConsultations = async (amount: number): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    // Get current subscription
    const { data: subscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('consultations_total')
        .eq('user_id', user.id)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error fetching subscription:", fetchError);
      return false;
    }

    const newTotal = ((subscription?.consultations_total) || 10) + amount;

    // Update database record
    const { error } = await supabase
        .from('user_subscriptions')
        .update({
          consultations_total: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

    return !error;
  } catch (error) {
    console.error("Error adding consultations:", error);
    return false;
  }
};

// Get tier name for display purposes
export const getSubscriptionTierName = (tier: SubscriptionTier): string => {
  switch (tier) {
    case 'starter': return 'Starter';
    case 'professional': return 'Professional';
    case 'enterprise': return 'Enterprise';
    case 'free': return 'Free';
    default: return 'Unknown';
  }
};

// Check if user has access to a feature based on their tier
export const hasSubscriptionAccess = (
    userTier: SubscriptionTier,
    requiredTier: SubscriptionTier
): boolean => {
  const tierLevels = {
    'free': 0,
    'starter': 1,
    'professional': 2,
    'enterprise': 3
  };

  return tierLevels[userTier] >= tierLevels[requiredTier];
};

// Check if template is available for user's tier
export const isTemplateAvailableForTier = (
    templateName: string,
    userTier: SubscriptionTier
): boolean => {
  // Basic templates available to all tiers
  const basicTemplates = ['SOAP Note', 'History & Physical', 'Dictation (Blank)'];

  // If it's a basic template, allow access to all tiers
  if (basicTemplates.includes(templateName)) {
    return true;
  }

  // Advanced templates (available to professional and enterprise)
  const advancedTemplates = [
    'Progress Note',
    'Discharge Summary',
    'Consultation Note',
    'Procedure Note', 
    'Comprehensive Clinical Note'
  ];

  if (advancedTemplates.includes(templateName)) {
    return hasSubscriptionAccess(userTier, 'professional');
  }

  // Specialty templates (available to enterprise only)
  const specialtyTemplates = [
    'Psychiatry Evaluation',
    'Cardiology Assessment',
    'Pediatric Examination',
    'Orthopedic Evaluation',
    'Obstetrics Assessment'
  ];

  if (specialtyTemplates.includes(templateName)) {
    return hasSubscriptionAccess(userTier, 'enterprise');
  }

  // Default: allow access (for any other templates)
  return true;
};

// Get required tier for a template
export const getRequiredTierForTemplate = (templateName: string): SubscriptionTier | null => {
  // Basic templates available to all tiers
  const basicTemplates = ['SOAP Note', 'History & Physical', 'Dictation (Blank)'];
  if (basicTemplates.includes(templateName)) {
    return 'free';
  }

  // Advanced templates (available to professional and enterprise)
  const advancedTemplates = [
    'Progress Note',
    'Discharge Summary',
    'Consultation Note', 
    'Procedure Note',
    'Comprehensive Clinical Note'
  ];
  if (advancedTemplates.includes(templateName)) {
    return 'professional';
  }

  // Specialty templates (available to enterprise only)
  const specialtyTemplates = [
    'Psychiatry Evaluation',
    'Cardiology Assessment',
    'Pediatric Examination',
    'Orthopedic Evaluation',
    'Obstetrics Assessment'
  ];
  if (specialtyTemplates.includes(templateName)) {
    return 'enterprise';
  }

  return null;
};

// Update user subscription tier
export const updateSubscriptionTier = async (tier: SubscriptionTier): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    // Update the subscription_tier in the user_subscriptions table
    const { error } = await supabase
        .from('user_subscriptions')
        .update({
          subscription_tier: tier,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

    return !error;
  } catch (error) {
    console.error("Error updating subscription tier:", error);
    return false;
  }
};

export default {
  getSubscriptionInfo,
  updateConsultationUsage,
  addConsultations,
  getSubscriptionTierName,
  hasSubscriptionAccess,
  isTemplateAvailableForTier,
  getRequiredTierForTemplate,
  updateSubscriptionTier
};
