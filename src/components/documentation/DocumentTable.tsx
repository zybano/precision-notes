
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import DocumentRow from "./DocumentRow";
import { Document } from "./DocumentTypes";

interface DocumentTableProps {
  documents: Document[];
  onOpenDocument: (doc: Document) => void;
  onViewTranscript: (doc: Document) => void;
  onDeleteDocument: (doc: Document) => void;
  onLoadMore: () => void;
}

const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  onOpenDocument,
  onViewTranscript,
  onDeleteDocument,
  onLoadMore
}) => {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-muted-foreground mb-4">You haven't created any documents yet</p>
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
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                onOpenDocument={onOpenDocument}
                onViewTranscript={onViewTranscript}
                onDeleteDocument={onDeleteDocument}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {documents.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onLoadMore}>Load More</Button>
        </div>
      )}
    </div>
  );
};

export default DocumentTable;
