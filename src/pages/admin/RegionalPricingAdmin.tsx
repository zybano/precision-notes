import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegionalPricingTable } from "@/components/admin/RegionalPricingTable";
import { toggleNigeriaMode, setCountryOverride } from "@/services/regionalPricingService";
import { Globe, RefreshCw, Settings } from "lucide-react";

export default function RegionalPricingAdmin() {
  const [activeTab, setActiveTab] = useState("view");
  const [selectedCountry, setSelectedCountry] = useState("NG");
  const [testMode, setTestMode] = useState(false);

  const handleToggleNigeriaMode = () => {
    const isNigeriaMode = toggleNigeriaMode();
    setTestMode(isNigeriaMode);
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setCountryOverride(value);
    // Force reload to update pricing
    window.location.reload();
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Regional Pricing Management</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant={testMode ? "default" : "outline"}
            size="sm"
            onClick={handleToggleNigeriaMode}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            {testMode ? 'Disable Nigeria Mode' : 'Enable Nigeria Mode'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.location.reload()}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="view">View Pricing</TabsTrigger>
          <TabsTrigger value="test">Test Mode</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          <RegionalPricingTable />
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regional Pricing Test Mode</CardTitle>
              <CardDescription>
                Test how the pricing displays for users from different regions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="country">Test Country</Label>
                  <Select 
                    value={selectedCountry} 
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default (Auto-detect)</SelectItem>
                      <SelectItem value="NG">Nigeria (🇳🇬)</SelectItem>
                      <SelectItem value="US">United States (🇺🇸)</SelectItem>
                      <SelectItem value="GB">United Kingdom (🇬🇧)</SelectItem>
                      <SelectItem value="KE">Kenya (🇰🇪)</SelectItem>
                      <SelectItem value="ZA">South Africa (🇿🇦)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Button 
                    onClick={() => {
                      setCountryOverride(null);
                      window.location.reload();
                    }}
                  >
                    Reset to Auto-Detect
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                After changing the test country, visit the pricing page to see how it displays for users from that region.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regional Pricing Settings</CardTitle>
              <CardDescription>
                Configure regional pricing settings and defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="default-currency">Default Currency</Label>
                  <Select defaultValue="USD">
                    <SelectTrigger id="default-currency">
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="exchange-rate">NGN to USD Exchange Rate</Label>
                  <Input id="exchange-rate" type="number" defaultValue="1500" />
                  <p className="text-sm text-muted-foreground">
                    Used for automatic price conversion (1 USD = X NGN)
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline">Cancel</Button>
              <Button>Save Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}