import React from "react";
import {FadeIn} from "@/components/ui/motion";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Mic, Search} from "lucide-react";
import {UseFormReturn} from "react-hook-form";
import {useIsMobile} from "@/hooks/use-mobile";

interface DocumentationSearchProps {
  setNewDocumentOpen: (open: boolean) => void;
  form: UseFormReturn<any>;
  resetForm: () => void;
}

const DocumentationSearch: React.FC<DocumentationSearchProps> = ({ 
  setNewDocumentOpen,
  form,
  resetForm
}) => {
  const isMobile = useIsMobile();
  
  const handleNewConsultation = () => {
    resetForm();
    setNewDocumentOpen(true);
  };

  return (
    <FadeIn delay={0.1}>
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 w-full">
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
          className="shadow-sm hover:shadow-md transition-all w-full sm:w-auto"
          onClick={handleNewConsultation}
        >
          <Mic className="h-4 w-4 mr-1" />
          {isMobile ? "Record" : "Record New Consultation"}
        </Button>
      </div>
    </FadeIn>
  );
};

export default DocumentationSearch;
