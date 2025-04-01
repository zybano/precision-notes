
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UseFormReturn } from "react-hook-form";
import { FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SharedDocument {
  title: string;
  author: string;
  date: string;
  id: string;
}

interface SharedDocumentsProps {
  setNewDocumentOpen: (open: boolean) => void;
  form: UseFormReturn<any>;
}

const SharedDocuments: React.FC<SharedDocumentsProps> = ({ setNewDocumentOpen, form }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (user?.id) {
      fetchSharedDocuments();
    }
  }, [user?.id]);
  
  const fetchSharedDocuments = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Query documents shared with the current user
      const { data, error } = await supabase
        .from('shared_documents')
        .select('document_id, shared_by, shared_at, medical_documents(id, title, patient_name, type)')
        .eq('shared_with', user.id);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const mappedDocuments: SharedDocument[] = data.map(item => ({
          id: item.document_id,
          title: item.medical_documents?.title || 'Unnamed Document',
          author: item.shared_by,
          date: new Date(item.shared_at).toLocaleDateString()
        }));
        
        setSharedDocuments(mappedDocuments);
      }
    } catch (error) {
      console.error("Error fetching shared documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDocument = (doc: SharedDocument) => {
    toast({
      title: "Viewing Shared Document",
      description: `Opening ${doc.title}`
    });
    setNewDocumentOpen(true);
    form.setValue("type", "Shared Document");
    form.setValue("patientName", doc.title);
    form.setValue("notes", `Shared by ${doc.author} on ${doc.date}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="animate-pulse">Loading shared documents...</div>
      </div>
    );
  }

  if (sharedDocuments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed rounded-lg border-border bg-muted/40">
        <FolderOpen className="w-10 h-10 mb-4 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-medium">No shared documents</h3>
        <p className="text-sm text-muted-foreground">
          Documents shared with you will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sharedDocuments.map((doc, index) => (
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
                onClick={() => handleViewDocument(doc)}
              >
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SharedDocuments;
