import React, {useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {DocumentFormat} from "@/services/transcription";
import {DocumentTemplate, documentTemplates} from "@/data/documentTemplates";
import {Baby, Brain, Eye, FileText, Heart, Loader2, Search, Stethoscope, Users} from "lucide-react";
import DocumentFormatModal from "./DocumentFormatModal";

interface TemplateSelectionStepProps {
  selectedFormat: DocumentFormat;
  onFormatSelect: (format: DocumentFormat) => void;
  onNext: () => void;
  isRegenerateMode?: boolean;
  isLoading?: boolean;
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
  onNext,
  isRegenerateMode = false,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModalFormat, setSelectedModalFormat] = useState<DocumentFormat | undefined>();
  
  const filteredTemplates = documentTemplates.filter(template => 
    searchTerm === "" || 
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewFormat = (format: DocumentFormat) => {
    setSelectedModalFormat(format);
    setIsModalOpen(true);
  };
  
  const generalTemplates = filteredTemplates.filter(template => template.category === "general");
  const specialtyTemplates = filteredTemplates.filter(template => template.category === "specialty");
  const reportTemplates = filteredTemplates.filter(template => template.category === "reports");
  const customTemplates = filteredTemplates.filter(template => template.category === "custom");
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            {isRegenerateMode ? "Select New Document Format" : "Select Document Template"}
          </CardTitle>
          <CardDescription>
            {isRegenerateMode 
              ? "Choose a new document format to regenerate your existing transcript."
              : "Choose the document format before recording or uploading audio. This determines how your transcription will be structured."
            }
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
              <Badge variant="secondary" className="mr-2">Custom Templates</Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {customTemplates.map(template => {
                const Icon = getIconForTemplate(template);
                return (
                  <div key={template.documentFormat} className="relative group">
                    <Button
                      variant={selectedFormat === template.documentFormat ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-start text-left w-full"
                      onClick={() => onFormatSelect(template.documentFormat as DocumentFormat)}
                    >
                      <div className="flex items-center justify-between mb-2 w-full">
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          <span className="font-medium">{template.title}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFormat(template.documentFormat as DocumentFormat);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <Badge variant="secondary" className="mr-2">General Templates</Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {generalTemplates.map(template => {
                const Icon = getIconForTemplate(template);
                return (
                  <div key={template.documentFormat} className="relative group">
                    <Button
                      variant={selectedFormat === template.documentFormat ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-start text-left w-full"
                      onClick={() => onFormatSelect(template.documentFormat as DocumentFormat)}
                    >
                      <div className="flex items-center justify-between mb-2 w-full">
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          <span className="font-medium">{template.title}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFormat(template.documentFormat as DocumentFormat);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
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
                  <div key={template.documentFormat} className="relative group">
                    <Button
                      variant={selectedFormat === template.documentFormat ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-start text-left w-full"
                      onClick={() => onFormatSelect(template.documentFormat as DocumentFormat)}
                    >
                      <div className="flex items-center justify-between mb-2 w-full">
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          <span className="font-medium">{template.title}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFormat(template.documentFormat as DocumentFormat);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
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
                  <div key={template.documentFormat} className="relative group">
                    <Button
                      variant={selectedFormat === template.documentFormat ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-start text-left w-full"
                      onClick={() => onFormatSelect(template.documentFormat as DocumentFormat)}
                    >
                      <div className="flex items-center justify-between mb-2 w-full">
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          <span className="font-medium">{template.title}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFormat(template.documentFormat as DocumentFormat);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
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
              disabled={!selectedFormat || isLoading}
              className="ml-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isRegenerateMode ? "Generating..." : "Processing..."}
                </>
              ) : (
                isRegenerateMode ? "Generate Document" : "Continue to Recording"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DocumentFormatModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedFormat={selectedModalFormat}
      />
    </div>
  );
};

export default TemplateSelectionStep;