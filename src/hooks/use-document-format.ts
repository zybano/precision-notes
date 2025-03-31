
import { useState } from 'react';
import { DocumentFormat, LLMProvider } from "@/services/transcription";

export const useDocumentFormat = () => {
  const [documentFormat, setDocumentFormat] = useState<DocumentFormat>(
    DocumentFormat.SOAP
  );
  
  const [llmProvider, setLlmProvider] = useState<LLMProvider>(
    LLMProvider.OPENAI
  );

  return {
    documentFormat,
    setDocumentFormat,
    llmProvider,
    setLlmProvider
  };
};
