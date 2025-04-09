import { useState, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/ui/use-toast"
import {useNavigate} from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from "@tanstack/react-query";
import React from "react";

type DocumentType = {
    id: string;
    created_at: string;
    title: string;
    content: string;
    user_id: string;
    file_path: string | null;
    metadata: any;
};

const useDocumentOperations = () => {
    const [isLoading, setIsLoading] = useState(false);
    const supabaseClient = useSupabaseClient();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const uploadFile = async (file: File): Promise<string | null> => {
        setIsLoading(true);
        const fileExt = file.name.split('.').pop();
        const filePath = `documents/${uuidv4()}.${fileExt}`;

        try {
            const { error: uploadError } = await supabaseClient.storage
                .from('document-files')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error("File upload error:", uploadError);
                toast({
                    title: "Upload failed",
                    description: "There was an error uploading your file.",
                    variant: "destructive",
                });
                return null;
            }

            return filePath;
        } catch (error) {
            console.error("Unexpected error during file upload:", error);
            toast({
                title: "Unexpected error",
                description: "An unexpected error occurred during file upload.",
                variant: "destructive",
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const createDocument = async (title: string, content: string, file: File | null, metadata: any = {}) => {
        setIsLoading(true);
        let filePath: string | null = null;

        if (file) {
            filePath = await uploadFile(file);
            if (!filePath) {
                setIsLoading(false);
                return;
            }
        }

        try {
            const { data, error } = await supabaseClient
                .from('documents')
                .insert([
                    {
                        title,
                        content,
                        user_id: user?.id,
                        file_path: filePath,
                        metadata: metadata,
                    },
                ])
                .select()
                .single();

            if (error) {
                console.error("Error creating document:", error);
                toast({
                    title: "Failed to create document",
                    description: "There was an error creating the document.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Document created",
                    description: "Your document has been successfully created.",
                });
                queryClient.invalidateQueries({ queryKey: ['documents'] });
                navigate(`/document/${data.id}`);
            }
        } catch (error) {
            console.error("Unexpected error creating document:", error);
            toast({
                title: "Unexpected error",
                description: "An unexpected error occurred while creating the document.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const updateDocument = async (id: string, title: string, content: string, file: File | null, existingFilePath: string | null, metadata: any = {}) => {
        setIsLoading(true);
        let filePath = existingFilePath;

        if (file) {
            filePath = await uploadFile(file);
            if (!filePath) {
                setIsLoading(false);
                return;
            }
        }

        try {
            const updates = {
                title,
                content,
                file_path: filePath,
                metadata: metadata,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabaseClient
                .from('documents')
                .update(updates)
                .eq('id', id);

            if (error) {
                console.error("Error updating document:", error);
                toast({
                    title: "Failed to update document",
                    description: "There was an error updating the document.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Document updated",
                    description: "Your document has been successfully updated.",
                });
                queryClient.invalidateQueries({ queryKey: ['documents'] });
            }
        } catch (error) {
            console.error("Unexpected error updating document:", error);
            toast({
                title: "Unexpected error",
                description: "An unexpected error occurred while updating the document.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const deleteDocument = async (id: string) => {
        setIsLoading(true);
        try {
            const { error } = await supabaseClient
                .from('documents')
                .delete()
                .eq('id', id);

            if (error) {
                console.error("Error deleting document:", error);
                toast({
                    title: "Failed to delete document",
                    description: "There was an error deleting the document.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Document deleted",
                    description: "Your document has been successfully deleted.",
                });
                queryClient.invalidateQueries({ queryKey: ['documents'] });
                navigate("/dashboard");
            }
        } catch (error) {
            console.error("Unexpected error deleting document:", error);
            toast({
                title: "Unexpected error",
                description: "An unexpected error occurred while deleting the document.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportAsPDF = async (
        document: DocumentType,
        formattedContent: string,
        handleClose: () => void,
        markdownRef: React.RefObject<HTMLDivElement>,
        fileName: string = `${document.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        includeHeader: boolean = true,
        includeFooter: boolean = true,
        includeTimestamp: boolean = true,
        includePatientInfo: boolean = true
    ) => {
        setIsLoading(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 10;
            let currentY = margin;

            // Function to add header
            const addHeader = () => {
                if (!includeHeader) return;

                doc.setFontSize(10);
                doc.setTextColor(40);
                const headerText = 'PrecisionNote - Clinical Documentation';
                doc.text(headerText, margin, currentY);
                currentY += 5;
            };

            // Function to add footer
            const addFooter = () => {
                if (!includeFooter) return;

                doc.setFontSize(10);
                doc.setTextColor(40);
                const footerText = '© 2025 PrecisionNote Inc. All rights reserved.';
                const textWidth = doc.getTextWidth(footerText);
                const xPosition = (pageWidth - textWidth - margin);
                doc.text(footerText, xPosition, doc.internal.pageSize.getHeight() - margin);
            };

            // Function to add timestamp
            const addTimestamp = () => {
                if (!includeTimestamp) return;

                doc.setFontSize(8);
                doc.setTextColor(80);
                const timestamp = `Exported on: ${formatDate(new Date().toISOString())}`;
                doc.text(timestamp, margin, doc.internal.pageSize.getHeight() - margin);
            };

            // Function to add patient information
            const addPatientInformation = () => {
                if (!includePatientInfo || !document.metadata?.patientInfo) return;

                const patientInfo = document.metadata.patientInfo;
                const col = ["Field", "Value"];
                const rows = [
                    ["Name", patientInfo.name || 'N/A'],
                    ["Age", patientInfo.age || 'N/A'],
                    ["Gender", patientInfo.gender || 'N/A'],
                    ["Contact", patientInfo.contact || 'N/A'],
                ];

                autoTable(doc, {
                    head: [col],
                    body: rows,
                    startY: currentY,
                    margin: { horizontal: margin },
                    columnStyles: {
                        0: { fontStyle: 'bold' }
                    },
                    didParseCell: function(data) {
                        if (data.section === 'head') {
                            doc.setFontSize(9);
                        } else {
                            doc.setFontSize(8);
                        }
                    },
                });

                currentY = (doc as any).lastAutoTable.finalY + margin;
            };

            addHeader();
            addPatientInformation();

            // Add main content
            doc.setFontSize(12);
            doc.setTextColor(0);
            const splitText = doc.splitTextToSize(formattedContent, pageWidth - 2 * margin);
            splitText.forEach(line => {
                if (currentY > doc.internal.pageSize.getHeight() - 2 * margin) {
                    doc.addPage();
                    currentY = margin;
                    addHeader();
                }
                doc.text(line, margin, currentY);
                currentY += 6;
            });

            addTimestamp();
            addFooter();

            doc.save(fileName);
            toast({
                title: "Exported as PDF",
                description: "The document has been successfully exported as a PDF.",
            });
            handleClose();

        } catch (error) {
            console.error("Error exporting as PDF:", error);
            toast({
                title: "Failed to export as PDF",
                description: "There was an error exporting the document as a PDF.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        createDocument,
        updateDocument,
        deleteDocument,
        uploadFile,
        handleExportAsPDF
    };
};

export default useDocumentOperations;
