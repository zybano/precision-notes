import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOrgAuth } from "@/contexts/OrgAuthContext";
import { requestOtp } from "@/services/orgAuthApi";
import { Mail, Lock, Shield } from "lucide-react";

interface PasswordFormValues {
  email: string;
  password: string;
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { loginWithPassword, loginWithOtp } = useOrgAuth();
  const passwordForm = useForm<PasswordFormValues>({ defaultValues: { email: "", password: "" } });
  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = passwordForm;

  const [otpEmail, setOtpEmail] = useState("");
  const [otpRequestLoading, setOtpRequestLoading] = useState(false);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [countdown, setCountdown] = useState(0);
  const OTP_LENGTH = 6;
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (otpStep !== "code" || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpStep, countdown]);

  const onPasswordLogin = async (values: PasswordFormValues) => {
    try {
      await loginWithPassword(values.email, values.password);
      toast.success("Welcome back!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error((error as Error)?.message ?? "Unable to login");
    }
  };

  const handleRequestOtp = async () => {
    if (!otpEmail) {
      toast.error("Enter your email first");
      return;
    }

    try {
      setOtpRequestLoading(true);
      await requestOtp(otpEmail);
      setOtpStep("code");
      setCountdown(60);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      toast.success("OTP sent. Check your inbox");
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (error) {
      toast.error((error as Error)?.message ?? "Failed to send OTP");
    } finally {
      setOtpRequestLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    const code = otpDigits.join("");
    if (!otpEmail || code.length !== OTP_LENGTH) {
      toast.error("Provide both email and OTP");
      return;
    }

    try {
      setOtpSubmitting(true);
      await loginWithOtp(otpEmail, code);
      toast.success("Signed in successfully");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error((error as Error)?.message ?? "OTP verification failed");
    } finally {
      setOtpSubmitting(false);
    }
  };

  const handleOtpDigitChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) {
      return;
    }
    const nextDigits = [...otpDigits];
    nextDigits[index] = value;
    setOtpDigits(nextDigits);

    if (value && index < OTP_LENGTH - 1) {
      otpInputsRef.current[index + 1]?.focus();
    }
    if (!value && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const resetOtpFlow = () => {
    setOtpStep("email");
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setCountdown(0);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding with background image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 opacity-95 z-10" />

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10 z-0">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Content */}
        <div className="relative z-20 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo and brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">PrecisionNote</h1>
                <p className="text-blue-100 text-sm">Medical Documentation Platform</p>
              </div>
            </div>
          </div>

          {/* Center image */}
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <img
                src="/lovable-uploads/PrecisionNote.jpeg"
                alt="PrecisionNote"
                className="max-w-md w-full h-auto rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-yellow-400 rounded-full blur-3xl opacity-50" />
              <div className="absolute -top-6 -left-6 h-32 w-32 bg-blue-400 rounded-full blur-3xl opacity-50" />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Trusted by healthcare professionals</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Safe & Secure</p>
                  <p className="text-sm text-blue-100">Enterprise-grade security</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">AI-Powered</p>
                  <p className="text-sm text-blue-100">Smart documentation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">PrecisionNote</span>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-600">
              Sign in to your organization account to continue
            </p>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:p-8">
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="password" className="gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </TabsTrigger>
                <TabsTrigger value="otp" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email OTP
                </TabsTrigger>
              </TabsList>

              <TabsContent value="password" className="space-y-5 mt-6">
                <form className="space-y-5" onSubmit={handleSubmit(onPasswordLogin)}>
                  <div className="space-y-2">
                    <Label htmlFor="password-email" className="text-slate-700 font-medium">
                      Work email
                    </Label>
                    <Input
                      id="password-email"
                      type="email"
                      placeholder="you@organization.com"
                      className="h-11"
                      required
                      {...register("email")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="h-11"
                      required
                      minLength={8}
                      {...register("password")}
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 text-base" disabled={isSubmitting}>
                    {isSubmitting ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
                <div className="text-center">
                  <Link
                    to="/admin/reset-password"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="otp" className="space-y-5 mt-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="otp-email" className="text-slate-700 font-medium">
                      Work email
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="otp-email"
                        type="email"
                        placeholder="you@organization.com"
                        className="h-11"
                        value={otpEmail}
                        onChange={(event) => setOtpEmail(event.target.value)}
                        disabled={otpStep === "code"}
                      />
                      {otpStep === "code" && (
                        <Button type="button" variant="outline" className="h-11" onClick={resetOtpFlow}>
                          Change
                        </Button>
                      )}
                    </div>
                  </div>

                  {otpStep === "email" && (
                    <Button
                      type="button"
                      onClick={handleRequestOtp}
                      className="w-full h-11 text-base"
                      disabled={otpRequestLoading || !otpEmail}
                    >
                      {otpRequestLoading ? "Sending..." : "Send OTP"}
                    </Button>
                  )}

                  {otpStep === "code" && (
                    <div className="space-y-5">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                          We've sent a 6-digit code to <span className="font-medium">{otpEmail}</span>
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-slate-700 font-medium">Enter verification code</Label>
                        <div className="flex gap-2 justify-between">
                          {otpDigits.map((digit, index) => (
                            <Input
                              key={index}
                              ref={(el) => (otpInputsRef.current[index] = el)}
                              inputMode="numeric"
                              maxLength={1}
                              className="text-center text-xl h-14 w-full font-semibold"
                              value={digit}
                              onChange={(event) => handleOtpDigitChange(event.target.value, index)}
                              onKeyDown={(event) => handleOtpKeyDown(event, index)}
                            />
                          ))}
                        </div>
                      </div>

                      <Button
                        type="button"
                        className="w-full h-11 text-base"
                        disabled={otpSubmitting || otpDigits.join("").length !== OTP_LENGTH}
                        onClick={handleOtpLogin}
                      >
                        {otpSubmitting ? "Verifying..." : "Verify & Sign in"}
                      </Button>

                      <div className="text-center">
                        <button
                          type="button"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleRequestOtp}
                          disabled={countdown > 0 || otpRequestLoading}
                        >
                          {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}


          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 pt-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Secure</span>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              <span>Encrypted</span>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Smart</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
