import {useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {CreditCard, DollarSign, Download, FileText, PieChart, Search} from "lucide-react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {toast} from "sonner";

// Import chart components
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart as RePieChart,
    ResponsiveContainer,
    Tooltip as ReTooltip,
    XAxis,
    YAxis
} from "recharts";

export const BillingModule = () => {
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  
  const pendingInvoices = [
    { id: 10001, patient: "John Smith", patientId: "P5421", amount: 1250.75, date: "2025-03-18", dueDate: "2025-04-18", items: 5, insurance: "BlueCross", status: "Pending" },
    { id: 10002, patient: "Emma Johnson", patientId: "P3654", amount: 785.50, date: "2025-03-19", dueDate: "2025-04-19", items: 3, insurance: "Aetna", status: "Insurance Submitted" },
    { id: 10003, patient: "Michael Davis", patientId: "P9087", amount: 2340.25, date: "2025-03-20", dueDate: "2025-04-20", items: 7, insurance: "Medicare", status: "Pending" },
    { id: 10004, patient: "Sophia Martinez", patientId: "P1243", amount: 550.00, date: "2025-03-21", dueDate: "2025-04-21", items: 2, insurance: "Self-Pay", status: "Pending" }
  ];

  const paidInvoices = [
    { id: 9998, patient: "Daniel Wilson", patientId: "P7632", amount: 875.25, date: "2025-03-01", paidDate: "2025-03-15", paymentMethod: "Credit Card", status: "Paid" },
    { id: 9999, patient: "Olivia Brown", patientId: "P2198", amount: 1450.75, date: "2025-03-02", paidDate: "2025-03-10", paymentMethod: "Insurance", status: "Paid" },
    { id: 10000, patient: "William Miller", patientId: "P4567", amount: 325.50, date: "2025-03-05", paidDate: "2025-03-18", paymentMethod: "Bank Transfer", status: "Paid" }
  ];

  // Data for the revenue source pie chart
  const revenueSources = [
    { name: "Insurance", value: 68 },
    { name: "Out-of-pocket", value: 22 },
    { name: "Medicare/Medicaid", value: 10 }
  ];

  // Data for the revenue by department bar chart
  const departmentRevenue = [
    { name: "Emergency", revenue: 125000 },
    { name: "Surgery", revenue: 215000 },
    { name: "Cardiology", revenue: 180000 },
    { name: "Radiology", revenue: 95000 },
    { name: "Outpatient", revenue: 145000 }
  ];

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  const filteredPendingInvoices = pendingInvoices.filter(invoice => 
    invoice.patient.toLowerCase().includes(invoiceSearch.toLowerCase()) || 
    invoice.patientId.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  const filteredPaidInvoices = paidInvoices.filter(invoice => 
    invoice.patient.toLowerCase().includes(invoiceSearch.toLowerCase()) || 
    invoice.patientId.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleViewInvoice = (id: number) => {
    toast.info("Viewing invoice details", {
      description: `Opening invoice #${id} for detailed view.`
    });
  };

  const handleProcessPayment = (id: number) => {
    toast.success("Payment processed", {
      description: `Payment for invoice #${id} has been processed successfully.`
    });
  };

  const handleDownloadInvoice = (id: number) => {
    toast.success("Invoice downloaded", {
      description: `Invoice #${id} has been downloaded as PDF.`
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Accounts</CardTitle>
        <CardDescription>Manage patient invoices and financial records</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="pending">Pending Invoices</TabsTrigger>
            <TabsTrigger value="paid">Paid Invoices</TabsTrigger>
            <TabsTrigger value="reports">Financial Reports</TabsTrigger>
          </TabsList>

          <div className="flex items-center justify-between mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by patient name or ID..."
                className="pl-8"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
              />
            </div>
            <Button size="sm" className="ml-2">
              <FileText className="h-4 w-4 mr-2" />
              Generate New Invoice
            </Button>
          </div>

          <TabsContent value="pending">
            <div className="border rounded-md">
              <div className="grid grid-cols-8 font-medium text-sm p-3 border-b bg-muted">
                <div>Invoice #</div>
                <div>Patient</div>
                <div>Amount</div>
                <div>Date</div>
                <div>Due Date</div>
                <div>Insurance</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              <div className="divide-y">
                {filteredPendingInvoices.map((invoice) => (
                  <div key={invoice.id} className="grid grid-cols-8 text-sm p-3">
                    <div>#{invoice.id}</div>
                    <div>
                      <div className="font-medium">{invoice.patient}</div>
                      <div className="text-xs text-muted-foreground">{invoice.patientId}</div>
                    </div>
                    <div className="font-medium">{formatCurrency(invoice.amount)}</div>
                    <div>{invoice.date}</div>
                    <div>{invoice.dueDate}</div>
                    <div>{invoice.insurance}</div>
                    <div>
                      <Badge 
                        variant={invoice.status === "Insurance Submitted" ? "secondary" : "default"}
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleViewInvoice(invoice.id)}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleProcessPayment(invoice.id)}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span className="sr-only">Process Payment</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="sr-only">Download</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="paid">
            <div className="border rounded-md">
              <div className="grid grid-cols-7 font-medium text-sm p-3 border-b bg-muted">
                <div>Invoice #</div>
                <div>Patient</div>
                <div>Amount</div>
                <div>Invoice Date</div>
                <div>Paid Date</div>
                <div>Payment Method</div>
                <div>Actions</div>
              </div>
              <div className="divide-y">
                {filteredPaidInvoices.map((invoice) => (
                  <div key={invoice.id} className="grid grid-cols-7 text-sm p-3">
                    <div>#{invoice.id}</div>
                    <div>
                      <div className="font-medium">{invoice.patient}</div>
                      <div className="text-xs text-muted-foreground">{invoice.patientId}</div>
                    </div>
                    <div className="font-medium">{formatCurrency(invoice.amount)}</div>
                    <div>{invoice.date}</div>
                    <div>{invoice.paidDate}</div>
                    <div>{invoice.paymentMethod}</div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleViewInvoice(invoice.id)}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="sr-only">Download</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Revenue Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={revenueSources}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {revenueSources.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Revenue by Department
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={departmentRevenue}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                        <ReTooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Financial Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-muted-foreground text-sm">Total Revenue (MTD)</div>
                      <div className="text-2xl font-bold mt-1">{formatCurrency(760500)}</div>
                      <div className="text-xs text-green-600 mt-1">+12.5% from last month</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-muted-foreground text-sm">Outstanding Balance</div>
                      <div className="text-2xl font-bold mt-1">{formatCurrency(125750)}</div>
                      <div className="text-xs text-red-600 mt-1">+3.2% from last month</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="text-muted-foreground text-sm">Insurance Claims</div>
                      <div className="text-2xl font-bold mt-1">86% approved</div>
                      <div className="text-xs text-green-600 mt-1">+2.1% from last month</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
