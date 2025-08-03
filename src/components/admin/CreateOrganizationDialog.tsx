import React, {useState} from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Loader2} from "lucide-react";
import {toast} from "sonner";

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateOrganization: (data: any) => Promise<any>;
}

const DOCUMENT_TYPES = [
  { id: 'soap', name: 'SOAP Notes', credits: 2 },
  { id: 'h&p', name: 'History & Physical', credits: 4 },
  { id: 'progress', name: 'Progress Notes', credits: 2 },
  { id: 'discharge', name: 'Discharge Summary', credits: 4 },
  { id: 'consultation', name: 'Consultation Note', credits: 3 },
  { id: 'procedure', name: 'Procedure Note', credits: 3 },
  { id: 'pediatrics', name: 'Pediatric Notes', credits: 3 },
  { id: 'cardiology', name: 'Cardiology Notes', credits: 4 },
  { id: 'psychiatry', name: 'Psychiatry Notes', credits: 4 },
  { id: 'geriatrics', name: 'Geriatric Notes', credits: 3 },
  { id: 'obstetrics', name: 'Obstetric Notes', credits: 3 },
  { id: 'orthopedics', name: 'Orthopedic Notes', credits: 3 },
  { id: 'endocrinology', name: 'Endocrinology Notes', credits: 3 },
  { id: 'dictation', name: 'Raw Dictation', credits: 1 },
];

const INDUSTRIES = [
  'Healthcare',
  'Hospital',
  'Clinic',
  'Private Practice',
  'EMR Vendor',
  'Health Tech',
  'Medical Software',
  'Telehealth',
  'Other'
];

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onCreateOrganization
}: CreateOrganizationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_name: '',
    industry: '',
    initial_credits: 1000,
    rate_limit_per_hour: 500,
    allowed_document_types: [] as string[],
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDocumentTypeToggle = (typeId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allowed_document_types: checked
        ? [...prev.allowed_document_types, typeId]
        : prev.allowed_document_types.filter(id => id !== typeId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.contact_email || !formData.contact_name || !formData.industry) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.allowed_document_types.length === 0) {
      toast.error('Please select at least one document type');
      return;
    }

    setIsLoading(true);
    try {
      await onCreateOrganization(formData);
      // Reset form
      setFormData({
        name: '',
        contact_email: '',
        contact_name: '',
        industry: '',
        initial_credits: 1000,
        rate_limit_per_hour: 500,
        allowed_document_types: [],
      });
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Set up a new B2B organization with API access and credit allocation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organization Details</CardTitle>
              <CardDescription>Basic information about the organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Acme Healthcare"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name *</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => handleInputChange('contact_name', e.target.value)}
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="john@acmehealthcare.com"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Configuration</CardTitle>
              <CardDescription>Set initial limits and allowances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initial_credits">Initial Credits</Label>
                  <Input
                    id="initial_credits"
                    type="number"
                    value={formData.initial_credits}
                    onChange={(e) => handleInputChange('initial_credits', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate_limit_per_hour">Rate Limit (per hour)</Label>
                  <Input
                    id="rate_limit_per_hour"
                    type="number"
                    value={formData.rate_limit_per_hour}
                    onChange={(e) => handleInputChange('rate_limit_per_hour', parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Allowed Document Types</CardTitle>
              <CardDescription>Select which document types this organization can generate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {DOCUMENT_TYPES.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.id}
                      checked={formData.allowed_document_types.includes(type.id)}
                      onCheckedChange={(checked) => handleDocumentTypeToggle(type.id, checked as boolean)}
                    />
                    <Label htmlFor={type.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {type.name}
                      <span className="text-muted-foreground ml-1">({type.credits} credits)</span>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Organization
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
