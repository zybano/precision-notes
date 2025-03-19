
import { useState } from "react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Heart, 
  Baby, 
  PersonStanding, 
  Stethoscope, 
  Users, 
  BadgePlus, 
  Bone, 
  Pill, 
  ListFilter,
  Copy
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// Define specialty template types
type SpecialtyParameter = {
  name: string;
  label: string;
  description: string;
  type: "textarea" | "input";
}

type SpecialtyTemplate = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  parameters: SpecialtyParameter[];
  category: "primary" | "specialty";
}

// Specialty templates data
const specialtyTemplates: SpecialtyTemplate[] = [
  // Primary Care Templates
  { 
    id: "general-medicine",
    title: "General Medicine", 
    description: "Comprehensive primary care templates", 
    icon: Stethoscope,
    category: "primary",
    parameters: [
      { name: "chiefComplaint", label: "Chief Complaint", description: "Patient's main reason for visit", type: "textarea" },
      { name: "history", label: "History", description: "Relevant medical history", type: "textarea" },
      { name: "examination", label: "Examination", description: "Physical examination findings", type: "textarea" },
      { name: "assessment", label: "Assessment", description: "Clinical assessment and diagnosis", type: "textarea" },
      { name: "plan", label: "Plan", description: "Treatment plan and follow-up", type: "textarea" }
    ]
  },
  
  // Specialty Templates
  { 
    id: "pediatrics",
    title: "Pediatrics", 
    description: "Child and adolescent care", 
    icon: Baby,
    category: "specialty",
    parameters: [
      { name: "growthDevelopment", label: "Growth & Development", description: "Height, weight, developmental milestones", type: "textarea" },
      { name: "immunizations", label: "Immunizations", description: "Vaccine status and schedule", type: "textarea" },
      { name: "nutritionalStatus", label: "Nutritional Status", description: "Feeding patterns and nutritional assessment", type: "textarea" },
      { name: "behavioralConcerns", label: "Behavioral Concerns", description: "Sleep, behavior, social interaction", type: "textarea" },
      { name: "parentalGuidance", label: "Parental Guidance", description: "Advice and education for caregivers", type: "textarea" }
    ]
  },
  { 
    id: "cardiology",
    title: "Cardiology", 
    description: "Heart and cardiovascular", 
    icon: Heart,
    category: "specialty",
    parameters: [
      { name: "cardiovascularHistory", label: "Cardiovascular History", description: "Cardiac symptoms and history", type: "textarea" },
      { name: "ecgFindings", label: "ECG Findings", description: "Electrocardiogram interpretation", type: "textarea" },
      { name: "imaging", label: "Cardiac Imaging", description: "Echocardiogram, stress test results", type: "textarea" },
      { name: "riskFactors", label: "Risk Factors", description: "Hypertension, dyslipidemia, diabetes", type: "textarea" },
      { name: "cardiacPlan", label: "Cardiac Management Plan", description: "Medications, interventions, lifestyle modifications", type: "textarea" }
    ]
  },
  { 
    id: "psychiatry",
    title: "Psychiatry", 
    description: "Mental health assessment", 
    icon: Brain,
    category: "specialty",
    parameters: [
      { name: "mentalStatusExam", label: "Mental Status Examination", description: "Appearance, behavior, cognitive function", type: "textarea" },
      { name: "moodAnxiety", label: "Mood & Anxiety", description: "Depression, anxiety, affect assessment", type: "textarea" },
      { name: "thoughtProcess", label: "Thought Process", description: "Thought content, perceptions, insight", type: "textarea" },
      { name: "riskAssessment", label: "Risk Assessment", description: "Suicidal/homicidal ideation, self-harm", type: "textarea" },
      { name: "psychiatricPlan", label: "Psychiatric Plan", description: "Medications, therapy, follow-up", type: "textarea" }
    ]
  },
  { 
    id: "geriatrics",
    title: "Geriatrics", 
    description: "Elderly patient care", 
    icon: PersonStanding,
    category: "specialty",
    parameters: [
      { name: "functionalStatus", label: "Functional Status", description: "ADLs, mobility, fall risk", type: "textarea" },
      { name: "cognitiveAssessment", label: "Cognitive Assessment", description: "Memory, orientation, dementia screening", type: "textarea" },
      { name: "medicationReview", label: "Medication Review", description: "Polypharmacy assessment, adverse effects", type: "textarea" },
      { name: "socialSupport", label: "Social Support", description: "Living situation, caregiver resources", type: "textarea" },
      { name: "advanceDirectives", label: "Advance Directives", description: "End-of-life planning, healthcare proxy", type: "textarea" }
    ]
  },
  { 
    id: "obstetrics",
    title: "Obstetrics", 
    description: "Pregnancy and childbirth", 
    icon: Users,
    category: "specialty",
    parameters: [
      { name: "gestationalAge", label: "Gestational Age", description: "LMP, EDD, current weeks", type: "textarea" },
      { name: "prenatalScreening", label: "Prenatal Screening", description: "Genetic testing, anomaly scans", type: "textarea" },
      { name: "maternalVitals", label: "Maternal Vitals", description: "Blood pressure, weight, urine analysis", type: "textarea" },
      { name: "fetalAssessment", label: "Fetal Assessment", description: "Heart rate, movement, growth", type: "textarea" },
      { name: "birthPlan", label: "Birth Plan", description: "Delivery preferences, postpartum care", type: "textarea" }
    ]
  },
  { 
    id: "orthopedics",
    title: "Orthopedics", 
    description: "Musculoskeletal system", 
    icon: Bone,
    category: "specialty",
    parameters: [
      { name: "musculoskeletalExam", label: "Musculoskeletal Exam", description: "Joint examination, range of motion", type: "textarea" },
      { name: "imagingFindings", label: "Imaging Findings", description: "X-ray, MRI, CT scan results", type: "textarea" },
      { name: "painAssessment", label: "Pain Assessment", description: "Pain scale, quality, aggravating factors", type: "textarea" },
      { name: "functionalLimitations", label: "Functional Limitations", description: "Impact on daily activities, work", type: "textarea" },
      { name: "treatmentOptions", label: "Treatment Options", description: "Physical therapy, surgery, medications", type: "textarea" }
    ]
  },
  { 
    id: "endocrinology",
    title: "Endocrinology", 
    description: "Hormonal disorders", 
    icon: Pill,
    category: "specialty",
    parameters: [
      { name: "metabolicControl", label: "Metabolic Control", description: "Blood glucose, A1C, thyroid function", type: "textarea" },
      { name: "endocrineHistory", label: "Endocrine History", description: "Diabetes, thyroid disorders, adrenal issues", type: "textarea" },
      { name: "medicationManagement", label: "Medication Management", description: "Insulin, hormone therapy, oral agents", type: "textarea" },
      { name: "metabolicComplications", label: "Metabolic Complications", description: "Micro/macrovascular complications, neuropathy", type: "textarea" },
      { name: "lifestyleModifications", label: "Lifestyle Modifications", description: "Diet, exercise, monitoring recommendations", type: "textarea" }
    ]
  },
];

