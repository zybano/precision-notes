
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

export const useTranscription = (onTranscriptionComplete?: (result: TranscriptionResult, summary?: string) => void) => {
  const [transcript, setTranscript] = useState("");
  const [transcriptSummary, setTranscriptSummary] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [transcriptResult, setTranscriptResult] = useState<TranscriptionResult | null>(null);

  const processRecording = async (
    chunks: BlobPart[],
    options: TranscriptionOptions
  ) => {
    if (chunks.length === 0) {
      toast.error("No audio data", {
        description: "No audio data was captured for transcription.",
      });
      return null;
    }

    const audioBlob = new Blob(chunks, { type: 'audio/webm' });

    setIsTranscribing(true);
    toast.info("Processing audio", {
      description: `Transcribing your audio...`,
    });

    try {
      const result = await transcribeAudio(audioBlob, {
        provider: options.provider,
        speakerLabels: true,
        useSpeechModelNano: options.useSpeechModelNano
      });

      setTranscriptResult(result);
      setTranscript(result.text);
      
      // Generate and set transcript summary
      let summary = "";
      try {
        summary = await generatePatientSummary(result.text);
        setTranscriptSummary(summary);
      } catch (error) {
        console.error("Error generating summary:", error);
        summary = "Unable to generate summary for this transcript.";
        setTranscriptSummary(summary);
      }
      
      setShowSummary(true);

      if (result.text) {
        toast.success("Transcription complete");
      }
      
      if (onTranscriptionComplete) {
        // Call the callback with the result and summary
        onTranscriptionComplete(result, summary);
      }

      return result;
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Transcription failed", {
        description: "Failed to process your audio recording.",
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
        if (!e.target || !e.target.result) {
          toast.error("File read error", {
            description: "Could not read the audio file.",
          });
          resolve(null);
          return;
        }
        
        const audioBlob = new Blob([new Uint8Array(e.target.result as ArrayBuffer)], { type: 'audio/webm' });
        const chunks = [audioBlob];
        const result = await processRecording(chunks, options);
        resolve(result);
      };
      
      reader.onerror = () => {
        toast.error("File read error", {
          description: "Could not read the audio file.",
        });
        resolve(null);
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  // Add a function to reset the transcription state
  const resetTranscription = () => {
    setTranscript("");
    setTranscriptSummary("");
    setTranscriptResult(null);
    setShowSummary(true);
  };

  return {
    transcript,
    transcriptSummary,
    isTranscribing,
    showSummary,
    setShowSummary,
    transcriptResult,
    processRecording,
    handleFileUpload,
    resetTranscription
  };
};
