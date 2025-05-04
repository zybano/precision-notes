
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsultationTopup } from "@/components/subscription/ConsultationTopup";
import { FadeIn } from "@/components/ui/motion";
import { FileText, MessageCircle, PenSquare } from "lucide-react";

const ConsultationPurchase = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleCheckoutStart = () => {
    setIsProcessing(true);
  };
  
  const benefits = [
    {
      title: "Enhanced Documentation",
      description: "Generate more comprehensive medical documentation with AI assistance",
      icon: FileText
    },
    {
      title: "AI Recommendations",
      description: "Receive intelligent suggestions tailored to your clinical notes",
      icon: MessageCircle
    },
    {
      title: "Advanced Templates",
      description: "Access premium specialized medical documentation templates",
      icon: PenSquare
    }
  ];
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <FadeIn>
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Buy Consultation Credits</h1>
            <p className="text-muted-foreground">
              Purchase consultation credits to enhance your medical documentation capabilities
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Consultations</CardTitle>
                <CardDescription>
                  Add consultation credits to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConsultationTopup 
                  onCheckout={handleCheckoutStart}
                  defaultQuantity={20}
                />
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Consultation Benefits</h2>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className="flex p-4 rounded-lg border border-border"
                  >
                    <div className="mr-4 bg-primary/10 p-2 rounded-full h-10 w-10 flex items-center justify-center">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium">Buy in bulk and save</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Purchase 50+ consultations to receive a discount of $1 per consultation
                </p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default ConsultationPurchase;
