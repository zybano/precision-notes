import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOrgAuth } from "@/contexts/OrgAuthContext";

interface FormValues {
  organizationId: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  department: string;
}

const DEFAULT_VALUES: FormValues = {
  organizationId: "",
  adminFirstName: "",
  adminLastName: "",
  adminEmail: "",
  adminPassword: "",
  department: ""
};

export default function AdminOnboardingPage() {
  const navigate = useNavigate();
  const { onboardAdmin } = useOrgAuth();
  const form = useForm<FormValues>({ defaultValues: DEFAULT_VALUES });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = form;

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        department: values.department || undefined
      };

      const result = await onboardAdmin(payload);
      toast.success(`Admin added to ${result.organization.name}`);
      navigate("/admin/dashboard", { replace: true });
    } catch (error) {
      toast.error((error as Error)?.message ?? "Failed to onboard organization");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-3xl p-8 space-y-8">
        <div>
          <p className="text-sm text-slate-500">Precision Notes</p>
          <h1 className="text-3xl font-semibold text-slate-900">Create an admin</h1>
          <p className="text-sm text-slate-500 mt-2">
            Admin provisioning is restricted. Contact operations if you don’t have an organization ID.
          </p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Organization access</h2>
            <div className="space-y-2">
              <Label htmlFor="organizationId">Organization ID</Label>
              <Input id="organizationId" required placeholder="Existing organization UUID" {...register("organizationId")} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Admin details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="adminFirstName">First name</Label>
                <Input id="adminFirstName" required {...register("adminFirstName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminLastName">Last name</Label>
                <Input id="adminLastName" required {...register("adminLastName")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="adminEmail">Work email</Label>
                <Input id="adminEmail" type="email" required {...register("adminEmail")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="adminPassword">Password</Label>
                <Input id="adminPassword" type="password" required minLength={8} {...register("adminPassword")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="department">Department (optional)</Label>
                <Input id="department" {...register("department")} />
              </div>
            </div>
          </section>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating admin..." : "Create admin"}
            </Button>
        </form>
      </Card>
    </div>
  );
}
