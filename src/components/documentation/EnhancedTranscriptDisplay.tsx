import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, FileText, Copy, Wand2, Zap, List, ArrowRightLeft, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import {
  TranscriptionResult,
  LLMProvider,
  DocumentFormat,
  generateMedicalDocument,
  DocumentGenerationOptions
} from "@/services/transcription";
import { PatientInfo } from "@/components/documentation/DocumentTypes";
import { updateDocument } from "@/services/supabaseSetup";

interface TranscriptDisplayProps {
  transcriptResult: TranscriptionResult;
  transcript: string;
  transcriptSummary: string;
  formattedNotes?: string; // Added this prop to fix the TypeScript error
  showSummary: boolean;
  setShowSummary: (value: boolean) => void;
  patientInfo?: PatientInfo | null; // Added this prop to fix the TypeScript error
  form?: any; // Optional form from parent to update
  showSummarySection?: boolean; // Prop to control summary section visibility
  documentId?: string; // Document identification for updates
  onSaveFormat?: (formatName: string, content: string) => Promise<void>;
  documentContext?: any;
}

const EnhancedTranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcriptResult,
  transcript,
  transcriptSummary,
  formattedNotes,
  showSummary,
  setShowSummary,
  patientInfo,
  form,
  showSummarySection = true, // Default to true for backward compatibility
  documentId
}) => {
  useEffect(() => {
    console.group('EnhancedTranscriptDisplay Debug');
    console.log('Transcript Result (Full):', JSON.stringify(transcriptResult, null, 2));
    console.log('Raw Transcript:', transcript);
    console.log('Transcript Summary:', transcriptSummary);

    const requiredFields = ['text', 'utterances'];
    const missingFields = requiredFields.filter(field =>
        !transcriptResult[field] ||
        (Array.isArray(transcriptResult[field]) && transcriptResult[field].length === 0)
    );

    if (missingFields.length > 0) {
      console.warn('Missing required fields:', missingFields);
      console.warn('Fallback rendering might be needed');
    }

    console.groupEnd();
  }, [transcriptResult, transcript, transcriptSummary]);
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState(DocumentFormat.SOAP);
  const [llmProvider, setLlmProvider] = useState(LLMProvider.OPENAI);
  const [structuredNote, setStructuredNote] = useState("");
  const [convertedNoteType, setConvertedNoteType] = useState("");
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [extractedResults, setExtractedResults] = useState<Record<string, string>>({});
  const [showExtractedResults, setShowExtractedResults] = useState(false);
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [highlightedText, setHighlightedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [editedTranscript, setEditedTranscript] = useState(transcript);
  const [editedSummary, setEditedSummary] = useState(transcriptSummary);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (form && transcriptResult) {
      form.setValue("transcriptResult", transcriptResult);
      form.setValue("transcript", transcript);
      if (transcriptSummary) {
        form.setValue("transcriptSummary", transcriptSummary);
      }
    }
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
    toast.success("The transcript has been copied to your clipboard.");
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
      const options: DocumentGenerationOptions = {
        provider: llmProvider,
        format: selectedFormat,
        apiKey: undefined
      };

      const result = await generateMedicalDocument(transcriptResult, options);
      
      const formatName = getFormatName(selectedFormat);
      
      setStructuredNote(result);
      setConvertedNoteType(formatName);

      if (form) {
        form.setValue("notes", result);
        form.setValue("documentFormat", selectedFormat);
        form.setValue("llmProvider", llmProvider);
      }

      extractClinicalResults(result);

      toast.success(`Your transcript has been converted to a structured ${formatName} using ${LLMProvider[llmProvider]}.`);
    } catch (error) {
      console.error("Error converting transcript:", error);
      toast.error("There was a problem converting your transcript. Please try again.");
    } finally {
      setIsGeneratingNote(false);
    }
  };

  const getFormatName = (format: DocumentFormat) => {
    switch (format) {
      case DocumentFormat.SOAP: return "SOAP Note";
      case DocumentFormat.HISTORY_AND_PHYSICAL: return "History & Physical";
      case DocumentFormat.PROGRESS: return "Progress Note";
      case DocumentFormat.DISCHARGE: return "Discharge Summary";
      case DocumentFormat.CONSULTATION: return "Consultation Note";
      case DocumentFormat.PROCEDURE: return "Procedure Note";
      case DocumentFormat.CARDIOLOGY: return "Cardiology Note";
      case DocumentFormat.DICTATION: return "Dictation";
      case DocumentFormat.ONCOLOGY: return "Oncology Note";
      case DocumentFormat.FOLLOWUP: return "Follow-up Note";
      case DocumentFormat.PRENATAL: return "Prenatal Note";
      case DocumentFormat.PSYCHIATRIC: return "Psychiatric Note";
      case DocumentFormat.NEUROLOGY: return "Neurology Note";
      case DocumentFormat.PEDIATRIC: return "Pediatric Note";
      default: return "Medical Note";
    }
  };

  const extractClinicalResults = (note: string) => {
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
    toast.success("The structured note has been copied to your clipboard.");
  };

  const handleSaveDocumentUpdate = async () => {
    if (!documentId) {
      toast.error("No document ID provided for update.");
      return;
    }

    setIsSaving(true);
    try {
      const updatePayload: any = {
        transcript_data: editedTranscript,
        summary: editedSummary,
      };
      if (structuredNote) {
        updatePayload.notes = structuredNote;
        updatePayload.document_format = convertedNoteType || selectedFormat;
      }

      const res = await updateDocument(documentId, updatePayload);

      if (res.success) {
      toast.success("Document updated successfully");
        setEditMode(false);
        if (form) {
          form.setValue("transcript", editedTranscript);
          form.setValue("transcriptSummary", editedSummary);
          if (structuredNote) form.setValue("notes", structuredNote);
          if (convertedNoteType) form.setValue("documentFormat", convertedNoteType);
        }
      } else {
        throw res.error;
      }
    } catch (error: any) {
      toast.error(error?.message || "There was a problem saving changes.");
    }
    setIsSaving(false);
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

    const sectionPattern = new RegExp(`(${sectionId}[:\\s]+)(.*?)(?=\\n\\n|$)`, 'is');
    const updatedNote = structuredNote.replace(sectionPattern, (match, p1, p2) => {
      return `${p1}${p2}\n• ${text}`;
    });

    setStructuredNote(updatedNote);

    toast.success(`Added selected text to ${sectionId} section.`);
  };

  useEffect(() => {
    if (interactiveMode && structuredNote) {
      const updatedNote = ensureStructuredFormat(structuredNote);
      if (updatedNote !== structuredNote) {
        setStructuredNote(updatedNote);
      }
    }
  }, [interactiveMode, structuredNote]);

  const ensureStructuredFormat = (note: string): string => {
    const sections = ["SUBJECTIVE", "OBJECTIVE", "ASSESSMENT", "PLAN",
      "CHIEF COMPLAINT", "INTERVAL HISTORY", "CURRENT STATUS",
      "REASON FOR CONSULTATION", "HISTORY OF PRESENT ILLNESS",
      "RELEVANT FINDINGS", "IMPRESSION & RECOMMENDATIONS"];

    let updatedNote = note;

    sections.forEach(section => {
      const sectionPattern = new RegExp(`(${section}[:\\s]+)(.*?)(?=\\n\\n|$)`, 'is');
      updatedNote = updatedNote.replace(sectionPattern, (match, p1, p2) => {
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
            {editMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDocumentUpdate}
                disabled={isSaving}
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
                className="flex items-center"
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                Edit Transcript
              </Button>
            )}
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
              onChange={(e) => setSelectedFormat(e.target.value as DocumentFormat)}
            >
              <option value={DocumentFormat.SOAP}>SOAP Note</option>
              <option value={DocumentFormat.PROGRESS}>Progress Note</option>
              <option value={DocumentFormat.CONSULTATION}>Consultation Note</option>
              <option value={DocumentFormat.HISTORY_AND_PHYSICAL}>History & Physical</option>
              <option value={DocumentFormat.PROCEDURE}>Procedure Note</option>
              <option value={DocumentFormat.CARDIOLOGY}>Cardiology Note</option>
              <option value={DocumentFormat.PSYCHIATRIC}>Psychiatric Note</option>
              <option value={DocumentFormat.FOLLOWUP}>Follow-up Note</option>
              <option value={DocumentFormat.PEDIATRIC}>Pediatric Note</option>
              <option value={DocumentFormat.NEUROLOGY}>Neurology Note</option>
              <option value={DocumentFormat.PRENATAL}>Prenatal Note</option>
              <option value={DocumentFormat.ONCOLOGY}>Oncology Note</option>
              <option value={DocumentFormat.DISCHARGE}>Discharge Summary</option>
              <option value={DocumentFormat.DICTATION}>Dictation</option>
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={convertToStructuredNote}
              disabled={isGeneratingNote || !transcript}
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
              </div>
              <div className={`mt-8 whitespace-pre-wrap font-mono text-sm ${interactiveMode ? 'cursor-pointer' : ''}`}>
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

export default EnhancedTranscriptDisplay;
