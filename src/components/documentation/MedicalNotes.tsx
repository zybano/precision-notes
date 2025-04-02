// import React, { useState, useRef } from "react";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { toast } from "sonner";
// import { Card, CardContent } from "@/components/ui/card";
// import {Printer, Eye, Edit, FileDown} from "lucide-react";
// import { useReactToPrint } from "react-to-print";
// import { jsPDF } from "jspdf";
// import { useForm } from "react-hook-form";
// import ReactMarkdown from "react-markdown";
//
// interface MedicalReportFormProps {
//   initialNotes?: string;
// }
//
// const MedicalReportDisplay: React.FC<MedicalReportFormProps> = ({
//   initialNotes = ""
// }) => {
//   const [isPreviewMode, setIsPreviewMode] = useState(true);
//   const printRef = useRef<HTMLDivElement>(null);
//
//   // React Hook Form setup
//   const { register, watch } = useForm({
//     defaultValues: {
//       notes: initialNotes
//     }
//   });
//
//   const notes = watch("notes");
//
//   // Handle printing functionality with react-to-print
//   const handlePrint = useReactToPrint({
//     content: () => printRef.current,
//     onBeforeprint: () => {
//       toast.success("Preparing document for printing", {
//         description: "Your document is being sent to the printer dialog."
//       });
//     },
//     onAfterprint: () => {
//       toast.success("Document sent to printer", {
//         description: "Please check your printer dialog to complete printing."
//       });
//     },
//   });
//
//   // Handle PDF download with jsPDF
//   const handleDownloadPDF = () => {
//     toast.success("PDF download started", {
//       description: "Your document is being prepared for download."
//     });
//
//     if (printRef.current) {
//       const doc = new jsPDF({
//         orientation: "portrait",
//         unit: "mm",
//         format: "a4"
//       });
//
//       // Capture the HTML content
//       const content = printRef.current;
//
//       // Use html2canvas and jsPDF to create PDF
//       doc.html(content, {
//         callback: function(pdf) {
//           // Save the PDF
//           pdf.save("medical-report.pdf");
//
//           toast.success("PDF document ready", {
//             description: "Your document has been downloaded."
//           });
//         },
//         x: 10,
//         y: 10,
//         width: 190,
//         windowWidth: 800
//       });
//     }
//   };
//
//   // Toggle between edit and preview modes
//   const toggleMode = () => {
//     setIsPreviewMode(!isPreviewMode);
//   };
//
//   return (
//     <div className="space-y-4">
//       {/* Control buttons */}
//       <div className="flex justify-between items-center">
//         <div className="space-x-2">
//           <Button onClick={toggleMode} variant="outline">
//             {isPreviewMode ? (
//               <>
//                 <Edit className="h-4 w-4 mr-2" />
//                 Edit
//               </>
//             ) : (
//               <>
//                 <Eye className="h-4 w-4 mr-2" />
//                 Preview
//               </>
//             )}
//           </Button>
//         </div>
//         <div className="space-x-2">
//           <Button onClick={handleDownloadPDF} variant="outline">
//             <FileDown className="h-4 w-4 mr-2" />
//             Export PDF
//           </Button>
//           <Button onClick={handlePrint} variant="outline">
//             <Printer className="h-4 w-4 mr-2" />
//             Print
//           </Button>
//         </div>
//       </div>
//
//       {/* Edit/Preview content area */}
//       {isPreviewMode ? (
//         <Card>
//           <CardContent ref={printRef} className="p-6">
//             <div className="prose max-w-none">
//               <ReactMarkdown>{notes}</ReactMarkdown>
//             </div>
//           </CardContent>
//         </Card>
//       ) : (
//         <Textarea
//           id="notes"
//           className="min-h-[600px] font-mono text-sm resize-y w-full p-4"
//           {...register("notes")}
//         />
//       )}
//
//       {/* Hidden print container */}
//       <div className="hidden">
//         <div ref={printRef} className="p-6 prose max-w-none">
//           <ReactMarkdown>{notes}</ReactMarkdown>
//         </div>
//       </div>
//     </div>
//   );
// };
//
// export default MedicalReportDisplay;