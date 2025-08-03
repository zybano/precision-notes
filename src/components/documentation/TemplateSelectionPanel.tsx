import React from "react";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {useAuth} from "@/contexts/AuthContext";
import {CheckCircle, Info, Lock} from "lucide-react";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";

interface TemplateCardProps {
  template: any;
  onSelect: (template: any) => void;
  subscriptionTier?: string;
}

// Helper function to determine if a template is available for the current subscription tier
const isTemplateAvailableForTier = (templateCategory: string, tier?: string) => {
  // Default to free tier if not specified
  if (!tier) tier = 'free';
  
  switch (templateCategory) {
    case 'basic':
      // Basic templates available to all tiers
      return true;
    case 'advanced':
      // Advanced templates available to professional and enterprise tiers
      return ['professional', 'enterprise'].includes(tier);
    case 'specialty':
      // Specialty templates only available to enterprise tier
      return tier === 'enterprise';
    default:
      return true;
  }
};

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect, subscriptionTier }) => {
  const isAvailable = isTemplateAvailableForTier(template.category, subscriptionTier);
  
  return (
    <Card className={`border ${isAvailable ? 'hover:border-primary cursor-pointer' : 'opacity-70'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{template.title}</CardTitle>
          {template.category === 'basic' && (
            <Badge variant="outline" className="ml-2">
              Basic
            </Badge>
          )}
          {template.category === 'advanced' && (
            <Badge variant="secondary" className="ml-2">
              Advanced
            </Badge>
          )}
          {template.category === 'specialty' && (
            <Badge variant="destructive" className="ml-2">
              Specialty
            </Badge>
          )}
        </div>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardFooter className="pt-2 flex justify-between">
        {isAvailable ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSelect(template)}
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Select
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="w-full" disabled>
                  <Lock className="h-4 w-4 mr-2" />
                  Upgrade Required
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {template.category === 'advanced' 
                    ? 'Requires Professional subscription or higher' 
                    : 'Requires Enterprise subscription'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );
};

interface TemplateSelectionPanelProps {
  templates: any[];
  onSelectTemplate: (template: any) => void;
}

const TemplateSelectionPanel: React.FC<TemplateSelectionPanelProps> = ({ 
  templates, 
  onSelectTemplate 
}) => {
  const { subscriptionInfo } = useAuth();
  const currentTier = subscriptionInfo?.tier || 'free';
  
  // Group templates by category
  const basicTemplates = templates.filter(t => t.category === 'basic' || !t.category);
  const advancedTemplates = templates.filter(t => t.category === 'advanced');
  const specialtyTemplates = templates.filter(t => t.category === 'specialty');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Document Templates</h2>
        <Badge variant={
          currentTier === 'free' ? 'outline' : 
          currentTier === 'starter' ? 'default' :
          currentTier === 'professional' ? 'secondary' : 'success'
        }>
          {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan
        </Badge>
      </div>
      
      {currentTier !== 'enterprise' && (
        <Card className="bg-muted/50">
          <CardContent className="p-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            <p className="text-sm">
              {currentTier === 'free' || currentTier === 'starter' 
                ? 'Upgrade to Professional plan to access Advanced templates' 
                : 'Upgrade to Enterprise plan to access Specialty templates'}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto"
              onClick={() => window.location.href = '/pricing'}
            >
              Upgrade
            </Button>
          </CardContent>
        </Card>
      )}
      
      {basicTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Basic Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {basicTemplates.map((template, index) => (
              <TemplateCard 
                key={index} 
                template={template} 
                onSelect={onSelectTemplate}
                subscriptionTier={currentTier}
              />
            ))}
          </div>
        </div>
      )}
      
      {advancedTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Advanced Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advancedTemplates.map((template, index) => (
              <TemplateCard 
                key={index} 
                template={template} 
                onSelect={onSelectTemplate}
                subscriptionTier={currentTier}
              />
            ))}
          </div>
        </div>
      )}
      
      {specialtyTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Specialty Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialtyTemplates.map((template, index) => (
              <TemplateCard 
                key={index} 
                template={template} 
                onSelect={onSelectTemplate}
                subscriptionTier={currentTier}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelectionPanel;
