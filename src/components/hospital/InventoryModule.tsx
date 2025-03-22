
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
import { Search, PlusCircle, AlertTriangle, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const InventoryModule = () => {
  const [itemSearch, setItemSearch] = useState("");
  const [activeTab, setActiveTab] = useState("medical");
  
  const medicalSupplies = [
    { id: 1, name: "Surgical Masks", category: "PPE", stock: 850, unit: "pieces", lastOrder: "2025-03-01", reorderLevel: 200 },
    { id: 2, name: "Disposable Gloves", category: "PPE", stock: 1250, unit: "pairs", lastOrder: "2025-03-10", reorderLevel: 300 },
    { id: 3, name: "Syringes (5ml)", category: "Injection", stock: 520, unit: "pieces", lastOrder: "2025-02-28", reorderLevel: 100 },
    { id: 4, name: "IV Catheters", category: "IV Therapy", stock: 95, unit: "pieces", lastOrder: "2025-02-20", reorderLevel: 100 },
    { id: 5, name: "Gauze Pads", category: "Wound Care", stock: 780, unit: "packets", lastOrder: "2025-03-05", reorderLevel: 150 }
  ];

  const equipmentItems = [
    { id: 101, name: "Patient Monitor", category: "Monitoring", quantity: 12, location: "ICU", condition: "Operational", nextService: "2025-06-15" },
    { id: 102, name: "Defibrillator", category: "Emergency", quantity: 8, location: "ER", condition: "Operational", nextService: "2025-07-02" },
    { id: 103, name: "Infusion Pump", category: "IV Therapy", quantity: 25, location: "Various", condition: "Operational", nextService: "2025-05-20" },
    { id: 104, name: "Ventilator", category: "Respiratory", quantity: 6, location: "ICU", condition: "Needs Service", nextService: "2025-04-01" },
    { id: 105, name: "ECG Machine", category: "Cardiology", quantity: 4, location: "Cardiology Dept", condition: "Operational", nextService: "2025-08-10" }
  ];

  const officeSupplies = [
    { id: 201, name: "Printer Paper", category: "Paper", stock: 35, unit: "reams", location: "Central Storage" },
    { id: 202, name: "Pens", category: "Writing", stock: 120, unit: "boxes", location: "Admin Office" },
    { id: 203, name: "Folders", category: "Filing", stock: 85, unit: "boxes", location: "Medical Records" },
    { id: 204, name: "Staples", category: "Office Supplies", stock: 40, unit: "boxes", location: "Admin Office" },
    { id: 205, name: "Notebooks", category: "Writing", stock: 25, unit: "pieces", location: "Nursing Stations" }
  ];

  const recentOrders = [
    { id: 5001, item: "Surgical Masks", quantity: 1000, orderDate: "2025-03-18", expectedDelivery: "2025-03-25", status: "Processing" },
    { id: 5002, item: "Disposable Gloves", quantity: 2000, orderDate: "2025-03-15", expectedDelivery: "2025-03-22", status: "Shipped" },
    { id: 5003, item: "IV Catheters", quantity: 500, orderDate: "2025-03-12", expectedDelivery: "2025-03-19", status: "Delivered" }
  ];

  const filteredMedicalSupplies = medicalSupplies.filter(item => 
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) || 
    item.category.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const filteredEquipment = equipmentItems.filter(item => 
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) || 
    item.category.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const filteredOfficeSupplies = officeSupplies.filter(item => 
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) || 
    item.category.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleReorderItem = (id: number, name: string) => {
    toast.success("Reorder initiated", {
      description: `A reorder request for ${name} has been created.`
    });
  };

  const handleScheduleService = (id: number, name: string) => {
    toast.success("Service scheduled", {
      description: `Maintenance service for ${name} has been scheduled.`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Management</CardTitle>
        <CardDescription>Track and manage hospital supplies and equipment</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="medical" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="medical">Medical Supplies</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="office">Office Supplies</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <div className="flex items-center justify-between mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search inventory..."
                className="pl-8"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
              />
            </div>
            <Button size="sm" className="ml-2">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Item
            </Button>
          </div>

          <TabsContent value="medical">
            <div className="border rounded-md">
              <div className="grid grid-cols-7 font-medium text-sm p-3 border-b bg-muted">
                <div>Name</div>
                <div>Category</div>
                <div>Stock</div>
                <div>Unit</div>
                <div>Last Order</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              <div className="divide-y">
                {filteredMedicalSupplies.map((item) => (
                  <div key={item.id} className="grid grid-cols-7 text-sm p-3">
                    <div className="font-medium">{item.name}</div>
                    <div>{item.category}</div>
                    <div>{item.stock}</div>
                    <div>{item.unit}</div>
                    <div>{item.lastOrder}</div>
                    <div>
                      {item.stock <= item.reorderLevel ? (
                        <Badge variant="destructive" className="flex items-center w-fit">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Reorder
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800 w-fit">
                          Sufficient
                        </Badge>
                      )}
                    </div>
                    <div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-2 text-xs"
                        onClick={() => handleReorderItem(item.id, item.name)}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Reorder
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="equipment">
            <div className="border rounded-md">
              <div className="grid grid-cols-7 font-medium text-sm p-3 border-b bg-muted">
                <div>Name</div>
                <div>Category</div>
                <div>Quantity</div>
                <div>Location</div>
                <div>Condition</div>
                <div>Next Service</div>
                <div>Actions</div>
              </div>
              <div className="divide-y">
                {filteredEquipment.map((item) => (
                  <div key={item.id} className="grid grid-cols-7 text-sm p-3">
                    <div className="font-medium">{item.name}</div>
                    <div>{item.category}</div>
                    <div>{item.quantity}</div>
                    <div>{item.location}</div>
                    <div>
                      <Badge 
                        variant={item.condition === "Operational" ? "outline" : "destructive"}
                        className={item.condition === "Operational" ? "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800" : ""}
                      >
                        {item.condition}
                      </Badge>
                    </div>
                    <div>{item.nextService}</div>
                    <div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 px-2 text-xs"
                        onClick={() => handleScheduleService(item.id, item.name)}
                      >
                        Schedule Service
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="office">
            <div className="border rounded-md">
              <div className="grid grid-cols-5 font-medium text-sm p-3 border-b bg-muted">
                <div>Name</div>
                <div>Category</div>
                <div>Stock</div>
                <div>Unit</div>
                <div>Location</div>
              </div>
              <div className="divide-y">
                {filteredOfficeSupplies.map((item) => (
                  <div key={item.id} className="grid grid-cols-5 text-sm p-3">
                    <div className="font-medium">{item.name}</div>
                    <div>{item.category}</div>
                    <div>{item.stock}</div>
                    <div>{item.unit}</div>
                    <div>{item.location}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="border rounded-md">
              <div className="grid grid-cols-6 font-medium text-sm p-3 border-b bg-muted">
                <div>Order ID</div>
                <div>Item</div>
                <div>Quantity</div>
                <div>Order Date</div>
                <div>Expected Delivery</div>
                <div>Status</div>
              </div>
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <div key={order.id} className="grid grid-cols-6 text-sm p-3">
                    <div>#{order.id}</div>
                    <div className="font-medium">{order.item}</div>
                    <div>{order.quantity}</div>
                    <div>{order.orderDate}</div>
                    <div>{order.expectedDelivery}</div>
                    <div>
                      <Badge 
                        variant={
                          order.status === "Delivered" 
                            ? "outline" 
                            : order.status === "Shipped" 
                              ? "secondary" 
                              : "default"
                        }
                        className={
                          order.status === "Delivered" 
                            ? "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800" 
                            : ""
                        }
                      >
                        {order.status}
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
