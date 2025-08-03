import React, {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Switch} from "@/components/ui/switch";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Label} from "@/components/ui/label";
import {Check, Copy, Edit, FileText, Save, Wand2} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import {TranscriptionResult} from "@/services/transcription";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable";
import {Textarea} from "@/components/ui/textarea";
import {
    convertTranscriptToConsultNote,
    convertTranscriptToHistoryAndPhysical,
    convertTranscriptToProcedureNote,
    convertTranscriptToProgressNote,
    convertTranscriptToSOAP
} from "@/services/noteConversion";

interface TranscriptDisplayProps {
  transcriptResult: TranscriptionResult;
  transcript: string;
  transcriptSummary: string;
  showSummary: boolean;
  setShowSummary: (value: boolean) => void;
  form?: any; // Optional form from parent to update
  showSummarySection?: boolean; // Prop to control summary section visibility
  onSaveFormat?: (formatName: string, content: string) => Promise<void>; // Callback for saving format
  documentContext?: {
    documentFormat?: string;
    onRegenerateDocument?: (newFormat: string) => Promise<void>;
  };
}

const SimplifiedTranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcriptResult,
  transcript,
  transcriptSummary,
  showSummary,
  setShowSummary,
  form,
  showSummarySection = true,
  onSaveFormat
}) => {
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState("SOAP Note");
  const [structuredNote, setStructuredNote] = useState("");
  const [convertedNoteType, setConvertedNoteType] = useState("");
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(transcript);
  const [editedSummary, setEditedSummary] = useState(transcriptSummary);
  
  // Get formatted document format names for dropdown
  const getFormattedOptions = () => {
    return [
      { value: "SOAP Note", label: "SOAP Note" },
      { value: "Progress Note", label: "Progress Note" },
      { value: "Consultation Note", label: "Consultation Note" },
      { value: "History & Physical", label: "History & Physical" },
      { value: "Discharge Summary", label: "Discharge Summary" },
      { value: "Procedure Note", label: "Procedure Note" },
      { value: "Pediatrics Note", label: "Pediatrics Note" },
      { value: "Cardiology Note", label: "Cardiology Note" },
      { value: "Orthopedics Note", label: "Orthopedics Note" },
      { value: "Psychiatry Note", label: "Psychiatry Note" },
      { value: "Geriatrics Note", label: "Geriatrics Note" },
      { value: "Obstetrics Note", label: "Obstetrics Note" },
      { value: "Endocrinology Note", label: "Endocrinology Note" },
    ];
  };
  
  // Map format display names to enum values
  const getDocumentFormatEnum = (displayName: string): string => {
    const formatMap: Record<string, string> = {
      "SOAP Note": "SOAP Note",
      "Progress Note": "Progress Note",
      "Consultation Note": "Consultation Note",
      "History & Physical": "History & Physical",
      "Discharge Summary": "Discharge Summary",
      "Procedure Note": "Procedure Note",
      "Pediatrics Note": "Pediatrics Note",
      "Cardiology Note": "Cardiology Note",
      "Orthopedics Note": "Orthopedics Note",
      "Psychiatry Note": "Psychiatry Note",
      "Geriatrics Note": "Geriatrics Note",
      "Obstetrics Note": "Obstetrics Note",
      "Endocrinology Note": "Endocrinology Note",
    };
    
    return formatMap[displayName] || "SOAP Note";
  };
  
  // Sync transcript data with form when loaded
  useEffect(() => {
    // When a transcript is loaded into this component, make sure the form also has access to it
    if (form && transcriptResult) {
      // Set transcript result for document generation
      form.setValue("transcriptResult", transcriptResult);
      
      // Set transcript text
      form.setValue("transcript", transcript);
      
      // Set transcript summary if available
      if (transcriptSummary) {
        form.setValue("transcriptSummary", transcriptSummary);
      }
    }
    
    // Initialize edited transcript and summary
    setEditedTranscript(transcript);
    setEditedSummary(transcriptSummary);
  }, [form, transcriptResult, transcript, transcriptSummary]);
  
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
    navigator.clipboard.writeText(editMode ? editedTranscript : transcript);
    toast.success("Transcript copied to clipboard");
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
      const sourceText = editMode ? editedTranscript : transcript;
      
      switch (selectedFormat) {
        case "SOAP Note":
          result = await convertTranscriptToSOAP(sourceText);
          break;
        case "Progress Note":
          result = await convertTranscriptToProgressNote(sourceText);
          break;
        case "Consultation Note":
          result = await convertTranscriptToConsultNote(sourceText);
          break;
        case "History & Physical":
          result = await convertTranscriptToHistoryAndPhysical(sourceText);
          break;
        case "Procedure Note":
          result = await convertTranscriptToProcedureNote(sourceText);
          break;
        case "Discharge Summary":
          result = await convertTranscriptToSOAP(sourceText); // Replace with dedicated function when available
          break;
        case "Pediatrics Note":
          result = await convertTranscriptToSOAP(sourceText); // Replace with dedicated function when available
          break;
        case "Cardiology Note":
          result = await convertTranscriptToSOAP(sourceText); // Replace with dedicated function when available
          break;
        case "Orthopedics Note":
          result = await convertTranscriptToSOAP(sourceText); // Replace with dedicated function when available
          break;
        case "Psychiatry Note":
          result = await convertTranscriptToSOAP(sourceText); // Replace with dedicated function when available
          break;
        case "Geriatrics Note":
          result = await convertTranscriptToSOAP(sourceText); // Replace with dedicated function when available
          break;
        case "Obstetrics Note":
          result = await convertTranscriptToSOAP(sourceText); // Replace with dedicated function when available
          break;
        case "Endocrinology Note":
          result = await convertTranscriptToSOAP(sourceText); // Replace with dedicated function when available
          break;
        default:
          result = await convertTranscriptToSOAP(sourceText);
      }
      
      setStructuredNote(result);
      setConvertedNoteType(selectedFormat);
      
      toast.success(`Transcript converted to ${selectedFormat} format`);
    } catch (error) {
      console.error("Error converting transcript:", error);
      toast.error("There was a problem converting your transcript. Please try again.");
    } finally {
      setIsGeneratingNote(false);
    }
  };

  const handleCopyStructuredNote = () => {
    navigator.clipboard.writeText(structuredNote);
    toast.success("Structured note copied to clipboard");
  };

  const handleSaveFormat = () => {
    if (onSaveFormat && structuredNote && convertedNoteType) {
      onSaveFormat(convertedNoteType, structuredNote);
      
      // Also update form values if form is available
      if (form) {
        form.setValue("notes", structuredNote);
        form.setValue("documentFormat", convertedNoteType);
        
        // Update transcript and summary if in edit mode
        if (editMode) {
          form.setValue("transcript", editedTranscript);
          form.setValue("transcriptSummary", editedSummary);
          
          // Update transcript result with edited text
          const updatedTranscriptResult = {
            ...transcriptResult,
            text: editedTranscript
          };
          form.setValue("transcriptResult", updatedTranscriptResult);
        }
      }
    }
  };
  
  const handleSaveTranscriptEdits = () => {
    if (form) {
      // Update transcript in form
      form.setValue("transcript", editedTranscript);
      
      // Update summary in form
      form.setValue("transcriptSummary", editedSummary);
      
      // Update transcript result with edited text
      const updatedTranscriptResult = {
        ...transcriptResult,
        text: editedTranscript
      };
      form.setValue("transcriptResult", updatedTranscriptResult);
      
      toast.success("Transcript edits have been saved");
      
      // Exit edit mode
      setEditMode(false);
    }
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
            {editMode ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSaveTranscriptEdits}
                className="flex items-center"
              >
                <Check className="h-4 w-4 mr-1" />
                Save Edits
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditMode(true)}
                  className="flex items-center"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Transcript
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyTranscript}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4 sm:items-center">
          <div className="flex items-center space-x-2">
            <Label htmlFor="note-format" className="whitespace-nowrap">Convert to:</Label>
            <select 
              id="note-format"
              className="text-sm rounded-md border border-input bg-transparent px-3 py-1"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              {getFormattedOptions().map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <Button
              variant="secondary"
              size="sm"
              onClick={convertToStructuredNote}
              disabled={isGeneratingNote || (!transcript && !editedTranscript)}
              className="ml-2"
            >
              {isGeneratingNote ? (
                <>
                  <Wand2 className="h-4 w-4 mr-1 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-1" />
                  Convert to {selectedFormat}
                </>
              )}
            </Button>
          </div>

          {structuredNote && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyStructuredNote}
                className="flex items-center"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSaveFormat}
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-1" />
                Update Document
              </Button>
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
            <FileText className="h-4 w-4" />
            {convertedNoteType}
          </TabsTrigger>}
        </TabsList>
        
        <TabsContent value="transcript">
          <ResizablePanelGroup direction="vertical" className="min-h-[300px] max-h-[600px] border rounded-md">
            <ResizablePanel defaultSize={70}>
              {editMode ? (
                <Textarea
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  className="h-full min-h-[300px] w-full resize-none p-4 font-mono text-sm border-0 focus-visible:ring-0"
                  placeholder="Edit transcript text here..."
                />
              ) : (
                <div className="p-4 h-full overflow-y-auto space-y-4">
                  {formattedUtterances.length > 0 ? (
                    formattedUtterances.map((utterance, index) => (
                      <div key={index} className="space-y-1">
                        <div className={`font-medium ${getSpeakerColor(utterance.speaker)}`}>
                          {utterance.speaker}
                        </div>
                        <div className="text-sm">
                          {utterance.text.split('. ').map((sentence: string, sentIdx: number) => (
                            sentence.trim() && (
                              <div key={`${index}-${sentIdx}`} className="mb-1">
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
              )}
            </ResizablePanel>
            
            {showSummarySection && (transcriptSummary || editMode) && (
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
                      editMode ? (
                        <Textarea
                          value={editedSummary}
                          onChange={(e) => setEditedSummary(e.target.value)}
                          className="h-full min-h-[100px] w-full resize-none p-4 text-sm border-0 focus-visible:ring-0"
                          placeholder="Edit summary text here..."
                        />
                      ) : (
                        <div className="text-sm">{transcriptSummary}</div>
                      )
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
                <Button variant="outline" size="sm" onClick={handleCopyStructuredNote}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveFormat}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
              <div className="mt-8 whitespace-pre-wrap font-mono text-sm">
                {structuredNote}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SimplifiedTranscriptDisplay;