import {Button} from "@/components/ui/button";
import StickyNavigation from "@/components/documentation/StickyNavigation";
import {FileCog, Copy, Download, RotateCcw} from "lucide-react";

interface ExportTabProps {
  onCopyToEmr: () => void;
  onDownloadPdf: () => void;
  onStartNewDocument: () => void;
  onBackToNotes: () => void;
  isProcessing: boolean;
}

const ExportTab = ({
  onCopyToEmr,
  onDownloadPdf,
  onStartNewDocument,
  onBackToNotes,
  isProcessing,
}: ExportTabProps) => (
  <>
    <div className="space-y-4 md:space-y-6">
      <div className="rounded-lg border p-4 md:p-6">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <FileCog className="h-5 w-5 mr-2" />
          Export Options
        </h3>

        <div className="space-y-4">
          <div className="bg-accent/20 p-4 rounded-md flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="bg-accent rounded-full p-1 w-fit mx-auto sm:mx-0 sm:mt-0.5">
              <FileCog className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-medium">Copy to EMR</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Copy the consultation summary and formatted notes to paste directly into your EMR system
              </p>
              <Button
                type="button"
                onClick={onCopyToEmr}
                size="sm"
                className="w-full sm:w-auto"
                disabled={isProcessing}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
          </div>

          <div className="bg-accent/20 p-4 rounded-md flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="bg-accent rounded-full p-1 w-fit mx-auto sm:mx-0 sm:mt-0.5">
              <Download className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-medium">Download PDF</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Save the consultation summary and notes as a PDF document
              </p>
              <Button
                type="button"
                onClick={onDownloadPdf}
                size="sm"
                className="w-full sm:w-auto"
                disabled={isProcessing}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 md:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="font-medium text-blue-900">Ready for Another Document?</h4>
            <p className="text-sm text-blue-700 mt-1">
              Start a fresh documentation with new audio and settings
            </p>
          </div>
          <Button
            type="button"
            onClick={onStartNewDocument}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            disabled={isProcessing}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Start Another Documentation
          </Button>
        </div>
      </div>
    </div>

    <StickyNavigation
      leftContent="Export your documentation"
      rightActions={[
        {
          label: "Back to Notes",
          onClick: onBackToNotes,
          variant: "outline",
          disabled: isProcessing,
        },
      ]}
      primaryAction={{
        label: "Start New Document",
        onClick: onStartNewDocument,
        disabled: isProcessing,
      }}
    />
  </>
);

export default ExportTab;
