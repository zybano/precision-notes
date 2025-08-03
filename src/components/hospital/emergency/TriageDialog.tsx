import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Label} from "@/components/ui/label";
import {EmergencyPatient} from "./EmergencyPatientList";

interface TriageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: EmergencyPatient | null;
  triageLevel: '1' | '2' | '3' | '4' | '5';
  onTriageLevelChange: (value: '1' | '2' | '3' | '4' | '5') => void;
  onConfirm: () => void;
}

export const TriageDialog = ({
  open,
  onOpenChange,
  patient,
  triageLevel,
  onTriageLevelChange,
  onConfirm
}: TriageDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Triage Level</DialogTitle>
          <DialogDescription>
            Assign a triage level based on patient's condition severity.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <p className="font-medium">Patient: {patient?.name}</p>
            <p className="text-sm text-muted-foreground">Complaint: {patient?.complaint}</p>
            <p className="text-sm text-muted-foreground">Vitals: {patient?.vital}</p>
          </div>
          
          <RadioGroup value={triageLevel} onValueChange={(value) => onTriageLevelChange(value as '1' | '2' | '3' | '4' | '5')}>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem id="level1" value="1" />
              <Label htmlFor="level1" className="text-red-600 font-medium">Level 1 - Immediate (Resuscitation)</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem id="level2" value="2" />
              <Label htmlFor="level2" className="text-orange-500 font-medium">Level 2 - Very Urgent (10 min)</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem id="level3" value="3" />
              <Label htmlFor="level3" className="text-yellow-500 font-medium">Level 3 - Urgent (30 min)</Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem id="level4" value="4" />
              <Label htmlFor="level4" className="text-blue-500 font-medium">Level 4 - Standard (60 min)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem id="level5" value="5" />
              <Label htmlFor="level5" className="text-green-500 font-medium">Level 5 - Non-Urgent (120 min)</Label>
            </div>
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm}>Update Triage Level</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
