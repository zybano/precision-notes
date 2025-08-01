import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentFormat } from "@/services/transcription";
import { FileText, Stethoscope, Heart, Baby, Brain, Users, Bone } from "lucide-react";

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
    format: DocumentFormat.PROGRESS_NOTE,
    label: "Progress Note",
    description: "Follow-up notes documenting patient progress",
    icon: FileText,
    category: "General"
  },
  {
    format: DocumentFormat.DISCHARGE_SUMMARY,
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
    format: DocumentFormat.PROCEDURE_NOTE,
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
    format: DocumentFormat.PEDIATRICS,
    label: "Pediatrics",
    description: "Child-focused medical documentation",
    icon: Baby,
    category: "Specialty"
  },
  {
    format: DocumentFormat.PSYCHIATRY,
    label: "Psychiatry",
    description: "Mental health and psychiatric documentation",
    icon: Brain,
    category: "Specialty"
  },
  {
    format: DocumentFormat.ORTHOPEDICS,
    label: "Orthopedics",
    description: "Musculoskeletal and bone-related documentation",
    icon: Bone,
    category: "Specialty"
  },
  {
    format: DocumentFormat.OBSTETRICS,
    label: "Obstetrics",
    description: "Pregnancy and childbirth documentation",
    icon: Baby,
    category: "Specialty"
  },
  {
    format: DocumentFormat.GERIATRICS,
    label: "Geriatrics",
    description: "Elderly patient care documentation",
    icon: Users,
    category: "Specialty"
  },
  {
    format: DocumentFormat.ENDOCRINOLOGY,
    label: "Endocrinology",
    description: "Hormone and metabolic disorder documentation",
    icon: Stethoscope,
    category: "Specialty"
  }
];

const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({
  selectedFormat,
  onFormatSelect,
  onNext
}) => {
  const generalFormats = formatOptions.filter(opt => opt.category === "General");
  const specialtyFormats = formatOptions.filter(opt => opt.category === "Specialty");

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