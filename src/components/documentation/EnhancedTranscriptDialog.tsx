import React, {useMemo} from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Edit} from "lucide-react";
import EnhancedTranscriptDisplay from "./EnhancedTranscriptDisplay";
import {Document, PatientInfo} from "./DocumentTypes";
import {TranscriptionResult} from "@/services/transcription";
import {UseFormReturn} from "react-hook-form";
import {updateDocument} from "@/services/supabaseSetup";
import {toast} from "sonner";

interface EnhancedTranscriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDocument: Document | null;
  parsedTranscript: TranscriptionResult | null;
  transcriptText: string;
  transcriptSummary: string;
  formattedNotes: string;
  showSummary: boolean;
  setShowSummary: (show: boolean) => void;
  form: UseFormReturn<any>;
  onEditDocument: (doc: Document) => void;
  documentFormat?: string;
  onSaveFormat?: (formatName: string, content: string) => Promise<void>;
  onRefreshDocuments?: () => Promise<void>;
}

const EnhancedTranscriptDialog: React.FC<EnhancedTranscriptDialogProps> = ({
                                                                             open,
                                                                             onOpenChange,
                                                                             selectedDocument,
                                                                             parsedTranscript,
                                                                             transcriptText,
                                                                             transcriptSummary,
                                                                             formattedNotes,
                                                                             showSummary,
                                                                             setShowSummary,
                                                                             form,
                                                                             onEditDocument,
                                                                             documentFormat,
                                                                             onSaveFormat,
                                                                             onRefreshDocuments
                                                                           }) => {
  // Extract patient info from transcript data if available
  const extractedPatientInfo: PatientInfo | null = useMemo(() => {
    if (!parsedTranscript) return null;

    try {
      // If we already have patientInfo from the transcript data, use it
      if ('patientInfo' in parsedTranscript) {
        return parsedTranscript.patientInfo as PatientInfo;
      }

      // Otherwise, try to extract basic info from the transcript summary
      if (transcriptSummary) {
        // Simple pattern matching to extract patient name
        const nameMatch = transcriptSummary.match(/patient(?:'s)? name is ([\w\s]+)[,\.\n]/i) ||
            transcriptSummary.match(/patient: ([\w\s]+)[,\.\n]/i);

        const ageMatch = transcriptSummary.match(/([0-9]+)[- ]year[s]?[- ]old/i) ||
            transcriptSummary.match(/age:?\s*([0-9]+)/i);

        const genderMatch = transcriptSummary.match(/\b(male|female|non-binary)\b/i);

        if (nameMatch || ageMatch || genderMatch) {
          return {
            name: nameMatch ? nameMatch[1].trim() : "Unknown",
            age: ageMatch ? ageMatch[1] : undefined,
            gender: genderMatch ? genderMatch[1] : undefined
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error extracting patient info:", error);
      return null;
    }
  }, [parsedTranscript, transcriptSummary]);

  // If we found patient info, add it to the form data when editing
  const handleEditWithData = () => {
    if (selectedDocument) {
      // Prepare transcript data with patient info if we have it
      if (extractedPatientInfo && parsedTranscript) {
        // Add patient info to transcript data before passing to edit handler
        const enhancedTranscript = {
          ...parsedTranscript,
          patientInfo: extractedPatientInfo
        };

        // Update the form before opening the document
        form.setValue('patientInfo', extractedPatientInfo);

        // Update the transcript result in the form
        form.setValue('transcriptResult', enhancedTranscript);
      }

      // Call the main edit handler
      onEditDocument(selectedDocument);
      onOpenChange(false);
    }
  };

  // Handle updating the record
  const handleUpdateRecord = async () => {
    if (!selectedDocument?.id) {
      toast.error("No document selected to update");
      return;
    }

    try {
      // Prepare the data for update
      const updateData = {
        transcript_data: transcriptText || null,
        summary: transcriptSummary || null,
        notes: formattedNotes || null
      };

      // Call the updateDocument function from supabaseSetup
      const { success, error } = await updateDocument(selectedDocument.id, updateData);

      if (success) {
        toast.success("Document updated successfully");
      } else {
        toast.error(`Failed to update document: ${error}`);
      }
    } catch (err) {
      console.error("Error updating document:", err);
      toast.error("An unexpected error occurred");
    }
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument?.patient_name} - Transcribed Conversation
            </DialogTitle>
            <DialogDescription>
              Transcribed on {selectedDocument?.updated_at ? new Date(selectedDocument.updated_at).toLocaleString() : ""}
              {extractedPatientInfo && extractedPatientInfo.name !== "Unknown" && (
                  <div className="mt-1 text-sm">
                    <span className="font-medium">Patient:</span> {extractedPatientInfo.name}
                    {extractedPatientInfo.age && `, ${extractedPatientInfo.age} years old`}
                    {extractedPatientInfo.gender && `, ${extractedPatientInfo.gender}`}
                  </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex-1 overflow-hidden">
            {parsedTranscript && (
                <EnhancedTranscriptDisplay
                    transcriptResult={parsedTranscript}
                    transcript={transcriptText}
                    transcriptSummary={transcriptSummary}
                    formattedNotes={formattedNotes}
                    patientInfo={extractedPatientInfo}
                    showSummary={showSummary}
                    setShowSummary={setShowSummary}
                    form={form}
                    documentId={selectedDocument?.id}
                />
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
            >
              Close
            </Button>

            <Button
                variant="default"
                className="flex items-center gap-2"
                onClick={handleUpdateRecord}
            >
              <Edit className="h-4 w-4" />
              Update Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
};

export default EnhancedTranscriptDialog;
