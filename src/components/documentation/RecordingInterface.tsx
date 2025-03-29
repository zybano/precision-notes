
import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Play, Pause, StopCircle, Loader2, Download, Copy, Printer, FileText } from "lucide-react";

interface RecordingInterfaceProps {
  isRecording: boolean;
  isPaused: boolean;
  isTranscribing: boolean;
  recordingTime: number;
  useSpeechModelNano: boolean;
  setUseSpeechModelNano: (value: boolean) => void;
  startRecording: () => void;
  pauseRecording: () => void;
  stopRecording: () => void;
  formatTime: (seconds: number) => string;
  onDownloadPdf?: () => void;
  onCopyToEMR?: () => void;
  onPrint?: () => void;
}

const RecordingInterface: React.FC<RecordingInterfaceProps> = ({
  isRecording,
  isPaused,
  isTranscribing,
  recordingTime,
  useSpeechModelNano,
  setUseSpeechModelNano,
  startRecording,
  pauseRecording,
  stopRecording,
  formatTime,
  onDownloadPdf,
  onCopyToEMR,
  onPrint
}) => {
  // Determine which workflow step we're in
  const getActiveStep = () => {
    if (isTranscribing) return "processing";
    if (isRecording) return "recording";
    return "start";
  };

  const activeStep = getActiveStep();

  return (
    <div className="border rounded-lg p-6">
      <Tabs value={activeStep} className="w-full">
        {/* Step indicators */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center ${activeStep === "start" ? "text-primary font-medium" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${activeStep === "start" ? "bg-primary text-white" : "bg-muted"}`}>
                1
              </div>
              Start
            </div>
            <div className="h-0.5 flex-1 bg-muted mx-2"></div>
            <div className={`flex items-center ${activeStep === "recording" ? "text-primary font-medium" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${activeStep === "recording" ? "bg-primary text-white" : "bg-muted"}`}>
                2
              </div>
              Record
            </div>
            <div className="h-0.5 flex-1 bg-muted mx-2"></div>
            <div className={`flex items-center ${activeStep === "processing" ? "text-primary font-medium" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${activeStep === "processing" ? "bg-primary text-white" : "bg-muted"}`}>
                3
              </div>
              Process
            </div>
            <div className="h-0.5 flex-1 bg-muted mx-2"></div>
            <div className="flex items-center text-muted-foreground">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 bg-muted">
                4
              </div>
              Export
            </div>
          </div>
          <Progress 
            value={
              activeStep === "start" ? 0 : 
              activeStep === "recording" ? 33 : 
              activeStep === "processing" ? 66 : 100
            } 
            max={100} 
            className="h-1"
          />
        </div>

        <TabsContent value="start" className="mt-0">
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 rounded-full flex items-center justify-center bg-slate-50 mb-4">
              <Button 
                className="h-20 w-20 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                onClick={startRecording}
                disabled={isTranscribing}
              >
                <Mic className="h-8 w-8" />
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-muted-foreground mt-2">
                Click to start recording your consultation
              </p>
            </div>

            <div className="mb-4 mt-6">
              <div className="flex items-center gap-2 justify-center">
                <input
                  type="checkbox"
                  id="nanoModelToggle"
                  checked={useSpeechModelNano}
                  onChange={(e) => setUseSpeechModelNano(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="nanoModelToggle" className="text-xs text-muted-foreground">
                  Use faster transcription (less accurate)
                </label>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recording" className="mt-0">
          <div className="flex flex-col items-center justify-center">
            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${isPaused ? 'bg-amber-50' : 'bg-red-50'} mb-4`}>
              <div className={`absolute inset-0 rounded-full ${!isPaused ? 'animate-ping opacity-20 bg-red-400' : ''}`}></div>
              <div className="relative">
                {isPaused ? (
                  <Button 
                    className="h-20 w-20 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
                    onClick={pauseRecording}
                    disabled={isTranscribing}
                  >
                    <Play className="h-8 w-8" />
                  </Button>
                ) : (
                  <Button 
                    className="h-20 w-20 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
                    onClick={pauseRecording}
                    disabled={isTranscribing}
                  >
                    <Pause className="h-8 w-8" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{formatTime(recordingTime)}</div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={pauseRecording}
                  disabled={isTranscribing}
                >
                  {isPaused ? (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </>
                  )}
                </Button>
                <Button 
                  variant="destructive"
                  className="rounded-full"
                  onClick={stopRecording}
                  disabled={isTranscribing}
                >
                  <StopCircle className="h-4 w-4 mr-1" />
                  Finish
                </Button>
              </div>
            </div>

            {!isPaused && (
              <div className="space-y-2 mt-6 w-full">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-xs font-medium text-red-500 animate-pulse">●</span>
                  <span className="text-xs">Recording in progress...</span>
                </div>
                <Progress value={recordingTime % 60} max={60} className="h-1" />
              </div>
            )}
            
            {isPaused && (
              <div className="space-y-2 mt-6 w-full">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-xs font-medium text-amber-500">●</span>
                  <span className="text-xs">Recording paused</span>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="processing" className="mt-0">
          <div className="flex flex-col items-center justify-center">
            <div className="space-y-6 w-full">
              <div className="flex items-center gap-2 justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-lg font-medium">Processing your consultation</span>
              </div>
              
              <Progress value={50} max={100} className="h-2" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm font-medium">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Speech recognition</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <span>Note generation</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                    <span>Context enhancement</span>
                  </div>
                </div>
                
                <p className="text-sm text-center text-muted-foreground">
                  We're analyzing the consultation, generating structured notes, and enhancing with additional context. This usually takes 20-30 seconds.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Options - shown after processing is complete */}
      {!isRecording && !isTranscribing && activeStep !== "start" && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            Export Options
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10"
              onClick={onDownloadPdf}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10"
              onClick={onCopyToEMR}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to EMR
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10"
              onClick={onPrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordingInterface;
