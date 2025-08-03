import React from "react";
import {FadeIn} from "@/components/ui/motion";
import {useIsMobile} from "@/hooks/use-mobile";

interface DocumentationHeaderProps {
  title?: string;
  description?: string;
}

const DocumentationHeader: React.FC<DocumentationHeaderProps> = ({ 
  title = "Documentation",
  description = "Record consultations and generate medical documentation"
}) => {
  const isMobile = useIsMobile();
  
  return (
    <FadeIn>
      <div className="flex flex-col mb-6">
        <div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-semibold tracking-tight`}>{title}</h1>
          <p className="text-muted-foreground mt-1">
            {description}
          </p>
        </div>
      </div>
    </FadeIn>
  );
};

export default DocumentationHeader;
