
import React from "react";
import { TranscriptionResult } from "@/services/transcription";

interface TranscriptPreviewProps {
  transcriptResult: TranscriptionResult | null;
  recordingDuration?: number;
  formatTime?: (seconds: number) => string;
}

const TranscriptPreview: React.FC<TranscriptPreviewProps> = ({
  transcriptResult,
  recordingDuration = 0,
  formatTime = (sec) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`
}) => {
  if (!transcriptResult) return null;
  
  // Extract speakers for metadata display
  const speakers = [...new Set(transcriptResult.utterances.map(u => u.speaker))];
  
  return (
    <div className="bg-muted p-4 rounded-lg">
      <h3 className="font-medium mb-2">Transcript Preview</h3>
      
      {/* Metadata section */}
      <div className="mb-3 text-xs text-muted-foreground bg-background p-2 rounded">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <div>Duration: {formatTime(recordingDuration)}</div>
          <div>Speakers: {speakers.join(', ')}</div>
          <div>Provider: {transcriptResult.provider}</div>
        </div>
      </div>
      
      <div className="max-h-60 overflow-y-auto bg-card p-3 rounded border text-sm">
        {transcriptResult.utterances.length > 0 ? (
          transcriptResult.utterances.map((utterance, idx) => (
            <div key={idx} className="mb-2">
              <span className={`font-bold ${utterance.speaker === "Doctor" ? "text-blue-600" : "text-emerald-600"}`}>
                {utterance.speaker}:
              </span>{" "}
              {utterance.text}
            </div>
          ))
        ) : (
          <p>{transcriptResult.text}</p>
        )}
      </div>
    </div>
  );
};

export default TranscriptPreview;
