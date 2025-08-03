import React from "react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ScrollArea} from "@/components/ui/scroll-area";
import {DocumentFormat} from "@/services/transcription";
import {Activity, Baby, Brain, FileText, Heart, Microscope, Stethoscope, Users} from "lucide-react";

interface DocumentFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFormat?: DocumentFormat;
}

// Credit costs mapping from the edge function
const getDocumentCredits = (format: string): number => {
  const creditsMap: Record<string, number> = {
    'dictation': 1,
    'soap': 2,
    'progress': 2,
    'consultation': 3,
    'h&p': 4,
    'discharge': 4,
    'procedure': 3,
    'operative': 4,
    'emergency': 3,
    'psychiatric': 3,
    'therapy': 2,
    'radiology': 2,
    'pathology': 3,
    'cardiology': 3,
    'pulmonary': 3,
    'neurology': 3,
    'oncology': 4,
    'pediatric': 3,
    'prenatal': 3,
    'followup': 2,
    'referral': 2,
    'medication': 2,
    'custom': 3
  };
  return creditsMap[format] || 3;
};

// Format details with sections included
const formatDetails: Record<string, {
  title: string;
  category: string;
  description: string;
  sections: string[];
  icon: React.ComponentType<any>;
  complexity: 'Basic' | 'Standard' | 'Complex' | 'Comprehensive';
}> = {
  // General Templates
  'dictation': {
    title: 'Dictation',
    category: 'General',
    description: 'Raw transcription without formatting - direct transcript output',
    sections: ['Unformatted transcript text'],
    icon: FileText,
    complexity: 'Basic'
  },
  'soap': {
    title: 'SOAP Notes',
    category: 'General',
    description: 'Structured clinical documentation using Subjective, Objective, Assessment, Plan format',
    sections: [
      'Subjective: Patient history, complaints, self-reported symptoms',
      'Objective: Clinical observations, vital signs, test results',
      'Assessment: Diagnostic impressions and conclusions',
      'Plan: Treatment plans, medications, follow-ups, referrals'
    ],
    icon: Stethoscope,
    complexity: 'Standard'
  },
  'progress': {
    title: 'Progress Notes',
    category: 'General',
    description: 'Concise updates on patient status and ongoing care',
    sections: [
      'Subjective update on patient condition',
      'Objective findings and measurements',
      'Assessment of current status',
      'Plan for continuing care'
    ],
    icon: Activity,
    complexity: 'Standard'
  },
  'h&p': {
    title: 'History & Physical',
    category: 'General',
    description: 'Comprehensive initial patient evaluation with complete history and examination',
    sections: [
      'Chief Complaint',
      'History of Present Illness',
      'Past Medical/Surgical History',
      'Drug History, Allergy History',
      'Social History, Family History',
      'Review of Systems',
      'Physical Examination',
      'Laboratory/Diagnostic Findings',
      'Differential Diagnosis, Diagnosis, Plan'
    ],
    icon: Stethoscope,
    complexity: 'Comprehensive'
  },
  'consultation': {
    title: 'Consultation Notes',
    category: 'General',
    description: 'Specialist consultation documentation with focused assessment',
    sections: [
      'Reason for Consultation',
      'History of Present Illness',
      'Pertinent Past Medical History',
      'Examination Findings',
      'Results of Studies/Tests',
      'Assessment/Impression',
      'Recommendations, Plan of Action'
    ],
    icon: Users,
    complexity: 'Complex'
  },
  'discharge': {
    title: 'Discharge Summary',
    category: 'General',
    description: 'Comprehensive summary of hospital stay and discharge planning',
    sections: [
      'Admission and Discharge Dates',
      'Admitting Diagnosis, Discharge Diagnosis',
      'Brief History and Hospital Course',
      'Significant Findings, Procedures Performed',
      'Discharge Condition, Instructions',
      'Medications on Discharge',
      'Follow-up Instructions'
    ],
    icon: FileText,
    complexity: 'Comprehensive'
  },
  'procedure': {
    title: 'Procedure Notes',
    category: 'General',
    description: 'Documentation of medical procedures performed',
    sections: [
      'Procedure Performed, Date and Time',
      'Indication and Pre-procedure Diagnosis',
      'Post-procedure Diagnosis',
      'Anesthesia Used',
      'Description of Procedure, Findings',
      'Specimens Collected, Complications',
      'Estimated Blood Loss, Patient Tolerance',
      'Post-procedure Plan'
    ],
    icon: Activity,
    complexity: 'Complex'
  },
  'operative': {
    title: 'Operative Notes',
    category: 'General',
    description: 'Detailed surgical procedure documentation',
    sections: [
      'Date and Time of Operation',
      'Surgeon(s) and Assistant(s)',
      'Preoperative/Postoperative Diagnosis',
      'Procedure(s) Performed',
      'Indication for Surgery',
      'Description of Procedure',
      'Findings, Complications',
      'Estimated Blood Loss, Specimens',
      'Postoperative Condition and Plan'
    ],
    icon: Activity,
    complexity: 'Comprehensive'
  },
  'emergency': {
    title: 'Emergency Department Notes',
    category: 'General',
    description: 'Emergency room visit documentation with triage and disposition',
    sections: [
      'Chief Complaint and Triage Information',
      'History of Present Illness',
      'Past Medical History, Medications, Allergies',
      'Physical Examination',
      'Vital Signs and Assessment',
      'Diagnostic Studies and Results',
      'Emergency Department Course',
      'Diagnosis and Disposition',
      'Discharge Instructions or Admission Orders'
    ],
    icon: Activity,
    complexity: 'Complex'
  },
  'followup': {
    title: 'Follow-up Visit Notes',
    category: 'General',
    description: 'Documentation for routine follow-up appointments',
    sections: [
      'Interval History Since Last Visit',
      'Current Symptoms and Status',
      'Medication Compliance and Side Effects',
      'Physical Examination Changes',
      'Review of Recent Tests/Studies',
      'Assessment of Treatment Response',
      'Plan Modifications and Next Steps'
    ],
    icon: FileText,
    complexity: 'Standard'
  },
  'referral': {
    title: 'Referral Notes',
    category: 'General',
    description: 'Documentation for specialist referrals',
    sections: [
      'Reason for Referral',
      'Relevant Medical History',
      'Current Problem and Duration',
      'Previous Treatments Attempted',
      'Specific Questions for Consultant',
      'Urgency of Referral',
      'Patient Preferences and Concerns'
    ],
    icon: Users,
    complexity: 'Standard'
  },
  'medication': {
    title: 'Medication Management',
    category: 'General',
    description: 'Documentation for drug therapy review and management',
    sections: [
      'Current Medications and Dosages',
      'Medication Compliance and Issues',
      'Side Effects and Adverse Reactions',
      'Medication Effectiveness',
      'Drug Interactions Discussed',
      'Changes Made to Regimen',
      'Patient Education Provided',
      'Follow-up Plan for Monitoring'
    ],
    icon: FileText,
    complexity: 'Standard'
  },

  // Specialty Templates
  'psychiatric': {
    title: 'Psychiatric Evaluation',
    category: 'Specialty',
    description: 'Mental health assessment and psychiatric evaluation',
    sections: [
      'Chief Complaint and Referral Source',
      'History of Present Illness',
      'Psychiatric History, Medical History',
      'Social History, Family History',
      'Mental Status Examination',
      'Risk Assessment',
      'Diagnostic Impression',
      'Treatment Plan and Recommendations'
    ],
    icon: Brain,
    complexity: 'Complex'
  },
  'therapy': {
    title: 'Therapy Session Notes',
    category: 'Specialty',
    description: 'Counseling and therapy session documentation',
    sections: [
      'Session Date and Duration',
      'Treatment Modality Used',
      'Patient Presentation and Mood',
      'Issues Discussed',
      'Interventions and Techniques Used',
      'Patient Response and Progress',
      'Homework/Action Items',
      'Plan for Next Session'
    ],
    icon: Brain,
    complexity: 'Standard'
  },
  'cardiology': {
    title: 'Cardiology Consultation',
    category: 'Specialty',
    description: 'Heart-related specialist consultation',
    sections: [
      'Reason for Consultation',
      'Cardiovascular History and Risk Factors',
      'Current Symptoms and Functional Status',
      'Physical Examination (cardiovascular focus)',
      'Diagnostic Studies and Results',
      'Assessment and Cardiac Diagnosis',
      'Recommendations and Treatment Plan'
    ],
    icon: Heart,
    complexity: 'Complex'
  },
  'pulmonary': {
    title: 'Pulmonary Consultation',
    category: 'Specialty',
    description: 'Respiratory specialist consultation',
    sections: [
      'Reason for Consultation',
      'Respiratory History and Symptoms',
      'Environmental and Occupational Exposure',
      'Physical Examination (pulmonary focus)',
      'Pulmonary Function Tests and Imaging',
      'Assessment and Pulmonary Diagnosis',
      'Treatment Plan and Recommendations'
    ],
    icon: Activity,
    complexity: 'Complex'
  },
  'neurology': {
    title: 'Neurology Consultation',
    category: 'Specialty',
    description: 'Neurological specialist consultation',
    sections: [
      'Reason for Consultation',
      'Neurological History and Symptoms',
      'Past Neurological Events',
      'Neurological Examination',
      'Cognitive Assessment (if performed)',
      'Diagnostic Studies and Results',
      'Assessment and Neurological Diagnosis',
      'Treatment Plan and Follow-up'
    ],
    icon: Brain,
    complexity: 'Complex'
  },
  'oncology': {
    title: 'Oncology Consultation',
    category: 'Specialty',
    description: 'Cancer care specialist consultation',
    sections: [
      'Reason for Consultation',
      'Cancer History and Staging',
      'Previous Treatments and Response',
      'Current Symptoms and Performance Status',
      'Physical Examination',
      'Laboratory and Imaging Results',
      'Assessment and Treatment Options',
      'Treatment Plan and Prognosis Discussion'
    ],
    icon: Activity,
    complexity: 'Comprehensive'
  },
  'pediatric': {
    title: 'Pediatric Notes',
    category: 'Specialty',
    description: 'Children\'s medical visit documentation',
    sections: [
      'Chief Complaint and History from Parent/Guardian',
      'Birth History and Developmental Milestones',
      'Immunization Status',
      'Growth Parameters and Vital Signs',
      'Physical Examination',
      'Assessment and Pediatric Considerations',
      'Treatment Plan and Parent Education'
    ],
    icon: Baby,
    complexity: 'Complex'
  },
  'prenatal': {
    title: 'Prenatal Visit Notes',
    category: 'Specialty',
    description: 'Pregnancy care documentation',
    sections: [
      'Gestational Age and Last Menstrual Period',
      'Prenatal History and Previous Pregnancies',
      'Current Symptoms and Concerns',
      'Physical Examination and Measurements',
      'Fetal Assessment and Heart Rate',
      'Laboratory Results and Screenings',
      'Assessment and Plan',
      'Next Appointment and Instructions'
    ],
    icon: Baby,
    complexity: 'Complex'
  },
  'custom': {
    title: 'Presenting Complaints',
    category: 'Custom',
    description: 'Structured presenting complaints assessment',
    sections: [
      'Presenting Complaints',
      'History of Presenting Complaints',
      'Review of Systems',
      'Past Medical History',
      'Past Surgical History',
      'Drug History',
      'Gynae History',
      'Obstetric History',
      'Family and Social History'
    ],
    icon: FileText,
    complexity: 'Complex'
  },

  // Reports
  'radiology': {
    title: 'Radiology Reports',
    category: 'Reports',
    description: 'Medical imaging interpretation',
    sections: [
      'Examination Type and Date',
      'Clinical Information and Indication',
      'Technique and Contrast Information',
      'Findings (imaging observations)',
      'Impression/Conclusion',
      'Recommendations for Follow-up'
    ],
    icon: Microscope,
    complexity: 'Standard'
  },
  'pathology': {
    title: 'Pathology Reports',
    category: 'Reports',
    description: 'Laboratory specimen analysis',
    sections: [
      'Specimen Type and Source',
      'Clinical History and Indication',
      'Gross Description',
      'Microscopic Description',
      'Special Stains/Studies (if mentioned)',
      'Diagnosis',
      'Comments and Recommendations'
    ],
    icon: Microscope,
    complexity: 'Complex'
  }
};

