
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ListFilter, Copy, Star, LucideIcon } from "lucide-react";

export interface TemplateParameter {
  name: string;
  label: string;
  description: string;
  type: "textarea" | "input";
}

export interface TemplateCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  parameters: TemplateParameter[];
  onViewDetails: () => void;
  onUseTemplate: () => void;
  isFeatured?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  title,
  description,
  icon: Icon,
  parameters,
  onViewDetails,
  onUseTemplate,
  isFeatured = false,
}) => {
  const isDictation = title === "Dictation (Blank)";
  
  return (
    <Card className={`h-full flex flex-col hover:shadow-md transition-all cursor-pointer border ${isDictation ? 'border-primary/80 bg-primary/5' : isFeatured ? 'border-primary/50 bg-primary/5' : 'border-border'} overflow-hidden`}>
      <CardContent className="p-0 flex flex-col h-full">
        <div className="p-6 flex-grow">
          <div className="flex items-start">
            <div className={`h-10 w-10 rounded-lg ${isDictation ? 'bg-primary/20' : isFeatured ? 'bg-primary/20' : 'bg-accent'} flex items-center justify-center mr-4 flex-shrink-0`}>
              <Icon className={`h-5 w-5 ${isDictation ? 'text-primary' : isFeatured ? 'text-primary' : 'text-primary'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium">{title}</h3>
                {isFeatured && (
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        </div>
        <div className="mt-auto">
          <Separator />
          <div className="p-4 flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ListFilter className="h-3.5 w-3.5" />
              Details
            </Button>
            <Button 
              variant="primary" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onUseTemplate();
              }}
              className="gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <Copy className="h-3.5 w-3.5" />
              Use
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateCard;
