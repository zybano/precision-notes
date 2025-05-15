import { supabase } from "@/integrations/supabase/client";

// Define country code for Nigeria
const NIGERIA_COUNTRY_CODE = 'NG';

// Define the order for subscription tiers
export const TIER_ORDER = {
  'free': 1,
  'starter': 2, // 'Basic' tier has 'starter' as its tier ID
  'professional': 3,
  'enterprise': 4
};

// Types for regional pricing
export interface RegionalPricingInfo {
  countryCode: string;
  region: string;
  currency: string;
  currencySymbol: string;
  isNigeria: boolean;
}

export interface SubscriptionPlanWithPricing {
  id: string;
  tier: string;
  name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  features: string[];
  highlight: string;
  popular: boolean;
  cta_label: string;
  cta_link: string;
  contact_sales: boolean;
  is_active: boolean;
  regional_pricing?: {
    id: string;
    plan_id: string;
    currency: string;
    currency_symbol: string;
    price_monthly: number;
    price_annual: number;
    country_code: string;
    region: string;
    is_active: boolean;
  };
}

export interface ConsultationPackageWithPricing {
  id: string;
  quantity: number;
  price: number;
  discount_percentage: number;
  highlight?: string;
  is_active: boolean;
  regional_pricing?: {
    id: string;
    package_id: string;
    currency: string;
    currency_symbol: string;
    price: number;
    country_code: string;
    region: string;
    is_active: boolean;
  };
}

/**
 * Sort subscription plans by their tier order
 */
export const sortPlansByTier = (plans: SubscriptionPlanWithPricing[]): SubscriptionPlanWithPricing[] => {
  return [...plans].sort((a, b) => {
    const orderA = TIER_ORDER[a.tier as keyof typeof TIER_ORDER] || 999;
    const orderB = TIER_ORDER[b.tier as keyof typeof TIER_ORDER] || 999;
    return orderA - orderB;
  });
};

/**
 * Detect user's country based on their IP address
 * This uses a public API to get the user's country
 */
export const detectUserCountry = async (): Promise<RegionalPricingInfo> => {
  try {
    // For development/testing purposes, we can set the country code through localStorage
    const overrideCountryCode = localStorage.getItem('override_country_code');
    if (overrideCountryCode) {
      const isNigeria = overrideCountryCode === NIGERIA_COUNTRY_CODE;
      return {
        countryCode: overrideCountryCode,
        region: isNigeria ? 'Nigeria' : 'Global',
        currency: isNigeria ? 'NGN' : 'USD',
        currencySymbol: isNigeria ? '₦' : '$',
        isNigeria
      };
    }
    
    // Use ipapi.co to get location info
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    const countryCode = data.country_code || 'US';
    const isNigeria = countryCode === NIGERIA_COUNTRY_CODE;

    return {
      countryCode,
      region: data.country_name || 'Global',
      currency: isNigeria ? 'NGN' : 'USD',
      currencySymbol: isNigeria ? '₦' : '$',
      isNigeria
    };
  } catch (error) {
    console.error('Error detecting user country:', error);
    
    // Default to global pricing if detection fails
    return {
      countryCode: 'US',
      region: 'Global',
      currency: 'USD',
      currencySymbol: '$',
      isNigeria: false
    };
  }
};

/**
 * Fetch regional pricing with plan details
 */
