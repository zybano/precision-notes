
// Document templates for the documentation page

export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'basic' | 'advanced' | 'specialty';
}

export const documentTemplates: DocumentTemplate[] = [
  // Basic Templates (available to all tiers)
  {
    id: "soap-note",
    title: "SOAP Note",
    description: "Standard SOAP format (Subjective, Objective, Assessment, Plan)",
    content: "",
    category: "basic"
  },
  {
    id: "history-physical",
    title: "History & Physical",
    description: "Comprehensive history and physical examination",
    content: "",
    category: "basic"
  },
  {
    id: "dictation",
    title: "Dictation",
    description: "Basic dictation format without structured sections",
    content: "",
    category: "basic"
  },
  
  // Advanced Templates (available to Professional and Enterprise tiers)
  {
    id: "progress-note",
    title: "Progress Note",
    description: "Follow-up visit documentation with relevant updates",
    content: "",
    category: "advanced"
  },
  {
    id: "discharge-summary",
    title: "Discharge Summary",
    description: "Hospital discharge documentation with follow-up instructions",
    content: "",
    category: "advanced"
  },
  {
    id: "consultation-note",
    title: "Consultation Note",
    description: "Specialist consultation with recommendations",
    content: "",
    category: "advanced"
  },
  {
    id: "procedure-note",
    title: "Procedure Note",
    description: "Documentation of medical procedures",
    content: "",
    category: "advanced"
  },
  
  // Specialty Templates (available to Enterprise tier only)
  {
    id: "psychiatry-note",
    title: "Psychiatry Evaluation",
    description: "Mental health assessment with DSM-5 criteria",
    content: "",
    category: "specialty"
  },
  {
    id: "cardiology-note",
    title: "Cardiology Assessment",
    description: "Cardiovascular-focused evaluation template",
    content: "",
    category: "specialty"
  },
  {
    id: "pediatric-note",
    title: "Pediatric Examination",
    description: "Age-specific pediatric visit documentation",
    content: "",
    category: "specialty"
  },
  {
    id: "orthopedic-note",
    title: "Orthopedic Evaluation",
    description: "Musculoskeletal assessment template",
    content: "",
    category: "specialty"
  },
  {
    id: "obstetrics-note",
    title: "Obstetrics Assessment",
    description: "Prenatal visit documentation template",
    content: "",
    category: "specialty"
  }
];
