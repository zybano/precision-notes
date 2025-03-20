
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Trash } from "lucide-react";
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
  notes: string | null; // Add notes property to the Document interface
}

const RecentDocuments: React.FC<RecentDocumentsProps> = ({ setNewDocumentOpen, form }) => {
  const { toast } = useToast();
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
      
      setRecentDocuments(data || []);
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
    setNewDocumentOpen(true);
    form.setValue("type", doc.type);
    form.setValue("patientName", doc.patient_name);
    form.setValue("notes", doc.notes || "");
    form.setValue("documentId", doc.id);
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
        setRecentDocuments(prev => [...prev, ...data]);
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
                      <span className="sr-only">View</span>
                    </Button>
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
    </div>
  );
};

export default RecentDocuments;
