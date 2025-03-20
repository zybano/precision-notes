
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
import { Database, User, PlugZap, KeyRound, Lock } from "lucide-react";
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

const authSettingsSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  currentPassword: z.string().min(6, {
    message: "Current password must be at least 6 characters.",
  }),
  newPassword: z.string().min(6, {
    message: "New password must be at least 6 characters.",
  }).optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && !data.confirmPassword) return false;
  if (!data.newPassword && data.confirmPassword) return false;
  if (data.newPassword && data.confirmPassword && data.newPassword !== data.confirmPassword) return false;
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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
  const [isUpdatingAuth, setIsUpdatingAuth] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "Dr. Alex Johnson",
      email: "alex.johnson@medicalpractice.com",
      title: "Cardiologist",
      bio: "Board-certified cardiologist with over 10 years of experience in treating heart diseases and related conditions. Special interest in preventative cardiology and heart health education.",
    },
  });

  const authForm = useForm<z.infer<typeof authSettingsSchema>>({
    resolver: zodResolver(authSettingsSchema),
    defaultValues: {
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
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

  // Fetch current user email on component mount
  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.email) {
        authForm.setValue('email', data.user.email);
      }
    };
    
    fetchUserEmail();
  }, []);

  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    setIsUpdatingProfile(true);
    
    // Simulate profile update
    setTimeout(() => {
      setIsUpdatingProfile(false);
      toast.success("Profile updated successfully");
      console.log("Profile update data:", data);
    }, 1500);
  };

  const onAuthSubmit = async (data: z.infer<typeof authSettingsSchema>) => {
    try {
      setIsUpdatingAuth(true);
      
      // Check current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.currentPassword,
      });
      
      if (signInError) {
        toast.error("Current password is incorrect");
        setIsUpdatingAuth(false);
        return;
      }
      
      // If user wants to update password
      if (data.newPassword) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: data.newPassword
        });
        
        if (updateError) {
          toast.error("Failed to update password: " + updateError.message);
          setIsUpdatingAuth(false);
          return;
        }
      }
      
      // Update email if needed
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user && userData.user.email !== data.email) {
        const { error: emailUpdateError } = await supabase.auth.updateUser({
          email: data.email
        });
        
        if (emailUpdateError) {
          toast.error("Failed to update email: " + emailUpdateError.message);
          setIsUpdatingAuth(false);
          return;
        }
      }
      
      toast.success("Authentication settings updated successfully");
      // Reset form fields
      authForm.reset({
        email: data.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error updating auth settings:", error);
      toast.error("Failed to update authentication settings");
    } finally {
      setIsUpdatingAuth(false);
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
                <AvatarFallback>AJ</AvatarFallback>
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
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
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

        {/* Authentication Settings Card */}
        <Card className="medical-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-16 w-16 rounded-full flex items-center justify-center bg-primary/20 text-primary">
                <KeyRound size={32} />
              </div>
              <div>
                <CardTitle>Authentication Settings</CardTitle>
                <CardDescription>Update your login information</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="w-fit gap-1 px-2 py-1 text-xs">
              <Lock size={14} /> Security
            </Badge>
          </CardHeader>
          <CardContent>
            <Form {...authForm}>
              <form onSubmit={authForm.handleSubmit(onAuthSubmit)} className="space-y-4">
                <FormField
                  control={authForm.control}
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
                  control={authForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your current password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={authForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password (Optional)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave blank if you don't want to change your password
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={authForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CardFooter className="px-0 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isUpdatingAuth}
                  >
                    {isUpdatingAuth ? "Updating..." : "Update Authentication"}
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
