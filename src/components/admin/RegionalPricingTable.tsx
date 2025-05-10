import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getRegionalPricingWithPlanDetails, formatPrice } from "@/services/regionalPricingService";

export const RegionalPricingTable = () => {
  const [regionalPricing, setRegionalPricing] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegionalPricing = async () => {
      setIsLoading(true);
      try {
        const data = await getRegionalPricingWithPlanDetails('NG');
        setRegionalPricing(data);
      } catch (err) {
        setError('Failed to load regional pricing data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegionalPricing();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Regional Pricing</CardTitle>
          <CardDescription>Loading regional pricing data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Regional Pricing</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nigeria Regional Pricing</CardTitle>
        <CardDescription>
          Regional pricing information for Nigerian users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Regular Price</TableHead>
              <TableHead>Nigeria Price</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regionalPricing.map((pricing) => {
              const plan = pricing.subscription_plans;
              return (
                <TableRow key={pricing.id}>
                  <TableCell className="font-medium">{plan?.name || 'Unknown'}</TableCell>
                  <TableCell>{plan?.tier || 'Unknown'}</TableCell>
                  <TableCell>
                    <div>Monthly: ${(plan?.price_monthly / 100).toFixed(2)}</div>
                    <div>Annual: ${(plan?.price_annual / 100).toFixed(2)}</div>
                  </TableCell>
                  <TableCell>
                    <div>Monthly: {pricing.currency_symbol}{(pricing.price_monthly / 100).toFixed(2)}</div>
                    <div>Annual: {pricing.currency_symbol}{(pricing.price_annual / 100).toFixed(2)}</div>
                  </TableCell>
                  <TableCell>{pricing.currency}</TableCell>
                  <TableCell>
                    {pricing.is_active ? (
                      <Badge variant="success" className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-100 text-red-800">Inactive</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {regionalPricing.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No regional pricing data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RegionalPricingTable;