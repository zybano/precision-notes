
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, PlusCircle, FileText, FileEdit, Trash2 } from "lucide-react";

const patients = [
  { id: 1, name: "John Smith", age: 45, gender: "Male", doctor: "Dr. Roberts", diagnosis: "Hypertension", status: "Active" },
  { id: 2, name: "Emily Johnson", age: 32, gender: "Female", doctor: "Dr. Garcia", diagnosis: "Pneumonia", status: "Inpatient" },
  { id: 3, name: "Michael Brown", age: 58, gender: "Male", doctor: "Dr. Patel", diagnosis: "Diabetes", status: "Active" },
  { id: 4, name: "Sophia Lee", age: 27, gender: "Female", doctor: "Dr. Wong", diagnosis: "Migraine", status: "Active" },
  { id: 5, name: "Robert Wilson", age: 67, gender: "Male", doctor: "Dr. Johnson", diagnosis: "Arthritis", status: "Inpatient" },
  { id: 6, name: "Olivia Davis", age: 38, gender: "Female", doctor: "Dr. Thompson", diagnosis: "Asthma", status: "Active" },
];

export const PatientsModule = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredPatients = patients.filter(
    patient => patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
               patient.doctor.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Patient
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inpatients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.filter(p => p.status === "Inpatient").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Discharged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Patient Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead className="hidden md:table-cell">Gender</TableHead>
                <TableHead className="hidden md:table-cell">Doctor</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell className="hidden md:table-cell">{patient.gender}</TableCell>
                  <TableCell className="hidden md:table-cell">{patient.doctor}</TableCell>
                  <TableCell>{patient.diagnosis}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                      ${patient.status === "Active" ? "bg-green-50 text-green-800" : 
                        patient.status === "Inpatient" ? "bg-blue-50 text-blue-800" : 
                        "bg-gray-50 text-gray-800"}`}>
                      {patient.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
