import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOrgAuth } from "@/contexts/OrgAuthContext";
import { requestOtp } from "@/services/orgAuthApi";

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
      navigate("/admin/dashboard", { replace: true });
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
      navigate("/admin/dashboard", { replace: true });
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <div>
          <p className="text-sm text-slate-500">Precision Notes</p>
          <h1 className="text-3xl font-semibold text-slate-900">Admin login</h1>
          <p className="text-sm text-slate-500 mt-2">
            Admins and staff can sign in here to access your organization.
          </p>
        </div>

        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="password">Email & password</TabsTrigger>
            <TabsTrigger value="otp">Email OTP</TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="space-y-4 mt-6">
            <form className="space-y-4" onSubmit={handleSubmit(onPasswordLogin)}>
              <div className="space-y-2">
                <Label htmlFor="password-email">Work email</Label>
                <Input id="password-email" type="email" required {...register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={8} {...register("password")} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <Link to="/admin/reset-password" className="text-sm text-blue-600">
              Forgot password?
            </Link>
          </TabsContent>

          <TabsContent value="otp" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp-email">Work email</Label>
                <div className="flex gap-2">
                  <Input
                    id="otp-email"
                    type="email"
                    value={otpEmail}
                    onChange={(event) => setOtpEmail(event.target.value)}
                    disabled={otpStep === "code"}
                  />
                  {otpStep === "code" && (
                    <Button type="button" variant="secondary" onClick={resetOtpFlow}>
                      Change
                    </Button>
                  )}
                </div>
              </div>
              <Button type="button" onClick={handleRequestOtp} disabled={otpRequestLoading || !otpEmail}>
                {otpRequestLoading ? "Sending..." : otpStep === "code" ? "Resend OTP" : "Send OTP"}
              </Button>
              {otpStep === "code" && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Enter the 6-digit code sent to {otpEmail}</span>
                    <button
                      type="button"
                      className="text-blue-600"
                      onClick={handleRequestOtp}
                      disabled={countdown > 0 || otpRequestLoading}
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                    </button>
                  </div>
                  <div className="flex gap-2 justify-between">
                    {otpDigits.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (otpInputsRef.current[index] = el)}
                        inputMode="numeric"
                        maxLength={1}
                        className="text-center text-xl"
                        value={digit}
                        onChange={(event) => handleOtpDigitChange(event.target.value, index)}
                        onKeyDown={(event) => handleOtpKeyDown(event, index)}
                      />
                    ))}
                  </div>
                  <Button type="button" className="w-full" disabled={otpSubmitting} onClick={handleOtpLogin}>
                    {otpSubmitting ? "Verifying..." : "Sign in"}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
