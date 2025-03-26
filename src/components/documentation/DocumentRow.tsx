
import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, Trash, MessageSquare } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Document } from "./DocumentTypes";

interface DocumentRowProps {
  doc: Document;
  onOpenDocument: (doc: Document) => void;
  onViewTranscript: (doc: Document) => void;
  onDeleteDocument: (doc: Document) => void;
}

const DocumentRow: React.FC<DocumentRowProps> = ({
  doc,
  onOpenDocument,
  onViewTranscript,
  onDeleteDocument
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `Edited ${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch (e) {
      return dateString;
    }
  };

  const hasTranscript = (doc: Document): boolean => {
    return !!doc.transcript_data;
  };

  return (
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
            onClick={() => onOpenDocument(doc)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Open</span>
          </Button>
          {hasTranscript(doc) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onViewTranscript(doc)}
              className="h-8 w-8 p-0"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="sr-only">View Transcript</span>
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDeleteDocument(doc)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default DocumentRow;
