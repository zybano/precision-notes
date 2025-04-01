
import React from "react";
import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface DocumentationHeaderProps {
  title?: string;
  description?: string;
}

const DocumentationHeader: React.FC<DocumentationHeaderProps> = ({ 
  title = "Documentation",
  description = "Record consultations and generate medical documentation with multiple AI providers"
}) => {
  return (
    <FadeIn>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="mb-2 md:mb-0">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-1">
              {description}
            </p>
          </div>
        </div>
      </div>
    </FadeIn>
  );
};

export default DocumentationHeader;
