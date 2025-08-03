import {TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {ReactNode} from "react";

export interface DashboardTabProps {
  value: string;
  children?: ReactNode;
}

export const DashboardTab = ({ value, children }: DashboardTabProps) => {
  return (
    <TabsContent value={value}>
      {children}
    </TabsContent>
  );
};

interface DashboardTabsListProps {
  tabs: Array<{
    value: string;
    label: string;
  }>;
}

export const DashboardTabsList = ({ tabs }: DashboardTabsListProps) => {
  return (
    <TabsList className="grid grid-cols-3 md:grid-cols-9 w-full">
      {tabs.map((tab) => (
        <TabsTrigger key={tab.value} value={tab.value}>
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
};
