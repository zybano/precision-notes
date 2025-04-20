
import React from "react";
import { Button } from "@/components/ui/button";
import { Trash, MessageSquare, FileText, RotateCw } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Document, parseTranscriptData } from "./DocumentTypes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DocumentRowProps {
  doc: Document;
  onViewTranscript: (doc: Document) => void;
  onDeleteDocument: (doc: Document) => void;
}

const DocumentRow: React.FC<DocumentRowProps> = ({
  doc,
  onViewTranscript,
  onDeleteDocument
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch (e) {
      return dateString;
    }
  };

  const hasTranscript = (doc: Document): boolean => {
    return !!doc.transcript_data;
  };
  
  // Get document format - use either document_format or type as fallback
  const getDocumentFormat = () => {
    try {
      if (doc.document_format) {
        return formatDocumentType(doc.document_format);
      } else {
        // Use the document type as a fallback if format isn't available
        return doc.type || "-";
      }
    } catch (e) {
      return doc.type || "-";
    }
  };
  
  // Format document format string to be more readable
  const formatDocumentType = (formatString: string) => {
    if (!formatString) return "-";
    
    // Convert snake_case or kebab-case to Title Case
    return formatString
      .replace(/[-_]/g, ' ')
      .replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
      });
  };
  
  // Get recording duration from transcript_data
  const getRecordingDuration = () => {
    try {
      // First try to get it from the recording_duration field if available
      if (doc.recording_duration) {
        return formatDuration(doc.recording_duration);
      }
      
      // Otherwise try to parse it from transcript data
      if (doc.transcript_data) {
        const transcriptData = parseTranscriptData(doc.transcript_data);
        // This would depend on how duration is stored in your transcript data
        return transcriptData?.recording_duration 
          ? formatDuration(transcriptData.recording_duration)
          : "-";
      }
      
      return "-";
    } catch (e) {
      return "-";
    }
  };
  
  // Format seconds into MM:SS format
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return "-";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <TableRow key={doc.id} className="hover:bg-muted/50 transition-colors">
      <TableCell className="font-medium">{doc.patient_name}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span>{getDocumentFormat()}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDate(doc.updated_at)}</TableCell>
      <TableCell>{getRecordingDuration()}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {hasTranscript(doc) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onViewTranscript(doc)}
                    className="h-8 w-8 p-0 text-primary hover:text-primary/90 hover:bg-primary/10"
                  >
                    <RotateCw className="h-4 w-4" />
                    <span className="sr-only">Change Format</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View transcript & change document format</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDeleteDocument(doc)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete document</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default DocumentRow;
