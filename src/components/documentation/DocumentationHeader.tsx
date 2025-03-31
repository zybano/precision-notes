
import React from "react";
import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Search } from "lucide-react";

interface DocumentationHeaderProps {
  onNewDocumentClick: () => void;
}

const DocumentationHeader: React.FC<DocumentationHeaderProps> = ({
  onNewDocumentClick,
}) => {
  return (
    <>
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Documentation</h1>
            <p className="text-muted-foreground mt-1">
              Record consultations and generate medical documentation with multiple AI providers
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center border border-input rounded-lg px-3 w-full max-w-md focus-within:ring-1 focus-within:ring-ring">
            <Search className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
            <Input
              type="text"
              placeholder="Search documents..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-10"
            />
          </div>
          <Button
            size="sm"
            className="ml-4 shadow-sm hover:shadow-md transition-all"
            onClick={onNewDocumentClick}
          >
            <Mic className="h-4 w-4 mr-1" />
            Record New Consultation
          </Button>
        </div>
      </FadeIn>
    </>
  );
};

export default DocumentationHeader;
