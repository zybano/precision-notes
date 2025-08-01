import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DocumentFormat } from "@/services/transcription";
import { FileText, Stethoscope, Heart, Baby, Brain, Users, Bone, Search } from "lucide-react";

interface TemplateSelectionStepProps {
  selectedFormat: DocumentFormat;
  onFormatSelect: (format: DocumentFormat) => void;
  onNext: () => void;
}

const formatOptions = [
  {
    format: DocumentFormat.SOAP,
    label: "SOAP Note",
    description: "Structured format: Subjective, Objective, Assessment, Plan",
    icon: FileText,
    category: "General"
  },
  {
    format: DocumentFormat.HISTORY_AND_PHYSICAL,
    label: "History & Physical",
    description: "Comprehensive patient history and physical examination",
    icon: Stethoscope,
    category: "General"
  },
  {
    format: DocumentFormat.PROGRESS,
    label: "Progress Note",
    description: "Follow-up notes documenting patient progress",
    icon: FileText,
    category: "General"
  },
  {
    format: DocumentFormat.DISCHARGE,
    label: "Discharge Summary",
    description: "Summary of hospital stay and discharge instructions",
    icon: FileText,
    category: "General"
  },
  {
    format: DocumentFormat.CONSULTATION,
    label: "Consultation",
    description: "Specialist consultation documentation",
    icon: Users,
    category: "General"
  },
  {
    format: DocumentFormat.PROCEDURE,
    label: "Procedure Note",
    description: "Documentation of medical procedures performed",
    icon: FileText,
    category: "General"
  },
  {
    format: DocumentFormat.CARDIOLOGY,
    label: "Cardiology",
    description: "Specialized cardiac care documentation",
    icon: Heart,
    category: "Specialty"
  },
  {
    format: DocumentFormat.PEDIATRIC,
    label: "Pediatrics",
    description: "Child-focused medical documentation",
    icon: Baby,
    category: "Specialty"
  },
  {
    format: DocumentFormat.PSYCHIATRIC,
    label: "Psychiatry",
    description: "Mental health and psychiatric documentation",
    icon: Brain,
    category: "Specialty"
  },
  {
    format: DocumentFormat.NEUROLOGY,
    label: "Neurology",
    description: "Neurological assessment and documentation",
    icon: Brain,
    category: "Specialty"
  },
  {
    format: DocumentFormat.PRENATAL,
    label: "Prenatal",
    description: "Pregnancy care documentation",
    icon: Baby,
    category: "Specialty"
  },
  {
    format: DocumentFormat.FOLLOWUP,
    label: "Follow-up",
    description: "Routine follow-up visit documentation",
    icon: Users,
    category: "Specialty"
  },
  {
    format: DocumentFormat.ONCOLOGY,
    label: "Oncology",
    description: "Cancer care specialist consultation",
    icon: Stethoscope,
    category: "Specialty"
  }
];

const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({
  selectedFormat,
  onFormatSelect,
  onNext
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredOptions = formatOptions.filter(option => 
    searchTerm === "" || 
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const generalFormats = filteredOptions.filter(opt => opt.category === "General");
  const specialtyFormats = filteredOptions.filter(opt => opt.category === "Specialty");

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
              {generalFormats.map(option => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.format}
                    variant={selectedFormat === option.format ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col items-start text-left"
                    onClick={() => onFormatSelect(option.format)}
                  >
                    <div className="flex items-center mb-2 w-full">
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
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
              {specialtyFormats.map(option => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.format}
                    variant={selectedFormat === option.format ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col items-start text-left"
                    onClick={() => onFormatSelect(option.format)}
                  >
                    <div className="flex items-center mb-2 w-full">
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedFormat ? `Selected: ${formatOptions.find(opt => opt.format === selectedFormat)?.label}` : "Please select a template"}
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