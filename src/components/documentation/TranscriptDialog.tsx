
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TranscriptDisplay from "./TranscriptDisplay";
import { Document } from "./DocumentTypes";
import { TranscriptionResult } from "@/services/transcription";
import { UseFormReturn } from "react-hook-form";

interface TranscriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDocument: Document | null;
  parsedTranscript: TranscriptionResult | null;
  transcriptText: string;
  transcriptSummary: string;
  showSummary: boolean;
  setShowSummary: (show: boolean) => void;
  form: UseFormReturn<any>;
  onEditDocument: (doc: Document) => void;
}

const TranscriptDialog: React.FC<TranscriptDialogProps> = ({
  open,
  onOpenChange,
  selectedDocument,
  parsedTranscript,
  transcriptText,
  transcriptSummary,
  showSummary,
  setShowSummary,
  form,
  onEditDocument
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedDocument?.patient_name} - Transcribed Conversation
          </DialogTitle>
          <DialogDescription>
            Transcribed on {selectedDocument?.updated_at ? new Date(selectedDocument.updated_at).toLocaleString() : ""}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 flex-1 overflow-hidden">
          {parsedTranscript && (
            <TranscriptDisplay
              transcriptResult={parsedTranscript}
              transcript={transcriptText}
              transcriptSummary={transcriptSummary}
              showSummary={showSummary}
              setShowSummary={setShowSummary}
              form={form}
            />
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={() => {
            if (selectedDocument) {
              onEditDocument(selectedDocument);
              onOpenChange(false);
            }
          }}>
            Edit Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TranscriptDialog;
