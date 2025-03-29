import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, FileText, Activity, FileSearch } from "lucide-react";

interface EnhancedContext {
  observations: {
    id: string;
    category: string;
    text: string;
    confidence: number;
    source: "explicit" | "implicit";
  }[];
  inferredConditions: {
    id: string;
    name: string;
    confidence: number;
    supportingEvidence: string[];
  }[];
  patientContext: {
    id: string;
    category: string;
    text: string;
  }[];
}

interface EnhancedContextPanelProps {
  context: EnhancedContext;
}

const EnhancedContextPanel: React.FC<EnhancedContextPanelProps> = ({ context }) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          Enhanced Context
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="observations" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="observations">Observations</TabsTrigger>
            <TabsTrigger value="inferred">Inferred</TabsTrigger>
            <TabsTrigger value="context">Patient Context</TabsTrigger>
          </TabsList>
          
          <TabsContent value="observations" className="space-y-4">
            <div className="text-sm text-muted-foreground italic mb-2">
              Observations captured from the consultation, including those not explicitly stated.
            </div>
            
            {context.observations.map(obs => (
              <div key={obs.id} className="border rounded-md p-3">
                <div className="flex justify-between items-start">
                  <div className="font-medium">{obs.text}</div>
                  <Badge variant={obs.source === "explicit" ? "outline" : "secondary"}>
                    {obs.source === "explicit" ? "Stated" : "Inferred"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Category: {obs.category}
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="inferred" className="space-y-4">
            <div className="text-sm text-muted-foreground italic mb-2">
              Conditions and issues inferred from the consultation content.
            </div>
            
            {context.inferredConditions.map(condition => (
              <div key={condition.id} className="border rounded-md p-3">
                <div className="font-medium">{condition.name}</div>
                <div className="mt-2">
                  <div className="text-sm font-medium">Supporting evidence:</div>
                  <ul className="list-disc pl-5 mt-1 text-sm">
                    {condition.supportingEvidence.map((evidence, i) => (
                      <li key={i}>{evidence}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Confidence: {(condition.confidence * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="context" className="space-y-6">
            <div className="text-sm text-muted-foreground italic mb-2">
              Additional patient context that may be relevant to the consultation.
            </div>
            
            {context.patientContext.map(item => (
              <div key={item.id} className="border rounded-md p-3">
                <div className="flex items-start gap-2">
                  <Badge variant="outline">{item.category}</Badge>
                  <div>{item.text}</div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedContextPanel;
