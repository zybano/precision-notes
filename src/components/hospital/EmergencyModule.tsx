
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  FileText, 
  Clipboard, 
  Ambulance,
  Plus,
  ArrowRight,
  BedIcon,
  UserPlus,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EmergencyPatient {
  id: number;
  name: string;
  age: number;
  arrivalTime: string;
  complaint: string;
  triageLevel: 1 | 2 | 3 | 4 | 5;
  vital: string;
  status: 'waiting' | 'in-treatment' | 'ready-for-discharge' | 'pending-admission';
}

interface Ambulance {
  id: number;
  unit: string;
  status: 'available' | 'dispatched' | 'returning';
  crew: string;
  location?: string;
  dispatchTime?: string;
}

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
  
  const [ambulances, setAmbulances] = useState<Ambulance[]>([
    { id: 1, unit: "Ambulance 1", status: 'available', crew: "Jones, Smith" },
    { id: 2, unit: "Ambulance 2", status: 'dispatched', crew: "Garcia, Wilson", location: "Downtown", dispatchTime: "11:30 AM" },
    { id: 3, unit: "Ambulance 3", status: 'returning', crew: "Thompson, Lee", dispatchTime: "10:15 AM" },
  ]);

  const filteredPatients = emergencyPatients.filter(
    patient => patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               patient.complaint.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const triageLevelColors = {
    1: "text-white bg-red-600 hover:bg-red-700",
    2: "text-white bg-orange-500 hover:bg-orange-600",
    3: "text-white bg-yellow-500 hover:bg-yellow-600",
    4: "text-white bg-blue-500 hover:bg-blue-600", 
    5: "text-white bg-green-500 hover:bg-green-600"
  };
  
  const triageLevelNames = {
    1: "Immediate",
    2: "Very Urgent",
    3: "Urgent",
    4: "Standard",
    5: "Non-Urgent"
  };

  const countByTriageLevel = (level: 1 | 2 | 3 | 4 | 5) => {
    return emergencyPatients.filter(patient => patient.triageLevel === level).length;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search patients..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            New Emergency Patient
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Level 1 (Immediate)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{countByTriageLevel(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Level 2 (Very Urgent)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{countByTriageLevel(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Level 3 (Urgent)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{countByTriageLevel(3)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Level 4 (Standard)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{countByTriageLevel(4)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Level 5 (Non-Urgent)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{countByTriageLevel(5)}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>ER Patient Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead className="hidden md:table-cell">Arrival</TableHead>
                <TableHead>Triage Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-muted-foreground">{patient.age} years</div>
                    </div>
                  </TableCell>
                  <TableCell>{patient.complaint}</TableCell>
                  <TableCell className="hidden md:table-cell">{patient.arrivalTime}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={triageLevelColors[patient.triageLevel]}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setTriageLevel(patient.triageLevel.toString() as '1' | '2' | '3' | '4' | '5');
                        setIsTriageDialogOpen(true);
                      }}
                    >
                      {patient.triageLevel} - {triageLevelNames[patient.triageLevel]}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        patient.status === 'waiting' ? 'outline' :
                        patient.status === 'in-treatment' ? 'secondary' :
                        patient.status === 'ready-for-discharge' ? 'default' :
                        'destructive'
                      }
                    >
                      {patient.status === 'waiting' ? 'Waiting' :
                       patient.status === 'in-treatment' ? 'In Treatment' :
                       patient.status === 'ready-for-discharge' ? 'Ready for Discharge' :
                       'Pending Admission'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <FileText className="h-4 w-4" />
                      </Button>
                      
                      {patient.status === 'ready-for-discharge' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedPatient(patient);
                            setIsDischargeDialogOpen(true);
                          }}
                        >
                          <UserCheck className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                      
                      {patient.status === 'pending-admission' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedPatient(patient);
                            setIsAdmitDialogOpen(true);
                          }}
                        >
                          <BedIcon className="h-4 w-4 text-blue-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ambulance Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Emergency Number</AlertTitle>
              <AlertDescription>
                For emergencies, call 911. Ambulance dispatch: 555-1234
              </AlertDescription>
            </Alert>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Crew</TableHead>
                <TableHead className="hidden md:table-cell">Location/Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ambulances.map((ambulance) => (
                <TableRow key={ambulance.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Ambulance className="h-4 w-4 mr-2 text-red-500" />
                      {ambulance.unit}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ambulance.status === 'available' ? 'default' :
                        ambulance.status === 'dispatched' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {ambulance.status.charAt(0).toUpperCase() + ambulance.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{ambulance.crew}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {ambulance.status !== 'available' 
                      ? ambulance.location || 'N/A' + ' - ' + (ambulance.dispatchTime || 'N/A')
                      : 'At station'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {ambulance.status === 'available' && (
                      <Button size="sm" variant="outline" onClick={() => handleDispatchAmbulance(ambulance.id)}>
                        Dispatch
                      </Button>
                    )}
                    {ambulance.status === 'dispatched' && (
                      <Button size="sm" variant="outline" onClick={() => handleReturnAmbulance(ambulance.id)}>
                        Mark Returned
                      </Button>
                    )}
                    {ambulance.status === 'returning' && (
                      <Button size="sm" variant="outline" onClick={() => handleReturnAmbulance(ambulance.id)}>
                        Arrived at Station
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Triage Dialog */}
      <Dialog open={isTriageDialogOpen} onOpenChange={setIsTriageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Triage Level</DialogTitle>
            <DialogDescription>
              Assign a triage level based on patient's condition severity.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="font-medium">Patient: {selectedPatient?.name}</p>
              <p className="text-sm text-muted-foreground">Complaint: {selectedPatient?.complaint}</p>
              <p className="text-sm text-muted-foreground">Vitals: {selectedPatient?.vital}</p>
            </div>
            
            <RadioGroup value={triageLevel} onValueChange={(value) => setTriageLevel(value as '1' | '2' | '3' | '4' | '5')}>
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
            <Button variant="outline" onClick={() => setIsTriageDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTriage}>Update Triage Level</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discharge Dialog */}
      <Dialog open={isDischargeDialogOpen} onOpenChange={setIsDischargeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discharge Patient</DialogTitle>
            <DialogDescription>
              Confirm patient discharge from emergency department.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to discharge <span className="font-semibold">{selectedPatient?.name}</span>?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This will remove the patient from the emergency tracking board.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDischargeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDischarge}>Confirm Discharge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admit Dialog */}
      <Dialog open={isAdmitDialogOpen} onOpenChange={setIsAdmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admit to Inpatient</DialogTitle>
            <DialogDescription>
              Transfer patient from emergency to inpatient care.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p>Admit <span className="font-semibold">{selectedPatient?.name}</span> to inpatient care?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This will transfer the patient to the inpatient module and remove them from emergency tracking.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdmitDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdmit}>Admit to Inpatient</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
