import {useState} from "react";
import {toast} from "sonner";
import { TranscriptionProvider, TranscriptionResult} from "@/services/transcription";
import { PatientSummaryResult} from "@/services/summaryUtils";


interface TranscriptionOptions {
  provider: TranscriptionProvider;
  useSpeechModelNano: boolean;
}

export const useTranscription = (onTranscriptionComplete?: (
  result: TranscriptionResult,
  summary?: string,
  patientInfo?: PatientSummaryResult['patientInfo']
) => void) => {
  const [transcript, setTranscript] = useState("");
  const [transcriptSummary, setTranscriptSummary] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [transcriptResult, setTranscriptResult] = useState<TranscriptionResult | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientSummaryResult['patientInfo'] | null>(null);



  return {
    transcript,
    transcriptSummary,
    patientInfo,
    isTranscribing,
    showSummary,
    setShowSummary,
    transcriptResult
  };
};
