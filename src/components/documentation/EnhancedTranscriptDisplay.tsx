import React, {useState, useEffect, useRef, RefObject} from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, FileText, Copy, Wand2, Zap, List, ArrowRightLeft, X } from "lucide-react";
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
import jsPDF from "jspdf";
import ReactMarkdown from "react-markdown";

interface TranscriptDisplayProps {
  transcriptResult: TranscriptionResult;
  transcript: string;
  transcriptSummary: string;
  formattedNotes: string;
  extractedPatientInfo: any;
  showSummary: boolean;
  setShowSummary: (value: boolean) => void;
  form?: any; // Optional form from parent to update
  showSummarySection?: boolean; // Prop to control summary section visibility
}


const EnhancedTranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
                                                                       transcriptResult,
                                                                       transcript,
                                                                       transcriptSummary,
    formattedNotes,
    extractedPatientInfo,
                                                                       showSummary,
                                                                       setShowSummary,
                                                                       form,
                                                                       showSummarySection = true // Default to true for backward compatibility
                                                                     }) => {
  // Comprehensive debugging for transcript result
  useEffect(() => {
    console.group('EnhancedTranscriptDisplay Debug');
    console.log('Transcript Result (Full):', JSON.stringify(transcriptResult, null, 2));
    console.log('Raw Transcript:', transcript);
    console.log('Transcript Summary:', transcriptSummary);

    // Validate required fields
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
  const transcriptRef = useRef<HTMLDivElement>(null);
  const exportToPDF = async (contentRef: RefObject<HTMLDivElement>, title?: string): Promise<void> => {
    try {
      // Modern implementation using contentRef
      if (contentRef?.current) {
        const doc = new jsPDF();
        const elementTitle = title || 'Medical Document';

        // Define page dimensions and margins
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const usableWidth = pageWidth - (margin * 2);
        const headerHeight = 60; // Space for header

        // Add logo and branding to the first page
        // Create a colored header box
        doc.setFillColor(245, 247, 250); // Light blue-gray background
        doc.rect(0, 0, pageWidth, headerHeight, 'F');

        // Add border at bottom of header
        doc.setDrawColor(93, 104, 253); // Primary blue color
        doc.setLineWidth(1.5);
        doc.line(0, headerHeight, pageWidth, headerHeight);

        // Add PrecisionNote logo/text
        doc.setTextColor(4, 5, 35); // Dark color for text
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('PrecisionNote', margin, 30);

        // Add tagline
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(93, 104, 253); // Primary blue color
        doc.text('AI-Powered Medical Documentation', margin, 40);

        // Add document title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(4, 5, 35); // Dark color for text
        doc.text(elementTitle, margin, headerHeight + 20);

        // Add generation timestamp
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100); // Gray text
        doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, headerHeight + 30);

        // Get text content from the element
        const content = contentRef.current.innerText || '';

        // Format main content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        // Split text to fit page width
        const splitText = doc.splitTextToSize(content, usableWidth);

        // Calculate total needed height and number of pages
        let startY = headerHeight + 40; // Start below the header and title
        const lineHeight = 7; // Height of each line in points

        // Add content with pagination support
        let currentPage = 1;
        let currentY = startY;

        for (let i = 0; i < splitText.length; i++) {
          // Check if we need a new page
          if (currentY + lineHeight > pageHeight - margin) {
            // Add page number to current page
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${currentPage}`, pageWidth - margin - 15, pageHeight - 10);

            // Add new page
            doc.addPage();
            currentPage++;
            currentY = margin + 15; // Reset Y position on new page

            // Add smaller header to continuation pages
            doc.setFillColor(245, 247, 250);
            doc.rect(0, 0, pageWidth, 25, 'F');
            doc.setDrawColor(93, 104, 253);
            doc.setLineWidth(1);
            doc.line(0, 25, pageWidth, 25);

            // Add smaller branding on continuation pages
            doc.setTextColor(4, 5, 35);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('PrecisionNote', margin, 17);

            // Reset to normal text for content
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
          }

          // Add the line to the page
          doc.text(splitText[i], margin, currentY);
          currentY += lineHeight;
        }

        // Add page number to the last page
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${currentPage}`, pageWidth - margin - 15, pageHeight - 10);

        // Add footer with website to all pages
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('www.precisionnote.com', margin, pageHeight - 10);

        // Save PDF
        doc.save(`${elementTitle.replace(/\s+/g, '_')}.pdf`);

        toast({
          title: "PDF Exported",
          description: "Document has been exported as PDF successfully."
        });
      } else {
        throw new Error("Content reference is not available");
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export document as PDF.",
        variant: "destructive"
      });
    }
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
    navigator.clipboard.writeText(transcript);
    toast({
      title: "Transcript Copied",
      description: "The transcript has been copied to your clipboard.",
      duration: 3000,
    });
  };
  const handleExportToPDF = async () => {
    if (form && transcriptRef.current) {
      const documentTitle = form.getValues("title") || "Transcript";
      await exportToPDF(transcriptRef, documentTitle);
    }
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
      // Setup document generation options
      const options: DocumentGenerationOptions = {
        provider: llmProvider,
        format: selectedFormat,
        apiKey: undefined // Using environment variables from config
      };

      // Generate the medical document using the transcription service
      const result = await generateMedicalDocument(transcriptResult, options);
      
      // Get the formatted name for display
      const formatName = getFormatName(selectedFormat);
      
      setStructuredNote(result);
      setConvertedNoteType(formatName);

      if (form) {
        form.setValue("notes", result);
        form.setValue("documentFormat", selectedFormat);
        form.setValue("llmProvider", llmProvider);
      }

      // Auto-extract clinical results from the note
      extractClinicalResults(result);

      toast({
        title: "Note Generated",
        description: `Your transcript has been converted to a structured ${formatName} using ${LLMProvider[llmProvider]}.`,
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
  
  const getFormatName = (format: DocumentFormat) => {
    switch (format) {
      case DocumentFormat.SOAP: return "SOAP Note";
      case DocumentFormat.HISTORY_AND_PHYSICAL: return "History & Physical";
      case DocumentFormat.PROGRESS_NOTE: return "Progress Note";
      case DocumentFormat.DISCHARGE_SUMMARY: return "Discharge Summary";
      case DocumentFormat.CONSULTATION: return "Consultation Note";
      case DocumentFormat.PROCEDURE_NOTE: return "Procedure Note";
      case DocumentFormat.CARDIOLOGY: return "Cardiology Note";
      case DocumentFormat.DICTATION: return "Dictation";
      case DocumentFormat.ENDOCRINOLOGY: return "Endocrinology Note";
      case DocumentFormat.GERIATRICS: return "Geriatrics Note";
      case DocumentFormat.OBSTETRICS: return "Obstetrics Note";
      case DocumentFormat.PSYCHIATRY: return "Psychiatry Note";
      case DocumentFormat.ORTHOPEDICS: return "Orthopedics Note";
      case DocumentFormat.PEDIATRICS: return "Pediatrics Note";
      default: return "Medical Note";
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
              <Button variant="outline" size="sm" onClick={handleExportToPDF}>
                <Copy className="h-4 w-4 mr-1" />
                Export to PDF
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
                <option value={DocumentFormat.PROGRESS_NOTE}>Progress Note</option>
                <option value={DocumentFormat.CONSULTATION}>Consultation Note</option>
                <option value={DocumentFormat.HISTORY_AND_PHYSICAL}>History & Physical</option>
                <option value={DocumentFormat.PROCEDURE_NOTE}>Procedure Note</option>
                <option value={DocumentFormat.CARDIOLOGY}>Cardiology Note</option>
                <option value={DocumentFormat.PSYCHIATRY}>Psychiatry Note</option>
                <option value={DocumentFormat.GERIATRICS}>Geriatrics Note</option>
                <option value={DocumentFormat.PEDIATRICS}>Pediatrics Note</option>
                <option value={DocumentFormat.ORTHOPEDICS}>Orthopedics Note</option>
                <option value={DocumentFormat.OBSTETRICS}>Obstetrics Note</option>
                <option value={DocumentFormat.ENDOCRINOLOGY}>Endocrinology Note</option>
                <option value={DocumentFormat.DISCHARGE_SUMMARY}>Discharge Summary</option>
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
{/*pdf*/}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={transcriptRef} className="p-6 bg-white" style={{ width: "800px" }}>
            <div className="pb-4 border-b border-[#ffcd6a]">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-[#040523]">PrecisionNote</h1>
                  <p className="text-sm text-[#5768fd]">Medical Documentation</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-medium text-[#040523]">{ "Medical Transscription"}</h2>
                  <p className="text-sm text-[#5768fd]">Generated on {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

             Patient information if available
            { extractedPatientInfo && extractedPatientInfo.name !== "Unknown" && (
                <div className="my-4 p-4 border-l-4 border-[#5768fd]">
                  <h3 className="font-bold">Patient Information</h3>
                  <p>Name: {extractedPatientInfo.name}</p>
                  {extractedPatientInfo.age && <p>Age: {extractedPatientInfo.age}</p>}
                  {extractedPatientInfo.gender && <p>Gender: {extractedPatientInfo.gender}</p>}
                </div>
            )}

            {transcriptSummary && (
                <div className="my-6">
                  <h2 className="text-xl font-bold text-[#040523] border-b border-[#ffcd6a] pb-2 mb-4">Consultation Summary</h2>
                  <div className="bg-gray-50 p-4 border rounded border-[#5768fd]/20">
                    <p className="text-[#040523]">{transcriptSummary}</p>
                  </div>
                </div>
            )}

            <h2 className="text-xl font-bold text-[#040523] border-b border-[#ffcd6a] pb-2 mb-4">Clinical Notes</h2>
            <div className="mt-4 text-[#040523]">
              <ReactMarkdown>{formattedNotes}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
  );
};

export default EnhancedTranscriptDisplay;