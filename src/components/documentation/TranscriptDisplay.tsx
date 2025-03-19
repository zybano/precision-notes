
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, User, UserRound, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TranscriptionResult } from "@/services/transcription";
import { formatTranscriptionToNoteText } from "@/services/noteConversion";
import { documentTemplates } from "@/data/documentTemplates";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Card, CardContent } from "@/components/ui/card";

interface TranscriptDisplayProps {
  transcriptResult: TranscriptionResult | null;
  transcript: string;
  transcriptSummary: string;
  showSummary: boolean;
  setShowSummary: (value: boolean) => void;
  form?: any; // Optional form from parent to update
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcriptResult,
  transcript,
  transcriptSummary,
  showSummary,
  setShowSummary,
  form
}) => {
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState("SOAP Note");
  const [formattedNote, setFormattedNote] = useState("");
  const [showPreview, setShowPreview] = useState(false);

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

  const handleConvertToNote = () => {
    if (!transcriptResult) return;

    // Convert the transcript to a formatted note
    const formattedText = formatTranscriptionToNoteText(transcriptResult, selectedFormat);
    
    setFormattedNote(formattedText);
    setShowPreview(true);
    
    // Update the form with the formatted note if form exists
    if (form) {
      form.setValue("type", selectedFormat);
      form.setValue("notes", formattedText);
    }
    
    toast({
      title: "Note Structured",
      description: `Transcript has been converted to ${selectedFormat} format`,
      duration: 3000,
    });
  };

  const handleApplyNote = () => {
    if (!form || !formattedNote) return;
    
    form.setValue("notes", formattedNote);
    
    toast({
      title: "Note Applied",
      description: "Structured note has been applied to the document",
      duration: 2000,
    });
  };

  if (!transcriptResult) return null;

  // Check if this is a mock transcript
  const isMockTranscript = transcriptResult.isMock;

  return (
    <>
      {transcriptResult.utterances && transcriptResult.utterances.length > 0 && (
        <div className="border rounded-md p-3 w-full">
          <ResizablePanelGroup direction="horizontal" className="min-h-[450px] w-full">
            {/* Left panel - Transcript */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <Card className="h-full rounded-none border-0 shadow-none">
                <CardContent className="p-3 h-full flex flex-col">
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
                      Copy
                    </Button>
                  </div>
                  
                  {isMockTranscript && (
                    <div className="flex gap-2 items-center p-2 mb-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800">
                      <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                      <span>Using mock data. For production use, please configure your AssemblyAI API key.</span>
                    </div>
                  )}
                  
                  <div className="space-y-3 overflow-y-auto pr-2 mt-2 flex-1">
                    {transcriptResult.utterances.map((utterance, idx) => (
                      <div 
                        key={idx} 
                        className={`flex gap-2 ${utterance.speaker === "Doctor" ? "justify-start" : "justify-end"}`}
                      >
                        <div 
                          className={`max-w-[85%] rounded-lg p-2.5 ${
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
                </CardContent>
              </Card>
            </ResizablePanel>
            
            {/* Resizable handle */}
            <ResizableHandle withHandle />
            
            {/* Right panel - Structured Note */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <Card className="h-full rounded-none border-0 shadow-none">
                <CardContent className="p-3 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Structured Clinical Note</h4>
                    {showPreview && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs flex items-center gap-1"
                        onClick={() => navigator.clipboard.writeText(formattedNote)}
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    {showPreview ? (
                      <div className="h-full">
                        <pre className="text-sm whitespace-pre-wrap p-3 bg-muted/30 rounded-md h-full overflow-y-auto">
                          {formattedNote}
                        </pre>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center p-6 bg-muted/20 rounded-md">
                        <div className="text-center space-y-2">
                          <FileText className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                          <p className="text-sm text-muted-foreground">
                            Select a format and click "Convert" to generate a structured clinical note
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <select
                        className="text-xs p-1.5 border rounded"
                        value={selectedFormat}
                        onChange={(e) => setSelectedFormat(e.target.value)}
                      >
                        {documentTemplates.map((template, idx) => (
                          <option key={idx} value={template.title}>
                            {template.title}
                          </option>
                        ))}
                      </select>
                      
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-xs flex items-center gap-1"
                        onClick={handleConvertToNote}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Convert to Note
                      </Button>
                    </div>
                    
                    {showPreview && form && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2 text-xs"
                        onClick={handleApplyNote}
                      >
                        Apply to Document
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </ResizablePanel>
          </ResizablePanelGroup>
          
          {transcript && (
            <div className="border-t mt-3 pt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Transcript Summary</h4>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => setShowSummary(!showSummary)}
                  >
                    {showSummary ? "Hide Summary" : "Show Summary"}
                  </Button>
                  
                  {showSummary && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs flex items-center gap-1"
                      onClick={handleCopySummary}
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                  )}
                </div>
              </div>
              
              {showSummary && (
                <div className="text-sm border-l-2 border-primary pl-3 py-1 my-2 bg-muted/50 rounded-sm">
                  {transcriptSummary}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default TranscriptDisplay;
