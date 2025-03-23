import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoctorsModule } from "@/components/hospital/DoctorsModule";
import { NursesModule } from "@/components/hospital/NursesModule";
import { PatientsModule } from "@/components/hospital/PatientsModule";
import { InpatientModule } from "@/components/hospital/InpatientModule";
import { PharmacyModule } from "@/components/hospital/PharmacyModule";
import { LaboratoryModule } from "@/components/hospital/LaboratoryModule";
import { InventoryModule } from "@/components/hospital/InventoryModule";
import { BillingModule } from "@/components/hospital/BillingModule";
import { EmergencyModule } from "@/components/hospital/EmergencyModule";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const HospitalDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab from location path
  useEffect(() => {
    const path = location.pathname;
    if (path === "/hospital") {
      setActiveTab("overview");
    } else if (path.includes("/hospital/")) {
      const tabName = path.split("/hospital/")[1];
      setActiveTab(tabName);
    }
  }, [location.pathname]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "overview") {
      navigate("/hospital");
    } else {
      navigate(`/hospital/${value}`);
    }
  };
  
  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Hospital Management System</h1>
            <p className="text-muted-foreground mt-1">
              Manage doctors, nurses, patients, and hospital resources
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Button variant="outline" size="sm">Help</Button>
            <Button size="sm">New Patient</Button>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Patients</CardTitle>
            <CardDescription>Current patient count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">367</div>
            <p className="text-sm text-muted-foreground mt-1">+4% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Available Beds</CardTitle>
            <CardDescription>Current bed availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">28</div>
            <p className="text-sm text-muted-foreground mt-1">75% occupancy rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Staff on Duty</CardTitle>
            <CardDescription>Doctors and nurses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">53</div>
            <p className="text-sm text-muted-foreground mt-1">15 doctors, 38 nurses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-3 md:grid-cols-9 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
          <TabsTrigger value="nurses">Nurses</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="inpatient">Inpatient</TabsTrigger>
          <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
          <TabsTrigger value="laboratory">Laboratory</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Admissions</CardTitle>
                <CardDescription>Last 5 patient admissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Sarah Johnson", time: "Today, 10:30 AM", doctor: "Dr. Roberts", reason: "Pneumonia" },
                    { name: "Michael Chen", time: "Today, 8:15 AM", doctor: "Dr. Patel", reason: "Fracture" },
                    { name: "Emily Williams", time: "Yesterday, 3:45 PM", doctor: "Dr. Garcia", reason: "Appendicitis" },
                    { name: "Robert Taylor", time: "Yesterday, 11:20 AM", doctor: "Dr. Wong", reason: "Chest Pain" },
                    { name: "Lisa Brown", time: "2 days ago", doctor: "Dr. Johnson", reason: "Diabetes" }
                  ].map((patient, i) => (
                    <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <div>
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-sm text-muted-foreground">{patient.reason}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{patient.doctor}</div>
                        <div className="text-xs text-muted-foreground">{patient.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Surgeries</CardTitle>
                <CardDescription>Scheduled for the next 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { patient: "John Wilson", time: "Today, 2:00 PM", procedure: "Appendectomy", surgeon: "Dr. Miller" },
                    { patient: "Amanda Lee", time: "Today, 3:30 PM", procedure: "Knee Replacement", surgeon: "Dr. Garcia" },
                    { patient: "David Clark", time: "Tomorrow, 8:00 AM", procedure: "Gallbladder Removal", surgeon: "Dr. Thompson" }
                  ].map((surgery, i) => (
                    <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <div>
                        <div className="font-medium">{surgery.patient}</div>
                        <div className="text-sm text-muted-foreground">{surgery.procedure}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{surgery.surgeon}</div>
                        <div className="text-xs text-muted-foreground">{surgery.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="emergency">
          <EmergencyModule />
        </TabsContent>
        
        <TabsContent value="doctors">
          <DoctorsModule />
        </TabsContent>
        
        <TabsContent value="nurses">
          <NursesModule />
        </TabsContent>
        
        <TabsContent value="patients">
          <PatientsModule />
        </TabsContent>
        
        <TabsContent value="inpatient">
          <InpatientModule />
        </TabsContent>
        
        <TabsContent value="pharmacy">
          <PharmacyModule />
        </TabsContent>
        
        <TabsContent value="laboratory">
          <LaboratoryModule />
        </TabsContent>
        
        <TabsContent value="inventory">
          <InventoryModule />
        </TabsContent>
        
        <TabsContent value="billing">
          <BillingModule />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HospitalDashboard;
