
import { useState } from "react";
import { LLMProvider, DocumentFormat } from "@/services/transcription";

export const useDocumentFormat = () => {
  const [transcriptionProvider, setTranscriptionProvider] = useState<TranscriptionProvider>(
    TranscriptionProvider.ASSEMBLYAI
  );
  const [llmProvider, setLlmProvider] = useState<LLMProvider>(LLMProvider.OPENAI);
  const [documentFormat, setDocumentFormat] = useState<DocumentFormat>(DocumentFormat.SOAP);
  const [useSpeechModelNano, setUseSpeechModelNano] = useState(false);

  return {
    transcriptionProvider,
    setTranscriptionProvider,
    llmProvider,
    setLlmProvider,
    documentFormat,
    setDocumentFormat,
    useSpeechModelNano,
    setUseSpeechModelNano
  };
};

// Import at the top of the file to ensure types are available
import { TranscriptionProvider } from "@/services/transcription";
