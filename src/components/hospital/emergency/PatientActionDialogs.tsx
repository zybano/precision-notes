
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmergencyPatient } from "./EmergencyPatientList";

interface DischargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: EmergencyPatient | null;
  onConfirm: () => void;
}

export const DischargeDialog = ({
  open,
  onOpenChange,
  patient,
  onConfirm
}: DischargeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Discharge Patient</DialogTitle>
          <DialogDescription>
            Confirm patient discharge from emergency department.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p>Are you sure you want to discharge <span className="font-semibold">{patient?.name}</span>?</p>
          <p className="text-sm text-muted-foreground mt-2">
            This will remove the patient from the emergency tracking board.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm Discharge</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface AdmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: EmergencyPatient | null;
  onConfirm: () => void;
}

export const AdmitDialog = ({
  open,
  onOpenChange,
  patient,
  onConfirm
}: AdmitDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Admit to Inpatient</DialogTitle>
          <DialogDescription>
            Transfer patient from emergency to inpatient care.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p>Admit <span className="font-semibold">{patient?.name}</span> to inpatient care?</p>
          <p className="text-sm text-muted-foreground mt-2">
            This will transfer the patient to the inpatient module and remove them from emergency tracking.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm}>Admit to Inpatient</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
