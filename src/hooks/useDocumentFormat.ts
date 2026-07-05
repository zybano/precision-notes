import {useState} from "react";
import {DocumentFormat, LLMProvider, TranscriptionProvider} from '@/types/transcription';

export enum TranscriptionLanguage {
  ENGLISH = 'en-US',
  YORUBA = 'yo-NG',
  HAUSA = 'ha-NG',
  SWAHILI_KE = 'sw-KE',
  SWAHILI_TZ = 'sw-TZ',
  ZULU = 'zu-ZA',
  AFRIKAANS = 'af-ZA',
  AMHARIC = 'am-ET',
  FRENCH = 'fr-FR',
  ARABIC = 'ar-EG',
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
    setAcceptSuggestions
  };
};
