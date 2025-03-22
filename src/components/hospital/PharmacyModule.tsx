
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Check, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const PharmacyModule = () => {
  const [medicationSearch, setMedicationSearch] = useState("");
  const [activeTab, setActiveTab] = useState("inventory");
  
  const medications = [
    { id: 1, name: "Amoxicillin", category: "Antibiotic", stock: 235, unit: "tablets", price: 12.99, supplier: "MedPharm Inc." },
    { id: 2, name: "Lisinopril", category: "Antihypertensive", stock: 189, unit: "tablets", price: 15.50, supplier: "HealthDrugs" },
    { id: 3, name: "Atorvastatin", category: "Statin", stock: 144, unit: "tablets", price: 22.75, supplier: "MedPharm Inc." },
    { id: 4, name: "Albuterol", category: "Bronchodilator", stock: 57, unit: "inhalers", price: 45.00, supplier: "RespiCare" },
    { id: 5, name: "Insulin Glargine", category: "Hormone", stock: 42, unit: "vials", price: 125.50, supplier: "DiabetCare" }
  ];

  const pendingPrescriptions = [
    { id: 101, patient: "Maria Garcia", doctor: "Dr. Chen", medications: ["Lisinopril 10mg", "Atorvastatin 20mg"], date: "2025-03-21", status: "pending" },
    { id: 102, patient: "James Wilson", doctor: "Dr. Patel", medications: ["Amoxicillin 500mg"], date: "2025-03-21", status: "pending" },
    { id: 103, patient: "Robert Chen", doctor: "Dr. Johnson", medications: ["Insulin Glargine"], date: "2025-03-22", status: "pending" }
  ];

  const dispensedPrescriptions = [
    { id: 98, patient: "Sarah Miller", doctor: "Dr. Williams", medications: ["Albuterol inhaler"], date: "2025-03-20", status: "completed" },
    { id: 99, patient: "David Brown", doctor: "Dr. Garcia", medications: ["Amoxicillin 500mg", "Acetaminophen 500mg"], date: "2025-03-20", status: "completed" },
    { id: 100, patient: "Elizabeth Taylor", doctor: "Dr. Martinez", medications: ["Lisinopril 20mg"], date: "2025-03-19", status: "completed" }
  ];

  const filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(medicationSearch.toLowerCase()) || 
    med.category.toLowerCase().includes(medicationSearch.toLowerCase())
  );

  const handleDispensePrescription = (id: number) => {
    toast.success("Prescription dispensed successfully", {
      description: `Prescription #${id} has been marked as dispensed.`
    });
  };

  const handleCancelPrescription = (id: number) => {
    toast.error("Prescription canceled", {
      description: `Prescription #${id} has been canceled.`
    });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pharmacy Management</CardTitle>
        <CardDescription>Manage medications and prescriptions</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="inventory" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="inventory">Medication Inventory</TabsTrigger>
            <TabsTrigger value="pending">Pending Prescriptions</TabsTrigger>
            <TabsTrigger value="dispensed">Dispensed Medications</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search medications..."
                  className="pl-8"
                  value={medicationSearch}
                  onChange={(e) => setMedicationSearch(e.target.value)}
                />
              </div>
              <Button size="sm" className="ml-2">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Medication
              </Button>
            </div>

            <div className="border rounded-md">
              <div className="grid grid-cols-6 font-medium text-sm p-3 border-b bg-muted">
                <div>Name</div>
                <div>Category</div>
                <div>Stock</div>
                <div>Unit</div>
                <div>Price</div>
                <div>Supplier</div>
              </div>
              <div className="divide-y">
                {filteredMedications.length > 0 ? (
                  filteredMedications.map((med) => (
                    <div key={med.id} className="grid grid-cols-6 text-sm p-3">
                      <div className="font-medium">{med.name}</div>
                      <div>{med.category}</div>
                      <div className="flex items-center">
                        {med.stock}
                        {med.stock < 50 && 
                          <Badge variant="destructive" className="ml-2 text-xs">Low</Badge>
                        }
                      </div>
                      <div>{med.unit}</div>
                      <div>${med.price.toFixed(2)}</div>
                      <div>{med.supplier}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No medications found matching your search.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="border rounded-md">
              <div className="grid grid-cols-5 font-medium text-sm p-3 border-b bg-muted">
                <div>ID</div>
                <div>Patient</div>
                <div>Medications</div>
                <div>Date</div>
                <div>Actions</div>
              </div>
              <div className="divide-y">
                {pendingPrescriptions.map((prescription) => (
                  <div key={prescription.id} className="grid grid-cols-5 text-sm p-3">
                    <div>#{prescription.id}</div>
                    <div>
                      <div className="font-medium">{prescription.patient}</div>
                      <div className="text-xs text-muted-foreground">{prescription.doctor}</div>
                    </div>
                    <div>
                      <ul className="list-disc list-inside">
                        {prescription.medications.map((med, i) => (
                          <li key={i} className="text-xs">{med}</li>
                        ))}
                      </ul>
                    </div>
                    <div>{prescription.date}</div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-2 text-xs"
                        onClick={() => handleDispensePrescription(prescription.id)}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Dispense
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-2 text-xs"
                        onClick={() => handleCancelPrescription(prescription.id)}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dispensed">
            <div className="border rounded-md">
              <div className="grid grid-cols-5 font-medium text-sm p-3 border-b bg-muted">
                <div>ID</div>
                <div>Patient</div>
                <div>Medications</div>
                <div>Date</div>
                <div>Status</div>
              </div>
              <div className="divide-y">
                {dispensedPrescriptions.map((prescription) => (
                  <div key={prescription.id} className="grid grid-cols-5 text-sm p-3">
                    <div>#{prescription.id}</div>
                    <div>
                      <div className="font-medium">{prescription.patient}</div>
                      <div className="text-xs text-muted-foreground">{prescription.doctor}</div>
                    </div>
                    <div>
                      <ul className="list-disc list-inside">
                        {prescription.medications.map((med, i) => (
                          <li key={i} className="text-xs">{med}</li>
                        ))}
                      </ul>
                    </div>
                    <div>{prescription.date}</div>
                    <div>
                      <Badge 
                        variant="outline" 
                        className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800"
                      >
                        Dispensed
                      </Badge>
                    </div>
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
