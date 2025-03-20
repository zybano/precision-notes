
import { FadeIn } from "@/components/ui/motion";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Trash } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

type DocumentProps = {
  id: string;
  patient: string;
  type: string;
  date: string;
  status: string;
  preview: string;
};

type DocumentTablesProps = {
  recentDocuments: DocumentProps[];
  isLoading: boolean;
  onViewDocument: (doc: DocumentProps) => void;
  onDeleteDocument: (doc: DocumentProps) => void;
};

export const DocumentTables = ({ 
  recentDocuments, 
  isLoading,
  onViewDocument,
  onDeleteDocument 
}: DocumentTablesProps) => {
  return (
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
                              onClick={() => onViewDocument(doc)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onDeleteDocument(doc)}
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
                              onClick={() => onViewDocument(doc)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onDeleteDocument(doc)}
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
                              onClick={() => onViewDocument(doc)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onDeleteDocument(doc)}
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
                              onClick={() => onViewDocument(doc)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onDeleteDocument(doc)}
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
  );
};
