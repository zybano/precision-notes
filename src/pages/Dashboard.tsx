
import { FadeIn } from "@/components/ui/motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Clipboard, Clock, Users } from "lucide-react";

const Dashboard = () => {
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
            <Button size="sm">New Document</Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FadeIn delay={0.2} className="lg:col-span-2">
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

        <FadeIn delay={0.3}>
          <Card className="border border-border h-full">
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Your schedule for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-start p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="bg-primary/10 rounded-md p-2 mr-3">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-muted-foreground">
                        {i === 0 ? "10:00 AM - Follow-up" : i === 1 ? "11:30 AM - New patient" : "2:15 PM - Consultation"}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" className="w-full mt-2 text-primary">
                  View All Appointments
                </Button>
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
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="py-3 px-4 text-left font-medium text-sm text-muted-foreground">Patient</th>
                    <th className="py-3 px-4 text-left font-medium text-sm text-muted-foreground">Type</th>
                    <th className="py-3 px-4 text-left font-medium text-sm text-muted-foreground">Date</th>
                    <th className="py-3 px-4 text-left font-medium text-sm text-muted-foreground">Status</th>
                    <th className="py-3 px-4 text-left font-medium text-sm text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Sarah Johnson", type: "Progress Note", date: "Today, 9:32 AM", status: "Completed" },
                    { name: "Michael Chen", type: "Assessment", date: "Yesterday, 3:15 PM", status: "Draft" },
                    { name: "Emily Rodriguez", type: "Consultation", date: "Aug 24, 2023", status: "Signed" },
                    { name: "Robert Williams", type: "Discharge Summary", date: "Aug 22, 2023", status: "Reviewed" },
                  ].map((doc, i) => (
                    <tr key={i} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-sm">{doc.name}</td>
                      <td className="py-3 px-4 text-sm">{doc.type}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{doc.date}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          doc.status === "Completed" ? "bg-green-100 text-green-800" :
                          doc.status === "Draft" ? "bg-yellow-100 text-yellow-800" :
                          doc.status === "Signed" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
};

export default Dashboard;
