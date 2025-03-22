
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserRound, Phone, Mail, Calendar, Search, PlusCircle, FileEdit, Trash2 } from "lucide-react";

const nurses = [
  { id: 1, name: "Emma Thompson", department: "Emergency", shift: "Morning", phone: "(555) 111-2233", email: "e.thompson@hospital.com" },
  { id: 2, name: "Daniel Brown", department: "ICU", shift: "Night", phone: "(555) 222-3344", email: "d.brown@hospital.com" },
  { id: 3, name: "Olivia Martinez", department: "Pediatrics", shift: "Evening", phone: "(555) 333-4455", email: "o.martinez@hospital.com" },
  { id: 4, name: "William Davis", department: "Surgery", shift: "Morning", phone: "(555) 444-5566", email: "w.davis@hospital.com" },
  { id: 5, name: "Sophia Wilson", department: "Cardiology", shift: "Night", phone: "(555) 555-6677", email: "s.wilson@hospital.com" },
  { id: 6, name: "Noah Anderson", department: "Oncology", shift: "Evening", phone: "(555) 666-7788", email: "n.anderson@hospital.com" },
];

export const NursesModule = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredNurses = nurses.filter(
    nurse => nurse.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             nurse.department.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search nurses..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Nurse
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Nurses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nurses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Morning Shift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nurses.filter(n => n.shift === "Morning").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evening Shift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nurses.filter(n => n.shift === "Evening").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Night Shift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nurses.filter(n => n.shift === "Night").length}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Nurses Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="hidden md:table-cell">Shift</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNurses.map((nurse) => (
                <TableRow key={nurse.id}>
                  <TableCell className="font-medium">{nurse.name}</TableCell>
                  <TableCell>{nurse.department}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                      ${nurse.shift === "Morning" ? "bg-blue-50 text-blue-800" : 
                        nurse.shift === "Evening" ? "bg-purple-50 text-purple-800" : 
                        "bg-gray-50 text-gray-800"}`}>
                      {nurse.shift}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col text-sm">
                      <span className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" /> {nurse.phone}
                      </span>
                      <span className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" /> {nurse.email}
                      </span>
                    </div>
                  </TableCell>
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
