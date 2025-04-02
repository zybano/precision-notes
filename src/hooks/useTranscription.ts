
import { useState } from "react";
import { toast } from "sonner";
import {
  TranscriptionProvider,
  transcribeAudio,
  TranscriptionResult
} from "@/services/transcription";
import {generateBriefSummary, generatePatientSummary} from "@/services/summaryUtils";

interface TranscriptionOptions {
  provider: TranscriptionProvider;
  useSpeechModelNano: boolean;
}

export const useTranscription = (onTranscriptionComplete?: (result: TranscriptionResult) => void) => {
  const [transcript, setTranscript] = useState("");
  const [transcriptSummary, setTranscriptSummary] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [transcriptResult, setTranscriptResult] = useState<TranscriptionResult | null>(null);

  const processRecording = async (
    chunks: BlobPart[],
    options: TranscriptionOptions
  ) => {
    const audioBlob = new Blob(chunks, { type: 'audio/webm' });

    setIsTranscribing(true);
    toast.success("Processing Audio", {
      description: `Your recording is being transcribed with ${TranscriptionProvider[options.provider]}...`,
    });

    try {
      const result = await transcribeAudio(audioBlob, {
        provider: options.provider,
        speakerLabels: true,
        useSpeechModelNano: options.useSpeechModelNano
      });

      setTranscriptResult(result);
      setTranscript(result.text);
      
      const summary = generatePatientSummary(result.text);
      setTranscriptSummary(await summary);
      setShowSummary(true);

      if (result.text) {
        toast.success("Transcription Completed Successfully", {
          description: "Choose your document format to continue",
        });
      }
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(result);
      }

      return result;
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Transcription Error", {
        description: "There was an error transcribing your audio. Please try again.",
      });
      return null;
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = async (
    file: File,
    options: TranscriptionOptions
  ) => {
    return new Promise<TranscriptionResult | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const audioBlob = new Blob([new Uint8Array(e.target.result as ArrayBuffer)], { type: 'audio/webm' });
        const chunks = [audioBlob];
        const result = await processRecording(chunks, options);
        resolve(result);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  return {
    transcript,
    transcriptSummary,
    isTranscribing,
    showSummary,
    setShowSummary,
    transcriptResult,
    processRecording,
    handleFileUpload
  };
};
