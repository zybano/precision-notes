import {useState} from "react";
import {DocumentFormat, LLMProvider, TranscriptionProvider} from "@/services/transcription";

export enum TranscriptionMode {
  STANDARD = 'standard',
  STREAMING = 'streaming',
}

export enum TranscriptionLanguage {
  ENGLISH = 'en_us',
  YORUBA = 'yo',
  HAUSA = 'ha'
}

export const useDocumentFormat = () => {
  const [transcriptionProvider, setTranscriptionProvider] = useState<TranscriptionProvider>(
    TranscriptionProvider.ASSEMBLYAI
  );
  const [llmProvider, setLlmProvider] = useState<LLMProvider>(LLMProvider.OPENAI);
  const [documentFormat, setDocumentFormat] = useState<DocumentFormat>(DocumentFormat.SOAP);
  const [useSpeechModelNano, setUseSpeechModelNano] = useState(false);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<TranscriptionLanguage>(TranscriptionLanguage.ENGLISH);
  const [acceptSuggestions, setAcceptSuggestions] = useState(true);
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>(TranscriptionMode.STANDARD);

  return {
    transcriptionProvider,
    setTranscriptionProvider,
    llmProvider,
    setLlmProvider,
    documentFormat,
    setDocumentFormat,
    useSpeechModelNano,
    setUseSpeechModelNano,
    transcriptionLanguage,
    setTranscriptionLanguage,
    acceptSuggestions,
    setAcceptSuggestions,
    transcriptionMode,
    setTranscriptionMode,
  };
};
