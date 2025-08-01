import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PatientSummaryResult } from "@/services/summaryUtils";
import { UseFormReturn } from "react-hook-form";
import { DocumentFormat } from "@/services/transcription";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface DocumentVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<any>;
  patientInfo: PatientSummaryResult['patientInfo'] | null;
  documentFormat: DocumentFormat;
  onConfirm: () => void;
}

const DocumentVerificationDialog: React.FC<DocumentVerificationDialogProps> = ({
  open,
  onOpenChange,
  form,
  patientInfo,
  documentFormat,
  onConfirm
}) => {
  const [localPatientName, setLocalPatientName] = useState("");
  const [localDocumentFormat, setLocalDocumentFormat] = useState<DocumentFormat>(documentFormat);
  const [hasManuallyEdited, setHasManuallyEdited] = useState(false);

  // Initialize form values from patientInfo when the dialog opens
  useEffect(() => {
    if (open && patientInfo) {
      setLocalPatientName(patientInfo.name !== "Unknown" ? patientInfo.name : "");
    }
    if (open) {
      setLocalDocumentFormat(documentFormat);
    }
  }, [open, patientInfo, documentFormat]);

  const handleConfirm = () => {
    // Update the form with verified values
    form.setValue("patientName", localPatientName);
    form.setValue("documentFormat", localDocumentFormat);
    
    // Mark that the information has been verified
    form.setValue("infoVerified", true);
    
    // Call the confirm callback
    onConfirm();
    
    // Close the dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Document Information</DialogTitle>
          <DialogDescription>
            Please verify the extracted information before saving the document.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="patientName" className="text-right">
              Patient Name
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 ml-1 inline-block text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This name was {hasManuallyEdited ? "manually entered" : "automatically extracted"} from the transcript.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="patientName"
              value={localPatientName}
              onChange={(e) => {
                setLocalPatientName(e.target.value);
                setHasManuallyEdited(true);
              }}
              placeholder="Enter patient name"
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="documentFormat" className="text-right">
              Document Format
            </Label>
            <select
              id="documentFormat"
              value={localDocumentFormat}
              onChange={(e) => setLocalDocumentFormat(e.target.value as DocumentFormat)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
            >
              <option value={DocumentFormat.SOAP}>SOAP Note</option>
              <option value={DocumentFormat.HISTORY_AND_PHYSICAL}>History & Physical</option>
              <option value={DocumentFormat.PROGRESS}>Progress Note</option>
              <option value={DocumentFormat.DISCHARGE}>Discharge Summary</option>
              <option value={DocumentFormat.CONSULTATION}>Consultation Note</option>
              <option value={DocumentFormat.PROCEDURE}>Procedure Note</option>
              <option value={DocumentFormat.PEDIATRIC}>Pediatric Note</option>
              <option value={DocumentFormat.CARDIOLOGY}>Cardiology Note</option>
              <option value={DocumentFormat.PSYCHIATRIC}>Psychiatric Note</option>
              <option value={DocumentFormat.PULMONARY}>Pulmonary Note</option>
              <option value={DocumentFormat.PRENATAL}>Prenatal Note</option>
              <option value={DocumentFormat.NEUROLOGY}>Neurology Note</option>
              <option value={DocumentFormat.ONCOLOGY}>Oncology Note</option>
              <option value={DocumentFormat.DICTATION}>Dictation (Raw Transcript)</option>
            </select>
          </div>

          {patientInfo &&
              (patientInfo.age || patientInfo.gender || (patientInfo.otherIdentifiers && patientInfo.otherIdentifiers.length > 0)) && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="additional-info">
                      <AccordionTrigger>Additional Patient Information</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          {patientInfo.age && (
                              <div>
                                <span className="font-semibold">Age:</span> {patientInfo.age}
                              </div>
                          )}

                          {patientInfo.gender && (
                              <div>
                                <span className="font-semibold">Gender:</span> {patientInfo.gender}
                              </div>
                          )}

                          {patientInfo.otherIdentifiers && patientInfo.otherIdentifiers.length > 0 && (
                              <div>
                                <span className="font-semibold">Other Identifiers:</span>
                                <ul className="list-disc pl-5 mt-1">
                                  {patientInfo.otherIdentifiers.map((identifier, index) => (
                                      <li key={index}>{identifier}</li>
                                  ))}
                                </ul>
                              </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
              )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleConfirm}>
            Confirm & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentVerificationDialog;