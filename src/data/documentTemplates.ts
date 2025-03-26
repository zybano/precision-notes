
import { FileText, Calendar, ClipboardList, Mic, ClipboardCheck } from "lucide-react";
import { TemplateParameter } from "@/components/documentation/TemplateCard";

export interface DocumentTemplate {
  title: string;
  description: string;
  icon: any;
  parameters: TemplateParameter[];
}

export const documentTemplates: DocumentTemplate[] = [
  { 
    title: "Dictation (Blank)", 
    description: "Free-form dictation without structure", 
    icon: Mic,
    parameters: [
      { name: "content", label: "Content", description: "Dictated content without predefined structure", type: "textarea" }
    ]
  },
  { 
    title: "Comprehensive Clinical Note", 
    description: "Complete clinical documentation with all standard sections", 
    icon: ClipboardCheck,
    parameters: [
      { name: "chiefComplaint", label: "Chief Complaint", description: "Patient's main reason for visit", type: "textarea" },
      { name: "hpi", label: "History of Present Illness (HPI)", description: "Detailed chronology of symptoms", type: "textarea" },
      { name: "pastMedicalHistory", label: "Past Medical History", description: "Prior medical conditions and surgeries", type: "textarea" },
      { name: "medications", label: "Medications", description: "Current medications", type: "textarea" },
      { name: "allergies", label: "Allergies", description: "Known allergies and reactions", type: "textarea" },
      { name: "familyHistory", label: "Family History", description: "Relevant family medical history", type: "textarea" },
      { name: "socialHistory", label: "Social History", description: "Lifestyle factors (smoking, alcohol, etc)", type: "textarea" },
      { name: "reviewOfSystems", label: "Review of Systems", description: "Systematic review of body systems", type: "textarea" },
      { name: "physicalExam", label: "Physical Examination", description: "Findings from physical examination", type: "textarea" },
      { name: "assessment", label: "Assessment", description: "Clinical assessment and diagnosis", type: "textarea" },
      { name: "plan", label: "Plan", description: "Treatment plan and next steps", type: "textarea" }
    ]
  },
  { 
    title: "SOAP Note", 
    description: "Subjective, Objective, Assessment, Plan", 
    icon: FileText,
    parameters: [
      { name: "subjective", label: "Subjective", description: "Patient's complaints and symptoms in their own words", type: "textarea" },
      { name: "objective", label: "Objective", description: "Measurable and observable findings, vital signs, exam results", type: "textarea" },
      { name: "assessment", label: "Assessment", description: "Diagnosis or clinical impression based on subjective and objective data", type: "textarea" },
      { name: "plan", label: "Plan", description: "Treatment plan, medications, follow-up instructions", type: "textarea" }
    ]
  },
  { 
    title: "Progress Note", 
    description: "Follow-up documentation", 
    icon: ClipboardList,
    parameters: [
      { name: "currentStatus", label: "Current Status", description: "Patient's current condition", type: "textarea" },
      { name: "changes", label: "Changes Since Last Visit", description: "Note any improvements or deterioration", type: "textarea" },
      { name: "treatmentResponse", label: "Treatment Response", description: "How the patient is responding to current treatment", type: "textarea" },
      { name: "nextSteps", label: "Next Steps", description: "Adjustments to treatment plan and follow-up schedule", type: "textarea" }
    ]
  },
  { 
    title: "Consultation Note", 
    description: "For specialist referrals", 
    icon: Calendar,
    parameters: [
      { name: "referralReason", label: "Referral Reason", description: "Why the patient was referred", type: "textarea" },
      { name: "specialistFindings", label: "Specialist Findings", description: "Results of specialist evaluation", type: "textarea" },
      { name: "recommendations", label: "Recommendations", description: "Specialist's recommended course of action", type: "textarea" },
      { name: "followUp", label: "Follow-up Plan", description: "When and how to follow up with specialist", type: "textarea" }
    ]
  },
  { 
    title: "Discharge Summary", 
    description: "Post-discharge documentation", 
    icon: FileText,
    parameters: [
      { name: "admissionReason", label: "Admission Reason", description: "Why the patient was admitted", type: "textarea" },
      { name: "hospitalCourse", label: "Hospital Course", description: "Summary of treatment during hospitalization", type: "textarea" },
      { name: "dischargeDiagnosis", label: "Discharge Diagnosis", description: "Final diagnosis at time of discharge", type: "textarea" },
      { name: "dischargeMedications", label: "Discharge Medications", description: "Medications prescribed at discharge", type: "textarea" },
      { name: "followUpInstructions", label: "Follow-up Instructions", description: "Post-discharge care instructions", type: "textarea" }
    ]
  },
  { 
    title: "Procedure Note", 
    description: "Documenting medical procedures", 
    icon: ClipboardList,
    parameters: [
      { name: "procedureType", label: "Procedure Type", description: "Name and type of procedure performed", type: "input" },
      { name: "indication", label: "Indication", description: "Reason for performing the procedure", type: "textarea" },
      { name: "technique", label: "Technique", description: "How the procedure was performed", type: "textarea" },
      { name: "findings", label: "Findings", description: "Results and observations during the procedure", type: "textarea" },
      { name: "complications", label: "Complications", description: "Any complications encountered", type: "textarea" },
      { name: "postProcedurePlan", label: "Post-Procedure Plan", description: "Follow-up care after procedure", type: "textarea" }
    ]
  },
  { 
    title: "History & Physical", 
    description: "Comprehensive patient assessment", 
    icon: Calendar,
    parameters: [
      { name: "chiefComplaint", label: "Chief Complaint", description: "Patient's main reason for visit", type: "textarea" },
      { name: "historyOfPresentIllness", label: "History of Present Illness", description: "Detailed chronology of the patient's illness", type: "textarea" },
      { name: "pastMedicalHistory", label: "Past Medical History", description: "Previous medical conditions and surgeries", type: "textarea" },
      { name: "medications", label: "Medications", description: "Current medications and allergies", type: "textarea" },
      { name: "familyHistory", label: "Family History", description: "Relevant family medical history", type: "textarea" },
      { name: "socialHistory", label: "Social History", description: "Relevant lifestyle factors", type: "textarea" },
      { name: "physicalExam", label: "Physical Exam", description: "Findings from physical examination", type: "textarea" },
      { name: "impression", label: "Impression", description: "Clinical impression and diagnosis", type: "textarea" },
      { name: "plan", label: "Plan", description: "Treatment and follow-up plan", type: "textarea" }
    ]
  },
];
