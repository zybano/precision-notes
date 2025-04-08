
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

// This is a custom hook, not a component
export const useTranscriptionController = ({
  form,
  transcriptionProvider,
  useSpeechModelNano
}: TranscriptionControllerProps): TranscriptionControllerReturn => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    startRecording,
    pauseRecording,
    stopRecording,
    formatTime,
    audioChunks,
    resetRecording
  } = useAudioRecording();

  const {
    transcript,
    transcriptSummary,
    isTranscribing,
    showSummary,
    setShowSummary,
    transcriptResult,
    processRecording,
    handleFileUpload,
    resetTranscription
  } = useTranscription((result) => {
    // When transcription is complete, update the form
    form.setValue("notes", result.text);
    form.setValue("transcript", result.text);
    form.setValue("transcriptResult", result);
    
    // Ensure the transcriptSummary is set in the form
    if (transcriptSummary) {
      form.setValue("transcriptSummary", transcriptSummary);
    }
    
    // Include the recording time in the form
    form.setValue("recordingTime", recordingTime);
  });

  // Handle processing audio when recording stops
  const handleStopRecording = () => {
    stopRecording();
    if (audioChunks.length > 0) {
      processRecording(audioChunks, {
        provider: transcriptionProvider,
        useSpeechModelNano
      }).then(result => {
        if (result && transcriptSummary) {
          // Update the form with the latest summary
          form.setValue("transcriptSummary", transcriptSummary);
        }
      });
    }
  };

  // Handle file upload
  const onFileUpload = (file: File) => {
    handleFileUpload(file, {
      provider: transcriptionProvider,
      useSpeechModelNano
    }).then(result => {
      if (result && transcriptSummary) {
        // Update the form with the latest summary 
        form.setValue("transcriptSummary", transcriptSummary);
      }
    });
  };

  return {
    isRecording,
    isPaused,
    recordingTime,
    startRecording,
    pauseRecording,
    handleStopRecording,
    formatTime,
    transcript,
    transcriptSummary,
    isTranscribing,
    showSummary,
    setShowSummary,
    transcriptResult,
    onFileUpload,
    resetRecording,
    resetTranscription
  };
};

export default useTranscriptionController;
