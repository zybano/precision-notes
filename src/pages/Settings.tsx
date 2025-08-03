import {useEffect, useState} from "react";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Textarea} from "@/components/ui/textarea";
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {Stethoscope} from "lucide-react";
import {toast} from "sonner";
import {supabase} from "@/integrations/supabase/client";
import {useAuth} from "@/contexts/AuthContext";

const profileSchema = z.object({
  fullName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }).optional().or(z.literal('')),
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

const transcriptSettingsSchema = z.object({
  enableOpenAI: z.boolean().default(true),
  openAIApiKey: z.string().optional(),
  preferAccuracy: z.boolean().default(true),
});

const Settings = () => {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingTranscriptSettings, setIsUpdatingTranscriptSettings] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

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
  
  const transcriptForm = useForm<z.infer<typeof transcriptSettingsSchema>>({
    resolver: zodResolver(transcriptSettingsSchema),
    defaultValues: {
      enableOpenAI: true,
      openAIApiKey: "",
      preferAccuracy: true,
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.setValue('email', user.email || '');
      
      const fullName = user.user_metadata?.full_name || '';
      const title = user.user_metadata?.title || '';
      const bio = user.user_metadata?.bio || '';
      
      profileForm.setValue('fullName', fullName);
      profileForm.setValue('title', title);
      profileForm.setValue('bio', bio);
    }
    
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      transcriptForm.setValue('openAIApiKey', storedApiKey);
      transcriptForm.setValue('enableOpenAI', true);
    }
  }, [user]);

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    setIsUpdatingProfile(true);
    
    try {
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
    
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      toast.success("EMR system connected successfully");
      console.log("EMR connection data:", data);
    }, 2000);
  };
  
  const onTranscriptSettingsSubmit = (data: z.infer<typeof transcriptSettingsSchema>) => {
    setIsUpdatingTranscriptSettings(true);
    
    try {
      if (data.enableOpenAI && data.openAIApiKey) {
        localStorage.setItem('openai_api_key', data.openAIApiKey);
      } else if (!data.enableOpenAI) {
        localStorage.removeItem('openai_api_key');
      }
      
      localStorage.setItem('transcript_settings', JSON.stringify({
        enableOpenAI: data.enableOpenAI,
        preferAccuracy: data.preferAccuracy
      }));
      
      toast.success("Transcript settings updated successfully");
    } catch (error) {
      console.error("Error saving transcript settings:", error);
      toast.error("Failed to update transcript settings");
    } finally {
      setIsUpdatingTranscriptSettings(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="medical-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4 mb-2">

                  <Stethoscope size={24} />


              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
            </div>
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

        {/*<Card className="medical-card">*/}
        {/*  <CardHeader className="pb-4">*/}
        {/*    <div className="flex items-center gap-4 mb-2">*/}
        {/*      <div className="h-16 w-16 rounded-full flex items-center justify-center bg-accent/20 text-accent-foreground">*/}
        {/*        <Database size={32} />*/}
        {/*      </div>*/}
        {/*      <div>*/}
        {/*        <CardTitle>EMR/EHR Integration</CardTitle>*/}
        {/*        <CardDescription>Connect to your medical records system</CardDescription>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*    <Badge */}
        {/*      variant={isConnected ? "default" : "outline"} */}
        {/*      className="w-fit gap-1 px-2 py-1 text-xs"*/}
        {/*    >*/}
        {/*      <PlugZap size={14} /> */}
        {/*      {isConnected ? "Connected" : "Not Connected"}*/}
        {/*    </Badge>*/}
        {/*  </CardHeader>*/}
        {/*  <CardContent>*/}
        {/*    <Form {...emrForm}>*/}
        {/*      <form onSubmit={emrForm.handleSubmit(onEmrSubmit)} className="space-y-4">*/}
        {/*        <FormField*/}
        {/*          control={emrForm.control}*/}
        {/*          name="providerName"*/}
        {/*          render={({ field }) => (*/}
        {/*            <FormItem>*/}
        {/*              <FormLabel>EMR Provider</FormLabel>*/}
        {/*              <FormControl>*/}
        {/*                <Input placeholder="e.g., Epic, Cerner, Allscripts" {...field} />*/}
        {/*              </FormControl>*/}
        {/*              <FormMessage />*/}
        {/*            </FormItem>*/}
        {/*          )}*/}
        {/*        />*/}
        {/*        <FormField*/}
        {/*          control={emrForm.control}*/}
        {/*          name="apiKey"*/}
        {/*          render={({ field }) => (*/}
        {/*            <FormItem>*/}
        {/*              <FormLabel>API Key</FormLabel>*/}
        {/*              <FormControl>*/}
        {/*                <Input type="password" placeholder="Enter your API key" {...field} />*/}
        {/*              </FormControl>*/}
        {/*              <FormMessage />*/}
        {/*            </FormItem>*/}
        {/*          )}*/}
        {/*        />*/}
        {/*        <FormField*/}
        {/*          control={emrForm.control}*/}
        {/*          name="endpointUrl"*/}
        {/*          render={({ field }) => (*/}
        {/*            <FormItem>*/}
        {/*              <FormLabel>Endpoint URL</FormLabel>*/}
        {/*              <FormControl>*/}
        {/*                <Input placeholder="https://api.emrprovider.com/v1" {...field} />*/}
        {/*              </FormControl>*/}
        {/*              <FormMessage />*/}
        {/*            </FormItem>*/}
        {/*          )}*/}
        {/*        />*/}
        {/*        <CardFooter className="px-0 pt-2">*/}
        {/*          <Button */}
        {/*            type="submit" */}
        {/*            className="w-full" */}
        {/*            disabled={isConnecting || isConnected}*/}
        {/*          >*/}
        {/*            {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Connect"}*/}
        {/*          </Button>*/}
        {/*        </CardFooter>*/}
        {/*      </form>*/}
        {/*    </Form>*/}
        {/*  </CardContent>*/}
        {/*</Card>*/}

        {/*<Card className="medical-card">*/}
        {/*  <CardHeader className="pb-4">*/}
        {/*    <div className="flex items-center gap-4 mb-2">*/}
        {/*      <div className="h-16 w-16 rounded-full flex items-center justify-center bg-accent/20 text-accent-foreground">*/}
        {/*        <FileText size={32} />*/}
        {/*      </div>*/}
        {/*      <div>*/}
        {/*        <CardTitle>Transcript Settings</CardTitle>*/}
        {/*        <CardDescription>Configure AI-enhanced transcript processing</CardDescription>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*    <Badge */}
        {/*      variant={transcriptForm.watch('enableOpenAI') ? "default" : "outline"} */}
        {/*      className="w-fit gap-1 px-2 py-1 text-xs"*/}
        {/*    >*/}
        {/*      <FileText size={14} /> */}
        {/*      {transcriptForm.watch('enableOpenAI') ? "AI Enhancement Enabled" : "Basic Processing"}*/}
        {/*    </Badge>*/}
        {/*  </CardHeader>*/}
        {/*  <CardContent>*/}
        {/*    <Form {...transcriptForm}>*/}
        {/*      <form onSubmit={transcriptForm.handleSubmit(onTranscriptSettingsSubmit)} className="space-y-4">*/}
        {/*        <FormField*/}
        {/*          control={transcriptForm.control}*/}
        {/*          name="enableOpenAI"*/}
        {/*          render={({ field }) => (*/}
        {/*            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">*/}
        {/*              <div className="space-y-0.5">*/}
        {/*                <FormLabel>Enable OpenAI Enhancement</FormLabel>*/}
        {/*                <FormDescription>*/}
        {/*                  Use OpenAI to improve transcript-to-note conversion*/}
        {/*                </FormDescription>*/}
        {/*              </div>*/}
        {/*              <FormControl>*/}
        {/*                <Switch*/}
        {/*                  checked={field.value}*/}
        {/*                  onCheckedChange={field.onChange}*/}
        {/*                />*/}
        {/*              </FormControl>*/}
        {/*            </FormItem>*/}
        {/*          )}*/}
        {/*        />*/}
        {/*        */}
        {/*        {transcriptForm.watch('enableOpenAI') && (*/}
        {/*          <FormField*/}
        {/*            control={transcriptForm.control}*/}
        {/*            name="openAIApiKey"*/}
        {/*            render={({ field }) => (*/}
        {/*              <FormItem>*/}
        {/*                <FormLabel>OpenAI API Key</FormLabel>*/}
        {/*                <div className="flex gap-2">*/}
        {/*                  <FormControl>*/}
        {/*                    <Input */}
        {/*                      type={apiKeyVisible ? "text" : "password"} */}
        {/*                      placeholder="Enter your OpenAI API key" */}
        {/*                      {...field} */}
        {/*                    />*/}
        {/*                  </FormControl>*/}
        {/*                  <Button */}
        {/*                    type="button"*/}
        {/*                    variant="outline"*/}
        {/*                    size="icon"*/}
        {/*                    onClick={() => setApiKeyVisible(!apiKeyVisible)}*/}
        {/*                  >*/}
        {/*                    {apiKeyVisible ? (*/}
        {/*                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>*/}
        {/*                    ) : (*/}
        {/*                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>*/}
        {/*                    )}*/}
        {/*                  </Button>*/}
        {/*                </div>*/}
        {/*                <FormDescription>*/}
        {/*                  Your API key is stored securely in your browser and never sent to our servers*/}
        {/*                </FormDescription>*/}
        {/*                <FormMessage />*/}
        {/*              </FormItem>*/}
        {/*            )}*/}
        {/*          />*/}
        {/*        )}*/}
        {/*        */}
        {/*        <FormField*/}
        {/*          control={transcriptForm.control}*/}
        {/*          name="preferAccuracy"*/}
        {/*          render={({ field }) => (*/}
        {/*            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">*/}
        {/*              <div className="space-y-0.5">*/}
        {/*                <FormLabel>Prioritize Accuracy</FormLabel>*/}
        {/*                <FormDescription>*/}
        {/*                  Higher accuracy but slower processing for clinical notes*/}
        {/*                </FormDescription>*/}
        {/*              </div>*/}
        {/*              <FormControl>*/}
        {/*                <Switch*/}
        {/*                  checked={field.value}*/}
        {/*                  onCheckedChange={field.onChange}*/}
        {/*                />*/}
        {/*              </FormControl>*/}
        {/*            </FormItem>*/}
        {/*          )}*/}
        {/*        />*/}
        {/*        */}
        {/*        <Button */}
        {/*          type="submit" */}
        {/*          className="w-full"*/}
        {/*          disabled={isUpdatingTranscriptSettings}*/}
        {/*        >*/}
        {/*          {isUpdatingTranscriptSettings ? "Updating..." : "Update Transcript Settings"}*/}
        {/*        </Button>*/}
        {/*      </form>*/}
        {/*    </Form>*/}
        {/*  </CardContent>*/}
        {/*</Card>*/}
      </div>
    </div>
  );
};

export default Settings;
