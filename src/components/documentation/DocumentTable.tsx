import React from "react";
import {Table, TableBody, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import DocumentRow from "./DocumentRow";
import {Document} from "./DocumentTypes";
import {FileText} from "lucide-react";

interface DocumentTableProps {
  documents: Document[];
  onViewTranscript: (doc: Document) => void;
  onDeleteDocument: (doc: Document) => void;
  onLoadMore: () => void;
}

const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
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
        <div className="w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Patient Name</TableHead>
                <TableHead className="w-[25%]">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>Document Format</span>
                  </div>
                </TableHead>
                <TableHead className="w-[25%]">Last Edited</TableHead>
                <TableHead className="w-[15%]">Duration</TableHead>
                <TableHead className="w-[10%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  onViewTranscript={onViewTranscript}
                  onDeleteDocument={onDeleteDocument}
                />
              ))}
            </TableBody>
          </Table>
        </div>
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
