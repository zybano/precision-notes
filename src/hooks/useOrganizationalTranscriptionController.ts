
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useTranscription } from "@/hooks/useTranscription";
import { TranscriptionProvider, TranscriptionResult } from "@/services/transcription";
import { PatientSummaryResult } from "@/services/summaryUtils";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface OrganizationalTranscriptionControllerProps {
  form: UseFormReturn<any>;
  transcriptionProvider: TranscriptionProvider;
  useSpeechModelNano: boolean;
}

interface OrganizationalTranscriptionControllerReturn {
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

export const useOrganizationalTranscriptionController = ({
  form,
  transcriptionProvider,
  useSpeechModelNano,
}: {
  form: UseFormReturn<any>;
  transcriptionProvider: TranscriptionProvider;
  useSpeechModelNano: boolean;
}): OrganizationalTranscriptionControllerReturn => {
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
    resetTranscription,
  } = useTranscription(handleTranscriptionComplete);

  const startRecording = async () => {
    baseStartRecording();
  };

  const handleStopRecording = async () => {
    const chunks = [...audioChunks];
    baseStopRecording();

    if (chunks.length > 0) {
      try {
        await processOrganizationalRecording(chunks, {
          provider: transcriptionProvider,
          useSpeechModelNano,
        });
      } catch (error) {
        console.error("Error processing recording:", error);
      }
    }
  };

  const onFileUpload = async (file: File) => {
    const result = await baseHandleFileUpload(file, {
      provider: transcriptionProvider,
      useSpeechModelNano,
    });

    if (result) {
      form.setValue("recordingTime", 0);
    }

    return result;
  };

  const processOrganizationalRecording = async (audioChunks: Blob[], options: any) => {
    if (audioChunks.length === 0) {
      toast.error("No audio data was captured for transcription.");
      return;
    }

    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    formData.append("document_format", form.getValues("documentFormat") || "soap");
    formData.append("languageCode", "en_us");
    formData.append("useSpeechModelNano", options.useSpeechModelNano.toString());
    formData.append("model_name", "gpt-4-turbo");
    formData.append("requestId", crypto.randomUUID());

    try {
      const response = await fetch("https://rdjzeayewevditzekveb.supabase.co/functions/v1/b2b-combined-request", {
        method: "POST",
        headers: {
          "x-api-key": "pn_mZ8/VeJQPMQBvGQdjUEcL5avl2Un8g8x",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle the B2B function response format
      if (result.success && result.transcription) {
        // Extract transcription from B2B response
        const transcriptionResult: TranscriptionResult = {
          text: result.transcription.text,
          utterances: result.transcription.utterances || [],
          isMock: result.transcription.isMock || false,
          provider: result.transcription.provider || TranscriptionProvider.ASSEMBLYAI
        };
        
        // Call the completion handler with transcription result
        handleTranscriptionComplete(transcriptionResult);
        
        // If there's a generated document, set it in the form
        if (result.document) {
          form.setValue("notes", result.document);
          form.setValue("generatedDocument", result.document);
        }
        
        toast.success("Audio processed successfully!");
      } else {
        throw new Error(result.error || "Failed to process audio");
      }
    } catch (error) {
      console.error("Error processing organizational recording:", error);
      toast.error("Failed to process your audio recording.");
    }
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
    resetTranscription,
  };
};
