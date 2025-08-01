import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { documentTemplates } from "@/data/documentTemplates";
import { Wand2, Loader2 } from "lucide-react";

interface TemplateRegenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFormat?: string;
  onRegenerateDocument: (newFormat: string) => Promise<void>;
}

const TemplateRegenerationDialog: React.FC<TemplateRegenerationDialogProps> = ({
  open,
  onOpenChange,
  currentFormat,
  onRegenerateDocument
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!selectedFormat) return;
    
    setIsRegenerating(true);
    try {
      await onRegenerateDocument(selectedFormat);
      onOpenChange(false);
      setSelectedFormat("");
    } catch (error) {
      console.error("Error regenerating document:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Group templates by category
  const groupedTemplates = documentTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, typeof documentTemplates>);

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'general': return 'General Templates';
      case 'specialty': return 'Specialty Templates';
      case 'reports': return 'Reports';
      default: return category;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Document Template</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([category, templates]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                {getCategoryTitle(category)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedFormat === template.documentFormat
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    } ${currentFormat === template.documentFormat ? 'opacity-50' : ''}`}
                    onClick={() => {
                      if (currentFormat !== template.documentFormat) {
                        setSelectedFormat(template.documentFormat);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-foreground">{template.title}</h4>
                      {currentFormat === template.documentFormat && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleRegenerate}
            disabled={!selectedFormat || isRegenerating || currentFormat === selectedFormat}
          >
            {isRegenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Regenerate Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateRegenerationDialog;