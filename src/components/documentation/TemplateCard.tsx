import React from "react";
import {Card, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {AlertCircle, Copy, ListFilter, Lock, LucideIcon, Star} from "lucide-react";
import {useAuth} from "@/contexts/AuthContext";
import {getRequiredTierForTemplate, isTemplateAvailableForTier} from "@/services/subscriptionService";
import {Badge} from "@/components/ui/badge";

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
  requiredTier?: string;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  title,
  description,
  icon: Icon,
  parameters,
  onViewDetails,
  onUseTemplate,
  isFeatured = false
}) => {
  const { subscriptionInfo } = useAuth();
  const isDictation = title === "Dictation (Blank)";
  
  // Get the required tier for this template
  const requiredTier = getRequiredTierForTemplate(title);
  
  // Check if user has access to this template
  const hasAccess = subscriptionInfo && 
    isTemplateAvailableForTier(title, subscriptionInfo.tier);
  
  // Format required tier name for display
  const getFormattedTierName = (tier: string | null): string => {
    if (!tier) return "";
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };
  
  return (
    <Card className={`h-full flex flex-col hover:shadow-md transition-all cursor-pointer border ${isDictation ? 'border-primary/80 bg-primary/5' : isFeatured ? 'border-primary/50 bg-primary/5' : 'border-border'} overflow-hidden ${!hasAccess ? 'opacity-75' : ''}`}>
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
                
                {requiredTier && requiredTier !== 'free' && (
                  <Badge 
                    variant={requiredTier === 'professional' ? 'outline' : 'secondary'} 
                    className={`ml-2 text-xs ${requiredTier === 'enterprise' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' : ''}`}
                  >
                    {getFormattedTierName(requiredTier)}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
              
              {!hasAccess && requiredTier && (
                <div className="mt-2 text-xs flex items-center text-amber-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  <span>Upgrade to {getFormattedTierName(requiredTier)} to unlock</span>
                </div>
              )}
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
              variant="default" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (hasAccess) {
                  onUseTemplate();
                } else {
                  // Redirect to pricing page if template is not available for user's tier
                  window.location.href = '/pricing';
                }
              }}
              className={`gap-1.5 ${hasAccess ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
            >
              {hasAccess ? (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Use
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Upgrade
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateCard;
