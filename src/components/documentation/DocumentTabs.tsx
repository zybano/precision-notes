
import React, { useState } from "react";
import { FadeIn } from "@/components/ui/motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecentDocuments from "@/components/documentation/RecentDocuments";
import SharedDocuments from "@/components/documentation/SharedDocuments";
import { UseFormReturn } from "react-hook-form";

interface DocumentTabsProps {
  setNewDocumentOpen: (open: boolean) => void;
  form: UseFormReturn<any>;
  currentUserId?: string;
}

const DocumentTabs: React.FC<DocumentTabsProps> = ({
  setNewDocumentOpen,
  form,
  currentUserId
}) => {
  const [activeTab, setActiveTab] = useState("saved");

  return (
    <FadeIn delay={0.2}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="saved">My Documents</TabsTrigger>
          <TabsTrigger value="shared">Shared Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="space-y-6">
          <RecentDocuments
            setNewDocumentOpen={setNewDocumentOpen}
            form={form}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="shared" className="space-y-6">
          <SharedDocuments
            setNewDocumentOpen={setNewDocumentOpen}
            form={form}
            currentUserId={currentUserId}
          />
        </TabsContent>
      </Tabs>
    </FadeIn>
  );
};

export default DocumentTabs;
