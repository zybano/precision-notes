import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useTranscription } from "@/hooks/useTranscription";
import { TranscriptionProvider, TranscriptionResult } from "@/services/transcription";
import { UseFormReturn } from "react-hook-form";

interface TranscriptionControllerProps {
  form: UseFormReturn<any>;
  transcriptionProvider: TranscriptionProvider;
  useSpeechModelNano: boolean;
}

interface TranscriptionControllerReturn {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  startRecording: () => void;
  pauseRecording: () => void;
  handleStopRecording: () => void;
  formatTime: (seconds: number) => string;
  transcript: string;
  transcriptSummary: string;
  isTranscribing: boolean;
  showSummary: boolean;
  setShowSummary: (value: boolean) => void;
  transcriptResult: TranscriptionResult | null;
  onFileUpload: (file: File) => void;
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
}) => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    startRecording,
    pauseRecording,
    stopRecording: baseStopRecording,
    formatTime,
    audioChunks,
    resetRecording
  } = useAudioRecording();

  const handleTranscriptionComplete = (result: TranscriptionResult, summary?: string) => {
    form.setValue("transcriptResult", result);
    form.setValue("transcript", result.text);
    
    if (summary) {
      form.setValue("transcriptSummary", summary);
    }
    
    if (recordingTime > 0) {
      form.setValue("recordingTime", recordingTime);
    }
  };

  const {
    transcript,
    transcriptSummary,
    isTranscribing,
    showSummary,
    setShowSummary,
    transcriptResult,
    processRecording,
    handleFileUpload: baseHandleFileUpload,
    resetTranscription
  } = useTranscription(handleTranscriptionComplete);

  const handleStopRecording = async () => {
    baseStopRecording();
    if (audioChunks.length > 0) {
      await processRecording(audioChunks, {
        provider: transcriptionProvider,
        useSpeechModelNano
      });
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
    showSummary,
    setShowSummary,
    transcriptResult,
    onFileUpload,
    resetRecording,
    resetTranscription
  };
};

export default useTranscriptionController;
