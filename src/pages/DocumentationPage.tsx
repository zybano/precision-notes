
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { documentTemplates } from "@/data/documentTemplates";
import { useDocumentFormat } from "@/hooks/useDocumentFormat";
import DocumentationHeader from "@/components/documentation/DocumentationHeader";
import DocumentationSearch from "@/components/documentation/DocumentationSearch";
import DocumentationTabs from "@/components/documentation/DocumentationTabs";
import UpdatedNewDocumentDialog from "@/components/documentation/NewDocumentDialog";
import DocumentationInitializer from "@/components/documentation/DocumentationInitializer";
import useDocumentOperations from "@/hooks/useDocumentOperations";
import { useTranscriptionController } from "@/components/documentation/TranscriptionController";
import { toast } from "sonner";
import { getCredits } from "@/services/payment/paymentService";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Coins, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

const DocumentationPage = () => {
  const [activeTab, setActiveTab] = useState("saved");
  const [newDocumentOpen, setNewDocumentOpen] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | undefined>(undefined);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  
  // Get subscription info
  const { subscriptionInfo } = useAuth();
  
  // Create a ref to store the refresh function
  const tabsRefreshRef = useRef({
    refreshSavedDocuments: () => {},
    refreshSharedDocuments: () => {}
  });

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
      documentFormat: "",
      infoVerified: false,
    },
  });

  // Use custom hooks
  const {
    transcriptionProvider,
    setTranscriptionProvider,
    llmProvider,
    setLlmProvider,
    documentFormat,
    setDocumentFormat,
    useSpeechModelNano,
    setUseSpeechModelNano
  } = useDocumentFormat();

  // Use our transcription controller hook
  const transcriptionControls = useTranscriptionController({
    form,
    transcriptionProvider,
    useSpeechModelNano
  });

  // Load credit balance
  useEffect(() => {
    const fetchCredits = async () => {
      setIsLoadingCredits(true);
      try {
        const { success, balance } = await getCredits();
        if (success) {
          setCreditBalance(balance);
        } else {
          console.error("Failed to fetch credit balance");
        }
      } catch (error) {
        console.error("Error fetching credits:", error);
      } finally {
        setIsLoadingCredits(false);
      }
    };
    
    fetchCredits();
    
    // Refresh credits every 60 seconds
    const interval = setInterval(fetchCredits, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle document dialog close
  const handleDialogClose = () => {
    setNewDocumentOpen(false);
  };

  // Function to refresh data from tabs
  const refetchDataFromTabs = () => {
    // Check which tab is active and refresh accordingly
    if (activeTab === "saved") {
      tabsRefreshRef.current.refreshSavedDocuments();
    } else if (activeTab === "shared") {
      tabsRefreshRef.current.refreshSharedDocuments();
    }
  };

  // Use our document operations hook with onSaveSuccess callback
  const {
    documentSaved,
    setDocumentSaved,
    verificationNeeded,
    setVerificationNeeded,
    handleCreateNewDocument,
    resetForm,
    exportToPDF
  } = useDocumentOperations({
    form,
    resetRecording: transcriptionControls.resetRecording,
    resetTranscription: transcriptionControls.resetTranscription,
    onSaveSuccess: handleDialogClose
  });

  // Handle document submission with verification
  const handleSubmitDocument = async (data: any) => {
    const success = await handleCreateNewDocument(data);
    if (success) {
      setNewDocumentOpen(false);
      // refresh the actual data in the tabs
      refetchDataFromTabs();
    }
  };

  // Handle dialog open change with state preservation
  const handleDialogOpenChange = (open: boolean) => {
    setNewDocumentOpen(open);
    if (!open && !documentSaved) {
      // If dialog is closed without saving, just stop recording if it's ongoing
      if (transcriptionControls.isRecording) {
        transcriptionControls.handleStopRecording();
      }
    }
  };

  return (
      <DocumentationInitializer>
        <div className={"container mx-auto py-6 space-y-8 w-full"}>
          <div className="flex justify-between items-center">
            <DocumentationHeader />
            
            <div className="flex items-center gap-4">
              {/* Credit balance display */}
              <Card className="border border-green-100">
                <CardContent className="p-3 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <div>
                    <div className="text-sm font-medium">Credits</div>
                    <div className="text-xl font-bold">
                      {isLoadingCredits ? '...' : creditBalance !== undefined ? creditBalance : 'N/A'}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-2"
                    onClick={() => window.location.href = '/consultation-purchase'}
                  >
                    <CreditCard className="h-3.5 w-3.5 mr-1" />
                    Buy
                  </Button>
                </CardContent>
              </Card>
              
              {/* Subscription tier badge */}
              {subscriptionInfo?.tier && (
                <Badge 
                  variant={
                    subscriptionInfo.tier === 'free' ? 'outline' : 
                    subscriptionInfo.tier === 'starter' ? 'default' :
                    subscriptionInfo.tier === 'professional' ? 'secondary' :
                    'destructive'
                  }
                  className="text-xs p-1.5"
                >
                  {subscriptionInfo.tier.charAt(0).toUpperCase() + subscriptionInfo.tier.slice(1)} Plan
                </Badge>
              )}
            </div>
          </div>

          <DocumentationSearch
              setNewDocumentOpen={setNewDocumentOpen}
              form={form}
              resetForm={resetForm}
          />

          <DocumentationTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setNewDocumentOpen={setNewDocumentOpen}
              form={form}
              refreshRef={tabsRefreshRef}
          />

          <UpdatedNewDocumentDialog
              open={newDocumentOpen}
              onOpenChange={handleDialogOpenChange}
              form={form}
              onSubmit={handleSubmitDocument}
              isRecording={transcriptionControls.isRecording}
              isPaused={transcriptionControls.isPaused}
              recordingTime={transcriptionControls.recordingTime}
              isTranscribing={transcriptionControls.isTranscribing}
              useSpeechModelNano={useSpeechModelNano}
              setUseSpeechModelNano={setUseSpeechModelNano}
              startRecording={transcriptionControls.startRecording}
              pauseRecording={transcriptionControls.pauseRecording}
              stopRecording={transcriptionControls.handleStopRecording}
              formatTime={transcriptionControls.formatTime}
              transcript={transcriptionControls.transcript}
              transcriptSummary={transcriptionControls.transcriptSummary}
              patientInfo={transcriptionControls.patientInfo}
              showSummary={transcriptionControls.showSummary}
              setShowSummary={transcriptionControls.setShowSummary}
              transcriptResult={transcriptionControls.transcriptResult}
              documentTemplates={documentTemplates}
              transcriptionProvider={transcriptionProvider}
              setTranscriptionProvider={setTranscriptionProvider}
              llmProvider={llmProvider}
              setLlmProvider={setLlmProvider}
              documentFormat={documentFormat}
              setDocumentFormat={setDocumentFormat}
              onFileUpload={transcriptionControls.onFileUpload}
              documentSaved={documentSaved}
              exportToPDF={exportToPDF}
          />
        </div>
      </DocumentationInitializer>
  );
};

export default DocumentationPage;
