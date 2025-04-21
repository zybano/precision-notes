import React, { useEffect, useState, MutableRefObject } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Document, RawDocumentData } from "./DocumentTypes";
import DocumentTable from "./DocumentTable";
import SimplifiedTranscriptDialog from "./SimplifiedTranscriptDialog";
import { TranscriptionResult } from "@/services/transcription";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserDocuments } from "@/services/supabaseSetup";
import EnhancedTranscriptDialog from "@/components/documentation/EnhancedTranscriptDialog.tsx";

interface RecentDocumentsProps {
  setNewDocumentOpen: (open: boolean) => void;
  form: UseFormReturn<any>;
  refreshRef?: MutableRefObject<{
    refreshSavedDocuments: () => void;
    refreshSharedDocuments: () => void;
  }>;
}

const RecentDocuments: React.FC<RecentDocumentsProps> = ({
  setNewDocumentOpen,
  form,
  refreshRef
}) => {
  const { user } = useAuth();
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transcriptDialogOpen, setTranscriptDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [parsedTranscript, setParsedTranscript] = useState<TranscriptionResult | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptSummary, setTranscriptSummary] = useState("");
  const [showSummary, setShowSummary] = useState(true);
  const [formattedNotes, setFormattedNotes] = useState("");
    const [documentFormat, setDocumentFormat] = useState("");

  const fetchRecentDocuments = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      console.log("Fetching documents for user:", user.id);
      const { success, data, error } = await fetchUserDocuments(user.id);

      if (!success || error) {
        throw error || new Error("Failed to fetch documents");
      }

      if (data && Array.isArray(data)) {
        console.log("Fetched documents:", data.length);
        const mappedDocuments: Document[] = data.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          patient_name: doc.patient_name,
          status: doc.status,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          notes: doc.notes,
          transcript_data: doc.transcript_data || null,
          document_format: doc.document_format || null,
          recording_duration: doc.recording_duration || null,
          generated_title: doc.generated_title || null
        }));
        setRecentDocuments(mappedDocuments);
      } else {
        console.log("No documents found or data is not an array:", data);
        setRecentDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch recent documents");
      setRecentDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Register the fetchRecentDocuments function with the parent component
  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = {
        ...refreshRef.current,
        refreshSavedDocuments: fetchRecentDocuments
      };
    }
  }, [refreshRef, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchRecentDocuments();
    } else {
      setIsLoading(false);
      setRecentDocuments([]);
    }
  }, [user?.id]);

  const handleOpenDocument = (doc: Document) => {
    toast.success("Continuing Document", {
      description: `Opening ${doc.title} for editing`
    });

    // Reset the form first
    form.reset();

    // Set document ID and basic info
    form.setValue("documentId", doc.id);
    form.setValue("type", doc.type);
    form.setValue("patientName", doc.patient_name);
    form.setValue("notes", doc.notes || "");
    
    // Set document format if available
    if (doc.document_format) {
      form.setValue("documentFormat", doc.document_format);
    }
    
    // Set recording duration if available
    if (doc.recording_duration) {
      form.setValue("recordingTime", doc.recording_duration);
    }

    // Set summary if available
    if (doc.summary) {
      form.setValue("transcriptSummary", doc.summary);
    }

    // Parse and set transcript data if available
    if (doc.transcript_data) {
      try {
        const parsedData = JSON.parse(doc.transcript_data);
        
        // Create transcript result object
        const transcriptResult: TranscriptionResult = {
          text: parsedData.text || "",
          utterances: parsedData.utterances || [],
          isMock: parsedData.isMock || false,
          provider: parsedData.provider || "default"
        };

        // Set transcript-related form values
        form.setValue("transcriptResult", transcriptResult);
        form.setValue("transcript", parsedData.text || "");
        
        // Set transcript summary if not already set but available in parsed data
        if (!doc.summary && parsedData.summary) {
          form.setValue("transcriptSummary", parsedData.summary);
        }
        
        // If there's patient info in the transcript data, set it
        if (parsedData.patientInfo) {
          form.setValue("patientInfo", parsedData.patientInfo);
        }
      } catch (e) {
        console.error("Error parsing transcript data:", e);
        toast.error("Error parsing transcript data", {
          description: "The transcript data could not be loaded properly"
        });
      }
    }

    setNewDocumentOpen(true);
  };

  const handleViewTranscript = (doc: Document) => {
    setSelectedDocument(doc);

    if (doc.transcript_data) {
      try {
        const parsedData = JSON.parse(doc.transcript_data);

        setParsedTranscript({
          text: parsedData.text || "",
          utterances: parsedData.utterances || [],
          isMock: parsedData.isMock || false,
          provider: parsedData.provider || "default",
          patientInfo: parsedData.patientInfo || undefined
        });

        setTranscriptText(parsedData.text || "");
        setFormattedNotes(doc.notes || "");
        setDocumentFormat(doc.document_format || "");
        
        // Get summary from document first, if not available use the one from transcript data
        setTranscriptSummary(doc.summary || parsedData.summary || "");
        
        setTranscriptDialogOpen(true);
      } catch (e) {
        console.error("Error parsing transcript data:", e);
        toast.error("Failed to parse transcript data");
      }
    } else {
      toast.error("No Transcript", {
        description: "This document does not have any saved transcript data"
      });
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    try {
      const { error } = await supabase
          .from('medical_documents')
          .delete()
          .eq('id', doc.id);

      if (error) {
        throw error;
      }

      toast.success("Document Deleted", {
        description: `${doc.title} has been deleted`
      });

      fetchRecentDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleRefreshDocuments = async () => {
    await fetchRecentDocuments();
  };
  const loadMoreDocuments = async () => {
    if (!user?.id) return;

    try {
      // For load more, we'll still use the direct table approach since our RPC doesn't support pagination yet
      const { data, error } = await supabase
          .from('medical_documents')
          .select('*')
          .eq('creator_id', user.id)
          .order('updated_at', { ascending: false })
          .range(recentDocuments.length, recentDocuments.length + 10);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const newDocs = data.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          patient_name: doc.patient_name,
          status: doc.status,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          notes: doc.notes,
          transcript_data: doc.transcript_data || null,
          document_format: doc.document_format || null,
          recording_duration: doc.recording_duration || null,
          generated_title: doc.generated_title || null
        }));

        setRecentDocuments(prev => [...prev, ...newDocs]);

        toast.success("Documents Loaded", {
          description: `Loaded ${data.length} more documents`
        });
      } else {
        toast.info("No More Documents", {
          description: "You've reached the end of your document list"
        });
      }
    } catch (error) {
      console.error("Error loading more documents:", error);
      toast.error("Failed to load more documents");
    }
  };

  if (isLoading) {
    return (
        <div className="flex justify-center items-center py-10">
          <div className="animate-pulse">Loading recent documents...</div>
        </div>
    );
  }

  if (recentDocuments.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-muted-foreground mb-4">You haven't created any documents yet</p>
          <Button onClick={() => setNewDocumentOpen(true)}>Create Your First Document</Button>
        </div>
    );
  }

  return (
      <div>
        <DocumentTable
            documents={recentDocuments}
            onViewTranscript={handleViewTranscript}
            onDeleteDocument={handleDeleteDocument}
            onLoadMore={loadMoreDocuments}
        />

        <EnhancedTranscriptDialog
            open={transcriptDialogOpen}
            onOpenChange={setTranscriptDialogOpen}
            selectedDocument={selectedDocument}
            parsedTranscript={parsedTranscript}
            transcriptText={transcriptText}
            transcriptSummary={transcriptSummary}
            documentFormat={documentFormat}
            formattedNotes={formattedNotes}
            showSummary={showSummary}
            setShowSummary={setShowSummary}
            form={form}
            onEditDocument={handleOpenDocument}
            onRefreshDocuments={handleRefreshDocuments}
        />
      </div>
  );
};

export default RecentDocuments;