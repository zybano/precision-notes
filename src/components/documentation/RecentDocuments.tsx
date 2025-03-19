
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Trash } from "lucide-react";
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

interface RecentDocumentsProps {
  setNewDocumentOpen: (open: boolean) => void;
  form: UseFormReturn<any>;
}

const RecentDocuments: React.FC<RecentDocumentsProps> = ({ setNewDocumentOpen, form }) => {
  const { toast } = useToast();
  
  const recentDocuments = [
    { 
      id: "doc-1",
      title: "Sarah Johnson - Progress Note", 
      date: "Edited 2 hours ago", 
      type: "Progress Note",
      status: "Draft", 
      patient: "Sarah Johnson"
    },
    { 
      id: "doc-2",
      title: "Michael Chen - Assessment", 
      date: "Edited yesterday", 
      type: "Assessment", 
      status: "Completed",
      patient: "Michael Chen"
    },
    { 
      id: "doc-3",
      title: "Emily Rodriguez - Consultation", 
      date: "Edited Aug 24, 2023", 
      type: "Consultation",
      status: "Signed",
      patient: "Emily Rodriguez"
    },
    { 
      id: "doc-4",
      title: "Robert Williams - Discharge Summary", 
      date: "Edited Aug 22, 2023", 
      type: "Discharge Summary",
      status: "Reviewed",
      patient: "Robert Williams"
    },
  ];

  const handleOpenDocument = (doc: typeof recentDocuments[0]) => {
    toast({
      title: "Continuing Document",
      description: `Opening ${doc.title} for editing`,
      duration: 3000,
    });
    setNewDocumentOpen(true);
    form.setValue("type", doc.type);
    form.setValue("patientName", doc.patient);
  };
  
  const handleDeleteDocument = (doc: typeof recentDocuments[0]) => {
    toast({
      title: "Document Deleted",
      description: `${doc.title} has been deleted`,
      duration: 3000,
    });
  };

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
                <TableCell className="font-medium">{doc.patient}</TableCell>
                <TableCell>{doc.type}</TableCell>
                <TableCell className="text-muted-foreground">{doc.date}</TableCell>
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
