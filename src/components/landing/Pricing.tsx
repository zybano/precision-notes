import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SubscriptionCheckout } from "@/components/subscription/SubscriptionCheckout";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getSubscriptionPlansWithRegionalPricing, 
  getRegionInfo,
  formatPrice,
  getConsultationPackagesWithRegionalPricing,
  toggleNigeriaMode,
  sortPlansByTier,
  TIER_ORDER
} from "@/services/regionalPricingService";
import { PricingPlan } from "@/components/landing/PricingPlan";
import { TopupOptions } from "@/components/landing/TopupOptions";
import { BillingToggle } from "@/components/landing/BillingToggle";
import { PricingLoadingState } from "@/components/landing/PricingLoadingState";
import { BillingCycle, PricingPlan as PricingPlanType, TopupOption, RegionInfo } from "@/types/subscription";
import { SubscriptionTier } from "@/services/subscriptionService";

export function Pricing() {
  const { user, refreshSubscriptionInfo } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    tier: SubscriptionTier;
    price: string;
  } | null>(null);
  
  // State for dynamically loaded plans
  const [pricingPlans, setPricingPlans] = useState<PricingPlanType[]>([]);
  const [topupOptions, setTopupOptions] = useState<TopupOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [isNigeriaMode, setIsNigeriaMode] = useState(false);
  
  // Load plans from database
  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      try {
        // Get user's region information
        const region = await getRegionInfo();
        setRegionInfo(region);
        setIsNigeriaMode(region.isNigeria);
        
        // Get plans with regional pricing
        const plans = await getSubscriptionPlansWithRegionalPricing();
        
        // Transform plans to format expected by the component
        const formattedPlans = plans.map(plan => formatPlanForDisplay(plan, region));
        setPricingPlans(formattedPlans);
        
        // Get consultation packages
        const packages = await getConsultationPackagesWithRegionalPricing();
        
        // Transform packages to format expected by the component
        const formattedPackages = packages.map(pkg => formatPackageForDisplay(pkg, region));
        setTopupOptions(formattedPackages);
      } catch (error) {
        console.error('Error loading pricing data:', error);
        
        // Use hardcoded plans as fallback
        setPricingPlans(getFallbackPlans());
        
        // Use hardcoded topup options as fallback
        setTopupOptions([
          { id: '1', consultations: 7, price: "$9", discountPercentage: 0 },
          { id: '2', consultations: 18, price: "$15", discountPercentage: 15 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlans();
  }, [isNigeriaMode]); // Re-fetch when Nigeria mode changes
  
  // Format a subscription plan for display
  const formatPlanForDisplay = (plan: any, region: RegionInfo): PricingPlanType => {
    // Determine if we should use regional pricing
    const useRegionalPricing = region.isNigeria && plan.regional_pricing;
    const currencySymbol = useRegionalPricing 
      ? plan.regional_pricing?.currency_symbol || '$'
      : '$';
    
    // Get the appropriate prices
    const priceMonthly = useRegionalPricing
      ? plan.regional_pricing?.price_monthly || plan.price_monthly 
      : plan.price_monthly;
      
    const priceAnnual = useRegionalPricing
      ? plan.regional_pricing?.price_annual || plan.price_annual
      : plan.price_annual;
    
    // For enterprise tier, show "Custom" instead of a price
    const displayPriceMonthly = plan.tier === 'enterprise' 
      ? 'Custom' 
      : formatPrice(priceMonthly, currencySymbol);
      
    const displayPriceAnnual = plan.tier === 'enterprise'
      ? 'Custom'
      : formatPrice(priceAnnual, currencySymbol);
    
    return {
      id: plan.id,
      tier: plan.tier as SubscriptionTier,
      name: plan.name,
      description: plan.description,
      price: {
        monthly: displayPriceMonthly,
        annual: displayPriceAnnual
      },
      features: Array.isArray(plan.features) ? plan.features : [],
      ctaLabel: plan.cta_label || (plan.tier === 'free' ? 'Start Free' : plan.tier === 'enterprise' ? 'Contact Sales' : 'Subscribe'),
      ctaLink: plan.cta_link || (plan.tier === 'free' ? '/signup' : plan.tier === 'enterprise' ? 'mailto:sales@precisionnote.com' : `/signup?plan=${plan.tier}`),
      highlight: plan.highlight || getPlanHighlight(plan.tier),
      popular: plan.popular || plan.tier === 'starter',
      savings: plan.tier !== 'free' && plan.tier !== 'enterprise' ? 'Save 5% annually' : undefined,
      contactSales: plan.contact_sales || plan.tier === 'enterprise'
    };
  };
  
  // Format a consultation package for display
  const formatPackageForDisplay = (pkg: any, region: RegionInfo): TopupOption => {
    // Determine if we should use regional pricing
    const useRegionalPricing = region.isNigeria && pkg.regional_pricing;
    const currencySymbol = useRegionalPricing 
      ? pkg.regional_pricing?.currency_symbol || '$'
      : '$';
    
    // Get the appropriate price
    const price = useRegionalPricing
      ? pkg.regional_pricing?.price || pkg.price
      : pkg.price;
    
    return {
      id: pkg.id,
      consultations: pkg.quantity,
      price: formatPrice(price, currencySymbol),
      discountPercentage: pkg.discount_percentage
    };
  };
  
  // Get plan highlight based on tier
  const getPlanHighlight = (tier: string): string => {
    switch (tier) {
      case 'free': return 'No Credit Card Required';
      case 'starter': return 'Most Popular';
      case 'professional': return 'Best Value';
      case 'enterprise': return 'For Large Organizations';
      default: return '';
    }
  };
  
  // Toggle Nigeria mode for testing
  const handleToggleNigeriaMode = () => {
    const newMode = toggleNigeriaMode();
    setIsNigeriaMode(newMode);
  };
  
  // Hardcoded fallback plans in case of database error
  const getFallbackPlans = (): PricingPlanType[] => {
    const plans = [
      {
        id: '1',
        tier: "free" as SubscriptionTier,
        name: "Free",
        description: "For individual providers starting out",
        price: {
          monthly: "$0",
          annual: "$0"
        },
        ctaLabel: "Start Free",
        ctaLink: "/signup",
        features: [
          "5 consultations",
          "SOAP Template",
          "History & Physical Template",
          "Secure storage"
        ],
        highlight: "No Credit Card Required",
        popular: false
      },
      {
        id: '2',
        tier: "starter" as SubscriptionTier,
        name: "Basic",
        description: "For growing practices",
        price: {
          monthly: "$25",
          annual: "$285"
        },
        ctaLabel: "Subscribe",
        ctaLink: "/signup?plan=basic",
        features: [
          "30 consultations/month",
          "SOAP Template",
          "History & Physical Template",
          "Email Support",
          "Secure storage"
        ],
        highlight: "Most Popular",
        popular: true,
        savings: "Save 5% annually"
      },
      {
        id: '3',
        tier: "professional" as SubscriptionTier,
        name: "Professional",
        description: "For established medical practices",
        price: {
          monthly: "$85",
          annual: "$969"
        },
        ctaLabel: "Subscribe",
        ctaLink: "/signup?plan=professional",
        features: [
          "80 consultations/month",
          "All Templates",
          "Priority Support",
          "Dictation",
          "Custom templates",
          "Advanced analytics"
        ],
        highlight: "Best Value",
        popular: false,
        savings: "Save 5% annually"
      },
      {
        id: '4',
        tier: "enterprise" as SubscriptionTier,
        name: "Enterprise",
        description: "For hospitals and large organizations",
        price: {
          monthly: "Custom",
          annual: "Custom"
        },
        ctaLabel: "Contact Sales",
        ctaLink: "mailto:sales@precisionnote.com?subject=Enterprise%20Plan%20Inquiry",
        features: [
          "Everything in Professional",
          "Custom integrations",
          "Multi-team management",
          "Dedicated account manager",
          "Advanced Analytics",
          "Hospital Management System"
        ],
        highlight: "For Large Organizations",
        popular: false,
        contactSales: true
      }
    ];
    
    // Sort plans by tier
    return plans.sort((a, b) => {
      const orderA = TIER_ORDER[a.tier as keyof typeof TIER_ORDER] || 999;
      const orderB = TIER_ORDER[b.tier as keyof typeof TIER_ORDER] || 999;
      return orderA - orderB;
    });
  };
  
  // Handle plan selection
  const handlePlanSelect = (plan: PricingPlanType) => {
    // For enterprise, just redirect to the contact link
    if (plan.tier === 'enterprise') {
      window.location.href = plan.ctaLink;
      return;
    }
    
    // For free plan, redirect to signup
    if (plan.tier === 'free') {
      window.location.href = plan.ctaLink;
      return;
    }
    
    // For other plans, open checkout dialog
    setSelectedPlan({
      name: plan.name,
      tier: plan.tier,
      price: plan.price[billingCycle]
    });
    setCheckoutOpen(true);
  };
  
  // Handle checkout completion
  const handleCheckoutSuccess = () => {
    setCheckoutOpen(false);
    refreshSubscriptionInfo();
  };

  // Handle billing cycle change
  const handleBillingCycleChange = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
  };

  if (isLoading) {
    return <PricingLoadingState />;
  }

  return (
    <section id="pricing" className="py-16 md:py-24 bg-white border-t border-border">
      <div className="container mx-auto px-6 max-w-7xl">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your practice. All plans include core features with flexible options as you grow.
            </p>
            
            {/* Region indicator and toggle (visible only in development) */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-4 flex justify-center items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleNigeriaMode}
                  className="flex items-center space-x-1"
                >
                  <Globe className="h-4 w-4" />
                  <span>
                    {isNigeriaMode ? 'Switch to Global Pricing' : 'Switch to Nigeria Pricing'}
                  </span>
                </Button>
              </div>
            )}
            
            {/*/!* Display Nigeria-specific pricing notice *!/*/}
            {/*{regionInfo && regionInfo.isNigeria && (*/}
            {/*  <div className="mt-4 bg-green-50 text-green-800 px-4 py-2 rounded-md inline-block">*/}
            {/*    <span>🇳🇬 Nigeria-specific pricing available</span>*/}
            {/*  </div>*/}
            {/*)}*/}
            
            <div className="mt-6">
              <BillingToggle billingCycle={billingCycle} onChange={handleBillingCycleChange} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan, index) => (
              <PricingPlan
                key={plan.id || index}
                plan={plan}
                billingCycle={billingCycle}
                user={user}
                onSelectPlan={handlePlanSelect}
              />
            ))}
          </div>
          
          {/* Top-up options */}
          <TopupOptions options={topupOptions} />
        </FadeIn>
        
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">Have questions about our plans?</p>
          <Button 
            variant="outline" 
            className="shadow-sm hover:shadow-md transition-all"
            onClick={() => window.location.href = "mailto:sales@PrecisionNote.com?subject=PrecisionNote Pricing Inquiry"}
          >
            Contact Sales
          </Button>
        </div>
      </div>
      
      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedPlan && (
            <SubscriptionCheckout
              tier={selectedPlan.tier}
              price={selectedPlan.price}
              isAnnual={billingCycle === 'annual'}
              onSuccess={handleCheckoutSuccess}
              onCancel={() => setCheckoutOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}