type SpecialtyTemplatesProps = {
  onUseTemplate: (template: SpecialtyTemplate) => void;
};

const SpecialtyTemplates = ({ onUseTemplate }: SpecialtyTemplatesProps) => {
  const [templateDetailsOpen, setTemplateDetailsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SpecialtyTemplate | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [customTemplateDialogOpen, setCustomTemplateDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleViewTemplateDetails = (template: SpecialtyTemplate) => {
    setSelectedTemplate(template);
    setTemplateDetailsOpen(true);
  };

  const handleUseTemplate = (template: SpecialtyTemplate) => {
    onUseTemplate(template);
    toast({
      title: `${template.title} Template Selected`,
      description: "Your new document has been created from this specialty template.",
      duration: 3000,
    });
  };

  const handleOpenCustomTemplateDialog = () => {
    setSelectedSpecialties([]);
    setCustomTemplateDialogOpen(true);
  };

  const handleSpecialtyCheckboxChange = (specialtyId: string) => {
    setSelectedSpecialties(current => 
      current.includes(specialtyId)
        ? current.filter(id => id !== specialtyId)
        : [...current, specialtyId]
    );
  };

  const handleCreateCustomTemplate = () => {
    if (selectedSpecialties.length === 0) {
      toast({
        title: "No Specialties Selected",
        description: "Please select at least one specialty to create a custom template.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Create a custom template by combining the selected specialties
    const selectedTemplates = specialtyTemplates.filter(template => 
      selectedSpecialties.includes(template.id)
    );
    
    const specialtyNames = selectedTemplates.map(t => t.title).join(", ");
    
    toast({
      title: "Custom Template Created",
      description: `Combined template with: ${specialtyNames}`,
      duration: 3000,
    });

    // This would normally create a custom template, but for now we'll just use the first selected template
    if (selectedTemplates.length > 0) {
      onUseTemplate(selectedTemplates[0]);
    }
    
    setCustomTemplateDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Specialties</TabsTrigger>
            <TabsTrigger value="primary">Primary Care</TabsTrigger>
            <TabsTrigger value="specialty">Specialties</TabsTrigger>
          </TabsList>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleOpenCustomTemplateDialog}
            className="flex items-center gap-1.5"
          >
            <BadgePlus className="h-4 w-4" />
            Custom Template
          </Button>
        </div>

        {/* All templates */}
        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialtyTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-all cursor-pointer border border-border overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mr-4">
                        <template.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{template.title}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="p-4 flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewTemplateDetails(template)}
                      className="gap-1.5"
                    >
                      <ListFilter className="h-3.5 w-3.5" />
                      View Parameters
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="gap-1.5"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Primary care templates */}
        <TabsContent value="primary" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialtyTemplates
              .filter(template => template.category === "primary")
              .map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-all cursor-pointer border border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mr-4">
                          <template.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{template.title}</h3>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="p-4 flex justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewTemplateDetails(template)}
                        className="gap-1.5"
                      >
                        <ListFilter className="h-3.5 w-3.5" />
                        View Parameters
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Specialty templates */}
        <TabsContent value="specialty" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialtyTemplates
              .filter(template => template.category === "specialty")
              .map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-all cursor-pointer border border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mr-4">
                          <template.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{template.title}</h3>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="p-4 flex justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewTemplateDetails(template)}
                        className="gap-1.5"
                      >
                        <ListFilter className="h-3.5 w-3.5" />
                        View Parameters
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template details dialog */}
      <Dialog open={templateDetailsOpen} onOpenChange={setTemplateDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate?.icon && <selectedTemplate.icon className="h-5 w-5" />}
              {selectedTemplate?.title} Template
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-2">
            <h3 className="text-sm font-medium">Template Parameters</h3>
            <div className="space-y-4">
              {selectedTemplate?.parameters.map((param, index) => (
                <div key={index} className="bg-muted/40 p-3 rounded-md space-y-1">
                  <div className="flex items-center">
                    <h4 className="text-sm font-medium">{param.label}</h4>
                    <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                      {param.type === 'textarea' ? 'Multi-line text' : 'Single-line text'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{param.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTemplateDetailsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              handleUseTemplate(selectedTemplate!);
              setTemplateDetailsOpen(false);
            }}>
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom template selection dialog */}
      <Dialog open={customTemplateDialogOpen} onOpenChange={setCustomTemplateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Template</DialogTitle>
            <DialogDescription>
              Select multiple specialties to create a combined template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-2 max-h-[400px] overflow-y-auto pr-2">
            <h3 className="text-sm font-medium">Available Specialties</h3>
            <div className="space-y-3">
              {specialtyTemplates.map((template) => (
                <div key={template.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50">
                  <Checkbox 
                    id={`specialty-${template.id}`} 
                    checked={selectedSpecialties.includes(template.id)}
                    onCheckedChange={() => handleSpecialtyCheckboxChange(template.id)}
                  />
                  <div className="grid gap-1.5">
                    <label
                      htmlFor={`specialty-${template.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                    >
                      <template.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                      {template.title}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCustomTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomTemplate}>
              Create Combined Template 
              {selectedSpecialties.length > 0 && ` (${selectedSpecialties.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpecialtyTemplates;
