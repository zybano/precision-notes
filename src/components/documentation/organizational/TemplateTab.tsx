import TemplateSelectionStep from "@/components/documentation/TemplateSelectionStep";
import {DocumentFormat} from "@/services/transcription";
import {TranscriptionLanguage, TranscriptionMode} from "@/hooks/useDocumentFormat";

interface TemplateTabProps {
  documentFormat: DocumentFormat;
  transcriptionLanguage: TranscriptionLanguage;
  useSpeechModelNano: boolean;
  setUseSpeechModelNano: (value: boolean) => void;
  acceptSuggestions: boolean;
  setAcceptSuggestions: (value: boolean) => void;
  transcriptionMode: TranscriptionMode;
  setTranscriptionMode: (mode: TranscriptionMode) => void;
  isRegenerateMode: boolean;
  isProcessing: boolean;
  onFormatSelect: (format: DocumentFormat) => void;
  onLanguageSelect: (language: TranscriptionLanguage) => void;
  onNext: (selectedFormat?: DocumentFormat) => void;
}

const TemplateTab = ({
  documentFormat,
  transcriptionLanguage,
  useSpeechModelNano,
  setUseSpeechModelNano,
  acceptSuggestions,
  setAcceptSuggestions,
  transcriptionMode,
  setTranscriptionMode,
  isRegenerateMode,
  isProcessing,
  onFormatSelect,
  onLanguageSelect,
  onNext,
}: TemplateTabProps) => (
  <TemplateSelectionStep
    selectedFormat={documentFormat}
    onFormatSelect={onFormatSelect}
    transcriptionLanguage={transcriptionLanguage}
    onLanguageSelect={onLanguageSelect}
    useSpeechModelNano={useSpeechModelNano}
    setUseSpeechModelNano={setUseSpeechModelNano}
    acceptSuggestions={acceptSuggestions}
    setAcceptSuggestions={setAcceptSuggestions}
    transcriptionMode={transcriptionMode}
    onTranscriptionModeChange={setTranscriptionMode}
    isRegenerateMode={isRegenerateMode}
    isLoading={isProcessing}
    onNext={onNext}
  />
);

export default TemplateTab;
