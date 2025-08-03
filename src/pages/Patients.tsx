import {useState} from "react";
import {FadeIn} from "@/components/ui/motion";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Separator} from "@/components/ui/separator";
import {Calendar, Clock, FileText, MoreVertical, Plus, Search} from "lucide-react";
import {toast} from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";

const Patients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  // Remove useToast hook since we're using sonner directly
  
  const patientData = [
    { 
      id: 1, 
      name: "Sarah Johnson", 
      age: 42, 
      gender: "Female", 
      lastVisit: "Aug 24, 2023", 
      condition: "Hypertension",
      upcoming: true
    },
    { 
      id: 2, 
      name: "Michael Chen", 
      age: 35, 
      gender: "Male", 
      lastVisit: "Aug 22, 2023", 
      condition: "Type 2 Diabetes",
      upcoming: false
    },
    { 
      id: 3, 
      name: "Emily Rodriguez", 
      age: 28, 
      gender: "Female", 
      lastVisit: "Aug 15, 2023", 
      condition: "Asthma",
      upcoming: true
    },
    { 
      id: 4, 
      name: "Robert Williams", 
      age: 65, 
      gender: "Male", 
      lastVisit: "Aug 10, 2023", 
      condition: "Arthritis",
      upcoming: false
    },
    { 
      id: 5, 
      name: "Jennifer Lopez", 
      age: 54, 
      gender: "Female", 
      lastVisit: "Aug 5, 2023", 
      condition: "Hypothyroidism",
      upcoming: true
    },
  ];

  const recentPatients = patientData.slice(0, 3);

  const filteredPatients = patientData.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedPatients = activeTab === "all" ? filteredPatients : recentPatients;

  const handleImport = () => {
    setIsImportDialogOpen(false);
    toast.success("Patient data import has begun. You'll be notified when complete.");
    
    // Simulate import completion after 2 seconds
    setTimeout(() => {
      toast.success("5 patient records have been successfully imported.");
    }, 2000);
  };

  const handleAddPatient = () => {
    setIsAddPatientOpen(false);
    toast.success("New patient has been successfully added to your records.");
  };

  const handleViewAppointments = () => {
    toast.success("Navigating to full appointment calendar.");
  };

  const handleViewRecords = (patientId: number) => {
    toast.success(`Viewing medical records for patient #${patientId}.`);
  };

  const handleScheduleAppointment = (patientId: number) => {
    toast.success(`Opening scheduler for patient #${patientId}.`);
  };
  
  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Patients</h1>
            <p className="text-muted-foreground mt-1">
              Manage your patients and their records
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Import</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Patient Records</DialogTitle>
                  <DialogDescription>
                    Upload a CSV or Excel file with patient records to import into the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">Drag and drop your file here or click to browse</p>
                    <Button variant="outline" className="mt-4">
                      Select File
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleImport}>Import Records</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="shadow-sm hover:shadow-md transition-all btn-premium">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Patient</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new patient below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                      <Input id="firstName" placeholder="First name" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                      <Input id="lastName" placeholder="Last name" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="birthdate" className="text-sm font-medium">Date of Birth</label>
                    <Input id="birthdate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="gender" className="text-sm font-medium">Gender</label>
                    <select id="gender" className="w-full border border-gray-300 rounded-md px-4 py-2">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                    <Input id="phone" placeholder="Phone number" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                    <Input id="email" type="email" placeholder="Email address" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddPatientOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddPatient}>Add Patient</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="border border-border">
          <CardHeader className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input 
                  type="text" 
                  placeholder="Search patients..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab} 
                className="w-full md:w-auto"
              >
                <TabsList className="grid grid-cols-2 w-full md:w-[200px]">
                  <TabsTrigger value="all">All Patients</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-b-md border-t overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="py-3 px-4 text-left font-medium text-sm text-muted-foreground">Name</th>
                    <th className="py-3 px-4 text-left font-medium text-sm text-muted-foreground">Age</th>
                    <th className="py-3 px-4 text-left font-medium text-sm text-muted-foreground">Gender</th>
                    <th className="py-3 px-4 text-left font-medium text-sm text-muted-foreground">Last Visit</th>
                    <th className="py-3 px-4 text-left font-medium text-sm text-muted-foreground">Condition</th>
                    <th className="py-3 px-4 text-right font-medium text-sm text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No patients found matching your search criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedPatients.map((patient) => (
                      <tr key={patient.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">{patient.name}</td>
                        <td className="py-3 px-4">{patient.age}</td>
                        <td className="py-3 px-4">{patient.gender}</td>
                        <td className="py-3 px-4 text-muted-foreground">{patient.lastVisit}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent text-accent-foreground">
                            {patient.condition}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewRecords(patient.id)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleScheduleAppointment(patient.id)}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Patient Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewRecords(patient.id)}>
                                  View Medical Records
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleScheduleAppointment(patient.id)}>
                                  Schedule Appointment
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                   toast.success(`Message sent to ${patient.name}.`);
                                }}>Send Message</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                   toast.success(`Editing ${patient.name}'s information.`);
                                }}>Edit Patient</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                     toast.success(`${patient.name} has been archived.`);
                                  }}
                                >
                                  Archive Patient
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FadeIn delay={0.2}>
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patientData.filter(p => p.upcoming).map((patient, i) => (
                  <div key={i} className="flex items-start p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="bg-primary/10 rounded-md p-2 mr-3">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {i === 0 ? "Tomorrow, 10:00 AM - Follow-up" : 
                         i === 1 ? "Sep 2, 11:30 AM - New visit" : 
                         "Sep 5, 2:15 PM - Consultation"}
                      </p>
                    </div>
                  </div>
                ))}
                <Separator className="my-2" />
                <Button variant="ghost" className="w-full text-primary" onClick={handleViewAppointments}>
                  View All Appointments
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.3}>
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Patient Demographics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center justify-center">
                <div className="rounded-md bg-accent/50 text-muted-foreground p-12 text-center">
                  Demographics chart will appear here
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
};

export default Patients;
