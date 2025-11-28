import {RefObject} from "react";
import ReactMarkdown from "react-markdown";
import {UseFormRegister} from "react-hook-form";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Loader2, Eye} from "lucide-react";
import UtterancesDisplay from "@/components/documentation/UtterancesDisplay";
import ConsultationSummary from "@/components/documentation/ConsultationSummary";
import B2BProcessingInfo from "@/components/documentation/B2BProcessingInfo";
import UsageInfo from "@/components/documentation/UsageInfo";
import StickyNavigation from "@/components/documentation/StickyNavigation";
import {TranscriptionResult} from "@/services/transcription";

interface NotesTabProps {
  transcriptText?: string;
  onTranscriptChange: (value: string) => void;
  register: UseFormRegister<any>;
  notesContent?: string;
  isEditMode: boolean;
  toggleEditMode: () => void;
  isProcessing: boolean;
  transcriptResult?: TranscriptionResult | null;
  consultationSummary?: string;
  usage?: any;
  creditsUsed?: number;
  processingTimeMs?: number;
  organizationId?: string;
  requestId?: string;
  documentFormat: string;
  onBackToRecording: () => void;
  onChangeFormat: () => void;
  onStartNewDocument: () => void;
  onGoToExport: () => void;
  printRef: RefObject<HTMLDivElement>;
}

const NotesTab = ({
  transcriptText,
  onTranscriptChange,
  register,
  notesContent,
  isEditMode,
  toggleEditMode,
  isProcessing,
  transcriptResult,
  consultationSummary,
  usage,
  creditsUsed,
  processingTimeMs,
  organizationId,
  requestId,
  documentFormat,
  onBackToRecording,
  onChangeFormat,
  onStartNewDocument,
  onGoToExport,
  printRef,
}: NotesTabProps) => (
  <>
    <div className="space-y-4 md:space-y-6">
      {transcriptText && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Label htmlFor="transcript" className="text-lg font-medium">
              Review Transcript
            </Label>
            <div className="text-sm text-muted-foreground">
              Edit transcript before regenerating with a new format
            </div>
          </div>
          <Textarea
            id="transcript"
            value={transcriptText}
            onChange={(e) => onTranscriptChange(e.target.value)}
            placeholder="Your transcript will appear here..."
            className="min-h-[160px] sm:min-h-[220px] font-mono text-sm"
            disabled={isProcessing}
          />
        </div>
      )}

      {transcriptResult?.utterances && transcriptResult.utterances.length > 0 && (
        <UtterancesDisplay utterances={transcriptResult.utterances} className="mb-4" />
      )}

      {consultationSummary && (
        <ConsultationSummary summary={consultationSummary} className="mb-4" />
      )}

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Label htmlFor="notes" className="text-lg font-medium flex items-center">
            Generated Notes
            {isProcessing && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
          </Label>
          <div className="flex items-center justify-end">
           <Button
             type="button"
             onClick={toggleEditMode}
             variant="outline"
             size="sm"
             className="flex items-center"
             disabled={isProcessing}
           >
             <Eye className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{isEditMode ? "Preview" : "Edit"}</span>
              <span className="sm:hidden">{isEditMode ? "Preview" : "Edit"}</span>
            </Button>
          </div>
        </div>

        {isProcessing ? (
          <div className="border rounded-md p-3 md:p-4 min-h-[240px] sm:min-h-[320px] flex items-center justify-center bg-muted/30">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Generating Document...</p>
                <p className="text-sm text-muted-foreground">
                  Processing your transcript with the new format
                </p>
              </div>
            </div>
          </div>
        ) : isEditMode ? (
          <Textarea
            id="notes"
            className="min-h-[240px] sm:min-h-[320px] font-mono text-sm resize-y"
            {...register("notes")}
          />
        ) : (
          <div
            ref={printRef}
            className="border rounded-md p-3 md:p-4 min-h-[240px] sm:min-h-[320px] overflow-y-auto prose prose-sm max-w-none"
          >
            <ReactMarkdown>{notesContent || ''}</ReactMarkdown>
          </div>
        )}
      </div>

      <B2BProcessingInfo
        creditsUsed={creditsUsed}
        processingTimeMs={processingTimeMs}
        organizationId={organizationId}
        requestId={requestId}
      />

      {usage && <UsageInfo usage={usage} className="mt-4" />}
    </div>

    <StickyNavigation
      leftContent={`${documentFormat.toUpperCase()} Notes - ${notesContent?.length || 0} characters`}
      rightActions={[
        {
          label: "Back to Recording",
          onClick: onBackToRecording,
          variant: "outline",
          disabled: isProcessing,
        },
        {
          label: "Change Format",
          onClick: onChangeFormat,
          variant: "outline",
          disabled: isProcessing,
        },
        {
          label: "New Doc",
          onClick: onStartNewDocument,
          variant: "outline",
          disabled: isProcessing,
        },
      ]}
      primaryAction={{
        label: "Export Options",
        onClick: onGoToExport,
        disabled: isProcessing,
      }}
    />
  </>
);

export default NotesTab;
