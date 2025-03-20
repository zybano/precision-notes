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
    <Card className={`hover:shadow-md transition-all cursor-pointer border ${isDictation ? 'border-primary/80 bg-primary/5' : isFeatured ? 'border-primary/50 bg-primary/5' : 'border-border'} overflow-hidden`}>
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-center">
            <div className={`h-10 w-10 rounded-lg ${isDictation ? 'bg-primary/20' : isFeatured ? 'bg-primary/20' : 'bg-accent'} flex items-center justify-center mr-4`}>
              <Icon className={`h-5 w-5 ${isDictation ? 'text-primary' : isFeatured ? 'text-primary' : 'text-primary'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium">{title}</h3>
                {isFeatured && (
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
        <Separator />
        <div className="p-4 flex justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onViewDetails}
            className="gap-1.5"
          >
            <ListFilter className="h-3.5 w-3.5" />
            View Parameters
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onUseTemplate}
            className="gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateCard;
