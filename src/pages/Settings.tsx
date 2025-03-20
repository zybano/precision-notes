
import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";

const profileSchema = z.object({
  fullName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  bio: z.string().optional(),
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
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
      title: "",
      bio: "",
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

  // Fetch current user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Set email from auth data
        profileForm.setValue('email', user.email || '');
        
        // Get additional user metadata
        const fullName = user.user_metadata?.full_name || '';
        const title = user.user_metadata?.title || '';
        const bio = user.user_metadata?.bio || '';
        
        profileForm.setValue('fullName', fullName);
        profileForm.setValue('title', title);
        profileForm.setValue('bio', bio);
      }
    };
    
    fetchUserData();
  }, []);

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    setIsUpdatingProfile(true);
    
    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
          title: data.title,
          bio: data.bio
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
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
        {/* Profile Card */}
        <Card className="medical-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4 mb-2">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src="https://ui.shadcn.com/avatars/01.png" alt="Doctor" />
                <AvatarFallback>
                  {profileForm.getValues().fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="w-fit gap-1 px-2 py-1 text-xs">
              <User size={14} /> Personal
            </Badge>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
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
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} disabled />
                      </FormControl>
                      <FormDescription>
                        Email cannot be changed here. Contact support if needed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Cardiologist, Radiologist" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of your professional background" 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CardFooter className="px-0 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? "Updating..." : "Update Profile"}
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
