import { useState } from "react";
import { FadeIn } from "@/components/ui/motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, ClipboardList, Search, Copy, Plus, Mic, StopCircle, Loader2, Pause, Play, CheckCircle, ListFilter, User, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { transcribeAudio, SpeakerUtterance, TranscriptionResult } from "@/services/transcription";
import { generateBriefSummary, extractKeyPoints } from "@/services/summaryUtils";

const documentTemplates = [
  { 
    title: "SOAP Note", 
    description: "Subjective, Objective, Assessment, Plan", 
    icon: FileText,
    parameters: [
      { name: "subjective", label: "Subjective", description: "Patient's complaints and symptoms in their own words", type: "textarea" },
      { name: "objective", label: "Objective", description: "Measurable and observable findings, vital signs, exam results", type: "textarea" },
      { name: "assessment", label: "Assessment", description: "Diagnosis or clinical impression based on subjective and objective data", type: "textarea" },
      { name: "plan", label: "Plan", description: "Treatment plan, medications, follow-up instructions", type: "textarea" }
    ]
  },
  { 
    title: "Progress Note", 
    description: "Follow-up documentation", 
    icon: ClipboardList,
    parameters: [
      { name: "currentStatus", label: "Current Status", description: "Patient's current condition", type: "textarea" },
      { name: "changes", label: "Changes Since Last Visit", description: "Note any improvements or deterioration", type: "textarea" },
      { name: "treatmentResponse", label: "Treatment Response", description: "How the patient is responding to current treatment", type: "textarea" },
      { name: "nextSteps", label: "Next Steps", description: "Adjustments to treatment plan and follow-up schedule", type: "textarea" }
    ]
  },
  { 
    title: "Consultation Note", 
    description: "For specialist referrals", 
    icon: Calendar,
    parameters: [
      { name: "referralReason", label: "Referral Reason", description: "Why the patient was referred", type: "textarea" },
      { name: "specialistFindings", label: "Specialist Findings", description: "Results of specialist evaluation", type: "textarea" },
      { name: "recommendations", label: "Recommendations", description: "Specialist's recommended course of action", type: "textarea" },
      { name: "followUp", label: "Follow-up Plan", description: "When and how to follow up with specialist", type: "textarea" }
    ]
  },
  { 
    title: "Discharge Summary", 
    description: "Post-discharge documentation", 
    icon: FileText,
    parameters: [
      { name: "admissionReason", label: "Admission Reason", description: "Why the patient was admitted", type: "textarea" },
      { name: "hospitalCourse", label: "Hospital Course", description: "Summary of treatment during hospitalization", type: "textarea" },
      { name: "dischargeDiagnosis", label: "Discharge Diagnosis", description: "Final diagnosis at time of discharge", type: "textarea" },
      { name: "dischargeMedications", label: "Discharge Medications", description: "Medications prescribed at discharge", type: "textarea" },
      { name: "followUpInstructions", label: "Follow-up Instructions", description: "Post-discharge care instructions", type: "textarea" }
    ]
  },
  { 
    title: "Procedure Note", 
    description: "Documenting medical procedures", 
    icon: ClipboardList,
    parameters: [
      { name: "procedureType", label: "Procedure Type", description: "Name and type of procedure performed", type: "input" },
      { name: "indication", label: "Indication", description: "Reason for performing the procedure", type: "textarea" },
      { name: "technique", label: "Technique", description: "How the procedure was performed", type: "textarea" },
      { name: "findings", label: "Findings", description: "Results and observations during the procedure", type: "textarea" },
      { name: "complications", label: "Complications", description: "Any complications encountered", type: "textarea" },
      { name: "postProcedurePlan", label: "Post-Procedure Plan", description: "Follow-up care after procedure", type: "textarea" }
    ]
  },
  { 
    title: "History & Physical", 
    description: "Comprehensive patient assessment", 
    icon: Calendar,
    parameters: [
      { name: "chiefComplaint", label: "Chief Complaint", description: "Patient's main reason for visit", type: "textarea" },
      { name: "historyOfPresentIllness", label: "History of Present Illness", description: "Detailed chronology of the patient's illness", type: "textarea" },
      { name: "pastMedicalHistory", label: "Past Medical History", description: "Previous medical conditions and surgeries", type: "textarea" },
      { name: "medications", label: "Medications", description: "Current medications and allergies", type: "textarea" },
      { name: "familyHistory", label: "Family History", description: "Relevant family medical history", type: "textarea" },
      { name: "socialHistory", label: "Social History", description: "Relevant lifestyle factors", type: "textarea" },
      { name: "physicalExam", label: "Physical Exam", description: "Findings from physical examination", type: "textarea" },
      { name: "impression", label: "Impression", description: "Clinical impression and diagnosis", type: "textarea" },
      { name: "plan", label: "Plan", description: "Treatment and follow-up plan", type: "textarea" }
    ]
  },
];

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
  
  const copyTranscription = () => {
    const textToCopy = form.getValues("notes");
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast({
          title: "Copied to Clipboard",
          description: "Transcription has been copied to your clipboard.",
          duration: 2000,
        });
      })
      .catch((error) => {
        console.error("Failed to copy:", error);
        toast({
          title: "Copy Failed",
          description: "Could not copy text to clipboard.",
          variant: "destructive",
          duration: 3000,
        });
      });
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
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentTemplates.map((template, index) => (
                <Card key={index} className="hover:shadow-md transition-all cursor-pointer border border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mr-4">
                          <template.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{template.title}</h3>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="p-4 flex justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewTemplateDetails(template)}
                        className="gap-1.5"
                      >
                        <ListFilter className="h-3.5 w-3.5" />
                        View Parameters
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="recent" className="space-y-6">
            <div className="space-y-4">
              {[
                { title: "Sarah Johnson - Progress Note", date: "Edited 2 hours ago", type: "Progress Note" },
                { title: "Michael Chen - Assessment", date: "Edited yesterday", type: "Assessment" },
                { title: "Emily Rodriguez - Consultation", date: "Edited Aug 24, 2023", type: "Consultation" },
                { title: "Robert Williams - Discharge Summary", date: "Edited Aug 22, 2023", type: "Discharge Summary" },
              ].map((doc, index) => (
                <Card key={index} className="hover:shadow-md transition-all cursor-pointer border border-border">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <FileText className="h-3 w-3 mr-1" />
                          <span>{doc.type} • {doc.date}</span>
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => {
                        toast({
                          title: "Continuing Document",
                          description: `Opening ${doc.title} for editing`,
                          duration: 3000,
                        });
                        setNewDocumentOpen(true);
                        form.setValue("type", doc.type);
                        form.setValue("patientName", doc.title.split(" - ")[0]);
                      }}>Continue</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => toast({
                title: "Loading More Documents",
                description: "Retrieving your additional documents",
                duration: 3000,
              })}>Load More</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="shared" className="space-y-6">
            <div className="space-y-4">
              {[
                { title: "Team Meeting Notes", author: "Dr. Jessica Kim", date: "Shared with you on Aug 26, 2023" },
                { title: "Clinical Guidelines 2023", author: "Dr. Andrew Martinez", date: "Shared with you on Aug 20, 2023" },
              ].map((doc, index) => (
                <Card key={index} className="hover:shadow-md transition-all cursor-pointer border border-border">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <span>{doc.author} • {doc.date}</span>
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          toast({
                            title: "Viewing Shared Document",
                            description: `Opening ${doc.title}`,
                            duration: 3000,
                          });
                          setNewDocumentOpen(true);
                          form.setValue("type", "Shared Document");
                          form.setValue("patientName", doc.title);
                          form.setValue("notes", `Shared by ${doc.author} on ${doc.date.split(" on ")[1]}`);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </FadeIn>

      <Dialog open={templateDetailsOpen} onOpenChange={setTemplateDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate?.icon && <selectedTemplate.icon className="h-5 w-5" />}
              {selectedTemplate?.title} Template
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-2">
            <h3 className="text-sm font-medium">Template Parameters</h3>
            <div className="space-y-4">
              {selectedTemplate?.parameters.map((param, index) => (
                <div key={index} className="bg-muted/40 p-3 rounded-md space-y-1">
                  <div className="flex items-center">
                    <h4 className="text-sm font-medium">{param.label}</h4>
                    <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                      {param.type === 'textarea' ? 'Multi-line text' : 'Single-line text'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{param.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTemplateDetailsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              handleUseTemplate(selectedTemplate!);
              setTemplateDetailsOpen(false);
            }}>
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newDocumentOpen} onOpenChange={(open) => {
        setNewDocumentOpen(open);
        if (!open) {
          stopRecording();
          setTranscript("");
          setTranscriptSummary("");
          setShowSummary(true);
          setTranscriptResult(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>
              Fill in the details or record your notes to create a new medical document
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateNewDocument)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                      >
                        {documentTemplates.map((template, index) => (
                          <option key={index} value={template.title}>{template.title}</option>
                        ))}
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter patient name" {...field} required />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Voice Recording</h4>
                  <div className="flex items-center gap-2">
                    {(isRecording || isPaused) && <span className="text-xs text-muted-foreground">{formatTime(recordingTime)}</span>}
                    <div className="flex items-center gap-1">
                      {!isRecording && !isPaused && (
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="secondary"
                          onClick={startRecording}
                          className="h-8 px-3"
                          disabled={isTranscribing}
                        >
                          <Mic className="h-4 w-4 mr-1" />
                          Record
                        </Button>
                      )}
                      
                      {(isRecording || isPaused) && (
                        <>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant={isPaused ? "outline" : "secondary"}
                            onClick={pauseRecording}
                            className="h-8 px-2"
                            disabled={isTranscribing}
                          >
                            {isPaused ? (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                Resume
                              </>
                            ) : (
                              <>
                                <Pause className="h-4 w-4 mr-1" />
                                Pause
                              </>
                            )}
                          </Button>
                          
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="destructive"
                            onClick={stopRecording}
                            className="h-8 px-2"
                            disabled={isTranscribing}
                          >
                            <StopCircle className="h-4 w-4 mr-1" />
                            Stop
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="nanoModelToggle"
                      checked={useSpeechModelNano}
                      onChange={(e) => setUseSpeechModelNano(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="nanoModelToggle" className="text-xs text-muted-foreground">
                      Use Nano Speech Model (faster but less accurate)
                    </label>
                  </div>
                </div>
                
                {isRecording && !isPaused && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-red-500">●</span>
                      <span className="text-xs">Recording in progress...</span>
                    </div>
                    <Progress value={recordingTime % 60} max={60} className="h-1" />
                  </div>
                )}
                
                {isPaused && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-amber-500">●</span>
                      <span className="text-xs">Recording paused</span>
                    </div>
                  </div>
                )}

                {isTranscribing && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Transcribing with AssemblyAI...</span>
                    </div>
                    <Progress value={50} max={100} className="h-1" />
                  </div>
                )}
              </div>
              
              {transcriptResult && transcriptResult.utterances && transcriptResult.utterances.length > 0 && (
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Conversation Transcript</h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs flex items-center gap-1"
                      onClick={() => {
                        const formattedTranscript = transcriptResult.utterances
                          .map(u => `${u.speaker}: ${u.text}`)
                          .join('\n\n');
                        navigator.clipboard.writeText(formattedTranscript);
                        toast({
                          title: "Transcript Copied",
                          description: "Conversation transcript copied to clipboard",
                          duration: 2000,
                        });
                      }}
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
                          onClick={() => {
                            toast({
                              title: "Summary Copied",
                              description: "Transcript summary copied to clipboard",
                              duration: 2000,
                            });
                            navigator.clipboard.writeText(transcriptSummary);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                          Copy Summary
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Notes</FormLabel>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs flex items-center gap-1"
                        onClick={copyTranscription}
                        disabled={!field.value}
                      >
                        <Copy className="h-3 w-3" />
                        Copy Transcription
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter notes or record audio to transcribe" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => {
                  setNewDocumentOpen(false);
                  stopRecording();
                  setTranscript("");
                  setTranscriptSummary("");
                  setShowSummary(true);
                  setTranscriptResult(null);
                  form.reset();
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isTranscribing}>Create Document</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentationPage;

