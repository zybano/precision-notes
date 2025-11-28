import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { requestPasswordReset, resetPassword } from "@/services/orgAuthApi";

export default function PasswordResetPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectUrl = `${window.location.origin}/admin/reset-password`;

  const handleRequest = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }

    try {
      setLoading(true);
      await requestPasswordReset(email, redirectUrl);
      toast.success("If that email exists, a reset link has been sent");
    } catch (error) {
      toast.error((error as Error)?.message ?? "Unable to request reset");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email || !token) {
      toast.error("Email and token required");
      return;
    }
    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email, token, password);
      toast.success("Password updated. Please login.");
      navigate("/admin/login", { replace: true });
    } catch (error) {
      toast.error((error as Error)?.message ?? "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  const isResetMode = Boolean(token);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div>
          <p className="text-sm text-slate-500">Precision Notes</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isResetMode ? "Set a new password" : "Reset your password"}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Back to <Link to="/admin/login" className="text-blue-600">login</Link>
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isResetMode && Boolean(emailParam)} />
          </div>

          {isResetMode ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input id="new-password" type="password" value={password} minLength={8} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} />
              </div>
              <Button type="button" className="w-full" disabled={loading} onClick={handleReset}>
                {loading ? "Updating password..." : "Update password"}
              </Button>
            </>
          ) : (
            <Button type="button" className="w-full" disabled={loading} onClick={handleRequest}>
              {loading ? "Sending reset link..." : "Send reset link"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