export const getRegionalPricingWithPlanDetails = async (countryCode: string = 'NG'): Promise<any[]> => {
  try {
    // Improved query to include plan details
    const { data, error } = await supabase
      .from('regional_pricing')
      .select(`
        *,
        subscription_plans:plan_id (
          id,
          tier,
          name,
          description,
          price_monthly,
          price_annual,
          features,
          highlight,
          popular,
          cta_label,
          cta_link,
          contact_sales,
          is_active
        )
      `)
      .eq('country_code', countryCode)
      .eq('is_active', true);
      
    if (error) throw new Error(error.message);
    
    // Sort the data by tier order
    if (data) {
      return data.sort((a, b) => {
        const tierA = a.subscription_plans.tier;
        const tierB = b.subscription_plans.tier;
        const orderA = TIER_ORDER[tierA as keyof typeof TIER_ORDER] || 999;
        const orderB = TIER_ORDER[tierB as keyof typeof TIER_ORDER] || 999;
        return orderA - orderB;
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching regional pricing with plan details:', error);
    return [];
  }
};

/**
 * Get subscription plans with region-specific pricing
 */
export const getSubscriptionPlansWithRegionalPricing = async (): Promise<SubscriptionPlanWithPricing[]> => {
  try {
    // Get user's country
    const { countryCode } = await detectUserCountry();
    
    // Fetch all active subscription plans
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw new Error(error.message);
    if (!plans || plans.length === 0) return [];
    
    // Process plans
    const processedPlans = plans.map(plan => ({
      ...plan,
      features: Array.isArray(plan.features) ? plan.features : []
    }));
    
    // If user is not from Nigeria, return global pricing sorted by tier
    if (countryCode !== NIGERIA_COUNTRY_CODE) {
      return sortPlansByTier(processedPlans);
    }
    
    // Fetch Nigeria-specific pricing with improved query
    const { data: regionalPricing, error: regionalError } = await supabase
      .from('regional_pricing')
      .select('*')
      .eq('country_code', countryCode)
      .eq('is_active', true);
      
    if (regionalError) throw new Error(regionalError.message);
    
    // Map regional pricing to plans
    const plansWithRegionalPricing = processedPlans.map(plan => {
      const regionalPrice = regionalPricing?.find(rp => rp.plan_id === plan.id);
      
      return {
        ...plan,
        regional_pricing: regionalPrice ? {
          id: regionalPrice.id,
          plan_id: regionalPrice.plan_id,
          currency: regionalPrice.currency,
          currency_symbol: regionalPrice.currency_symbol,
          price_monthly: regionalPrice.price_monthly,
          price_annual: regionalPrice.price_annual,
          country_code: regionalPrice.country_code,
          region: regionalPrice.region,
          is_active: regionalPrice.is_active
        } : undefined
      };
    });
    
    // Sort by tier order
    return sortPlansByTier(plansWithRegionalPricing);
  } catch (error) {
    console.error('Error fetching subscription plans with regional pricing:', error);
    return [];
  }
};

/**
 * Get consultation packages with region-specific pricing
 */
export const getConsultationPackagesWithRegionalPricing = async (): Promise<ConsultationPackageWithPricing[]> => {
  try {
    // Get user's country
    const { countryCode } = await detectUserCountry();
    
    // Fetch all active consultation packages
    const { data: packages, error } = await supabase
      .from('consultation_packages')
      .select('*')
      .eq('is_active', true)
      .order('quantity');
    
    if (error) throw new Error(error.message);
    if (!packages || packages.length === 0) return [];
    
    // If user is not from Nigeria, return global pricing
    if (countryCode !== NIGERIA_COUNTRY_CODE) {
      return packages;
    }
    
    // Fetch Nigeria-specific pricing
    const { data: regionalPricing, error: regionalError } = await supabase
      .from('regional_consultation_pricing')
      .select('*')
      .eq('country_code', countryCode)
      .eq('is_active', true);
      
    if (regionalError) throw new Error(regionalError.message);
    
    // Map regional pricing to packages
    return packages.map(pkg => {
      const regionalPrice = regionalPricing?.find(rp => rp.package_id === pkg.id);
      
      return {
        ...pkg,
        regional_pricing: regionalPrice ? {
          id: regionalPrice.id,
          package_id: regionalPrice.package_id,
          currency: regionalPrice.currency,
          currency_symbol: regionalPrice.currency_symbol,
          price: regionalPrice.price,
          country_code: regionalPrice.country_code,
          region: regionalPrice.region,
          is_active: regionalPrice.is_active
        } : undefined
      };
    });
  } catch (error) {
    console.error('Error fetching consultation packages with regional pricing:', error);
    return [];
  }
};

/**
 * Format price for display based on user's region
 */
export const formatRegionalPrice = async (priceInCents: number): Promise<string> => {
  try {
    const { currencySymbol, currency, isNigeria } = await detectUserCountry();
    
    // For Nigeria, convert price to Naira and handle format
    if (isNigeria) {
      // Assuming prices are stored in smallest currency unit
      return `${currencySymbol}${(priceInCents / 100).toLocaleString('en-NG')}`;
    }
    
    // For other countries, use USD format
    return `${currencySymbol}${(priceInCents / 100).toFixed(2)}`;
  } catch (error) {
    console.error('Error formatting regional price:', error);
    // Default to USD format
    return `$${(priceInCents / 100).toFixed(2)}`;
  }
};


/**
 * Cache key for storing region info in localStorage
 */
const REGION_INFO_CACHE_KEY = 'precision_notes_region_info';

/**
 * Cache expiry time in milliseconds (72 hours)
 */
const CACHE_EXPIRY_TIME = 72 * 60 * 60 * 1000;

/**
 * Get cached region info from localStorage or fetch if not available
 */
export const getRegionInfo = async (): Promise<RegionalPricingInfo> => {
  try {
    // Try to get cached data from localStorage
    const cachedData = localStorage.getItem(REGION_INFO_CACHE_KEY);

    if (cachedData) {
      const parsedData = JSON.parse(cachedData);

      // Check if the cache has expired
      if (parsedData.timestamp && Date.now() - parsedData.timestamp < CACHE_EXPIRY_TIME) {
        console.log('Using cached region info from localStorage');
        return parsedData.regionInfo;
      }

      // Cache expired, clear it
      console.log('Region info cache expired, fetching fresh data');
      localStorage.removeItem(REGION_INFO_CACHE_KEY);
    }

    // If no valid cache exists, fetch fresh data
    const regionInfo = await detectUserCountry();

    // Store in localStorage with timestamp
    const cacheData = {
      regionInfo,
      timestamp: Date.now()
    };

    localStorage.setItem(REGION_INFO_CACHE_KEY, JSON.stringify(cacheData));

    return regionInfo;
  } catch (error) {
    // If there's any error with localStorage, fall back to direct detection
    console.error('Error accessing localStorage:', error);
    return await detectUserCountry();
  }
};

/**
 * Clear cached region info
 */
export const clearRegionCache = (): void => {
  localStorage.removeItem(REGION_INFO_CACHE_KEY);
};


/**
 * Format price for display based on currency and value
 */
export const formatPrice = (value: number, currencySymbol: string = '$'): string => {
  return `${currencySymbol}${(value / 100).toFixed(2)}`;
};

/**
 * Set country override for testing
 */
export const setCountryOverride = (countryCode: string | null): void => {
  if (countryCode) {
    localStorage.setItem('override_country_code', countryCode);
  } else {
    localStorage.removeItem('override_country_code');
  }

  // Clear cache to ensure new country code takes effect
  clearRegionCache();
};

/**
 * Toggle Nigeria mode for testing
 */
export const toggleNigeriaMode = (): boolean => {
  const currentOverride = localStorage.getItem('override_country_code');
  const isNigeria = currentOverride === NIGERIA_COUNTRY_CODE;

  if (isNigeria) {
    localStorage.removeItem('override_country_code');
  } else {
    localStorage.setItem('override_country_code', NIGERIA_COUNTRY_CODE);
  }

  // Clear cache to ensure new country code takes effect
  clearRegionCache();

  // Return new status
  return !isNigeria;
};

export default {
  detectUserCountry,
  getSubscriptionPlansWithRegionalPricing,
  getConsultationPackagesWithRegionalPricing,
  getRegionalPricingWithPlanDetails,
  formatRegionalPrice,
  getRegionInfo,
  clearRegionCache,
  formatPrice,
  setCountryOverride,
  toggleNigeriaMode,
  sortPlansByTier,
  TIER_ORDER
};