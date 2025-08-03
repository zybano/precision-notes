import {Tabs} from "@/components/ui/tabs";
import {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {useAuth} from "@/contexts/AuthContext";
import {toast} from "sonner";

// Components
import {DashboardHeader} from "@/components/hospital/dashboard/DashboardHeader";
import {DashboardCard} from "@/components/hospital/dashboard/DashboardCards";
import {DashboardTab, DashboardTabsList} from "@/components/hospital/dashboard/DashboardTabs";
import {OverviewTab} from "@/components/hospital/dashboard/OverviewTab";
import EnterpriseAccessDialog from "@/components/hospital/EnterpriseAccessDialog";

// Modules
import {DoctorsModule} from "@/components/hospital/DoctorsModule";
import {NursesModule} from "@/components/hospital/NursesModule";
import {PatientsModule} from "@/components/hospital/PatientsModule";
import {InpatientModule} from "@/components/hospital/InpatientModule";
import {PharmacyModule} from "@/components/hospital/PharmacyModule";
import {LaboratoryModule} from "@/components/hospital/LaboratoryModule";
import {InventoryModule} from "@/components/hospital/InventoryModule";
import {BillingModule} from "@/components/hospital/BillingModule";
import {EmergencyModule} from "@/components/hospital/EmergencyModule";

const HospitalDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEnterpriseDialogOpen, setIsEnterpriseDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const userSubscriptionLevel = user?.user_metadata?.subscription_level || 'free';
  const hasEnterpriseAccess = userSubscriptionLevel === 'enterprise';
  
  // Dashboard summary cards data
  const dashboardCards = [
    {
      title: "Total Patients",
      value: "367",
      description: "+4% from last month",
      bgClass: "bg-medical-300/50 dark:bg-medical-700/50",
      borderClass: "border-medical-400"
    },
    {
      title: "Available Beds",
      value: "28",
      description: "75% occupancy rate",
      bgClass: "bg-sunshine-100 dark:bg-sunshine-700/30",
      borderClass: "border-sunshine-400"
    },
    {
      title: "Staff on Duty",
      value: "53",
      description: "15 doctors, 38 nurses",
      bgClass: "bg-medical-300/50 dark:bg-medical-700/50",
      borderClass: "border-medical-400"
    }
  ];

  // Tabs configuration
  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "emergency", label: "Emergency" },
    { value: "doctors", label: "Doctors" },
    { value: "nurses", label: "Nurses" },
    { value: "patients", label: "Patients" },
    { value: "inpatient", label: "Inpatient" },
    { value: "pharmacy", label: "Pharmacy" },
    { value: "laboratory", label: "Laboratory" },
    { value: "inventory", label: "Inventory" }
  ];
  
  useEffect(() => {
    const path = location.pathname;
    if (path === "/hospital") {
      setActiveTab("overview");
    } else if (path.includes("/hospital/")) {
      const tabName = path.split("/hospital/")[1];
      setActiveTab(tabName);
    }
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    if (!hasEnterpriseAccess && value !== "overview") {
      setIsEnterpriseDialogOpen(true);
      return;
    }
    
    setActiveTab(value);
    if (value === "overview") {
      navigate("/hospital");
    } else {
      navigate(`/hospital/${value}`);
    }
  };

  const handleModuleAction = () => {
    if (!hasEnterpriseAccess) {
      setIsEnterpriseDialogOpen(true);
      return;
    }
    
    toast.success("New patient record created");
  };
  
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Hospital Management System"
        description="Manage doctors, nurses, patients, and hospital resources"
        onNewPatient={handleModuleAction}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dashboardCards.map((card, index) => (
          <DashboardCard key={index} {...card} />
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <DashboardTabsList tabs={tabs} />
        
        <DashboardTab value="overview">
          <OverviewTab />
        </DashboardTab>
        
        <DashboardTab value="emergency">
          <EmergencyModule />
        </DashboardTab>
        
        <DashboardTab value="doctors">
          <DoctorsModule />
        </DashboardTab>
        
        <DashboardTab value="nurses">
          <NursesModule />
        </DashboardTab>
        
        <DashboardTab value="patients">
          <PatientsModule />
        </DashboardTab>
        
        <DashboardTab value="inpatient">
          <InpatientModule />
        </DashboardTab>
        
        <DashboardTab value="pharmacy">
          <PharmacyModule />
        </DashboardTab>
        
        <DashboardTab value="laboratory">
          <LaboratoryModule />
        </DashboardTab>
        
        <DashboardTab value="inventory">
          <InventoryModule />
        </DashboardTab>
        
        <DashboardTab value="billing">
          <BillingModule />
        </DashboardTab>
      </Tabs>

      <EnterpriseAccessDialog 
        open={isEnterpriseDialogOpen} 
        onOpenChange={setIsEnterpriseDialogOpen} 
      />
    </div>
  );
};

export default HospitalDashboard;