const getComplexityColor = (complexity: string) => {
  switch (complexity) {
    case 'Basic': return 'bg-green-100 text-green-800';
    case 'Standard': return 'bg-blue-100 text-blue-800';
    case 'Complex': return 'bg-orange-100 text-orange-800';
    case 'Comprehensive': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const DocumentFormatModal: React.FC<DocumentFormatModalProps> = ({
  isOpen,
  onClose,
  selectedFormat
}) => {
  const currentFormat = selectedFormat && formatDetails[selectedFormat] ? formatDetails[selectedFormat] : null;
  const credits = selectedFormat ? getDocumentCredits(selectedFormat) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentFormat && <currentFormat.icon className="h-5 w-5" />}
            Document Format Details
            {currentFormat && ` - ${currentFormat.title}`}
          </DialogTitle>
          <DialogDescription>
            Understand what sections and information are included in each document format
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          {currentFormat ? (
            <div className="space-y-6">
              {/* Format Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <currentFormat.icon className="h-5 w-5" />
                      {currentFormat.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{currentFormat.category}</Badge>
                      <Badge className={getComplexityColor(currentFormat.complexity)}>
                        {currentFormat.complexity}
                      </Badge>
                      <Badge variant="secondary">
                        {credits} Credit{credits !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-base">
                    {currentFormat.description}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Document Sections */}
              <Card>
                <CardHeader>
                  <CardTitle>Document Sections Included</CardTitle>
                  <CardDescription>
                    The following sections will be generated based on information from your transcript
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentFormat.sections.map((section, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-relaxed">{section}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Credit Information */}
              {/*<Card>*/}
              {/*  <CardHeader>*/}
              {/*    <CardTitle>Credit Usage</CardTitle>*/}
              {/*    <CardDescription>*/}
              {/*      Understanding the cost structure for this document format*/}
              {/*    </CardDescription>*/}
              {/*  </CardHeader>*/}
              {/*  <CardContent>*/}
              {/*    <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">*/}
              {/*      <div>*/}
              {/*        <p className="font-medium">Credits Required</p>*/}
              {/*        <p className="text-sm text-muted-foreground">*/}
              {/*          This format costs {credits} credit{credits !== 1 ? 's' : ''} to generate*/}
              {/*        </p>*/}
              {/*      </div>*/}
              {/*      <div className="text-2xl font-bold text-primary">*/}
              {/*        {credits}*/}
              {/*      </div>*/}
              {/*    </div>*/}
              {/*  </CardContent>*/}
              {/*</Card>*/}

              {/* Important Notice */}
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-orange-900 mb-1">Important Note</h4>
                      <p className="text-sm text-orange-800">
                        All document generation uses ONLY information explicitly mentioned in your transcript. 
                        The AI will not add, infer, or hallucinate medical information. If a section cannot 
                        be completed due to missing information, it will be clearly indicated rather than 
                        making assumptions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a document format to view its details</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentFormatModal;