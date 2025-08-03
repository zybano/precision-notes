import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  value: string;
  description: string;
  bgClass: string;
  borderClass: string;
}

export const DashboardCard = ({ title, value, description, bgClass, borderClass }: DashboardCardProps) => {
  return (
    <Card className={`${bgClass} ${borderClass}`}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
};

interface DashboardCardGroup {
  cards: DashboardCardProps[];
}

export const DashboardCards = ({ cards }: DashboardCardGroup) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <DashboardCard key={index} {...card} />
      ))}
    </div>
  );
};

export const CardDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-muted-foreground">{children}</p>
);
