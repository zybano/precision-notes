
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, User, UserRound, AlertCircle, FileText, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TranscriptionResult } from "@/services/transcription";
import { formatTranscriptionToNoteText, convertToComprehensiveNote } from "@/services/noteConversion";
import { documentTemplates } from "@/data/documentTemplates";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"standard" | "comprehensive">("standard");
  const [comprehensiveNote, setComprehensiveNote] = useState("");

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

  // Helper function to extract relevant information from transcript
  const extractInformation = (text: string, section: string): string => {
    const transcript = text.toLowerCase();
    
    // Define keywords for each section
    const sectionKeywords: Record<string, string[]> = {
      "chief complaint": ["complaint", "reason", "visit", "problem", "issue", "concerns"],
      "history of present illness": ["started", "began", "history", "duration", "symptoms", "onset", "course"],
      "past medical history": ["past", "history", "medical history", "previous", "prior", "diagnosed", "conditions"],
      "medications": ["medication", "prescriptions", "taking", "drugs", "dose", "regimen"],
      "allergies": ["allergy", "allergic", "reaction", "sensitivity"],
      "family history": ["family", "father", "mother", "sibling", "genetic", "inherited"],
      "social history": ["smoke", "drinking", "alcohol", "occupation", "exercise", "diet", "living situation"],
      "review of systems": ["systems", "respiratory", "cardiovascular", "gastrointestinal", "neurological"],
      "physical examination": ["exam", "examination", "vitals", "vital signs", "temperature", "heart rate", "blood pressure"],
      "assessment": ["assessment", "impression", "diagnosis", "condition", "problem"],
      "plan": ["plan", "treatment", "recommend", "follow-up", "referral", "schedule", "prescription"]
    };
    
    // Extract information based on keywords
    const keywords = sectionKeywords[section.toLowerCase()];
    if (!keywords) return "";
    
    // Get sentences that might contain relevant information
    const allSentences = text.split(/[.!?]+/);
    const relevantSentences = allSentences.filter(sentence => {
      const lowercaseSentence = sentence.toLowerCase();
      return keywords.some(keyword => lowercaseSentence.includes(keyword));
    });
    
    if (relevantSentences.length > 0) {
      return relevantSentences.join(". ") + ".";
    }
    
    // If no specific sentences found, use a placeholder message
    return `No specific ${section} information found in the transcript.`;
  };

  const generateTemplateContent = (templateName: string): string => {
    if (!transcriptResult || !transcript) {
      return "No transcript data available.";
    }
    
    const template = documentTemplates.find(t => t.title === templateName);
    if (!template) return "Template not found.";
    
    const lines: string[] = [];
    
    // Generate content based on template parameters
    template.parameters.forEach(param => {
      lines.push(`${param.label}:`);
      const content = extractInformation(transcript, param.label);
      lines.push(content || "Not mentioned in conversation.");
      lines.push("");  // Add empty line between sections
    });
    
    return lines.join("\n");
  };

  const handleConvertToNote = () => {
    if (!transcriptResult) return;

    // Generate the formatted note based on the selected template
    const formattedText = generateTemplateContent(selectedFormat);
    
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

  const handleConvertToComprehensiveNote = () => {
    if (!transcriptResult) return;

    // Create a comprehensive note with all standard sections
    const sections = [
      "## Chief Complaint",
      extractInformation(transcript, "chief complaint"),
      "",
      "## History of Present Illness",
      extractInformation(transcript, "history of present illness"),
      "",
      "## Past Medical History",
      extractInformation(transcript, "past medical history"),
      "",
      "## Medications",
      extractInformation(transcript, "medications"),
      "",
      "## Allergies",
      extractInformation(transcript, "allergies"),
      "",
      "## Family History",
      extractInformation(transcript, "family history"),
      "",
      "## Social History",
      extractInformation(transcript, "social history"),
      "",
      "## Review of Systems",
      extractInformation(transcript, "review of systems"),
      "",
      "## Physical Examination",
      extractInformation(transcript, "physical examination"),
      "",
      "## Assessment",
      extractInformation(transcript, "assessment"),
      "",
      "## Plan",
      extractInformation(transcript, "plan")
    ];
    
    const comprehensiveText = sections.join("\n");
    
    setComprehensiveNote(comprehensiveText);
    setShowPreview(true);
    
    // Update the form with the comprehensive note if form exists
    if (form) {
      form.setValue("type", "Comprehensive Clinical Note");
      form.setValue("notes", comprehensiveText);
    }
    
    toast({
      title: "Comprehensive Note Created",
      description: "Transcript has been converted to a detailed clinical note with all standard sections",
      duration: 3000,
    });
  };

  const handleCopyComprehensiveNote = () => {
    navigator.clipboard.writeText(comprehensiveNote);
    
    toast({
      title: "Comprehensive Note Copied",
      description: "Comprehensive clinical note copied to clipboard",
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
                    <div className="flex gap-2 items-center p-2 mb-3 bg-green-50 border border-green-200 rounded-md text-xs text-green-800">
                      <AlertCircle className="h-3.5 w-3.5 text-green-500" />
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
                              ? "bg-blue-500 text-white" 
                              : "bg-[#39ff14] text-black"
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
                    {showPreview && activeTab === "standard" && (
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
                    {showPreview && activeTab === "comprehensive" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs flex items-center gap-1"
                        onClick={handleCopyComprehensiveNote}
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                    )}
                  </div>
                  
                  <Tabs 
                    value={activeTab} 
                    onValueChange={(value) => setActiveTab(value as "standard" | "comprehensive")}
                    className="flex-1 flex flex-col"
                  >
                    <TabsList className="mb-2">
                      <TabsTrigger value="standard" className="text-xs">
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Standard Templates
                      </TabsTrigger>
                      <TabsTrigger value="comprehensive" className="text-xs">
                        <ClipboardList className="h-3.5 w-3.5 mr-1" />
                        Comprehensive Note
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="standard" className="flex-1 mt-0">
                      <div className="h-full">
                        {showPreview ? (
                          <ScrollArea className="h-full">
                            <pre className="text-sm whitespace-pre-wrap p-3 bg-muted/30 rounded-md h-full">
                              {formattedNote}
                            </pre>
                          </ScrollArea>
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
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="comprehensive" className="flex-1 mt-0">
                      <div className="h-full">
                        {comprehensiveNote ? (
                          <ScrollArea className="h-full">
                            <div className="text-sm p-3 bg-muted/30 rounded-md h-full whitespace-pre-wrap markdown-content">
                              {comprehensiveNote.split('\n').map((line, index) => {
                                if (line.startsWith('##')) {
                                  return (
                                    <h3 key={index} className="text-md font-semibold text-primary mt-4 mb-2">
                                      {line.replace('##', '').trim()}
                                    </h3>
                                  );
                                }
                                return <p key={index} className="mb-2">{line}</p>;
                              })}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="h-full flex items-center justify-center p-6 bg-muted/20 rounded-md">
                            <div className="text-center space-y-2">
                              <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                              <p className="text-sm text-muted-foreground">
                                Click "Create Comprehensive Note" to generate a detailed clinical note with all standard sections
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 px-2 text-xs flex items-center gap-1"
                          onClick={handleConvertToComprehensiveNote}
                        >
                          <ClipboardList className="h-3.5 w-3.5 mr-1" />
                          Create Comprehensive Note
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
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
                    onClick={() => setSummaryExpanded(!summaryExpanded)}
                  >
                    {summaryExpanded ? (
                      <><ChevronUp className="h-3.5 w-3.5 mr-1" /> Collapse</>
                    ) : (
                      <><ChevronDown className="h-3.5 w-3.5 mr-1" /> Expand</>
                    )}
                  </Button>
                  
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
                <div className={`text-sm border-l-2 border-primary pl-3 py-1 my-2 bg-muted/50 rounded-sm ${summaryExpanded ? 'h-auto max-h-[300px]' : 'max-h-24 overflow-hidden'}`}>
                  <ScrollArea className={summaryExpanded ? 'h-[280px]' : 'h-auto'}>
                    {transcriptSummary}
                  </ScrollArea>
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
