// Document templates matching B2B API specification

export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'general' | 'specialty' | 'reports' | 'custom';
  documentFormat: string;
}

export const documentTemplates: DocumentTemplate[] = [
  // General Templates
  {
    id: "dictation",
    title: "Dictation",
    description: "Raw transcription without formatting",
    content: "",
    category: "general",
    documentFormat: "dictation"
  },
  {
    id: "soap",
    title: "SOAP Notes",
    description: "Subjective, Objective, Assessment, Plan format",
    content: "",
    category: "general",
    documentFormat: "soap"
  },
  {
    id: "progress",
    title: "Progress Notes",
    description: "Patient progress and status updates",
    content: "",
    category: "general",
    documentFormat: "progress"
  },
  {
    id: "h&p",
    title: "History & Physical",
    description: "Comprehensive history and physical examination",
    content: "",
    category: "general",
    documentFormat: "h&p"
  },
  {
    id: "consultation",
    title: "Consultation Notes",
    description: "Specialist consultation documentation",
    content: "",
    category: "general",
    documentFormat: "consultation"
  },
  {
    id: "discharge",
    title: "Discharge Summary",
    description: "Hospital discharge documentation",
    content: "",
    category: "general",
    documentFormat: "discharge"
  },
  {
    id: "procedure",
    title: "Procedure Notes",
    description: "Medical procedure documentation",
    content: "",
    category: "general",
    documentFormat: "procedure"
  },
  {
    id: "operative",
    title: "Operative Notes",
    description: "Surgical procedure documentation",
    content: "",
    category: "general",
    documentFormat: "operative"
  },
  {
    id: "emergency",
    title: "Emergency Department Notes",
    description: "Emergency room visit documentation",
    content: "",
    category: "general",
    documentFormat: "emergency"
  },
  {
    id: "followup",
    title: "Follow-up Visit Notes",
    description: "Routine follow-up visit documentation",
    content: "",
    category: "general",
    documentFormat: "followup"
  },
  {
    id: "referral",
    title: "Referral Notes",
    description: "Specialist referral documentation",
    content: "",
    category: "general",
    documentFormat: "referral"
  },
  {
    id: "medication",
    title: "Medication Management",
    description: "Drug therapy review documentation",
    content: "",
    category: "general",
    documentFormat: "medication"
  },

  // Specialty Templates
  {
    id: "psychiatric",
    title: "Psychiatric Evaluation",
    description: "Mental health assessment documentation",
    content: "",
    category: "specialty",
    documentFormat: "psychiatric"
  },
  {
    id: "therapy",
    title: "Therapy Session Notes",
    description: "Counseling/therapy session documentation",
    content: "",
    category: "specialty",
    documentFormat: "therapy"
  },
  {
    id: "cardiology",
    title: "Cardiology Consultation",
    description: "Heart-related specialist consultation",
    content: "",
    category: "specialty",
    documentFormat: "cardiology"
  },
  {
    id: "pulmonary",
    title: "Pulmonary Consultation",
    description: "Respiratory specialist consultation",
    content: "",
    category: "specialty",
    documentFormat: "pulmonary"
  },
  {
    id: "neurology",
    title: "Neurology Consultation",
    description: "Neurological specialist consultation",
    content: "",
    category: "specialty",
    documentFormat: "neurology"
  },
  {
    id: "oncology",
    title: "Oncology Consultation",
    description: "Cancer care specialist consultation",
    content: "",
    category: "specialty",
    documentFormat: "oncology"
  },
  {
    id: "pediatric",
    title: "Pediatric Notes",
    description: "Children's medical visit documentation",
    content: "",
    category: "specialty",
    documentFormat: "pediatric"
  },
  {
    id: "prenatal",
    title: "Prenatal Visit Notes",
    description: "Pregnancy care documentation",
    content: "",
    category: "specialty",
    documentFormat: "prenatal"
  },
  {
    id: "custom",
    title: "Presenting Complaints",
    description: "Structured presenting complaints assessment",
    content: "",
    category: "custom",
    documentFormat: "custom"
  },

  // Reports
  {
    id: "radiology",
    title: "Radiology Reports",
    description: "Medical imaging interpretation",
    content: "",
    category: "reports",
    documentFormat: "radiology"
  },
  {
    id: "pathology",
    title: "Pathology Reports",
    description: "Laboratory specimen analysis",
    content: "",
    category: "reports",
    documentFormat: "pathology"
  }
];