
import React from "react";
import { FadeIn } from "@/components/ui/motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecentDocuments from "@/components/documentation/RecentDocuments";
import SharedDocuments from "@/components/documentation/SharedDocuments";
import { UseFormReturn } from "react-hook-form";
import { useIsMobile } from "@/hooks/use-mobile";

interface DocumentationTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setNewDocumentOpen: (open: boolean) => void;
  form: UseFormReturn<any>;
}

const DocumentationTabs: React.FC<DocumentationTabsProps> = ({ 
  activeTab, 
  setActiveTab, 
  setNewDocumentOpen, 
  form 
}) => {
  const isMobile = useIsMobile();
  
  return (
    <FadeIn delay={0.2}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
        <TabsList className={`grid grid-cols-2 ${isMobile ? 'w-full' : 'max-w-md w-full'}`}>
          <TabsTrigger value="saved">My Documents</TabsTrigger>
          <TabsTrigger value="shared">Shared Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="space-y-6 w-full">
          <RecentDocuments
            setNewDocumentOpen={setNewDocumentOpen}
            form={form}
          />
        </TabsContent>

        <TabsContent value="shared" className="space-y-6 w-full">
          <SharedDocuments
            setNewDocumentOpen={setNewDocumentOpen}
            form={form}
          />
        </TabsContent>
      </Tabs>
    </FadeIn>
  );
};

export default DocumentationTabs;
