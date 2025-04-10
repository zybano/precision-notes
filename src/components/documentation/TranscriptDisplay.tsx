
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, FileText, Copy, Wand2, Zap, List, ArrowRightLeft, X } from "lucide-react";
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
  const [extractedResults, setExtractedResults] = useState<Record<string, string>>({});
  const [showExtractedResults, setShowExtractedResults] = useState(false);
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [highlightedText, setHighlightedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  const formatUtterances = (utterances: any[]) => {
    if (!utterances || utterances.length === 0) {
      return [];
    }
    
    let groupedUtterances: any[] = [];
    let currentSpeaker = null;
    let currentText = "";
    
    utterances.forEach((utterance, index) => {
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
    
    const hash = speaker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const convertToStructuredNote = async () => {
    setIsGeneratingNote(true);
    setStructuredNote("");
    
    try {
      let result = "";
      
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
      
      if (form) {
        form.setValue("notes", result);
      }
      
      // Auto-extract clinical results from the note
      extractClinicalResults(result);
      
      toast({
        title: "Note Generated",
        description: `Your transcript has been converted to a structured ${selectedFormat} using enhanced AI.`,
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

  const extractClinicalResults = (note: string) => {
    // Simple pattern-based extraction for common clinical metrics
    const patterns = [
      { name: "Blood Pressure", regex: /(?:BP|blood pressure)[:\s]+(\d{2,3}\/\d{2,3})(?:\s*mmHg)?/i },
      { name: "Heart Rate", regex: /(?:HR|heart rate|pulse)[:\s]+(\d{2,3})(?:\s*bpm)?/i },
      { name: "Temperature", regex: /(?:temp|temperature)[:\s]+(\d{2,3}(?:\.\d)?)(?:\s*(?:°C|°F|C|F))?/i },
      { name: "Oxygen Saturation", regex: /(?:O2 sat|oxygen saturation|SpO2)[:\s]+(\d{1,3}%)/ },
      { name: "Weight", regex: /(?:weight)[:\s]+(\d{1,3}(?:\.\d)?)(?:\s*(?:kg|lbs?))?/i },
      { name: "Height", regex: /(?:height)[:\s]+(\d{1,3}(?:\.\d)?)(?:\s*(?:cm|in|inches|feet|ft|foot|m))?/i },
      { name: "BMI", regex: /(?:BMI|body mass index)[:\s]+(\d{1,2}(?:\.\d)?)(?:\s*kg\/m2)?/i }
    ];
    
    const results: Record<string, string> = {};
    
    patterns.forEach(pattern => {
      const match = note.match(pattern.regex);
      if (match && match[1]) {
        results[pattern.name] = match[1];
      }
    });
    
    // Extract diagnoses with a more complex pattern
    const diagnosisPattern = /(?:assessment|impression|diagnosis)[:\s]+(.*?)(?:\s*(?:plan|treatment|recommendations|follow-up|followup)|\n\n)/is;
    const diagnosisMatch = note.match(diagnosisPattern);
    if (diagnosisMatch && diagnosisMatch[1]) {
      results["Diagnosis"] = diagnosisMatch[1].trim().replace(/\n+/g, " ");
    }
    
    setExtractedResults(results);
    setShowExtractedResults(Object.keys(results).length > 0);
  };

  const handleCopyStructuredNote = () => {
    navigator.clipboard.writeText(structuredNote);
    toast({
      title: "Note Copied",
      description: "The structured note has been copied to your clipboard.",
      duration: 3000,
    });
  };

  const handleTextSelection = () => {
    if (!interactiveMode) return;
    
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setHighlightedText(selection.toString());
    }
  };

  const handleDragStart = (e: React.DragEvent, text: string) => {
    if (!interactiveMode) return;
    
    e.dataTransfer.setData("text/plain", text);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!interactiveMode) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, sectionId: string) => {
    if (!interactiveMode) return;
    
    e.preventDefault();
    const text = e.dataTransfer.getData("text/plain");
    
    // Update the structured note by adding the dragged text to the appropriate section
    if (text && sectionId) {
      const sectionPattern = new RegExp(`(${sectionId}[:\\s]+)(.*?)(?=\\n\\n|$)`, 'is');
      const updatedNote = structuredNote.replace(sectionPattern, (match, p1, p2) => {
        return `${p1}${p2}\n• ${text}`;
      });
      
      setStructuredNote(updatedNote);
      
      toast({
        title: "Content Added",
        description: `Added selected text to ${sectionId} section.`,
        duration: 2000,
      });
    }
  };

  useEffect(() => {
    if (interactiveMode && structuredNote) {
      // Ensure the structured note is in a format suitable for interactive editing
      const updatedNote = ensureStructuredFormat(structuredNote);
      if (updatedNote !== structuredNote) {
        setStructuredNote(updatedNote);
      }
    }
  }, [interactiveMode, structuredNote]);

  const ensureStructuredFormat = (note: string): string => {
    // Helper function to add bullet points to sections and ensure proper formatting
    const sections = ["SUBJECTIVE", "OBJECTIVE", "ASSESSMENT", "PLAN", 
                     "CHIEF COMPLAINT", "INTERVAL HISTORY", "CURRENT STATUS", 
                     "REASON FOR CONSULTATION", "HISTORY OF PRESENT ILLNESS", 
                     "RELEVANT FINDINGS", "IMPRESSION & RECOMMENDATIONS"];
    
    let updatedNote = note;
    
    sections.forEach(section => {
      const sectionPattern = new RegExp(`(${section}[:\\s]+)(.*?)(?=\\n\\n|$)`, 'is');
      updatedNote = updatedNote.replace(sectionPattern, (match, p1, p2) => {
        // If content doesn't already have bullet points, add them
        if (!p2.includes('•') && p2.includes('\n')) {
          const lines = p2.split('\n').filter(l => l.trim().length > 0);
          const bulletedLines = lines.map(l => l.startsWith('•') ? l : `• ${l}`).join('\n');
          return `${p1}${bulletedLines}`;
        }
        return match;
      });
    });
    
    return updatedNote;
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

          
          {structuredNote && (
            <div className="flex items-center space-x-2">
              <Switch 
                id="interactive-mode" 
                checked={interactiveMode} 
                onCheckedChange={setInteractiveMode} 
              />
              <Label htmlFor="interactive-mode" className="text-xs cursor-pointer">
                Interactive Mode
              </Label>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="transcript" className="w-full">
        <TabsList>
          <TabsTrigger value="transcript" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Raw Transcript
          </TabsTrigger>
          {structuredNote && <TabsTrigger value="structured" className="flex items-center gap-1">
            <List className="h-4 w-4" />
            {convertedNoteType}
          </TabsTrigger>}
          {showExtractedResults && <TabsTrigger value="results" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            Clinical Results
          </TabsTrigger>}
        </TabsList>
        
        <TabsContent value="transcript">
          <ResizablePanelGroup direction="vertical" className="min-h-[300px] max-h-[600px] border rounded-md">
            <ResizablePanel defaultSize={70}>
              <div 
                className="p-4 h-full overflow-y-auto space-y-4" 
                onMouseUp={handleTextSelection}
              >
                {formattedUtterances.length > 0 ? (
                  formattedUtterances.map((utterance, index) => (
                    <div 
                      key={index} 
                      className="space-y-1"
                      draggable={interactiveMode}
                      onDragStart={(e) => handleDragStart(e, utterance.text)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className={`font-medium ${getSpeakerColor(utterance.speaker)}`}>
                        {utterance.speaker}
                      </div>
                      <div className="text-sm">
                        {utterance.text.split('. ').map((sentence: string, sentIdx: number) => (
                          sentence.trim() && (
                            <div 
                              key={`${index}-${sentIdx}`} 
                              className={`mb-1 ${interactiveMode ? 'cursor-pointer hover:bg-muted/50 rounded' : ''}`}
                              draggable={interactiveMode}
                              onDragStart={(e) => handleDragStart(e, sentence)}
                              onDragEnd={handleDragEnd}
                            >
                              {sentence.trim()}{sentence.endsWith('.') ? '' : '.'}
                            </div>
                          )
                        ))}
                      </div>
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
              <div className="absolute top-2 right-2 flex space-x-2">
                {interactiveMode && (
                  <Badge className="bg-primary/20 text-primary">Interactive Mode: Drag content between panels</Badge>
                )}
                <Button variant="outline" size="sm" onClick={handleCopyStructuredNote}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <div 
                className={`mt-8 whitespace-pre-wrap font-mono text-sm ${interactiveMode ? 'cursor-pointer' : ''}`}
                onDragOver={interactiveMode ? handleDragOver : undefined}
              >
                {interactiveMode ? (
                  // Render with interactive sections when in interactive mode
                  structuredNote.split('\n\n').map((section, idx) => {
                    const sectionMatch = section.match(/^([A-Z\s&]+):/);
                    const sectionName = sectionMatch ? sectionMatch[1] : "";
                    
                    return (
                      <div 
                        key={idx} 
                        className={`mb-4 p-2 ${isDragging ? 'border-2 border-dashed border-primary/50 rounded' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, sectionName)}
                      >
                        {section}
                      </div>
                    );
                  })
                ) : (
                  // Regular render when not in interactive mode
                  structuredNote
                )}
              </div>
            </div>
          </TabsContent>
        )}
        
        {showExtractedResults && (
          <TabsContent value="results">
            <div className="border rounded-md p-4 min-h-[300px] max-h-[600px] overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">Extracted Clinical Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(extractedResults).map(([key, value]) => (
                  <div key={key} className="p-3 bg-muted rounded-md">
                    <div className="font-medium text-sm text-muted-foreground mb-1">{key}</div>
                    <div className="text-base font-semibold">{value}</div>
                  </div>
                ))}
              </div>
              {Object.keys(extractedResults).length === 0 && (
                <div className="text-center p-6 text-muted-foreground">
                  No clinical results were extracted from the conversation.
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
      
      {interactiveMode && highlightedText && (
        <div className="p-3 bg-muted/80 rounded-md text-sm flex items-center justify-between">
          <div className="flex-1">
            <span className="font-medium">Selected text: </span>
            <span className="italic">"{highlightedText}"</span>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setHighlightedText("")}
            className="h-7 w-7 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
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
