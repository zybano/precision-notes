
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { DocumentFormat } from "@/services/transcription";

interface DocumentFormatSelectorProps {
  documentFormat: DocumentFormat;
  setDocumentFormat: (format: DocumentFormat) => void;
}

const DocumentFormatSelector: React.FC<DocumentFormatSelectorProps> = ({
  documentFormat,
  setDocumentFormat
}) => {
  const formatOptions = [
    { format: DocumentFormat.SOAP, label: "SOAP Note" },
    { format: DocumentFormat.HISTORY_AND_PHYSICAL, label: "History & Physical" },
    { format: DocumentFormat.PROGRESS_NOTE, label: "Progress Note" },
    { format: DocumentFormat.DISCHARGE_SUMMARY, label: "Discharge Summary" },
    { format: DocumentFormat.CONSULTATION, label: "Consultation" },
    { format: DocumentFormat.PROCEDURE_NOTE, label: "Procedure Note" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Document Configuration
        </CardTitle>
        <CardDescription>
          Configure how you want the consultation documents to be formatted
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Document Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formatOptions.map(option => (
              <Button
                key={option.format}
                variant={documentFormat === option.format ? "default" : "outline"}
                className="justify-start"
                onClick={() => setDocumentFormat(option.format)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentFormatSelector;
