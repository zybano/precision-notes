
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, UserCheck, BedIcon, Search, UserPlus } from "lucide-react";

export interface EmergencyPatient {
  id: number;
  name: string;
  age: number;
  arrivalTime: string;
  complaint: string;
  triageLevel: 1 | 2 | 3 | 4 | 5;
  vital: string;
  status: 'waiting' | 'in-treatment' | 'ready-for-discharge' | 'pending-admission';
}

interface EmergencyPatientListProps {
  patients: EmergencyPatient[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onTriagePatient: (patient: EmergencyPatient) => void;
  onDischargePatient: (patient: EmergencyPatient) => void;
  onAdmitPatient: (patient: EmergencyPatient) => void;
}

export const triageLevelColors = {
  1: "text-white bg-red-600 hover:bg-red-700",
  2: "text-white bg-orange-500 hover:bg-orange-600",
  3: "text-white bg-yellow-500 hover:bg-yellow-600",
  4: "text-white bg-blue-500 hover:bg-blue-600", 
  5: "text-white bg-green-500 hover:bg-green-600"
};

export const triageLevelNames = {
  1: "Immediate",
  2: "Very Urgent",
  3: "Urgent",
  4: "Standard",
  5: "Non-Urgent"
};

export const EmergencyPatientList = ({ 
  patients, 
  searchTerm, 
  setSearchTerm,
  onTriagePatient,
  onDischargePatient,
  onAdmitPatient
}: EmergencyPatientListProps) => {
  const filteredPatients = patients.filter(
    patient => patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               patient.complaint.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
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
                      onClick={() => onTriagePatient(patient)}
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
                          onClick={() => onDischargePatient(patient)}
                        >
                          <UserCheck className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                      
                      {patient.status === 'pending-admission' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onAdmitPatient(patient)}
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
    </>
  );
};
