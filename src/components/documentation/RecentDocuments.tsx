import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, FileText, Share2, Trash2, User, Calendar, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Document } from "./DocumentTypes";
import { SimplifiedTranscriptDisplay } from "./SimplifiedTranscriptDisplay";
import { EnhancedTranscriptDisplay } from "./EnhancedTranscriptDisplay";
import { TranscriptionResult } from "@/services/transcription";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchUserDocuments,
  fetchSharedDocuments,
  saveDocument
} from "@/services/supabaseSetup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateMockTranscriptionResult } from "@/data/mockTranscript";

interface RecentDocumentsProps {
  setNewDocumentOpen: (open: boolean) => void;
  form: any;
  refreshRef: React.MutableRefObject<{
    refreshSavedDocuments: () => void;
    refreshSharedDocuments: () => void;
  }>;
}

const RecentDocuments: React.FC<RecentDocumentsProps> = ({
  setNewDocumentOpen,
  form,
  refreshRef
}) => {
  const { toast } = useToast();
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [documentToShare, setDocumentToShare] = useState<Document | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharedEmail, setSharedEmail] = useState("");
  const [documentToView, setDocumentToView] = useState<Document | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isSimplifiedView, setIsSimplifiedView] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [documents, setDocuments] = useState<Document[]>([]);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const PAGE_SIZE = 5;

  // Mock transcription result for testing
  const mockResult = generateMockTranscriptionResult();

  // Define a schema for document sharing form
  const shareFormSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
  });

  // Initialize the form for sharing documents
  const shareForm = useForm<z.infer<typeof shareFormSchema>>({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      email: "",
    },
  });

  // Function to handle document sharing
  const handleShareDocument = async (document: Document) => {
    setDocumentToShare(document);
    setShareDialogOpen(true);
  };

  // Function to execute the sharing action
  const executeShareDocument = async (values: z.infer<typeof shareFormSchema>) => {
    shareForm.reset();
    setShareDialogOpen(false);

    if (!documentToShare) {
      toast({
        title: "Error",
        description: "No document selected to share.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if the user exists in Supabase
      const { data: existingUser, error: userError } = await queryClient.fetchQuery({
        queryKey: ['checkUser', values.email],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('email', values.email)
            .single();

          if (error) {
            console.error("Error checking user:", error);
            throw new Error("Failed to check user existence.");
          }

          return data;
        }
      });

      if (!existingUser) {
        toast({
          title: "User Not Found",
          description: "The specified user does not exist.",
          variant: "destructive",
        });
        return;
      }

      // Create a share record in the database
      const { data, error } = await queryClient.fetchQuery({
        queryKey: ['shareDocument', documentToShare.id, existingUser.id],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('shared_documents')
            .insert([
              {
                document_id: documentToShare.id,
                shared_with: existingUser.id,
                shared_by: user?.id,
              },
            ])
            .select();

          if (error) {
            console.error("Error sharing document:", error);
            throw new Error("Failed to share document.");
          }

          return data;
        }
      });

      toast({
        title: "Document Shared",
        description: `Document has been successfully shared with ${values.email}.`,
      });
    } catch (error) {
      toast({
        title: "Sharing Failed",
        description: "There was an error sharing the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDocumentToShare(null);
    }
  };

  // Function to handle document deletion
  const handleDeleteDocument = (document: Document) => {
    setDocumentToDelete(document);
  };

  // Function to execute the deletion action
  const executeDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      // Delete the document from the database
      const { data, error } = await queryClient.fetchQuery({
        queryKey: ['deleteDocument', documentToDelete.id],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('medical_documents')
            .delete()
            .eq('id', documentToDelete.id);

          if (error) {
            console.error("Error deleting document:", error);
            throw new Error("Failed to delete document.");
          }

          return data;
        }
      });

      // Update the local state to remove the deleted document
      setDocuments((prevDocuments) =>
        prevDocuments.filter((doc) => doc.id !== documentToDelete.id)
      );

      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "There was an error deleting the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDocumentToDelete(null);
    }
  };

  // Function to handle viewing a document
  const handleViewDocument = (document: Document) => {
    setDocumentToView(document);
    setViewDialogOpen(true);

    // Load transcript data into the form
    if (document.transcript_data) {
      try {
        const transcriptResult = JSON.parse(document.transcript_data);

        // Check if patientInfo exists, if not, create it
        let extractedInfo = transcriptResult.patientInfo;
        if (!extractedInfo) {
          extractedInfo = { name: "Unknown" };
        }

        // Set the transcript result and patient info in the form
        form.setValue("transcriptResult", transcriptResult);

        // Also set the mock result for testing purposes
        setTranscriptResult({
          ...mockResult,
          patientInfo: extractedInfo // Use a type assertion if needed
        } as TranscriptionResult);
      } catch (error) {
        console.error("Error parsing transcript data:", error);
        toast({
          title: "Error",
          description: "Failed to load transcript data.",
          variant: "destructive",
        });
      }
    } else {
      // Reset transcript result if no data
      form.setValue("transcriptResult", null);
    }

    // Load notes into the form
    form.setValue("notes", document.notes || "");

    // Load document format into the form
    form.setValue("documentFormat", document.document_format || "");
  };

  const [transcriptResult, setTranscriptResult] = useState<TranscriptionResult | null>(null);

  // Function to handle closing the view dialog
  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setIsEditingTitle(false);
  };

  // Function to handle title editing
  const handleTitleEdit = (document: Document) => {
    setIsEditingTitle(true);
    setEditedTitle(document.title);
  };

  // Function to handle title saving
  const handleTitleSave = async (document: Document) => {
    if (!editedTitle.trim()) {
      toast({
        title: "Error",
        description: "Title cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update the document title in the database
      const { data, error } = await saveDocument({
        ...document,
        title: editedTitle,
        creator_id: user?.id,
        notes: document.notes || null,
        transcript_data: document.transcript_data || null,
        summary: document.summary || null,
        recording_duration: document.recording_duration || null,
        document_format: document.document_format || null,
        generated_title: document.generated_title || null,
        id: document.id
      });

      if (error) {
        console.error("Error updating document title:", error);
        throw new Error("Failed to update document title.");
      }

      // Update the local state to reflect the title change
      setDocuments((prevDocuments) =>
        prevDocuments.map((doc) =>
          doc.id === document.id ? { ...doc, title: editedTitle } : doc
        )
      );

      toast({
        title: "Title Updated",
        description: "The document title has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "There was an error updating the title. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditingTitle(false);
    }
  };

  // Function to handle loading more documents
  const onLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      const { data, error } = await queryClient.fetchQuery({
        queryKey: ['documents', page + 1],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('medical_documents')
            .select('*')
            .eq('creator_id', user?.id)
            .order('created_at', { ascending: false })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

          if (error) {
            console.error("Error fetching documents:", error);
            throw new Error("Failed to fetch documents.");
          }

          return data;
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load more documents.",
          variant: "destructive",
        });
        return;
      }

      if (!data || data.length === 0) {
        setHasMore(false);
      } else {
        setDocuments((prevDocuments) => [...prevDocuments, ...data]);
        setPage((prevPage) => prevPage + 1);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load more documents.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, user, toast, queryClient]);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { data, error } = await queryClient.fetchQuery({
          queryKey: ['documents', 0],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('medical_documents')
              .select('*')
              .eq('creator_id', user?.id)
              .order('created_at', { ascending: false })
              .range(0, PAGE_SIZE - 1);

            if (error) {
              console.error("Error fetching documents:", error);
              throw new Error("Failed to fetch documents.");
            }

            return data;
          }
        });

        if (error) {
          toast({
            title: "Error",
            description: "Failed to load documents.",
            variant: "destructive",
          });
          return;
        }

        if (!data || data.length === 0) {
          setHasMore(false);
        } else {
          setDocuments(data);
          setPage(1);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load documents.",
          variant: "destructive",
        });
      }
    };

    if (user) {
      loadInitialData();
    }
  }, [user, toast, queryClient]);

  // Refresh function for saved documents
  const refreshSavedDocuments = useCallback(() => {
    setDocuments([]);
    setPage(0);
    setHasMore(true);
    setIsLoadingMore(false);

    const loadInitialData = async () => {
      try {
        const { data, error } = await queryClient.fetchQuery({
          queryKey: ['documents', 0],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('medical_documents')
              .select('*')
              .eq('creator_id', user?.id)
              .order('created_at', { ascending: false })
              .range(0, PAGE_SIZE - 1);

            if (error) {
              console.error("Error fetching documents:", error);
              throw new Error("Failed to fetch documents.");
            }

            return data;
          }
        });

        if (error) {
          toast({
            title: "Error",
            description: "Failed to load documents.",
            variant: "destructive",
          });
          return;
        }

        if (!data || data.length === 0) {
          setHasMore(false);
        } else {
          setDocuments(data);
          setPage(1);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load documents.",
          variant: "destructive",
        });
      }
    };

    if (user) {
      loadInitialData();
    }
  }, [user, toast, queryClient]);

  // Provide the refresh function to the parent component
  useEffect(() => {
    refreshRef.current = { refreshSavedDocuments, refreshSharedDocuments: () => {} };
  }, [refreshSavedDocuments]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>
            Your recently created and edited documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Title</TableHead>
                  <TableHead className="w-[20%]">Type</TableHead>
                  <TableHead className="w-[20%]">Last Modified</TableHead>
                  <TableHead className="w-[15%]">Created By</TableHead>
                  <TableHead className="text-right w-[15%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">
                      {isEditingTitle && documentToView?.id === document.id ? (
                        <Input
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          onBlur={() => handleTitleSave(document)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleTitleSave(document);
                            }
                          }}
                        />
                      ) : (
                        document.title
                      )}
                    </TableCell>
                    <TableCell>{document.type}</TableCell>
                    <TableCell>{formatDate(document.updated_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        {user?.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewDocument(document)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            View & Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleTitleEdit(document)}
                            disabled={isEditingTitle}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleShareDocument(document)}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteDocument(document)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No documents found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      {/* Share Document Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>
              Enter the email address of the user you want to share this document
              with.
            </DialogDescription>
          </DialogHeader>
          <Form {...shareForm}>
            <form
              onSubmit={shareForm.handleSubmit(executeShareDocument)}
              className="space-y-4"
            >
              <FormField
                control={shareForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit">Share Document</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Document Alert Dialog */}
      <AlertDialog open={documentToDelete !== null} onOpenChange={setDocumentToDelete ? (open) => !open ? setDocumentToDelete(null) : null : undefined}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              document from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteDocument}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={handleViewDialogClose}>
        <DialogContent className="max-w-[90vw] h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {isEditingTitle && documentToView ? (
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={() => handleTitleSave(documentToView)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleTitleSave(documentToView);
                    }
                  }}
                />
              ) : (
                documentToView?.title
              )}
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{documentToView?.type}</span>
                <Clock className="h-4 w-4" />
                <span>{formatDate(documentToView?.updated_at)}</span>
              </div>
            </DialogDescription>
          </DialogHeader>

          {documentToView && (
            <EnhancedTranscriptDisplay
              transcriptResult={transcriptResult}
              transcript={documentToView?.notes || ""}
              transcriptSummary={documentToView?.summary || ""}
              showSummary={form.watch("showSummary")}
              setShowSummary={(show: boolean) => form.setValue("showSummary", show)}
              form={form}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );

  function refreshSharedDocuments() {
    throw new Error("Function not implemented.");
  }
};

export default RecentDocuments;
