import {useState} from "react";
import {DocumentFormat, LLMProvider, TranscriptionProvider} from "@/services/transcription";

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
