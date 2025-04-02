import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, AlertTriangle, Info, Shield, Pill, Heart, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Drug {
  id: string;
  name: string;
  generic: string;
  type: "prescription" | "otc";
  ingredients: string[];
  dosages: string[];
  indications: string[];
  contraindications: string[];
  interactions: {
    drug: string;
    severity: "mild" | "moderate" | "severe";
    description: string;
  }[];
  sideEffects: {
    common: string[];
    serious: string[];
  };
  allergies: string[];
}

const DrugMonograph: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [filteredDrugs, setFilteredDrugs] = useState<Drug[]>([]);
  const [activeTab, setActiveTab] = useState("search");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to search drugs from OpenFDA API
  const searchDrugs = async (query: string) => {
    if (!query || query.length < 2) {
      setFilteredDrugs([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Search for drugs using the OpenFDA API
      const response = await fetch(
          `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${query}"&limit=10`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // Map the FDA API data to our Drug interface
        const mappedDrugs: Drug[] = data.results.map((result: any) => {
          // Extract the relevant information from the FDA data
          const brandName = result.openfda?.brand_name?.[0] || "Unknown";
          const genericName = result.openfda?.generic_name?.[0] || "Unknown";
          const substanceName = result.openfda?.substance_name || [];
          const rxcui = result.openfda?.rxcui?.[0] || "";

          // Determine if prescription or OTC based on available data
          const rxNormId = result.openfda?.rxnorm?.[0] || "";
          const isRx = result.openfda?.product_type?.includes("PRESCRIPTION") ||
              Boolean(rxNormId) ||
              Boolean(result.openfda?.product_type?.includes("RX"));

          return {
            id: rxcui || String(Math.random()).slice(2, 10),
            name: brandName,
            generic: genericName,
            type: isRx ? "prescription" : "otc",
            ingredients: substanceName.length > 0 ? substanceName : [genericName],
            dosages: result.dosage_forms_and_strengths ?
                [result.dosage_forms_and_strengths.join(", ")] :
                ["Information not available"],
            indications: result.indications_and_usage ?
                [result.indications_and_usage.join(" ")] :
                ["Information not available"],
            contraindications: result.contraindications ?
                result.contraindications :
                ["Information not available"],
            interactions: result.drug_interactions ?
                [{
                  drug: "Various medications",
                  severity: "moderate",
                  description: result.drug_interactions.join(" ")
                }] :
                [],
            sideEffects: {
              common: result.adverse_reactions ?
                  [result.adverse_reactions.join(" ")] :
                  ["Information not available"],
              serious: result.warnings ?
                  [result.warnings.join(" ")] :
                  ["Information not available"]
            },
            allergies: result.warnings_and_cautions ?
                [result.warnings_and_cautions.join(" ")] :
                ["Information not available"]
          };
        });

        setFilteredDrugs(mappedDrugs);
      } else {
        setFilteredDrugs([]);
      }
    } catch (err) {
      console.error("Error fetching drug data:", err);
      setError("Failed to fetch drug information. Please try again.");
      setFilteredDrugs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get detailed information for a selected drug
  const fetchDrugDetails = async (drug: Drug) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the RxNorm API to get more detailed drug information
      const response = await fetch(
          `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${drug.name}"&limit=1`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];

        // Update drug with more detailed information
        const updatedDrug: Drug = {
          ...drug,
          indications: result.indications_and_usage || drug.indications,
          contraindications: result.contraindications ?
              result.contraindications :
              drug.contraindications,
          interactions: result.drug_interactions ?
              [{
                drug: "Various medications",
                severity: "moderate",
                description: result.drug_interactions.join(" ")
              }] :
              drug.interactions,
          sideEffects: {
            common: result.adverse_reactions ?
                [result.adverse_reactions.join(" ")] :
                drug.sideEffects.common,
            serious: result.warnings ?
                [result.warnings.join(" ")] :
                drug.sideEffects.serious
          },
          allergies: result.warnings_and_cautions ?
              [result.warnings_and_cautions.join(" ")] :
              drug.allergies
        };

        setSelectedDrug(updatedDrug);
      } else {
        // If no detailed information found, use the basic information
        setSelectedDrug(drug);
      }
    } catch (err) {
      console.error("Error fetching detailed drug information:", err);
      setError("Failed to fetch detailed drug information.");
      // Still set the basic drug information
      setSelectedDrug(drug);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchDrugs(searchQuery);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleDrugSelect = (drug: Drug) => {
    fetchDrugDetails(drug);
    setActiveTab("details");
  };

  return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center">
            <Pill className="h-5 w-5 mr-2" />
            Drug Monograph
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="details" disabled={!selectedDrug}>Details</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      type="search"
                      placeholder="Search by drug name (min. 2 characters)..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {isLoading && (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2">Searching for drugs...</span>
                  </div>
              )}

              {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}

              {!isLoading && !error && filteredDrugs.length === 0 && searchQuery.length >= 2 && (
                  <div className="text-center p-4 text-muted-foreground">
                    No drugs found matching your search criteria.
                  </div>
              )}

              {!isLoading && !error && searchQuery.length < 2 && (
                  <div className="text-center p-4 text-muted-foreground">
                    Enter at least 2 characters to search for drugs.
                  </div>
              )}

              {!isLoading && !error && filteredDrugs.length > 0 && (
                  <div className="space-y-2">
                    {filteredDrugs.map(drug => (
                        <div
                            key={drug.id}
                            className="border rounded-md p-3 cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => handleDrugSelect(drug)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{drug.name}</div>
                              <div className="text-sm text-muted-foreground">{drug.generic}</div>
                            </div>
                            <Badge variant={drug.type === "prescription" ? "default" : "outline"}>
                              {drug.type === "prescription" ? "Rx" : "OTC"}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {drug.indications.slice(0, 1).map((indication, i) => {
                              // Truncate long indication text
                              const truncated = indication.length > 100 ?
                                  indication.substring(0, 100) + '...' : indication;
                              return (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {truncated}
                                  </Badge>
                              );
                            })}
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {isLoading && (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2">Loading drug details...</span>
                  </div>
              )}

              {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}

              {!isLoading && !error && selectedDrug && (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold">{selectedDrug.name}</h2>
                        <p className="text-muted-foreground">{selectedDrug.generic}</p>
                      </div>
                      <Badge variant={selectedDrug.type === "prescription" ? "default" : "outline"}>
                        {selectedDrug.type === "prescription" ? "Prescription" : "Over-the-counter"}
                      </Badge>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-2">Available Dosages</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedDrug.dosages.map((dosage, i) => (
                            <Badge key={i} variant="outline">{dosage}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Active Ingredients</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {selectedDrug.ingredients.map((ingredient, i) => (
                            <li key={i}>{ingredient}</li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-2 flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        Indications
                      </h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {selectedDrug.indications.map((indication, i) => (
                            <li key={i}>{indication}</li>
                        ))}
                      </ul>
                    </div>

                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Contraindications</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                          {selectedDrug.contraindications.map((contraindication, i) => (
                              <li key={i}>{contraindication}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <div>
                      <h3 className="font-medium mb-2 flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        Allergies
                      </h3>
                      <div className="space-y-1">
                        {selectedDrug.allergies.map((allergy, i) => (
                            <div key={i} className="text-red-600">{allergy}</div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Drug Interactions</h3>
                      <div className="space-y-2">
                        {selectedDrug.interactions.length > 0 ? (
                            selectedDrug.interactions.map((interaction, i) => (
                                <Alert
                                    key={i}
                                    variant="default"
                                    className={
                                      interaction.severity === "severe" ? "bg-red-50 border-red-200" :
                                          interaction.severity === "moderate" ? "bg-amber-50 border-amber-200" :
                                              "bg-blue-50 border-blue-200"
                                    }
                                >
                                  <div className="flex justify-between">
                                    <AlertTitle className="flex items-center">
                                      <Info className="h-4 w-4 mr-1" />
                                      {interaction.drug}
                                    </AlertTitle>
                                    <Badge
                                        variant={
                                          interaction.severity === "severe" ? "destructive" :
                                              interaction.severity === "moderate" ? "default" :
                                                  "outline"
                                        }
                                        className={
                                          interaction.severity === "moderate" ? "bg-amber-500" : ""
                                        }
                                    >
                                      {interaction.severity}
                                    </Badge>
                                  </div>
                                  <AlertDescription>
                                    {interaction.description}
                                  </AlertDescription>
                                </Alert>
                            ))
                        ) : (
                            <div className="text-muted-foreground">No interaction data available</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Side Effects</h3>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium">Common</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {selectedDrug.sideEffects.common.map((effect, i) => (
                                <li key={i}>{effect}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Serious</h4>
                          <ul className="list-disc pl-5 space-y-1 text-red-600">
                            {selectedDrug.sideEffects.serious.map((effect, i) => (
                                <li key={i}>{effect}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" onClick={() => setActiveTab("search")}>
                        Back to Search
                      </Button>
                    </div>
                  </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
  );
};

export default DrugMonograph;