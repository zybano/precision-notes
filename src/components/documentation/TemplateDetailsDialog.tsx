
import React from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TemplateParameter } from "./TemplateCard";

interface TemplateDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    title: string;
    description: string;
    icon: LucideIcon;
    parameters: TemplateParameter[];
  } | null;
  onUseTemplate: () => void;
}

const TemplateDetailsDialog: React.FC<TemplateDetailsDialogProps> = ({
  open,
  onOpenChange,
  template,
  onUseTemplate,
}) => {
  if (!template) return null;
  
  const Icon = template.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {template.title} Template
          </DialogTitle>
          <DialogDescription>
            {template.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-2">
          <h3 className="text-sm font-medium">Template Parameters</h3>
          <div className="space-y-4">
            {template.parameters.map((param, index) => (
              <div key={index} className="bg-muted/40 p-3 rounded-md space-y-1">
                <div className="flex items-center">
                  <h4 className="text-sm font-medium">{param.label}</h4>
                  <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                    {param.type === 'textarea' ? 'Multi-line text' : 'Single-line text'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{param.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => {
            onUseTemplate();
            onOpenChange(false);
          }}>
            Use Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDetailsDialog;
