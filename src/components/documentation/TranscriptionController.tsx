import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useTranscription } from "@/hooks/useTranscription";
import { TranscriptionProvider, TranscriptionResult } from "@/services/transcription";
import { PatientSummaryResult } from "@/services/summaryUtils";
import { UseFormReturn } from "react-hook-form";
import { hasEnoughCredits, deductCredits, getCredits } from "@/services/payment/paymentService";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface TranscriptionControllerProps {
  form: UseFormReturn<any>;
  transcriptionProvider: TranscriptionProvider;
  useSpeechModelNano: boolean;
}

interface TranscriptionControllerReturn {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  handleStopRecording: () => void;
  formatTime: (seconds: number) => string;
  transcript: string;
  transcriptSummary: string;
  patientInfo: PatientSummaryResult['patientInfo'] | null;
  isTranscribing: boolean;
  showSummary: boolean;
  setShowSummary: (value: boolean) => void;
  transcriptResult: TranscriptionResult | null;
  onFileUpload: (file: File) => Promise<TranscriptionResult | null>;
  resetRecording: () => void;
  resetTranscription: () => void;
  creditBalance?: number;
  checkingCredits: boolean;
}

export const useTranscriptionController = ({
  form,
  transcriptionProvider,
  useSpeechModelNano
}: {
  form: UseFormReturn<any>;
  transcriptionProvider: TranscriptionProvider;
  useSpeechModelNano: boolean;
}): TranscriptionControllerReturn => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    startRecording: baseStartRecording,
    pauseRecording,
    stopRecording: baseStopRecording,
    formatTime,
    audioChunks,
    resetRecording
  } = useAudioRecording();
  
  const [checkingCredits, setCheckingCredits] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | undefined>(undefined);

  const handleTranscriptionComplete = (
    result: TranscriptionResult, 
    summary?: string,
    patientInfo?: PatientSummaryResult['patientInfo']
  ) => {
    form.setValue("transcriptResult", result);
    form.setValue("transcript", result.text);
    
    if (summary) {
      form.setValue("transcriptSummary", summary);
    }
    
    if (patientInfo) {
      form.setValue("patientInfo", patientInfo);
      
      // If we have a valid patient name, set it in the form
      if (patientInfo.name && patientInfo.name !== "Unknown") {
        form.setValue("patientName", patientInfo.name);
      }
    }
    
    if (recordingTime > 0) {
      form.setValue("recordingTime", recordingTime);
    }
    
    // Deduct 1 credit for the transcription
    deductCredits(1).then(({ success, balance }) => {
      if (success && balance !== undefined) {
        setCreditBalance(balance);
        toast.success(`1 credit used for transcription. ${balance} credits remaining.`);
      }
    });
  };

  const {
    transcript,
    transcriptSummary,
    patientInfo,
    isTranscribing,
    showSummary,
    setShowSummary,
    transcriptResult,
    processRecording,
    handleFileUpload: baseHandleFileUpload,
    resetTranscription
  } = useTranscription(handleTranscriptionComplete);

  // Start recording with credit check
  const startRecording = async () => {
    setCheckingCredits(true);
    try {
      const hasCredits = await hasEnoughCredits(1);
      if (!hasCredits) {
        toast.error("Insufficient credits", {
          description: "You need at least 1 credit to create a new transcription.",
          action: {
            label: "Get Credits",
            onClick: () => window.location.href = '/consultation-purchase',
          },
        });
        return;
      }
      
      // If we have credits, start recording
      baseStartRecording();
    } catch (error) {
      console.error("Error checking credits:", error);
      toast.error("Could not verify credits. Please try again.");
    } finally {
      setCheckingCredits(false);
    }
  };

  const handleStopRecording = async () => {
    const chunks = [...audioChunks]; // Create a copy of the current chunks
    baseStopRecording();
    
    // Only process if we have audio to process
    if (chunks.length > 0) {
      try {
        await processRecording(chunks, {
          provider: transcriptionProvider,
          useSpeechModelNano
        });
      } catch (error) {
        console.error("Error processing recording:", error);
      }
    }
  };

  const onFileUpload = async (file: File) => {
    // Check credits before processing the file
    setCheckingCredits(true);
    try {
      const hasCredits = await hasEnoughCredits(1);
      if (!hasCredits) {
        toast.error("Insufficient credits", {
          description: "You need at least 1 credit to process this audio file.",
          action: {
            label: "Get Credits",
            onClick: () => window.location.href = '/consultation-purchase',
          },
        });
        return null;
      }
      
      const result = await baseHandleFileUpload(file, {
        provider: transcriptionProvider,
        useSpeechModelNano
      });
      
      if (result) {
        form.setValue("recordingTime", 0);
      }
      
      return result;
    } finally {
      setCheckingCredits(false);
    }
  };
  
  // Load credit balance on component mount
  useEffect(() => {
    const loadCredits = async () => {
      try {
        const { success, balance } = await getCredits();
        if (success) {
          setCreditBalance(balance);
        }
      } catch (error) {
        console.error("Error loading credits:", error);
      }
    };
    
    loadCredits();
  }, []);

  return {
    isRecording,
    isPaused,
    recordingTime,
    isTranscribing,
    startRecording,
    pauseRecording,
    handleStopRecording,
    formatTime,
    transcript,
    transcriptSummary,
    patientInfo,
    showSummary,
    setShowSummary,
    transcriptResult,
    onFileUpload,
    resetRecording,
    resetTranscription,
    creditBalance,
    checkingCredits
  };
};

export default useTranscriptionController;
