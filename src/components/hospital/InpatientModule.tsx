import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Calendar, Clipboard, Clock, FileText, Search} from "lucide-react";

const inpatients = [
  { id: 1, name: "Emily Johnson", room: "203A", admitted: "05/15/2023", doctor: "Dr. Garcia", diagnosis: "Pneumonia", duration: "7 days" },
  { id: 2, name: "Robert Wilson", room: "105B", admitted: "05/12/2023", doctor: "Dr. Johnson", diagnosis: "Arthritis", duration: "10 days" },
  { id: 3, name: "Alice Thompson", room: "322C", admitted: "05/17/2023", doctor: "Dr. Roberts", diagnosis: "Appendicitis", duration: "5 days" },
  { id: 4, name: "David Martinez", room: "115A", admitted: "05/10/2023", doctor: "Dr. Wong", diagnosis: "Fracture", duration: "12 days" },
  { id: 5, name: "Sophia Clark", room: "210B", admitted: "05/16/2023", doctor: "Dr. Patel", diagnosis: "Kidney Infection", duration: "6 days" },
];

export const InpatientModule = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredInpatients = inpatients.filter(
    patient => patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
               patient.room.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search inpatients..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Occupied Beds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inpatients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Beds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Stay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8 days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expected Discharges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 today</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Current Inpatients</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="hidden md:table-cell">Admitted</TableHead>
                    <TableHead className="hidden md:table-cell">Doctor</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInpatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>{patient.room}</TableCell>
                      <TableCell className="hidden md:table-cell">{patient.admitted}</TableCell>
                      <TableCell className="hidden md:table-cell">{patient.doctor}</TableCell>
                      <TableCell>{patient.diagnosis}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Clipboard className="h-4 w-4" />
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
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ward Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-3">
                  <div className="font-medium mb-1">Morning Rounds</div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    8:00 AM - 10:00 AM
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center mt-1">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    Dr. Roberts, Dr. Garcia
                  </div>
                </div>
                
                <div className="border rounded-md p-3">
                  <div className="font-medium mb-1">Medication Administration</div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    11:00 AM - 12:00 PM
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center mt-1">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    Nurse Thompson, Nurse Wilson
                  </div>
                </div>
                
                <div className="border rounded-md p-3">
                  <div className="font-medium mb-1">Evening Rounds</div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    5:00 PM - 7:00 PM
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center mt-1">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    Dr. Patel, Dr. Wong
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
