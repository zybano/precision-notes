
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Trash, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UseFormReturn } from "react-hook-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import TranscriptDisplay from "./TranscriptDisplay";
import { TranscriptionResult } from "@/services/transcription";
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentDocumentsProps {
  setNewDocumentOpen: (open: boolean) => void;
  form: UseFormReturn<any>;
}

interface Document {
  id: string;
  title: string;
  type: string;
  patient_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
  transcript_data: string | null;
}

const RecentDocuments: React.FC<RecentDocumentsProps> = ({ setNewDocumentOpen, form }) => {
  const { toast } = useToast();
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transcriptDialogOpen, setTranscriptDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [parsedTranscript, setParsedTranscript] = useState<TranscriptionResult | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptSummary, setTranscriptSummary] = useState("");
  const [showSummary, setShowSummary] = useState(true);
  
  useEffect(() => {
    fetchRecentDocuments();
  }, []);
  
  const fetchRecentDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_documents')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);
        
      if (error) {
        throw error;
      }
      
      // Convert the data to Document[] type
      if (data) {
        const mappedDocuments: Document[] = data.map(doc => ({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          patient_name: doc.patient_name,
          status: doc.status,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          notes: doc.notes,
          transcript_data: doc.transcript_data
        }));
        setRecentDocuments(mappedDocuments);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch recent documents",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDocument = (doc: Document) => {
    toast({
      title: "Continuing Document",
      description: `Opening ${doc.title} for editing`,
      duration: 3000,
    });
    
    // If there's transcript data, parse it and set it in the form
    if (doc.transcript_data) {
      try {
        const parsedData = JSON.parse(doc.transcript_data);
        const transcriptResult: TranscriptionResult = {
          text: parsedData.text || "",
          utterances: parsedData.utterances || [],
          isMock: parsedData.isMock || false
        };
        
        // Make transcript data available to the form
        form.setValue("transcriptResult", transcriptResult);
        form.setValue("transcript", parsedData.text || "");
        form.setValue("transcriptSummary", parsedData.summary || "");
      } catch (e) {
        console.error("Error parsing transcript data:", e);
      }
    }
    
    setNewDocumentOpen(true);
    form.setValue("type", doc.type);
    form.setValue("patientName", doc.patient_name);
    form.setValue("notes", doc.notes || "");
    form.setValue("documentId", doc.id);
  };
  
  const handleViewTranscript = (doc: Document) => {
    setSelectedDocument(doc);
    
    if (doc.transcript_data) {
      try {
        const parsedData = JSON.parse(doc.transcript_data);
        
        setParsedTranscript({
          text: parsedData.text || "",
          utterances: parsedData.utterances || [],
          isMock: parsedData.isMock || false
        });
        
        setTranscriptText(parsedData.text || "");
        setTranscriptSummary(parsedData.summary || "");
        setTranscriptDialogOpen(true);
      } catch (e) {
        console.error("Error parsing transcript data:", e);
        toast({
          title: "Error",
          description: "Failed to parse transcript data",
          duration: 3000,
        });
      }
    } else {
      toast({
        title: "No Transcript",
        description: "This document does not have any saved transcript data",
        duration: 3000,
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
      
      toast({
        title: "Document Deleted",
        description: `${doc.title} has been deleted`,
        duration: 3000,
      });
      
      // Refresh the list
      fetchRecentDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        duration: 3000,
      });
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `Edited ${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch (e) {
      return dateString;
    }
  };

  const loadMoreDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_documents')
        .select('*')
        .order('updated_at', { ascending: false })
        .range(recentDocuments.length, recentDocuments.length + 10);
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Convert the data to Document[] type
        const mappedDocuments: Document[] = data.map(doc => ({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          patient_name: doc.patient_name,
          status: doc.status,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          notes: doc.notes,
          transcript_data: doc.transcript_data
        }));
        
        setRecentDocuments(prev => [...prev, ...mappedDocuments]);
        
        toast({
          title: "Documents Loaded",
          description: `Loaded ${data.length} more documents`,
          duration: 3000,
        });
      } else {
        toast({
          title: "No More Documents",
          description: "You've reached the end of your document list",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error loading more documents:", error);
      toast({
        title: "Error",
        description: "Failed to load more documents",
        duration: 3000,
      });
    }
  };

  const hasTranscript = (doc: Document): boolean => {
    return !!doc.transcript_data;
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
    <div className="space-y-6">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Last Edited</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentDocuments.map((doc) => (
              <TableRow key={doc.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{doc.patient_name}</TableCell>
                <TableCell>{doc.type}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(doc.updated_at)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    doc.status === "Completed" ? "bg-green-100 text-green-800" :
                    doc.status === "Draft" ? "bg-yellow-100 text-yellow-800" :
                    doc.status === "Signed" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {doc.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleOpenDocument(doc)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Open</span>
                    </Button>
                    {hasTranscript(doc) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewTranscript(doc)}
                        className="h-8 w-8 p-0"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="sr-only">View Transcript</span>
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteDocument(doc)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {recentDocuments.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMoreDocuments}>Load More</Button>
        </div>
      )}

      {/* Transcript Dialog */}
      <Dialog open={transcriptDialogOpen} onOpenChange={setTranscriptDialogOpen}>
        <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument?.patient_name} - Transcribed Conversation
            </DialogTitle>
            <DialogDescription>
              Transcribed on {selectedDocument?.updated_at ? new Date(selectedDocument.updated_at).toLocaleString() : ""}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 flex-1 overflow-hidden">
            {parsedTranscript && (
              <TranscriptDisplay
                transcriptResult={parsedTranscript}
                transcript={transcriptText}
                transcriptSummary={transcriptSummary}
                showSummary={showSummary}
                setShowSummary={setShowSummary}
                form={form}
              />
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => {
              if (selectedDocument) {
                handleOpenDocument(selectedDocument);
                setTranscriptDialogOpen(false);
              }
            }}>
              Edit Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecentDocuments;
