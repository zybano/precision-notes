import {useAudioRecording} from "@/hooks/useAudioRecording";
import {useTranscription} from "@/hooks/useTranscription";
import {TranscriptionProvider, TranscriptionResult} from "@/services/transcription";
import {PatientSummaryResult} from "@/services/summaryUtils";
import {UseFormReturn} from "react-hook-form";
import {toast} from "sonner";


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
    resetRecording,
    hasAudioData
  } = useAudioRecording();
  

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

  const startRecording = async () => {
    baseStartRecording();
  };

  const handleStopRecording = async () => {
    const chunks = [...audioChunks]; // Create a copy of the current chunks
    baseStopRecording();
    
    // Check if we have actual audio data
    if (!hasAudioData || chunks.length === 0) {
      toast.error("No audio captured", {
        description: "Please make sure your microphone is working and you've spoken during recording."
      });
      return;
    }
    
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
    const result = await baseHandleFileUpload(file, {
      provider: transcriptionProvider,
      useSpeechModelNano
    });
    
    if (result) {
      form.setValue("recordingTime", 0);
    }
    
    return result;
  };
  

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
    resetTranscription
  };
};

export default useTranscriptionController;
