
import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, User, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TranscriptionResult } from "@/services/transcription";

interface TranscriptDisplayProps {
  transcriptResult: TranscriptionResult | null;
  transcript: string;
  transcriptSummary: string;
  showSummary: boolean;
  setShowSummary: (value: boolean) => void;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcriptResult,
  transcript,
  transcriptSummary,
  showSummary,
  setShowSummary,
}) => {
  const { toast } = useToast();

  const handleCopyConversation = () => {
    if (!transcriptResult || !transcriptResult.utterances) return;
    
    const formattedTranscript = transcriptResult.utterances
      .map(u => `${u.speaker}: ${u.text}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(formattedTranscript);
    
    toast({
      title: "Transcript Copied",
      description: "Conversation transcript copied to clipboard",
      duration: 2000,
    });
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(transcriptSummary);
    
    toast({
      title: "Summary Copied",
      description: "Transcript summary copied to clipboard",
      duration: 2000,
    });
  };

  if (!transcriptResult) return null;

  return (
    <>
      {transcriptResult.utterances && transcriptResult.utterances.length > 0 && (
        <div className="border rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Conversation Transcript</h4>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs flex items-center gap-1"
              onClick={handleCopyConversation}
            >
              <Copy className="h-3 w-3" />
              Copy Conversation
            </Button>
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mt-2">
            {transcriptResult.utterances.map((utterance, idx) => (
              <div 
                key={idx} 
                className={`flex gap-2 ${utterance.speaker === "Doctor" ? "justify-start" : "justify-end"}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-2.5 ${
                    utterance.speaker === "Doctor" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {utterance.speaker === "Doctor" ? (
                      <UserRound className="h-3.5 w-3.5" />
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )}
                    <span className="text-xs font-medium">{utterance.speaker}</span>
                  </div>
                  <p className="text-sm">{utterance.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {transcript && (
        <div className="border rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Transcript Summary</h4>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setShowSummary(!showSummary)}
            >
              {showSummary ? "Hide Summary" : "Show Summary"}
            </Button>
          </div>
          
          {showSummary && (
            <>
              <div className="text-sm border-l-2 border-primary pl-3 py-1 my-2 bg-muted/50 rounded-sm">
                {transcriptSummary}
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs flex items-center gap-1"
                  onClick={handleCopySummary}
                >
                  <Copy className="h-3 w-3" />
                  Copy Summary
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default TranscriptDisplay;
