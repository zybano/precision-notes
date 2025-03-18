
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Database, User, PlugZap } from "lucide-react";
import { toast } from "sonner";

const userProfileSchema = z.object({
  fullName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  role: z.string().min(2, {
    message: "Role must be at least 2 characters.",
  }),
  bio: z.string().max(160, {
    message: "Bio must not be longer than 160 characters.",
  }),
});

const emrConnectionSchema = z.object({
  providerName: z.string().min(2, {
    message: "Provider name must be at least 2 characters.",
  }),
  apiKey: z.string().min(10, {
    message: "API key must be at least 10 characters.",
  }),
  endpointUrl: z.string().url({
    message: "Please enter a valid URL.",
  }),
});

const Settings = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const userForm = useForm<z.infer<typeof userProfileSchema>>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      fullName: "Dr. Sarah Johnson",
      email: "sarah.johnson@notemed.ai",
      role: "Medical Director",
      bio: "Board-certified physician with over 10 years of experience in internal medicine."
    },
  });

  const emrForm = useForm<z.infer<typeof emrConnectionSchema>>({
    resolver: zodResolver(emrConnectionSchema),
    defaultValues: {
      providerName: "",
      apiKey: "",
      endpointUrl: "",
    },
  });

  const onUserSubmit = (data: z.infer<typeof userProfileSchema>) => {
    toast.success("Profile updated successfully");
    console.log("User profile data:", data);
  };

  const onEmrSubmit = (data: z.infer<typeof emrConnectionSchema>) => {
    setIsConnecting(true);
    
    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      toast.success("EMR system connected successfully");
      console.log("EMR connection data:", data);
    }, 2000);
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile Card */}
        <Card className="medical-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4 mb-2">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" />
                <AvatarFallback className="bg-primary text-white text-xl">SJ</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="w-fit gap-1 px-2 py-1 text-xs">
              <User size={14} /> Active Account
            </Badge>
          </CardHeader>
          <CardContent>
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                <FormField
                  control={userForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Role</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your role" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about yourself" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Brief professional description (max 160 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CardFooter className="px-0 pt-2">
                  <Button type="submit" className="w-full">
                    Update Profile
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* EMR/EHR Connection Card */}
        <Card className="medical-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-16 w-16 rounded-full flex items-center justify-center bg-accent/20 text-accent-foreground">
                <Database size={32} />
              </div>
              <div>
                <CardTitle>EMR/EHR Integration</CardTitle>
                <CardDescription>Connect to your medical records system</CardDescription>
              </div>
            </div>
            <Badge 
              variant={isConnected ? "default" : "outline"} 
              className="w-fit gap-1 px-2 py-1 text-xs"
            >
              <PlugZap size={14} /> 
              {isConnected ? "Connected" : "Not Connected"}
            </Badge>
          </CardHeader>
          <CardContent>
            <Form {...emrForm}>
              <form onSubmit={emrForm.handleSubmit(onEmrSubmit)} className="space-y-4">
                <FormField
                  control={emrForm.control}
                  name="providerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>EMR Provider</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Epic, Cerner, Allscripts" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={emrForm.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your API key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={emrForm.control}
                  name="endpointUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endpoint URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://api.emrprovider.com/v1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CardFooter className="px-0 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isConnecting || isConnected}
                  >
                    {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Connect"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
