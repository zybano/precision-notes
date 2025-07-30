
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { documentTemplates } from "@/data/documentTemplates";
import { useDocumentFormat } from "@/hooks/useDocumentFormat";
import DocumentationHeader from "@/components/documentation/DocumentationHeader";
import { useOrganizationalTranscriptionController } from "@/hooks/useOrganizationalTranscriptionController";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Eye, FileCog, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  TranscriptionResult,
  TranscriptionProvider,
  LLMProvider,
  DocumentFormat,
} from "@/services/transcription";
import EnhancedRecordingInterface from "@/components/documentation/EnhancedRecordingInterface";
import { PatientSummaryResult } from "@/services/summaryUtils";

const OrganizationalDocumentationPage = () => {
  const [activeTab, setActiveTab] = useState("record");
  const [isEditMode, setIsEditMode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const form = useForm({
    defaultValues: {
      type: "Consultation",
      notes: "",
      documentId: "",
      transcript: "",
      transcriptSummary: "",
      transcriptResult: null,
      recordingTime: 0,
      patientName: "",
      patientInfo: null,
      documentFormat: "soap",
      infoVerified: false,
    },
  });

  const {
    transcriptionProvider,
    setTranscriptionProvider,
    llmProvider,
    setLlmProvider,
    documentFormat,
    setDocumentFormat,
    useSpeechModelNano,
    setUseSpeechModelNano,
  } = useDocumentFormat();

  const transcriptionControls = useOrganizationalTranscriptionController({
    form,
    transcriptionProvider,
    useSpeechModelNano,
  });

  const { register, watch, getValues, setValue } = form;
  const notesContent = watch("notes");
  const documentTitle = watch("title") || "Medical Report";

  const handleCopyToEMR = () => {
    navigator.clipboard.writeText(getValues().notes);
    toast.success("Notes Copied");
  };

  const handleDownloadPDF = async () => {
    // PDF generation logic will be added later
    toast.info("PDF download functionality is not yet implemented.");
  };


  const handleDocumentGenerated = (document: string, formatName?: string) => {
    setValue("notes", document);
    if (formatName) {
      setValue("documentFormat", formatName);
    }
    setActiveTab("notes");
    toast.success("Document Generated, You can export or save");
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <div className={"container mx-auto py-6 space-y-8 w-full"}>
      <DocumentationHeader />
      <div className="flex flex-col lg:flex-row h-full">
        <div className="lg:w-full p-6 pt-0 border-r">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="record" className="flex items-center">
                Transcription
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center" disabled={!transcriptionControls.transcript}>
                Notes
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center" disabled={!transcriptionControls.transcript}>
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="record" className="mt-0">
              <EnhancedRecordingInterface
                form={form}
                isRecording={transcriptionControls.isRecording}
                isPaused={transcriptionControls.isPaused}
                recordingTime={transcriptionControls.recordingTime}
                startRecording={transcriptionControls.startRecording}
                pauseRecording={transcriptionControls.pauseRecording}
                stopRecording={transcriptionControls.handleStopRecording}
                formatTime={transcriptionControls.formatTime}
                transcript={transcriptionControls.transcript}
                transcriptSummary={transcriptionControls.transcriptSummary}
                patientInfo={transcriptionControls.patientInfo}
                isTranscribing={transcriptionControls.isTranscribing}
                showSummary={transcriptionControls.showSummary}
                setShowSummary={transcriptionControls.setShowSummary}
                transcriptResult={transcriptionControls.transcriptResult}
                onFileUpload={transcriptionControls.onFileUpload}
                resetRecording={transcriptionControls.resetRecording}
                resetTranscription={transcriptionControls.resetTranscription}
                transcriptionProvider={transcriptionProvider}
                setTranscriptionProvider={setTranscriptionProvider}
                llmProvider={llmProvider}
                setLlmProvider={setLlmProvider}
                documentFormat={documentFormat}
                setDocumentFormat={setDocumentFormat}
                useSpeechModelNano={useSpeechModelNano}
                setUseSpeechModelNano={setUseSpeechModelNano}
                onDocumentGenerated={handleDocumentGenerated}
                showTemplateSelection={false}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-0">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notes" className="text-lg font-medium">
                      Generated Notes
                    </Label>
                    <div className="flex items-center space-x-4">
                      <Button
                        type="button"
                        onClick={toggleEditMode}
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                      >
                        {isEditMode ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {isEditMode ? (
                    <Textarea
                      id="notes"
                      className="min-h-[350px] font-mono text-sm resize-y"
                      {...register("notes")}
                    />
                  ) : (
                    <div className="border rounded-md p-4 min-h-[350px] overflow-y-auto prose prose-sm max-w-none">
                      <ReactMarkdown>{notesContent}</ReactMarkdown>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("record")}
                  >
                    Back to Recording
                  </Button>
                  <div className="space-x-2">
                    <Button
                      type="button"
                      className="flex items-center"
                      onClick={() => setActiveTab("export")}
                    >
                      Export Options
                      <FileCog className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export" className="mt-0">
              <div className="space-y-6">
                <div className="rounded-lg border p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <FileCog className="h-5 w-5 mr-2" />
                    Export Options
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-accent/20 p-4 rounded-md flex items-start space-x-4">
                      <div className="bg-accent rounded-full p-1 mt-0.5">
                        <FileCog className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">Copy to EMR</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Copy the formatted notes to paste directly into your
                          EMR system
                        </p>
                        <Button
                          type="button"
                          onClick={handleCopyToEMR}
                          size="sm"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy to Clipboard
                        </Button>
                      </div>
                    </div>

                    <div className="bg-accent/20 p-4 rounded-md flex items-start space-x-4">
                      <div className="bg-accent rounded-full p-1 mt-0.5">
                        <Download className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">Download PDF</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Save the consultation notes as a PDF document
                        </p>
                        <Button
                          type="button"
                          onClick={handleDownloadPDF}
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("notes")}
                  >
                    Back to Notes
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default OrganizationalDocumentationPage;
