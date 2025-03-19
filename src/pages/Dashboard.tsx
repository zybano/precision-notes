
import { FadeIn } from "@/components/ui/motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Clipboard, Clock, FileText, Users, Eye, Trash } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const Dashboard = () => {
  const { toast } = useToast();
  
  const metrics = [
    { 
      title: "Documentation Time", 
      value: "32%", 
      change: "-12%", 
      description: "Average time spent on documentation", 
      icon: Clock,
      positive: true
    },
    { 
      title: "Consultation Notes", 
      value: "128", 
      change: "+24", 
      description: "Notes completed this week", 
      icon: Clipboard,
      positive: true
    },
    { 
      title: "Patient Encounters", 
      value: "85", 
      change: "+12%", 
      description: "Compared to last week", 
      icon: Users,
      positive: true
    },
    { 
      title: "Efficiency Score", 
      value: "94", 
      change: "+5", 
      description: "Documentation quality metric", 
      icon: BarChart,
      positive: true
    }
  ];

  const recentDocuments = [
    { 
      id: "doc-1", 
      patient: "Sarah Johnson", 
      type: "Progress Note", 
      date: "Today, 9:32 AM", 
      status: "Completed",
      preview: "Patient reports improvement in symptoms following medication adjustment..."
    },
    { 
      id: "doc-2", 
      patient: "Michael Chen", 
      type: "Assessment", 
      date: "Yesterday, 3:15 PM", 
      status: "Draft",
      preview: "Initial assessment indicates potential anxiety disorder with comorbid insomnia..."
    },
    { 
      id: "doc-3", 
      patient: "Emily Rodriguez", 
      type: "Consultation", 
      date: "Aug 24, 2023", 
      status: "Signed",
      preview: "Consultation for chronic lower back pain. Patient reports pain level of 7/10..."
    },
    { 
      id: "doc-4", 
      patient: "Robert Williams", 
      type: "Discharge Summary", 
      date: "Aug 22, 2023", 
      status: "Reviewed",
      preview: "Patient is being discharged following successful treatment of pneumonia..."
    },
    { 
      id: "doc-5", 
      patient: "Jennifer Martinez", 
      type: "Progress Note", 
      date: "Aug 20, 2023", 
      status: "Completed",
      preview: "Follow-up visit shows significant improvement in mobility following physical therapy..."
    },
  ];

  const handleViewDocument = (doc: typeof recentDocuments[0]) => {
    toast({
      title: "Viewing Document",
      description: `Opening ${doc.patient}'s ${doc.type}`,
      duration: 3000,
    });
  };

  const handleDeleteDocument = (doc: typeof recentDocuments[0]) => {
    toast({
      title: "Document Deleted",
      description: `${doc.patient}'s ${doc.type} has been deleted`,
      duration: 3000,
    });
  };

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, Dr. Smith
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Button variant="outline" size="sm">Export Data</Button>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, i) => (
            <Card key={i} className="overflow-hidden border border-border hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className="p-1.5 bg-accent rounded-lg">
                    <metric.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold mb-1">{metric.value}</div>
                <div className="flex items-center">
                  <span className={`text-xs font-medium ${metric.positive ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.change}
                  </span>
                  <CardDescription className="text-xs ml-2">
                    {metric.description}
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <FadeIn delay={0.2} className="lg:col-span-1">
          <Card className="border border-border h-full overflow-hidden">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your documentation activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <div className="rounded-md bg-accent/50 text-muted-foreground p-12 text-center">
                  Activity chart will appear here
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.4}>
        <Card className="border border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Documents</CardTitle>
                <CardDescription>Your recently created documentation</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/documentation">View All</Link>
              </Button>
            </div>
          </CardHeader>
          
          <Tabs defaultValue="all" className="px-6">
            <TabsList>
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDocuments.map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{doc.patient}</TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell className="text-muted-foreground">{doc.date}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            doc.status === "Completed" ? "bg-green-100 text-green-800" :
                            doc.status === "Draft" ? "bg-yellow-100 text-yellow-800" :
                            doc.status === "Signed" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {doc.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewDocument(doc)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteDocument(doc)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">3</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </TabsContent>
            
            <TabsContent value="recent" className="mt-4">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDocuments.slice(0, 3).map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{doc.patient}</TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell className="text-muted-foreground">{doc.date}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            doc.status === "Completed" ? "bg-green-100 text-green-800" :
                            doc.status === "Draft" ? "bg-yellow-100 text-yellow-800" :
                            doc.status === "Signed" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {doc.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewDocument(doc)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteDocument(doc)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="drafts" className="mt-4">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDocuments.filter(doc => doc.status === "Draft").map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{doc.patient}</TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell className="text-muted-foreground">{doc.date}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                            {doc.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewDocument(doc)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteDocument(doc)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDocuments.filter(doc => doc.status === "Completed").map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{doc.patient}</TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell className="text-muted-foreground">{doc.date}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                            {doc.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewDocument(doc)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteDocument(doc)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
          
          <CardFooter className="flex justify-between pt-0">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/documentation">View More Documents</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/documentation?new=true">Create New</Link>
            </Button>
          </CardFooter>
        </Card>
      </FadeIn>
    </div>
  );
};

export default Dashboard;
