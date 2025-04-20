//   // Extract patient info from transcript data if available
//   const extractedPatientInfo: PatientInfo | null = useMemo(() => {
//     if (!parsedTranscript) return null;
//
//     try {
//       // If we already have patientInfo from the transcript data, use it
//       if (parsedTranscript['patientInfo']) {
//         return parsedTranscript['patientInfo'] as PatientInfo;
//       }
//
//       // Otherwise, try to extract basic info from the transcript summary
//       if (transcriptSummary) {
//         // Simple pattern matching to extract patient name
//         const nameMatch = transcriptSummary.match(/patient(?:'s)? name is ([\w\s]+)[,\.\n]/i) ||
//                          transcriptSummary.match(/patient: ([\w\s]+)[,\.\n]/i);
//
//         const ageMatch = transcriptSummary.match(/([0-9]+)[- ]year[s]?[- ]old/i) ||
//                         transcriptSummary.match(/age:?\s*([0-9]+)/i);
//
//         const genderMatch = transcriptSummary.match(/\b(male|female|non-binary)\b/i);
//
//         if (nameMatch || ageMatch || genderMatch) {
//           return {
//             name: nameMatch ? nameMatch[1].trim() : "Unknown",
//             age: ageMatch ? ageMatch[1] : undefined,
//             gender: genderMatch ? genderMatch[1] : undefined
//           };
//         }
//       }
//
//       return null;
//     } catch (error) {
//       console.error("Error extracting patient info:", error);
//       return null;
//     }
//   }, [parsedTranscript, transcriptSummary]);import React, { useMemo } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Edit, FileText } from "lucide-react";
// import EnhancedTranscriptDisplay from "./EnhancedTranscriptDisplay";
// import { Document, PatientInfo } from "./DocumentTypes";
// import { TranscriptionResult } from "@/services/transcription";
// import { UseFormReturn } from "react-hook-form";
//
// interface TranscriptDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   selectedDocument: Document | null;
//   parsedTranscript: TranscriptionResult | null;
//   transcriptText: string;
//   transcriptSummary: string;
//   showSummary: boolean;
//   setShowSummary: (show: boolean) => void;
//   form: UseFormReturn<any>;
//   onEditDocument: (doc: Document) => void;
// }
//
// const TranscriptDialog: React.FC<TranscriptDialogProps> = ({
//   open,
//   onOpenChange,
//   selectedDocument,
//   parsedTranscript,
//   transcriptText,
//   transcriptSummary,
//   showSummary,
//   setShowSummary,
//   form,
//   onEditDocument
// }) => {
//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>
//             {selectedDocument?.patient_name} - Transcribed Conversation
//           </DialogTitle>
//           <DialogDescription>
//             Transcribed on {selectedDocument?.updated_at ? new Date(selectedDocument.updated_at).toLocaleString() : ""}
//           </DialogDescription>
//         </DialogHeader>
//
//         <div className="mt-4 flex-1 overflow-hidden">
//           {parsedTranscript && (
//             <EnhancedTranscriptDisplay
//               transcriptResult={parsedTranscript}
//               transcript={transcriptText}
//               transcriptSummary={transcriptSummary}
//               showSummary={showSummary}
//               setShowSummary={setShowSummary}
//               form={form}
//             />
//           )}
//         </div>
//
//         <DialogFooter className="flex justify-between">
//           <Button
//             variant="outline"
//             onClick={() => onOpenChange(false)}
//           >
//             Close
//           </Button>
//
//           <Button
//             variant="default"
//             className="flex items-center gap-2"
//             onClick={() => {
//               if (selectedDocument) {
//                 onEditDocument(selectedDocument);
//                 onOpenChange(false);
//               }
//             }}
//           >
//             <Edit className="h-4 w-4" />
//             Edit Document with Transcript Data
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };
//
// export default TranscriptDialog;
