
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, FileText, Copy, MagicWand } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TranscriptionResult } from "@/services/transcription";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import { convertTranscriptToSOAP, convertTranscriptToProgressNote, convertTranscriptToConsultNote, convertTranscriptToHistoryAndPhysical, convertTranscriptToProcedureNote } from "@/services/noteConversion";

interface TranscriptDisplayProps {
  transcriptResult: TranscriptionResult;
  transcript: string;
  transcriptSummary: string;
  showSummary: boolean;
  setShowSummary: (value: boolean) => void;
  form?: any; // Optional form from parent to update
  showSummarySection?: boolean; // Prop to control summary section visibility
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcriptResult,
  transcript,
  transcriptSummary,
  showSummary,
  setShowSummary,
  form,
  showSummarySection = true // Default to true for backward compatibility
}) => {
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState("SOAP Note");
  const [structuredNote, setStructuredNote] = useState("");
  const [convertedNoteType, setConvertedNoteType] = useState("");
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  
  const formatUtterances = (utterances: any[]) => {
    if (!utterances || utterances.length === 0) {
      return [];
    }
    
    // Group utterances by speaker
    let groupedUtterances: any[] = [];
    let currentSpeaker = null;
    let currentText = "";
    
    utterances.forEach((utterance, index) => {
      // If this is a mock dataset, just return the raw utterances
      if (transcriptResult.isMock) {
        groupedUtterances.push({
          speaker: utterance.speaker || "Unknown",
          text: utterance.text || "",
          start: utterance.start || 0,
          end: utterance.end || 0
        });
        return;
      }
      
      const speaker = utterance.speaker || "Unknown";
      
      if (speaker !== currentSpeaker) {
        if (currentSpeaker !== null) {
          groupedUtterances.push({
            speaker: currentSpeaker,
            text: currentText
          });
        }
        currentSpeaker = speaker;
        currentText = utterance.text || "";
      } else {
        currentText += " " + (utterance.text || "");
      }
      
      // Add the last utterance
      if (index === utterances.length - 1) {
        groupedUtterances.push({
          speaker: currentSpeaker,
          text: currentText
        });
      }
    });
    
    return groupedUtterances;
  };
  
  const formattedUtterances = formatUtterances(transcriptResult.utterances);
  
  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcript);
    toast({
      title: "Transcript Copied",
      description: "The transcript has been copied to your clipboard.",
      duration: 3000,
    });
  };
  
  const getSpeakerColor = (speaker: string) => {
    const colors = [
      "text-blue-600 dark:text-blue-400",
      "text-green-600 dark:text-green-400",
      "text-purple-600 dark:text-purple-400",
      "text-amber-600 dark:text-amber-400",
      "text-rose-600 dark:text-rose-400"
    ];
    
    // Simple hash function to consistently assign colors to speakers
    const hash = speaker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const convertToStructuredNote = async () => {
    setIsGeneratingNote(true);
    setStructuredNote("");
    
    try {
      let result = "";
      
      // Use the appropriate conversion function based on selected format
      switch (selectedFormat) {
        case "SOAP Note":
          result = await convertTranscriptToSOAP(transcript);
          break;
        case "Progress Note":
          result = await convertTranscriptToProgressNote(transcript);
          break;
        case "Consultation Note":
          result = await convertTranscriptToConsultNote(transcript);
          break;
        case "History & Physical":
          result = await convertTranscriptToHistoryAndPhysical(transcript);
          break;
        case "Procedure Note":
          result = await convertTranscriptToProcedureNote(transcript);
          break;
        default:
          result = await convertTranscriptToSOAP(transcript);
      }
      
      setStructuredNote(result);
      setConvertedNoteType(selectedFormat);
      
      // Update the form if it exists
      if (form) {
        form.setValue("notes", result);
      }
      
      toast({
        title: "Note Generated",
        description: `Your transcript has been converted to a structured ${selectedFormat}.`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error converting transcript:", error);
      toast({
        title: "Conversion Error",
        description: "There was a problem converting your transcript. Please try again.",
        duration: 3000,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingNote(false);
    }
  };

  const handleCopyStructuredNote = () => {
    navigator.clipboard.writeText(structuredNote);
    toast({
      title: "Note Copied",
      description: "The structured note has been copied to your clipboard.",
      duration: 3000,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium">Transcript</h3>
            {transcriptResult.isMock && (
              <Badge variant="outline" className="text-xs">Sample Data</Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleCopyTranscript}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-start space-y-2 sm:space-y-0 sm:space-x-4 sm:items-center">
          <div className="flex items-center space-x-2">
            <Label htmlFor="note-format" className="whitespace-nowrap">Convert to:</Label>
            <select 
              id="note-format"
              className="text-sm rounded-md border border-input bg-transparent px-3 py-1"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              <option value="SOAP Note">SOAP Note</option>
              <option value="Progress Note">Progress Note</option>
              <option value="Consultation Note">Consultation Note</option>
              <option value="History & Physical">History & Physical</option>
              <option value="Procedure Note">Procedure Note</option>
            </select>
          </div>
          
          <Button 
            size="sm" 
            onClick={convertToStructuredNote}
            disabled={isGeneratingNote || !transcript}
            className="whitespace-nowrap"
          >
            <MagicWand className="h-4 w-4 mr-1" />
            {isGeneratingNote ? "Converting..." : "Convert to Structured Note"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="transcript" className="w-full">
        <TabsList>
          <TabsTrigger value="transcript">Raw Transcript</TabsTrigger>
          {structuredNote && <TabsTrigger value="structured">{convertedNoteType}</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="transcript">
          <ResizablePanelGroup direction="vertical" className="min-h-[300px] max-h-[600px] border rounded-md">
            <ResizablePanel defaultSize={70}>
              <div className="p-4 h-full overflow-y-auto space-y-4">
                {formattedUtterances.length > 0 ? (
                  formattedUtterances.map((utterance, index) => (
                    <div key={index} className="space-y-1">
                      <div className={`font-medium ${getSpeakerColor(utterance.speaker)}`}>
                        {utterance.speaker}
                      </div>
                      <div className="text-sm">{utterance.text}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground italic">No transcript data available</div>
                )}
              </div>
            </ResizablePanel>
            
            {showSummarySection && transcriptSummary && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={30}>
                  <div className="p-4 border-t h-full overflow-y-auto">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">AI Summary</h4>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="summary-toggle" 
                          checked={showSummary} 
                          onCheckedChange={setShowSummary} 
                        />
                        <Label htmlFor="summary-toggle" className="text-xs">Show Summary</Label>
                      </div>
                    </div>
                    {showSummary ? (
                      <div className="text-sm">{transcriptSummary}</div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">Summary hidden</div>
                    )}
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </TabsContent>
        
        {structuredNote && (
          <TabsContent value="structured">
            <div className="border rounded-md p-4 min-h-[300px] max-h-[600px] overflow-y-auto relative">
              <div className="absolute top-2 right-2">
                <Button variant="outline" size="sm" onClick={handleCopyStructuredNote}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="mt-8 whitespace-pre-wrap font-mono text-sm">
                {structuredNote}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
      
      {showSummarySection && transcript && (
        <div className="border-t mt-3 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Transcript Summary</h4>
            <div className="flex items-center space-x-2">
              <Switch 
                id="summary-toggle-bottom" 
                checked={showSummary} 
                onCheckedChange={setShowSummary} 
              />
              <Label htmlFor="summary-toggle-bottom" className="text-xs">Show</Label>
            </div>
          </div>
          {showSummary && (
            <div className="p-3 bg-muted rounded-md text-sm">
              {transcriptSummary}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TranscriptDisplay;
