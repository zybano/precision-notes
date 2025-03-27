
import React, { useState } from 'react';
import { TranscriptData, parseTranscriptData, extractSpeakers } from './DocumentTypes';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, FileText, MessageSquare, FileDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { convertTranscriptToSOAP, convertTranscriptToProgressNote, convertTranscriptToConsultNote } from "@/services/noteConversion";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TranscriptViewerProps {
  transcriptData: string | null;
  documentType: string;
}

const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ transcriptData, documentType }) => {
  const [activeTab, setActiveTab] = useState<string>("raw");
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [convertedNote, setConvertedNote] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>(documentType.toLowerCase() || "soap note");
  
  const parsedData = parseTranscriptData(transcriptData);
  const speakers = parsedData ? extractSpeakers(parsedData) : [];
  
  const handleConvertTranscript = async () => {
    if (!parsedData) return;
    
    setIsConverting(true);
    try {
      let result: string;
      
      switch(selectedTemplate.toLowerCase()) {
        case "soap note":
          result = await convertTranscriptToSOAP(parsedData.text);
          break;
        case "progress note":
          result = await convertTranscriptToProgressNote(parsedData.text);
          break;
        case "consultation note":
          result = await convertTranscriptToConsultNote(parsedData.text);
          break;
        default:
          result = await convertTranscriptToSOAP(parsedData.text);
      }
      
      setConvertedNote(result);
      setActiveTab("converted");
      toast.success("Transcript converted successfully using OpenAI");
    } catch (error) {
      console.error("Error converting transcript:", error);
      toast.error("Failed to convert transcript");
    } finally {
      setIsConverting(false);
    }
  };
  
  const downloadTranscript = () => {
    if (!parsedData) return;
    
    const content = activeTab === "converted" ? convertedNote : parsedData.text;
    const filename = activeTab === "converted" 
      ? `${selectedTemplate.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`
      : `transcript_${new Date().toISOString().slice(0, 10)}.txt`;
    
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success(`Downloaded as ${filename}`);
  };
  
  if (!parsedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Transcript Data</CardTitle>
          <CardDescription>This document does not have any associated transcript data.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Transcript</CardTitle>
          <CardDescription>
            {parsedData.isMock 
              ? "Demo transcript (AI-generated)" 
              : "Recorded and transcribed conversation"}
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          {speakers.map((speaker, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-1">
              <Mic className="h-3 w-3" />
              {speaker}
            </Badge>
          ))}
          <Button variant="outline" size="sm" onClick={downloadTranscript}>
            <FileDown className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="raw" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Raw Transcript
              </TabsTrigger>
              <TabsTrigger value="converted" className="flex items-center gap-1" disabled={!convertedNote}>
                <FileText className="h-4 w-4" />
                Clinical Note
              </TabsTrigger>
            </TabsList>
            
            {activeTab === "raw" && (
              <div className="flex items-center gap-2">
                <Select 
                  value={selectedTemplate} 
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select note type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soap note">SOAP Note</SelectItem>
                    <SelectItem value="progress note">Progress Note</SelectItem>
                    <SelectItem value="consultation note">Consultation Note</SelectItem>
                    <SelectItem value="history & physical">History & Physical</SelectItem>
                    <SelectItem value="procedure note">Procedure Note</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  size="sm" 
                  onClick={handleConvertTranscript}
                  disabled={isConverting}
                >
                  {isConverting ? "Converting via OpenAI..." : "Convert to Clinical Note"}
                </Button>
              </div>
            )}
          </div>
          
          <TabsContent value="raw">
            <div className="bg-muted/50 p-4 rounded-md whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {parsedData.utterances.map((utterance, index) => (
                <div key={index} className="mb-4">
                  <div className="font-semibold text-sm text-muted-foreground mb-1">
                    {utterance.speaker}:
                  </div>
                  <div>{utterance.text}</div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="converted">
            <div className="bg-muted/50 p-4 rounded-md whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {convertedNote}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TranscriptViewer;
