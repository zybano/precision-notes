import { useState } from "react";
import { FadeIn } from "@/components/ui/motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, ClipboardList, Search, Copy, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";

const DocumentationPage = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [newDocumentOpen, setNewDocumentOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: {
      type: "SOAP Note",
      patientName: "",
    },
  });

  const handleUseTemplate = (templateTitle: string) => {
    toast({
      title: `Template Selected: ${templateTitle}`,
      description: "Your new document has been created from this template.",
      duration: 3000,
    });
    // In a real app, this would create a new document from the template
  };

  const handleCreateNewDocument = (data: any) => {
    toast({
      title: "Document Created",
      description: `Your new ${data.type} for ${data.patientName} has been created.`,
      duration: 3000,
    });
    setNewDocumentOpen(false);
    form.reset();
    // In a real app, this would create a new document with the provided details
  };
  
  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Documentation</h1>
            <p className="text-muted-foreground mt-1">
              Create, edit and manage your medical documents
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Button 
              size="sm" 
              className="shadow-sm hover:shadow-md transition-all btn-premium"
              onClick={() => setNewDocumentOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Document
            </Button>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="relative">
          <div className="flex items-center border border-input rounded-lg px-3 mb-6 w-full max-w-md focus-within:ring-1 focus-within:ring-ring">
            <Search className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
            <Input 
              type="text" 
              placeholder="Search documents..." 
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-10"
            />
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "SOAP Note", description: "Subjective, Objective, Assessment, Plan", icon: FileText },
                { title: "Progress Note", description: "Follow-up documentation", icon: ClipboardList },
                { title: "Consultation Note", description: "For specialist referrals", icon: Calendar },
                { title: "Discharge Summary", description: "Post-discharge documentation", icon: FileText },
                { title: "Procedure Note", description: "Documenting medical procedures", icon: ClipboardList },
                { title: "History & Physical", description: "Comprehensive patient assessment", icon: Calendar },
              ].map((template, index) => (
                <Card key={index} className="hover:shadow-md transition-all cursor-pointer border border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mr-4">
                          <template.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{template.title}</h3>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="p-4 flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleUseTemplate(template.title)}
                        className="gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="recent" className="space-y-6">
            <div className="space-y-4">
              {[
                { title: "Sarah Johnson - Progress Note", date: "Edited 2 hours ago", type: "Progress Note" },
                { title: "Michael Chen - Assessment", date: "Edited yesterday", type: "Assessment" },
                { title: "Emily Rodriguez - Consultation", date: "Edited Aug 24, 2023", type: "Consultation" },
                { title: "Robert Williams - Discharge Summary", date: "Edited Aug 22, 2023", type: "Discharge Summary" },
              ].map((doc, index) => (
                <Card key={index} className="hover:shadow-md transition-all cursor-pointer border border-border">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <FileText className="h-3 w-3 mr-1" />
                          <span>{doc.type} • {doc.date}</span>
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => toast({
                        title: "Continuing Document",
                        description: `Opening ${doc.title} for editing`,
                        duration: 3000,
                      })}>Continue</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => toast({
                title: "Loading More Documents",
                description: "Retrieving your additional documents",
                duration: 3000,
              })}>Load More</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="shared" className="space-y-6">
            <div className="space-y-4">
              {[
                { title: "Team Meeting Notes", author: "Dr. Jessica Kim", date: "Shared with you on Aug 26, 2023" },
                { title: "Clinical Guidelines 2023", author: "Dr. Andrew Martinez", date: "Shared with you on Aug 20, 2023" },
              ].map((doc, index) => (
                <Card key={index} className="hover:shadow-md transition-all cursor-pointer border border-border">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <span>{doc.author} • {doc.date}</span>
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toast({
                          title: "Viewing Shared Document",
                          description: `Opening ${doc.title}`,
                          duration: 3000,
                        })}
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </FadeIn>

      <Dialog open={newDocumentOpen} onOpenChange={setNewDocumentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new medical document
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateNewDocument)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                      >
                        <option value="SOAP Note">SOAP Note</option>
                        <option value="Progress Note">Progress Note</option>
                        <option value="Consultation Note">Consultation Note</option>
                        <option value="Discharge Summary">Discharge Summary</option>
                        <option value="Procedure Note">Procedure Note</option>
                        <option value="History & Physical">History & Physical</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter patient name" {...field} required />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setNewDocumentOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Document</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentationPage;
