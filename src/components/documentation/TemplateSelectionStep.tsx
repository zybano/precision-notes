import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DocumentFormat } from "@/services/transcription";
import { documentTemplates, DocumentTemplate } from "@/data/documentTemplates";
import { FileText, Stethoscope, Heart, Baby, Brain, Users, Bone, Search } from "lucide-react";

interface TemplateSelectionStepProps {
  selectedFormat: DocumentFormat;
  onFormatSelect: (format: DocumentFormat) => void;
  onNext: () => void;
}

// Icon mapping for templates
const getIconForTemplate = (template: DocumentTemplate) => {
  switch (template.documentFormat) {
    case 'soap':
    case 'progress':
    case 'discharge':
    case 'procedure':
    case 'dictation':
    case 'operative':
    case 'emergency':
    case 'referral':
    case 'medication':
      return FileText;
    case 'h&p':
    case 'consultation':
    case 'pulmonary':
    case 'radiology':
    case 'pathology':
      return Stethoscope;
    case 'cardiology':
      return Heart;
    case 'pediatric':
    case 'prenatal':
      return Baby;
    case 'psychiatric':
    case 'therapy':
    case 'neurology':
      return Brain;
    case 'followup':
    case 'oncology':
      return Users;
    default:
      return FileText;
  }
};

const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({
  selectedFormat,
  onFormatSelect,
  onNext
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredTemplates = documentTemplates.filter(template => 
    searchTerm === "" || 
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const generalTemplates = filteredTemplates.filter(template => template.category === "general");
  const specialtyTemplates = filteredTemplates.filter(template => template.category === "specialty");
  const reportTemplates = filteredTemplates.filter(template => template.category === "reports");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Select Document Template
          </CardTitle>
          <CardDescription>
            Choose the document format before recording or uploading audio. This determines how your transcription will be structured.
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <Badge variant="secondary" className="mr-2">General Templates</Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {generalTemplates.map(template => {
                const Icon = getIconForTemplate(template);
                return (
                  <Button
                    key={template.documentFormat}
                    variant={selectedFormat === template.documentFormat ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col items-start text-left"
                    onClick={() => onFormatSelect(template.documentFormat as DocumentFormat)}
                  >
                    <div className="flex items-center mb-2 w-full">
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="font-medium">{template.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <Badge variant="secondary" className="mr-2">Specialty Templates</Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {specialtyTemplates.map(template => {
                const Icon = getIconForTemplate(template);
                return (
                  <Button
                    key={template.documentFormat}
                    variant={selectedFormat === template.documentFormat ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col items-start text-left"
                    onClick={() => onFormatSelect(template.documentFormat as DocumentFormat)}
                  >
                    <div className="flex items-center mb-2 w-full">
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="font-medium">{template.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <Badge variant="secondary" className="mr-2">Report Templates</Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reportTemplates.map(template => {
                const Icon = getIconForTemplate(template);
                return (
                  <Button
                    key={template.documentFormat}
                    variant={selectedFormat === template.documentFormat ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col items-start text-left"
                    onClick={() => onFormatSelect(template.documentFormat as DocumentFormat)}
                  >
                    <div className="flex items-center mb-2 w-full">
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="font-medium">{template.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedFormat ? `Selected: ${documentTemplates.find(template => template.documentFormat === selectedFormat)?.title}` : "Please select a template"}
            </div>
            <Button 
              onClick={onNext} 
              disabled={!selectedFormat}
              className="ml-4"
            >
              Continue to Recording
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateSelectionStep;