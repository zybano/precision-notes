import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Eye, EyeOff, Loader2} from "lucide-react";
import {useAdminAuth} from "@/contexts/AdminAuthContext";
import precisionLogo from '/lovable-uploads/precision.jpeg';
import precisionNote from '/lovable-uploads/PrecisionNote.jpeg';

function AdminAuthProgressOverlay({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 text-left shadow-[0_20px_70px_rgba(15,23,42,0.18)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">{title}</p>
            <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { signIn, adminUser, isLoading } = useAdminAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (adminUser) {
      navigate('/admin');
    }
  }, [adminUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await signIn(username, password);
      if (success) {
        navigate('/admin');
      } else {
        setError('Invalid credentials or session could not be created');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-hidden bg-slate-50">
      <div className="flex min-h-screen flex-col md:flex-row">
        <div className="flex flex-1 items-center justify-center p-4 md:p-8">
          <Card className="w-full max-w-md overflow-hidden">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-white">
                  <a href="/" target="_self" rel="noreferrer">
                    <img
                      src={precisionLogo}
                      alt="PrecisionNote"
                      className="h-full w-full object-contain"
                    />
                  </a>
                </div>
              </div>
              <CardTitle className="text-center text-2xl text-slate-950">Login to Precision Notes</CardTitle>
              <CardDescription className="text-center text-slate-500">
                Enter your platform admin credentials to access the control center.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="superadmin"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isSubmitting}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-center">
                  <a href="mailto:support@precisionnote.ai" className="text-sm font-medium text-indigo-600 hover:underline">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !username || !password}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="justify-center">
              <div className="text-sm text-muted-foreground text-center">
                Need platform admin access? Contact your system owner.
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="hidden flex-1 items-center justify-center border-l border-slate-200 bg-white md:flex">
          <img
            src={precisionNote}
            alt="Admin login illustration"
            className="h-full w-full object-contain p-8"
          />
        </div>
      </div>
      {isLoading && (
        <AdminAuthProgressOverlay
          title="Loading admin console"
          description="Checking your current platform admin session."
        />
      )}
      {isSubmitting && (
        <AdminAuthProgressOverlay
          title="Signing you in"
          description="Creating your admin session and opening the control center."
        />
      )}
    </div>
  );
}
