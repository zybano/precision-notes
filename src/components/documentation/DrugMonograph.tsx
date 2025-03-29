
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, AlertTriangle, Info, Shield, Pill, Heart } from "lucide-react";
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

// Mock data for demonstration
const mockDrugs: Drug[] = [
  {
    id: "1",
    name: "Lisinopril",
    generic: "Lisinopril",
    type: "prescription",
    ingredients: ["Lisinopril dihydrate"],
    dosages: ["5mg", "10mg", "20mg", "40mg"],
    indications: ["Hypertension", "Heart failure", "Post-myocardial infarction"],
    contraindications: ["Pregnancy", "History of angioedema", "Hypersensitivity"],
    interactions: [
      {
        drug: "Potassium supplements",
        severity: "moderate",
        description: "May increase risk of hyperkalemia"
      },
      {
        drug: "NSAIDs",
        severity: "moderate",
        description: "May reduce antihypertensive effects"
      },
      {
        drug: "Lithium",
        severity: "severe",
        description: "May increase lithium levels and toxicity"
      }
    ],
    sideEffects: {
      common: ["Dizziness", "Headache", "Dry cough", "Fatigue"],
      serious: ["Angioedema", "Hypotension", "Hyperkalemia", "Renal impairment"]
    },
    allergies: ["ACE inhibitors", "Lisinopril"]
  },
  {
    id: "2",
    name: "Metformin",
    generic: "Metformin hydrochloride",
    type: "prescription",
    ingredients: ["Metformin hydrochloride"],
    dosages: ["500mg", "850mg", "1000mg"],
    indications: ["Type 2 diabetes mellitus"],
    contraindications: ["Renal impairment", "Metabolic acidosis", "Hypersensitivity"],
    interactions: [
      {
        drug: "Iodinated contrast media",
        severity: "severe",
        description: "Increased risk of lactic acidosis"
      },
      {
        drug: "Alcohol",
        severity: "moderate",
        description: "May enhance hypoglycemic effect"
      }
    ],
    sideEffects: {
      common: ["Nausea", "Diarrhea", "Abdominal discomfort", "Metallic taste"],
      serious: ["Lactic acidosis", "Vitamin B12 deficiency"]
    },
    allergies: ["Metformin", "Biguanides"]
  },
  {
    id: "3",
    name: "Tylenol",
    generic: "Acetaminophen",
    type: "otc",
    ingredients: ["Acetaminophen"],
    dosages: ["325mg", "500mg", "650mg"],
    indications: ["Pain relief", "Fever reduction"],
    contraindications: ["Severe liver disease", "Hypersensitivity"],
    interactions: [
      {
        drug: "Alcohol",
        severity: "severe",
        description: "Increased risk of liver damage"
      },
      {
        drug: "Warfarin",
        severity: "moderate",
        description: "May enhance anticoagulant effect"
      }
    ],
    sideEffects: {
      common: ["Nausea", "Headache"],
      serious: ["Liver damage", "Skin reactions"]
    },
    allergies: ["Acetaminophen"]
  }
];

const DrugMonograph: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [filteredDrugs, setFilteredDrugs] = useState<Drug[]>(mockDrugs);
  const [activeTab, setActiveTab] = useState("search");

  useEffect(() => {
    if (searchQuery) {
      const filtered = mockDrugs.filter(drug =>
        drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drug.generic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drug.ingredients.some(i => i.toLowerCase().includes(searchQuery.toLowerCase())) ||
        drug.indications.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredDrugs(filtered);
    } else {
      setFilteredDrugs(mockDrugs);
    }
  }, [searchQuery]);

  const handleDrugSelect = (drug: Drug) => {
    setSelectedDrug(drug);
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
                  placeholder="Search by drug name, ingredient, or indication..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {filteredDrugs.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No drugs found matching your search criteria.
              </div>
            ) : (
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
                      {drug.indications.slice(0, 2).map((indication, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {indication}
                        </Badge>
                      ))}
                      {drug.indications.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{drug.indications.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4">
            {selectedDrug && (
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
                  <div className="flex flex-wrap gap-2">
                    {selectedDrug.allergies.map((allergy, i) => (
                      <Badge key={i} variant="destructive">{allergy}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Drug Interactions</h3>
                  <div className="space-y-2">
                    {selectedDrug.interactions.map((interaction, i) => (
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
                    ))}
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
