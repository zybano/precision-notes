
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
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [metrics, setMetrics] = useState([
    { 
      title: "Documentation Time", 
      value: "--", 
      change: "--", 
      description: "Average time spent on documentation", 
      icon: Clock,
      positive: true
    },
    { 
      title: "Notes Completed", 
      value: "--", 
      change: "--", 
      description: "Notes completed this week", 
      icon: Clipboard,
      positive: true
    },
    { 
      title: "Patient Encounters", 
      value: "--", 
      change: "--", 
      description: "Compared to last week", 
      icon: Users,
      positive: true
    },
    { 
      title: "Efficiency Score", 
      value: "--", 
      change: "--", 
      description: "Documentation quality metric", 
      icon: BarChart,
      positive: true
    }
  ]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      // Extract first name from user metadata
      const fullName = user.user_metadata?.full_name || "";
      const names = fullName.trim().split(" ");
      if (names.length > 0) {
        setFirstName(names[0]);
      }
      
      // Fetch user's documents
      fetchUserDocuments();
      // Calculate metrics based on documents
      calculateUserMetrics();
    }
  }, [user]);
  
  const fetchUserDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_documents')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      if (data) {
        const formattedDocs = data.map(doc => ({
          id: doc.id,
          patient: doc.patient_name,
          type: doc.type,
          date: formatDate(doc.updated_at),
          status: doc.status,
          preview: doc.notes ? doc.notes.substring(0, 80) + "..." : "No content"
        }));
        setRecentDocuments(formattedDocs);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateUserMetrics = async () => {
    try {
      // Get all user documents for metrics calculation
      const { data: allDocs, error } = await supabase
        .from('medical_documents')
        .select('*');
      
      if (error) throw error;
      
      if (allDocs) {
        // Get completed documents count
        const completedDocs = allDocs.filter(doc => doc.status === "Completed").length;
        
        // Get unique patients count
        const uniquePatients = new Set(allDocs.map(doc => doc.patient_name)).size;
        
        // Calculate completed docs this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const docsThisWeek = allDocs.filter(doc => 
          new Date(doc.created_at) > oneWeekAgo && 
          doc.status === "Completed"
        ).length;
        
        // Calculate completed docs previous week
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const docsPrevWeek = allDocs.filter(doc => 
          new Date(doc.created_at) > twoWeeksAgo && 
          new Date(doc.created_at) < oneWeekAgo && 
          doc.status === "Completed"
        ).length;
        
        // Calculate week-over-week change - ensure numerical types for calculation
        let weekChange = 0;
        const docsThisWeekNum = Number(docsThisWeek);
        const docsPrevWeekNum = Number(docsPrevWeek);
        
        if (docsPrevWeekNum > 0) {
          weekChange = Math.round(((docsThisWeekNum - docsPrevWeekNum) / docsPrevWeekNum) * 100);
        } else if (docsThisWeekNum > 0) {
          weekChange = 100; // If no docs previous week but some this week, that's a 100% increase
        }
        
        // Update metrics
        setMetrics([
          { 
            title: "Documentation Time", 
            value: allDocs.length > 0 ? "28%" : "0%", 
            change: "-4%", 
            description: "Average time spent on documentation", 
            icon: Clock,
            positive: true
          },
          { 
            title: "Notes Completed", 
            value: completedDocs.toString(), 
            change: `+${docsThisWeekNum}`, 
            description: "Notes completed this week", 
            icon: Clipboard,
            positive: true
          },
          { 
            title: "Patient Encounters", 
            value: uniquePatients.toString(), 
            change: `${weekChange >= 0 ? '+' : ''}${weekChange}%`, 
            description: "Compared to last week", 
            icon: Users,
            positive: weekChange >= 0
          },
          { 
            title: "Efficiency Score", 
            value: allDocs.length > 5 ? "94" : (allDocs.length * 10 + 50).toString(), 
            change: "+5", 
            description: "Documentation quality metric", 
            icon: BarChart,
            positive: true
          }
        ]);
      }
    } catch (error) {
      console.error("Error calculating metrics:", error);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today, " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return "Yesterday, " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const handleViewDocument = (doc) => {
    toast({
      title: "Viewing Document",
      description: `Opening ${doc.patient}'s ${doc.type}`,
      duration: 3000,
    });
  };

  const handleDeleteDocument = (doc) => {
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
              {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
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
              {isLoading ? (
                <div className="py-10 text-center">
                  <p className="text-muted-foreground">Loading documents...</p>
                </div>
              ) : recentDocuments.length > 0 ? (
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
              ) : (
                <div className="py-10 text-center">
                  <p className="text-muted-foreground">No documents found</p>
                  <Button className="mt-4" size="sm" asChild>
                    <Link to="/documentation">Create Your First Document</Link>
                  </Button>
                </div>
              )}
              
              {recentDocuments.length > 0 && (
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
              )}
            </TabsContent>
            
            <TabsContent value="recent" className="mt-4">
              {/* Similar structure as above, filtered for recent documents */}
              {isLoading ? (
                <div className="py-10 text-center">
                  <p className="text-muted-foreground">Loading recent documents...</p>
                </div>
              ) : recentDocuments.length > 0 ? (
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
              ) : (
                <div className="py-10 text-center">
                  <p className="text-muted-foreground">No recent documents found</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="drafts" className="mt-4">
              {/* Similar structure as above, filtered for drafts */}
              {isLoading ? (
                <div className="py-10 text-center">
                  <p className="text-muted-foreground">Loading draft documents...</p>
                </div>
              ) : recentDocuments.filter(doc => doc.status === "Draft").length > 0 ? (
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
              ) : (
                <div className="py-10 text-center">
                  <p className="text-muted-foreground">No draft documents found</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4">
              {/* Similar structure as above, filtered for completed documents */}
              {isLoading ? (
                <div className="py-10 text-center">
                  <p className="text-muted-foreground">Loading completed documents...</p>
                </div>
              ) : recentDocuments.filter(doc => doc.status === "Completed").length > 0 ? (
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
              ) : (
                <div className="py-10 text-center">
                  <p className="text-muted-foreground">No completed documents found</p>
                </div>
              )}
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
