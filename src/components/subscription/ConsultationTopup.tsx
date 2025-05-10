import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createConsultationCheckout } from "@/services/payment/stripeService";
import { getConsultationPackagesWithRegionalPricing, getRegionInfo, formatPrice } from "@/services/regionalPricingService";
import { toast } from "sonner";

interface PackageOption {
    id: string;
    quantity: number;
    price: number;
    discount_percentage: number;
    price_display: string;
    currency_symbol: string;
}

interface ConsultationTopupProps {
    onCheckout?: () => void;
    defaultQuantity?: number;
}

export const ConsultationTopup = ({
                                      onCheckout,
                                      defaultQuantity = 20
                                  }: ConsultationTopupProps) => {
    const [quantity, setQuantity] = useState(defaultQuantity);
    const [isLoading, setIsLoading] = useState(false);
    const [packageOptions, setPackageOptions] = useState<PackageOption[]>([]);
    const [isLoadingPackages, setIsLoadingPackages] = useState(true);
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

    // Fetch package options from the database with regional pricing
    useEffect(() => {
        const loadPackages = async () => {
            setIsLoadingPackages(true);
            try {
                // Get region info for proper pricing
                const regionInfo = await getRegionInfo();
                const currencySymbol = regionInfo.currencySymbol;

                // Get packages with regional pricing
                const packagesResult = await getConsultationPackagesWithRegionalPricing();

                if (packagesResult && packagesResult.length > 0) {
                    // Format packages for display
                    const formattedPackages = packagesResult.map(pkg => {
                        // Determine if we should use regional pricing
                        const useRegionalPricing = regionInfo.isNigeria && pkg.regional_pricing;
                        const packageCurrencySymbol = useRegionalPricing
                            ? pkg.regional_pricing?.currency_symbol || currencySymbol
                            : currencySymbol;

                        // Get the appropriate price
                        const price = useRegionalPricing
                            ? pkg.regional_pricing?.price || pkg.price
                            : pkg.price;

                        return {
                            id: pkg.id,
                            quantity: pkg.quantity,
                            price: price,
                            discount_percentage: pkg.discount_percentage,
                            price_display: formatPrice(price, packageCurrencySymbol),
                            currency_symbol: packageCurrencySymbol
                        };
                    });

                    setPackageOptions(formattedPackages);

                    // Set default quantity and selected package
                    const defaultPackage = formattedPackages.find(pkg => pkg.quantity === defaultQuantity) || formattedPackages[0];
                    setQuantity(defaultPackage.quantity);
                    setSelectedPackageId(defaultPackage.id);
                } else {
                    // Fallback to hardcoded options if fetch returns empty
                    setPackageOptions([
                        { id: '1', quantity: 7, price: 900, discount_percentage: 0, price_display: `${currencySymbol}9.00`, currency_symbol: currencySymbol },
                        { id: '2', quantity: 18, price: 1500, discount_percentage: 15, price_display: `${currencySymbol}15.00`, currency_symbol: currencySymbol }
                    ]);

                    // Set default selected package
                    const defaultPackage = { id: '2', quantity: 18 };
                    setQuantity(defaultPackage.quantity);
                    setSelectedPackageId(defaultPackage.id);
                }
            } catch (error) {
                console.error("Error loading consultation packages:", error);

                // Fallback to hardcoded options if fetch fails
                const currencySymbol = '$';
                setPackageOptions([
                    { id: '1', quantity: 7, price: 900, discount_percentage: 0, price_display: `${currencySymbol}9.00`, currency_symbol: currencySymbol },
                    { id: '2', quantity: 18, price: 1500, discount_percentage: 15, price_display: `${currencySymbol}15.00`, currency_symbol: currencySymbol }
                ]);

                // Set default selected package
                const defaultPackage = { id: '2', quantity: 18 };
                setQuantity(defaultPackage.quantity);
                setSelectedPackageId(defaultPackage.id);
            } finally {
                setIsLoadingPackages(false);
            }
        };

        loadPackages();
    }, [defaultQuantity]);

    const handleSelectPackage = (packageId: string, packageQuantity: number) => {
        setSelectedPackageId(packageId);
        setQuantity(packageQuantity);
    };

    const startCheckout = async () => {
        if (!selectedPackageId) {
            toast.error("Please select a package first");
            return;
        }

        try {
            setIsLoading(true);
            if (onCheckout) onCheckout();

            // Find the selected package
            const selectedPackage = packageOptions.find(p => p.id === selectedPackageId);
            if (!selectedPackage) {
                throw new Error("Selected package not found");
            }

            // Use real Stripe checkout
            const result = await createConsultationCheckout(
                selectedPackage.quantity,
                `${window.location.origin}/payment-success`,
                `${window.location.origin}/payment-canceled`
            );

            if (result.success && result.url) {
                // Redirect to Stripe checkout
                window.location.href = result.url;
            } else {
                toast.error(result.error || "Failed to create checkout");
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Error starting checkout:", error);
            toast.error("An error occurred while processing your request");
            setIsLoading(false);
        }
    };

    if (isLoadingPackages) {
        return (
            <div className="space-y-6">
                <div className="text-center py-4">Loading consultation packages...</div>
                <div className="animate-pulse">
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2].map((i) => (
                            <Card key={i} className="p-4">
                                <div className="flex justify-between items-center">
                                    <div className="h-6 bg-muted w-1/4 rounded"></div>
                                    <div className="h-8 bg-muted w-1/3 rounded"></div>
                                </div>
                            </Card>
                        ))}
                    </div>
                    <div className="mt-6 h-10 bg-muted rounded w-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                {packageOptions.map((option) => (
                    <Card
                        key={option.id}
                        className={`p-4 cursor-pointer relative ${
                            selectedPackageId === option.id
                                ? "border-primary shadow-sm"
                                : "border-border"
                        }`}
                        onClick={() => handleSelectPackage(option.id, option.quantity)}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="font-medium">{option.quantity}</div>
                                <div className="text-sm text-muted-foreground">consultations</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">{option.price_display}</div>
                                {option.discount_percentage > 0 && (
                                    <div className="text-xs text-green-600">Save {option.discount_percentage}%</div>
                                )}
                            </div>
                        </div>

                        {selectedPackageId === option.id && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full"></div>
                        )}
                    </Card>
                ))}
            </div>

            <Button
                className="w-full"
                disabled={isLoading || !selectedPackageId}
                onClick={startCheckout}
            >
                {isLoading ? "Processing..." : `Purchase ${quantity} Consultations`}
            </Button>

            <div className="text-xs text-center text-muted-foreground">
                Consultations are added to your account immediately after purchase
            </div>
        </div>
    );
};