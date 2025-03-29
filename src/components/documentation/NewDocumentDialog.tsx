
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { Check, LayoutDashboard, BadgeInfo, Pill, BookOpen, ChevronRight, FileText, FileSpreadsheet, Eye, FileCog } from "lucide-react";
import { toast } from "sonner";
import { TranscriptionResult } from "@/services/transcription";
import RecordingInterface from "@/components/documentation/RecordingInterface";
import DrugMonograph from "@/components/documentation/DrugMonograph";
import MedicationSafetyAlerts from "@/components/documentation/MedicationSafetyAlerts";
import EnhancedContextPanel from "@/components/documentation/EnhancedContextPanel";

interface NewDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: any;
  onSubmit: (data: any) => void;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  isTranscribing: boolean;
  useSpeechModelNano: boolean;
  setUseSpeechModelNano: (value: boolean) => void;
  startRecording: () => void;
  pauseRecording: () => void;
  stopRecording: () => void;
  formatTime: (seconds: number) => string;
  transcript: string;
  transcriptSummary: string;
  showSummary: boolean;
  setShowSummary: (value: boolean) => void;
  transcriptResult: TranscriptionResult | null;
  documentTemplates: any[];
}

const NewDocumentDialog: React.FC<NewDocumentDialogProps> = ({
  open,
  onOpenChange,
  form,
  onSubmit,
  isRecording,
  isPaused,
  recordingTime,
  isTranscribing,
  useSpeechModelNano,
  setUseSpeechModelNano,
  startRecording,
  pauseRecording,
  stopRecording,
  formatTime,
  transcript,
  transcriptSummary,
  showSummary,
  setShowSummary,
  transcriptResult,
  documentTemplates
}) => {
  const [activeTab, setActiveTab] = useState("record");
  const { register, handleSubmit, formState: { errors } } = form;
  
  // Mock data for demo purposes
  const mockMedicationAlerts = [
    {
      id: "1",
      type: "interaction",
      severity: "high",
      title: "Critical Drug Interaction: Lisinopril + Potassium",
      description: "Combining Lisinopril with potassium supplements increases risk of hyperkalemia.",
      medications: ["Lisinopril 20mg", "Potassium 10mEq"]
    },
    {
      id: "2",
      type: "contraindication",
      severity: "medium",
      title: "Contraindication: Metformin and Renal Impairment",
      description: "Patient's eGFR indicates reduced renal function, which may contraindicate standard Metformin dosing.",
      medications: ["Metformin 1000mg"]
    },
    {
      id: "3",
      type: "dosage",
      severity: "low",
      title: "Dosage Warning: Statin Therapy",
      description: "Current dosage may need adjustment based on recent lipid panel results.",
      medications: ["Atorvastatin 40mg"]
    }
  ];
  
  // Mock data for enhanced context
  const mockEnhancedContext = {
    observations: [
      {
        id: "1",
        category: "Physical",
        text: "Patient is obese with BMI of approximately 32",
        confidence: 0.95,
        source: "implicit" as const
      },
      {
        id: "2",
        category: "Behavior",
        text: "Patient appears anxious when discussing weight",
        confidence: 0.78,
        source: "implicit" as const
      },
      {
        id: "3",
        category: "Symptoms",
        text: "Reports fatigue and shortness of breath when climbing stairs",
        confidence: 0.92,
        source: "explicit" as const
      }
    ],
    inferredConditions: [
      {
        id: "1",
        name: "Uncontrolled Hypertension",
        confidence: 0.88,
        supportingEvidence: [
          "BP readings consistently elevated",
          "Medication compliance issues mentioned",
          "Family history of cardiovascular disease"
        ]
      },
      {
        id: "2",
        name: "Pre-diabetes",
        confidence: 0.76,
        supportingEvidence: [
          "BMI in obese range",
          "Sedentary lifestyle indicated",
          "Complaint of fatigue"
        ]
      }
    ],
    patientContext: [
      {
        id: "1",
        category: "Social",
        text: "Lives alone, limited social support network"
      },
      {
        id: "2",
        category: "Economic",
        text: "Expressed concern about medication costs"
      },
      {
        id: "3",
        category: "Compliance",
        text: "History of medication non-adherence due to side effects"
      }
    ]
  };
  
  const handleCopyToEMR = () => {
    navigator.clipboard.writeText(form.getValues().notes);
    toast.success("Notes copied to clipboard for EMR entry", {
      description: "The formatted notes can now be pasted into your EMR system."
    });
  };
  
  const handleDownloadPDF = () => {
    toast.success("PDF download started", {
      description: "Your document is being prepared for download."
    });
    
    // Simulate PDF generation delay
    setTimeout(() => {
      toast.success("PDF document ready", {
        description: "Your document has been downloaded."
      });
    }, 1500);
  };
  
  const handlePrint = () => {
    toast.success("Preparing document for printing", {
      description: "Your document is being sent to the printer dialog."
    });
    
    // In a real implementation, this would trigger window.print()
    setTimeout(() => {
      toast.success("Document sent to printer", {
        description: "Please check your printer dialog to complete printing."
      });
    }, 1000);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl">Consultation Documentation</DialogTitle>
          <DialogDescription>
            Record your consultation, generate notes, and export to your EMR system
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col lg:flex-row h-full">
          <div className="lg:w-2/3 p-6 pt-0 border-r">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-8">
                <TabsTrigger value="record" className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" /> Record
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center" disabled={!transcript}>
                  <FileText className="h-4 w-4 mr-2" /> Notes
                </TabsTrigger>
                <TabsTrigger value="context" className="flex items-center" disabled={!transcript}>
                  <BadgeInfo className="h-4 w-4 mr-2" /> Context
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center" disabled={!transcript}>
                  <FileCog className="h-4 w-4 mr-2" /> Export
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="record" className="mt-0">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <RecordingInterface
                    isRecording={isRecording}
                    isPaused={isPaused}
                    isTranscribing={isTranscribing}
                    recordingTime={recordingTime}
                    useSpeechModelNano={useSpeechModelNano}
                    setUseSpeechModelNano={setUseSpeechModelNano}
                    startRecording={startRecording}
                    pauseRecording={pauseRecording}
                    stopRecording={stopRecording}
                    formatTime={formatTime}
                    onDownloadPdf={handleDownloadPDF}
                    onCopyToEMR={handleCopyToEMR}
                    onPrint={handlePrint}
                  />
                  
                  {transcript && !isRecording && !isTranscribing && (
                    <div className="mt-6 flex justify-end">
                      <Button 
                        type="button" 
                        className="flex items-center"
                        onClick={() => setActiveTab("notes")}
                      >
                        Proceed to Notes
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </form>
              </TabsContent>
              
              <TabsContent value="notes" className="mt-0">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notes" className="text-lg font-medium">Generated Notes</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="showSummary"
                          checked={showSummary}
                          onCheckedChange={setShowSummary}
                        />
                        <Label htmlFor="showSummary" className="text-sm">Show Summary</Label>
                      </div>
                    </div>
                    
                    {showSummary && transcriptSummary && (
                      <div className="bg-muted p-3 rounded-md text-sm mb-4">
                        <p className="font-medium mb-1">Summary:</p>
                        <p>{transcriptSummary}</p>
                      </div>
                    )}
                    
                    <Textarea
                      id="notes"
                      className="min-h-[350px] font-mono text-sm resize-y"
                      {...register("notes")}
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setActiveTab("record")}
                    >
                      Back to Recording
                    </Button>
                    <Button 
                      type="button" 
                      className="flex items-center"
                      onClick={() => setActiveTab("context")}
                    >
                      View Enhanced Context
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="context" className="mt-0">
                <div className="space-y-6">
                  <EnhancedContextPanel context={mockEnhancedContext} />
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label className="text-lg font-medium">Medication Safety Alerts</Label>
                    <MedicationSafetyAlerts alerts={mockMedicationAlerts} />
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setActiveTab("notes")}
                    >
                      Back to Notes
                    </Button>
                    <Button 
                      type="button" 
                      className="flex items-center"
                      onClick={() => setActiveTab("export")}
                    >
                      Export Options
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
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
                          <FileText className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">Copy to EMR</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Copy the formatted notes to paste directly into your EMR system
                          </p>
                          <Button onClick={handleCopyToEMR} size="sm">
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
                          <Button onClick={handleDownloadPDF} size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-accent/20 p-4 rounded-md flex items-start space-x-4">
                        <div className="bg-accent rounded-full p-1 mt-0.5">
                          <Printer className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">Print Document</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Print the consultation notes for physical records
                          </p>
                          <Button onClick={handlePrint} size="sm">
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setActiveTab("context")}
                    >
                      Back to Context
                    </Button>
                    <Button 
                      type="submit"
                      onClick={handleSubmit(onSubmit)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Save Document
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="lg:w-1/3 p-6 space-y-6">
            <DrugMonograph />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewDocumentDialog;
