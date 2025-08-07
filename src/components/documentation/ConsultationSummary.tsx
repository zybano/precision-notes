import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface ConsultationSummaryProps {
  summary: string;
  className?: string;
}

const ConsultationSummary: React.FC<ConsultationSummaryProps> = ({ summary, className = '' }) => {
  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary);
    toast.success('Summary copied to clipboard');
  };

  if (!summary || summary.trim() === '') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Consultation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No summary available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center min-w-0">
            <FileText className="h-4 w-4 md:h-5 md:w-5 mr-2 flex-shrink-0" />
            <span className="text-sm md:text-base truncate">Consultation Summary</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            className="flex items-center flex-shrink-0"
          >
            <Copy className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Copy</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="prose prose-xs md:prose-sm max-w-none">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsultationSummary;