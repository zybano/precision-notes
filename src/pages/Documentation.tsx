import { useState } from "react";
import { FadeIn } from "@/components/ui/motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { transcribeAudio, TranscriptionResult } from "@/services/transcription";
import { generateBriefSummary } from "@/services/summaryUtils";
import SpecialtyTemplates from "@/components/SpecialtyTemplates";
import { documentTemplates } from "@/data/documentTemplates";
import TemplateCard from "@/components/documentation/TemplateCard";
import TemplateDetailsDialog from "@/components/documentation/TemplateDetailsDialog";
import NewDocumentDialog from "@/components/documentation/NewDocumentDialog";
import RecentDocuments from "@/components/documentation/RecentDocuments";
import SharedDocuments from "@/components/documentation/SharedDocuments";
import { useNavigate } from "react-router-dom";

const DocumentationPage = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [newDocumentOpen, setNewDocumentOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [transcriptSummary, setTranscriptSummary] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [useSpeechModelNano, setUseSpeechModelNano] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [templateDetailsOpen, setTemplateDetailsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof documentTemplates[0] | null>(null);
  const [transcriptResult, setTranscriptResult] = useState<TranscriptionResult | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      type: "SOAP Note",
      patientName: "",
      notes: "",
    },
  });

  const handleUseTemplate = (template: typeof documentTemplates[0]) => {
    toast({
      title: `Template Selected: ${template.title}`,
      description: "Your new document has been created from this template.",
      duration: 3000,
    });
    
    if (template.title === "Dictation (Blank)") {
      form.setValue("type", template.title);
      form.setValue("notes", "");
      setNewDocumentOpen(true);
      return;
    }
    
    setNewDocumentOpen(true);
    form.setValue("type", template.title);
    
    const parameterStructure = template.parameters
      .map(param => `${param.label}:\n\n`)
      .join('\n');
    
    form.setValue("notes", parameterStructure);
  };
  
  const handleViewTemplateDetails = (template: typeof documentTemplates[0]) => {
    setSelectedTemplate(template);
    setTemplateDetailsOpen(true);
  };

  const handleUseSpecialtyTemplate = (template: any) => {
    toast({
      title: `Specialty Template Selected: ${template.title}`,
      description: "Your new document has been created from this specialty template.",
      duration: 3000,
    });
    setNewDocumentOpen(true);
    form.setValue("type", template.title);
    
    const parameterStructure = template.parameters
      .map((param: any) => `${param.label}:\n\n`)
      .join('\n');
    
    form.setValue("notes", parameterStructure);
  };

  const handleCreateNewDocument = (data: any) => {
    toast({
      title: "Document Created",
      description: `Your new ${data.type} for ${data.patientName} has been created.`,
      duration: 3000,
    });
    setNewDocumentOpen(false);
    form.reset();
    stopRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        setAudioChunks(chunks);
        
        processRecording(chunks);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      recorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      
      const timer = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
      setRecordingTimer(timer);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        duration: 3000,
      });
    }
  };
  
  const pauseRecording = () => {
    if (mediaRecorder && isRecording && !isPaused) {
      mediaRecorder.pause();
      setIsPaused(true);
      
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      
      toast({
        title: "Recording Paused",
        description: "Click resume to continue recording.",
        duration: 3000,
      });
    } else if (mediaRecorder && isRecording && isPaused) {
      mediaRecorder.resume();
      setIsPaused(false);
      
      const timer = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
      setRecordingTimer(timer);
      
      toast({
        title: "Recording Resumed",
        description: "Recording has been resumed.",
        duration: 3000,
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      setRecordingTime(0);
      
      toast({
        title: "Recording Stopped",
        description: "Your recording will be processed shortly.",
        duration: 3000,
      });
    }
  };
  
  const processRecording = async (chunks: BlobPart[]) => {
    const audioBlob = new Blob(chunks, { type: 'audio/webm' });
    
    setIsTranscribing(true);
    toast({
      title: "Processing Audio",
      description: "Your recording is being transcribed with AssemblyAI...",
      duration: 3000,
    });
    
    try {
      const result = await transcribeAudio(audioBlob, {
        speakerLabels: true,
        useSpeechModelNano: useSpeechModelNano
      });
      
      setTranscriptResult(result);
      setTranscript(result.text);
      form.setValue("notes", result.text);
      
      const summary = generateBriefSummary(result.text);
      setTranscriptSummary(summary);
      setShowSummary(true);
      
      toast({
        title: "Transcription Complete",
        description: "Your recording has been transcribed successfully with speaker diarization.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Transcription Error",
        description: "There was an error transcribing your audio. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsTranscribing(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Documentation</h1>
            <p className="text-muted-foreground mt-1">
              Create, edit and manage your medical documents
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Button 
              size="sm" 
              className="shadow-sm hover:shadow-md transition-all btn-premium"
              onClick={() => setNewDocumentOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Document
            </Button>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="relative">
          <div className="flex items-center border border-input rounded-lg px-3 mb-6 w-full max-w-md focus-within:ring-1 focus-within:ring-ring">
            <Search className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
            <Input 
              type="text" 
              placeholder="Search documents..." 
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-10"
            />
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="specialties">Specialties</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentTemplates
                .filter(template => template.title === "Dictation (Blank)")
                .map((template, index) => (
                <TemplateCard
                  key={`dictation-${index}`}
                  title={template.title}
                  description={template.description}
                  icon={template.icon}
                  parameters={template.parameters}
                  onViewDetails={() => handleViewTemplateDetails(template)}
                  onUseTemplate={() => handleUseTemplate(template)}
                  isFeatured={true}
                />
              ))}
              
              {documentTemplates
                .filter(template => template.title === "History & Physical")
                .map((template, index) => (
                <TemplateCard
                  key={`history-physical-${index}`}
                  title={template.title}
                  description={template.description}
                  icon={template.icon}
                  parameters={template.parameters}
                  onViewDetails={() => handleViewTemplateDetails(template)}
                  onUseTemplate={() => handleUseTemplate(template)}
                />
              ))}
              
              {documentTemplates
                .filter(template => template.title !== "Dictation (Blank)" && template.title !== "History & Physical")
                .map((template, index) => (
                <TemplateCard
                  key={index}
                  title={template.title}
                  description={template.description}
                  icon={template.icon}
                  parameters={template.parameters}
                  onViewDetails={() => handleViewTemplateDetails(template)}
                  onUseTemplate={() => handleUseTemplate(template)}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="specialties" className="space-y-6">
            <SpecialtyTemplates onUseTemplate={handleUseSpecialtyTemplate} />
          </TabsContent>
          
          <TabsContent value="recent" className="space-y-6">
            <RecentDocuments 
              setNewDocumentOpen={setNewDocumentOpen} 
              form={form} 
            />
          </TabsContent>
          
          <TabsContent value="shared" className="space-y-6">
            <SharedDocuments 
              setNewDocumentOpen={setNewDocumentOpen} 
              form={form} 
            />
          </TabsContent>
        </Tabs>
      </FadeIn>

      <TemplateDetailsDialog
        open={templateDetailsOpen}
        onOpenChange={setTemplateDetailsOpen}
        template={selectedTemplate}
        onUseTemplate={() => selectedTemplate && handleUseTemplate(selectedTemplate)}
      />

      <NewDocumentDialog
        open={newDocumentOpen}
        onOpenChange={(open) => {
          setNewDocumentOpen(open);
          if (!open) {
            stopRecording();
            setTranscript("");
            setTranscriptSummary("");
            setShowSummary(true);
            setTranscriptResult(null);
            form.reset();
          }
        }}
        form={form}
        onSubmit={handleCreateNewDocument}
        isRecording={isRecording}
        isPaused={isPaused}
        recordingTime={recordingTime}
        isTranscribing={isTranscribing}
        useSpeechModelNano={useSpeechModelNano}
        setUseSpeechModelNano={setUseSpeechModelNano}
        startRecording={startRecording}
        pauseRecording={pauseRecording}
        stopRecording={stopRecording}
        formatTime={formatTime}
        transcript={transcript}
        transcriptSummary={transcriptSummary}
        showSummary={showSummary}
        setShowSummary={setShowSummary}
        transcriptResult={transcriptResult}
        documentTemplates={documentTemplates}
      />
    </div>
  );
};

export default DocumentationPage;
