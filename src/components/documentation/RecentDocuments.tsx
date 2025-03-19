
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UseFormReturn } from "react-hook-form";

interface RecentDocumentsProps {
  setNewDocumentOpen: (open: boolean) => void;
  form: UseFormReturn<any>;
}

const RecentDocuments: React.FC<RecentDocumentsProps> = ({ setNewDocumentOpen, form }) => {
  const { toast } = useToast();
  
  const recentDocuments = [
    { title: "Sarah Johnson - Progress Note", date: "Edited 2 hours ago", type: "Progress Note" },
    { title: "Michael Chen - Assessment", date: "Edited yesterday", type: "Assessment" },
    { title: "Emily Rodriguez - Consultation", date: "Edited Aug 24, 2023", type: "Consultation" },
    { title: "Robert Williams - Discharge Summary", date: "Edited Aug 22, 2023", type: "Discharge Summary" },
  ];

  const handleOpenDocument = (doc: typeof recentDocuments[0]) => {
    toast({
      title: "Continuing Document",
      description: `Opening ${doc.title} for editing`,
      duration: 3000,
    });
    setNewDocumentOpen(true);
    form.setValue("type", doc.type);
    form.setValue("patientName", doc.title.split(" - ")[0]);
  };

  return (
    <div className="space-y-4">
      {recentDocuments.map((doc, index) => (
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
              <Button variant="outline" size="sm" onClick={() => handleOpenDocument(doc)}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => toast({
          title: "Loading More Documents",
          description: "Retrieving your additional documents",
          duration: 3000,
        })}>Load More</Button>
      </div>
    </div>
  );
};

export default RecentDocuments;
