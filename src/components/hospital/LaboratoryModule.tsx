import {useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {CheckCircle, Clock, FileText, Microscope, Search} from "lucide-react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {toast} from "sonner";

export const LaboratoryModule = () => {
  const [testSearch, setTestSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  
  const pendingTests = [
    { id: 1001, patient: "John Smith", patientId: "P5421", doctor: "Dr. Williams", test: "Complete Blood Count", urgency: "Routine", requestDate: "2025-03-21" },
    { id: 1002, patient: "Emma Johnson", patientId: "P3654", doctor: "Dr. Garcia", test: "Lipid Panel", urgency: "Urgent", requestDate: "2025-03-21" },
    { id: 1003, patient: "Michael Davis", patientId: "P9087", doctor: "Dr. Patel", test: "Urinalysis", urgency: "Routine", requestDate: "2025-03-22" },
    { id: 1004, patient: "Sophia Martinez", patientId: "P1243", doctor: "Dr. Chen", test: "COVID-19 PCR", urgency: "STAT", requestDate: "2025-03-22" }
  ];

  const completedTests = [
    { id: 998, patient: "Daniel Wilson", patientId: "P7632", doctor: "Dr. Roberts", test: "Liver Function Test", completionDate: "2025-03-20", result: "Normal" },
    { id: 999, patient: "Olivia Brown", patientId: "P2198", doctor: "Dr. Taylor", test: "HbA1c", completionDate: "2025-03-20", result: "Abnormal" },
    { id: 1000, patient: "William Miller", patientId: "P4567", doctor: "Dr. Jackson", test: "Thyroid Panel", completionDate: "2025-03-19", result: "Normal" }
  ];

  const allTestTypes = [
    { id: 1, name: "Complete Blood Count (CBC)", department: "Hematology", turnaround: "1 day", price: 35.00 },
    { id: 2, name: "Comprehensive Metabolic Panel", department: "Chemistry", turnaround: "1 day", price: 45.00 },
    { id: 3, name: "Lipid Panel", department: "Chemistry", turnaround: "1 day", price: 40.00 },
    { id: 4, name: "Urinalysis", department: "Microbiology", turnaround: "1 day", price: 25.00 },
    { id: 5, name: "COVID-19 PCR Test", department: "Virology", turnaround: "Same day", price: 120.00 },
    { id: 6, name: "Liver Function Test", department: "Chemistry", turnaround: "1 day", price: 42.00 },
    { id: 7, name: "HbA1c", department: "Endocrinology", turnaround: "2 days", price: 55.00 },
    { id: 8, name: "Thyroid Panel", department: "Endocrinology", turnaround: "2 days", price: 85.00 }
  ];

  const filteredTests = allTestTypes.filter(test => 
    test.name.toLowerCase().includes(testSearch.toLowerCase()) || 
    test.department.toLowerCase().includes(testSearch.toLowerCase())
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleProcessTest = (id: number) => {
    toast.success("Test marked as in process", {
      description: `Test #${id} has been moved to processing.`
    });
  };

  const handleCompleteTest = (id: number) => {
    toast.success("Test marked as completed", {
      description: `Test #${id} has been completed and results are ready.`
    });
  };

  const handleViewResults = (id: number) => {
    toast.info("Viewing test results", {
      description: `Opening detailed results for test #${id}.`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laboratory Management</CardTitle>
        <CardDescription>Process and manage laboratory tests</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="pending">Pending Tests</TabsTrigger>
            <TabsTrigger value="completed">Completed Tests</TabsTrigger>
            <TabsTrigger value="catalog">Test Catalog</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="border rounded-md">
              <div className="grid grid-cols-7 font-medium text-sm p-3 border-b bg-muted">
                <div>ID</div>
                <div>Patient</div>
                <div>Test</div>
                <div>Doctor</div>
                <div>Date</div>
                <div>Urgency</div>
                <div>Actions</div>
              </div>
              <div className="divide-y">
                {pendingTests.map((test) => (
                  <div key={test.id} className="grid grid-cols-7 text-sm p-3">
                    <div>#{test.id}</div>
                    <div>
                      <div className="font-medium">{test.patient}</div>
                      <div className="text-xs text-muted-foreground">{test.patientId}</div>
                    </div>
                    <div>{test.test}</div>
                    <div>{test.doctor}</div>
                    <div>{test.requestDate}</div>
                    <div>
                      <Badge 
                        variant={test.urgency === "STAT" ? "destructive" : test.urgency === "Urgent" ? "secondary" : "outline"}
                        className={test.urgency === "Urgent" ? "bg-yellow-100 text-yellow-800" : ""}
                      >
                        {test.urgency}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-2 text-xs"
                        onClick={() => handleProcessTest(test.id)}
                      >
                        <Microscope className="h-3.5 w-3.5 mr-1" />
                        Process
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-2 text-xs"
                        onClick={() => handleCompleteTest(test.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Complete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="border rounded-md">
              <div className="grid grid-cols-6 font-medium text-sm p-3 border-b bg-muted">
                <div>ID</div>
                <div>Patient</div>
                <div>Test</div>
                <div>Date</div>
                <div>Result</div>
                <div>Actions</div>
              </div>
              <div className="divide-y">
                {completedTests.map((test) => (
                  <div key={test.id} className="grid grid-cols-6 text-sm p-3">
                    <div>#{test.id}</div>
                    <div>
                      <div className="font-medium">{test.patient}</div>
                      <div className="text-xs text-muted-foreground">{test.patientId}</div>
                    </div>
                    <div>{test.test}</div>
                    <div>{test.completionDate}</div>
                    <div>
                      <Badge 
                        variant={test.result === "Normal" ? "outline" : "destructive"}
                        className={test.result === "Normal" ? "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800" : ""}
                      >
                        {test.result}
                      </Badge>
                    </div>
                    <div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-2 text-xs"
                        onClick={() => handleViewResults(test.id)}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        View Results
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="catalog">
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tests..."
                  className="pl-8"
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                />
              </div>
              <Button size="sm" className="ml-2">
                <Clock className="h-4 w-4 mr-2" />
                View Queue Stats
              </Button>
            </div>

            <div className="border rounded-md">
              <div className="grid grid-cols-4 font-medium text-sm p-3 border-b bg-muted">
                <div>Test Name</div>
                <div>Department</div>
                <div>Turnaround Time</div>
                <div>Price</div>
              </div>
              <div className="divide-y">
                {filteredTests.map((test) => (
                  <div key={test.id} className="grid grid-cols-4 text-sm p-3">
                    <div className="font-medium">{test.name}</div>
                    <div>{test.department}</div>
                    <div>{test.turnaround}</div>
                    <div>${test.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
