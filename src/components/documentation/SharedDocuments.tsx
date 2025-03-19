
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UseFormReturn } from "react-hook-form";

interface SharedDocumentsProps {
  setNewDocumentOpen: (open: boolean) => void;
  form: UseFormReturn<any>;
}

const SharedDocuments: React.FC<SharedDocumentsProps> = ({ setNewDocumentOpen, form }) => {
  const { toast } = useToast();
  
  const sharedDocuments = [
    { title: "Team Meeting Notes", author: "Dr. Jessica Kim", date: "Shared with you on Aug 26, 2023" },
    { title: "Clinical Guidelines 2023", author: "Dr. Andrew Martinez", date: "Shared with you on Aug 20, 2023" },
  ];

  const handleViewDocument = (doc: typeof sharedDocuments[0]) => {
    toast({
      title: "Viewing Shared Document",
      description: `Opening ${doc.title}`,
      duration: 3000,
    });
    setNewDocumentOpen(true);
    form.setValue("type", "Shared Document");
    form.setValue("patientName", doc.title);
    form.setValue("notes", `Shared by ${doc.author} on ${doc.date.split(" on ")[1]}`);
  };

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
