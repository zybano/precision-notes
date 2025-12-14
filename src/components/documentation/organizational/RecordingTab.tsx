import OrganizationalRecordingInterface from "@/components/documentation/OrganizationalRecordingInterface";
import StickyNavigation from "@/components/documentation/StickyNavigation";
import {OrganizationalTranscriptionControllerReturn} from "@/hooks/useOrganizationalTranscriptionController";
import {DocumentFormat} from "@/services/transcription";
import {TranscriptionMode} from "@/hooks/useDocumentFormat";

interface RecordingTabProps {
  documentFormat: DocumentFormat;
  transcriptionLanguage: string;
  useSpeechModelNano: boolean;
  setUseSpeechModelNano: (value: boolean) => void;
  transcriptionMode: TranscriptionMode;
  notesAvailable: boolean;
  transcriptionControls: OrganizationalTranscriptionControllerReturn;
  onBackToTemplate: () => void;
  onGoToNotes: () => void;
}

const RecordingTab = ({
  documentFormat,
  transcriptionLanguage,
  useSpeechModelNano,
  setUseSpeechModelNano,
  transcriptionMode,
  notesAvailable,
  transcriptionControls,
  onBackToTemplate,
  onGoToNotes,
}: RecordingTabProps) => (
  <>
    <OrganizationalRecordingInterface
      isRecording={transcriptionControls.isRecording}
      isPaused={transcriptionControls.isPaused}
      recordingTime={transcriptionControls.recordingTime}
      startRecording={transcriptionControls.startRecording}
      pauseRecording={transcriptionControls.pauseRecording}
      stopRecording={transcriptionControls.handleStopRecording}
      formatTime={transcriptionControls.formatTime}
      isTranscribing={transcriptionControls.isTranscribing}
      transcriptResult={transcriptionControls.transcriptResult}
      onFileUpload={transcriptionControls.onFileUpload}
      documentFormat={documentFormat}
      transcriptionLanguage={transcriptionLanguage}
      useSpeechModelNano={useSpeechModelNano}
      setUseSpeechModelNano={setUseSpeechModelNano}
      transcriptionMode={transcriptionMode}
      streamingPreviewText={transcriptionControls.streamingTranscriptPreview}
    />

    <StickyNavigation
      leftContent={`Recording ${documentFormat.toUpperCase()} format`}
      rightActions={[
        {
          label: "Back to Template",
          onClick: onBackToTemplate,
          variant: "outline",
        },
      ]}
      primaryAction={{
        label: "Go to Notes",
        onClick: onGoToNotes,
        disabled: !notesAvailable,
      }}
    />
  </>
);

export default RecordingTab;
