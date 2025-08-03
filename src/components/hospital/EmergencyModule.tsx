import {useState} from "react";
import {TriageSummary} from "./emergency/TriageSummary";
import {EmergencyPatient, EmergencyPatientList} from "./emergency/EmergencyPatientList";
import {AmbulanceManager, AmbulanceUnit} from "./emergency/AmbulanceManager";
import {TriageDialog} from "./emergency/TriageDialog";
import {AdmitDialog, DischargeDialog} from "./emergency/PatientActionDialogs";

export const EmergencyModule = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<EmergencyPatient | null>(null);
  const [isTriageDialogOpen, setIsTriageDialogOpen] = useState(false);
  const [isDischargeDialogOpen, setIsDischargeDialogOpen] = useState(false);
  const [isAdmitDialogOpen, setIsAdmitDialogOpen] = useState(false);
  const [triageLevel, setTriageLevel] = useState<'1' | '2' | '3' | '4' | '5'>("3");
  
  // Sample data
  const [emergencyPatients, setEmergencyPatients] = useState<EmergencyPatient[]>([
    { id: 1, name: "James Wilson", age: 45, arrivalTime: "10:30 AM", complaint: "Chest Pain", triageLevel: 2, vital: "BP: 150/90, HR: 95", status: 'in-treatment' },
    { id: 2, name: "Emily Smith", age: 28, arrivalTime: "11:15 AM", complaint: "Abdominal Pain", triageLevel: 3, vital: "BP: 120/80, HR: 82", status: 'waiting' },
    { id: 3, name: "David Chen", age: 72, arrivalTime: "09:45 AM", complaint: "Shortness of Breath", triageLevel: 1, vital: "BP: 160/95, HR: 110, O2: 85%", status: 'pending-admission' },
    { id: 4, name: "Sarah Johnson", age: 8, arrivalTime: "12:00 PM", complaint: "Fever, Rash", triageLevel: 4, vital: "Temp: 101.3°F, HR: 110", status: 'waiting' },
    { id: 5, name: "Robert Brown", age: 35, arrivalTime: "10:00 AM", complaint: "Ankle Injury", triageLevel: 5, vital: "BP: 118/78, HR: 72", status: 'ready-for-discharge' },
  ]);
  
  const [ambulances, setAmbulances] = useState<AmbulanceUnit[]>([
    { id: 1, unit: "Ambulance 1", status: 'available', crew: "Jones, Smith" },
    { id: 2, unit: "Ambulance 2", status: 'dispatched', crew: "Garcia, Wilson", location: "Downtown", dispatchTime: "11:30 AM" },
    { id: 3, unit: "Ambulance 3", status: 'returning', crew: "Thompson, Lee", dispatchTime: "10:15 AM" },
  ]);

  const handleTriagePatient = (patient: EmergencyPatient) => {
    setSelectedPatient(patient);
    setTriageLevel(patient.triageLevel.toString() as '1' | '2' | '3' | '4' | '5');
    setIsTriageDialogOpen(true);
  };

  const handleDischargePatient = (patient: EmergencyPatient) => {
    setSelectedPatient(patient);
    setIsDischargeDialogOpen(true);
  };

  const handleAdmitPatient = (patient: EmergencyPatient) => {
    setSelectedPatient(patient);
    setIsAdmitDialogOpen(true);
  };

  const handleDispatchAmbulance = (id: number) => {
    setAmbulances(prevAmbulances => 
      prevAmbulances.map(amb => 
        amb.id === id 
          ? { ...amb, status: 'dispatched' as const, dispatchTime: new Date().toLocaleTimeString() } 
          : amb
      )
    );
  };

  const handleReturnAmbulance = (id: number) => {
    setAmbulances(prevAmbulances => 
      prevAmbulances.map(amb => 
        amb.id === id 
          ? { ...amb, status: 'available' as const, location: undefined, dispatchTime: undefined } 
          : amb
      )
    );
  };

  const handleTriage = () => {
    if (selectedPatient) {
      setEmergencyPatients(prevPatients => 
        prevPatients.map(patient => 
          patient.id === selectedPatient.id 
            ? { ...patient, triageLevel: parseInt(triageLevel) as 1 | 2 | 3 | 4 | 5 } 
            : patient
        )
      );
    }
    setIsTriageDialogOpen(false);
  };

  const handleDischarge = () => {
    if (selectedPatient) {
      setEmergencyPatients(prevPatients => 
        prevPatients.filter(patient => patient.id !== selectedPatient.id)
      );
    }
    setIsDischargeDialogOpen(false);
  };

  const handleAdmit = () => {
    if (selectedPatient) {
      // In a real app, you would create an admission record and then remove from emergency
      setEmergencyPatients(prevPatients => 
        prevPatients.filter(patient => patient.id !== selectedPatient.id)
      );
    }
    setIsAdmitDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Triage Summary */}
      <TriageSummary patients={emergencyPatients} />
      
      {/* Patient List */}
      <EmergencyPatientList 
        patients={emergencyPatients} 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onTriagePatient={handleTriagePatient}
        onDischargePatient={handleDischargePatient}
        onAdmitPatient={handleAdmitPatient}
      />

      {/* Ambulance Management */}
      <AmbulanceManager 
        ambulances={ambulances}
        onDispatchAmbulance={handleDispatchAmbulance}
        onReturnAmbulance={handleReturnAmbulance}
      />

      {/* Dialogs */}
      <TriageDialog 
        open={isTriageDialogOpen}
        onOpenChange={setIsTriageDialogOpen}
        patient={selectedPatient}
        triageLevel={triageLevel}
        onTriageLevelChange={setTriageLevel}
        onConfirm={handleTriage}
      />

      <DischargeDialog 
        open={isDischargeDialogOpen}
        onOpenChange={setIsDischargeDialogOpen}
        patient={selectedPatient}
        onConfirm={handleDischarge}
      />

      <AdmitDialog 
        open={isAdmitDialogOpen}
        onOpenChange={setIsAdmitDialogOpen}
        patient={selectedPatient}
        onConfirm={handleAdmit}
      />
    </div>
  );
};
