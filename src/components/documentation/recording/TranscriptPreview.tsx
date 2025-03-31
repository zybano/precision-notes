
import React from "react";
import { TranscriptionResult } from "@/services/transcription";

interface TranscriptPreviewProps {
  transcriptResult: TranscriptionResult | null;
}

const TranscriptPreview: React.FC<TranscriptPreviewProps> = ({
  transcriptResult
}) => {
  if (!transcriptResult) return null;
  
  return (
    <div className="bg-muted p-4 rounded-lg">
      <h3 className="font-medium mb-2">Transcript Preview</h3>
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
