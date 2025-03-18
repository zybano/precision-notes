
import { useState } from "react";
import { FadeIn } from "@/components/ui/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, MoreVertical, Calendar, Clock, FileText } from "lucide-react";

const Patients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
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

  const filteredPatients = patientData.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
            <Button variant="outline" size="sm">Import</Button>
            <Button size="sm" className="shadow-sm hover:shadow-md transition-all btn-premium">
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
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
              <Tabs defaultValue="all" className="w-full md:w-auto">
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
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No patients found matching your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient) => (
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
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
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
                <Button variant="ghost" className="w-full text-primary">
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
