
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserRound, Phone, Mail, Calendar, Search, PlusCircle, FileEdit, Trash2 } from "lucide-react";

const doctors = [
  { id: 1, name: "Dr. Sarah Roberts", specialty: "Cardiology", phone: "(555) 123-4567", email: "s.roberts@hospital.com", patients: 28 },
  { id: 2, name: "Dr. James Patel", specialty: "Neurology", phone: "(555) 234-5678", email: "j.patel@hospital.com", patients: 32 },
  { id: 3, name: "Dr. Maria Garcia", specialty: "Pediatrics", phone: "(555) 345-6789", email: "m.garcia@hospital.com", patients: 45 },
  { id: 4, name: "Dr. Michael Wong", specialty: "Orthopedics", phone: "(555) 456-7890", email: "m.wong@hospital.com", patients: 22 },
  { id: 5, name: "Dr. Jennifer Johnson", specialty: "Oncology", phone: "(555) 567-8901", email: "j.johnson@hospital.com", patients: 19 },
  { id: 6, name: "Dr. David Smith", specialty: "Internal Medicine", phone: "(555) 678-9012", email: "d.smith@hospital.com", patients: 38 },
];

export const DoctorsModule = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredDoctors = doctors.filter(
    doctor => doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search doctors..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On Duty Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available for Consult</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Doctors Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden md:table-cell">Patients</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.name}</TableCell>
                  <TableCell>{doctor.specialty}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col text-sm">
                      <span className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" /> {doctor.phone}
                      </span>
                      <span className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" /> {doctor.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{doctor.patients}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Calendar className="h-4 w-4" />
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
