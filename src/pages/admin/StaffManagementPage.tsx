import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrgAuth } from "@/contexts/OrgAuthContext";
import { bulkUploadStaff, createStaff } from "@/services/orgAuthApi";
import { loadXlsx } from "@/utils/xlsxLoader";

interface StaffFormValues {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  password?: string;
}

interface PreviewRow {
  [key: string]: string;
  email: string;
  first_name: string;
  last_name: string;
  department?: string;
}

export default function StaffManagementPage() {
  const { session, user, logout } = useOrgAuth();
  const staffForm = useForm<StaffFormValues>({
    defaultValues: { firstName: "", lastName: "", email: "", department: "", password: "" }
  });

  const token = session?.token;
  const [singleSubmitting, setSingleSubmitting] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<Array<Record<string, unknown>>>([]);

  const organizationId = session?.organization_id;

  const greeting = useMemo(() => {
    if (!user) return "";
    return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
  }, [user]);

  const onSingleSubmit = async (values: StaffFormValues) => {
    if (!token) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    try {
      setSingleSubmitting(true);
      const payload = {
        ...values,
        department: values.department || undefined,
        password: values.password || undefined
      };
      const result = await createStaff(token, payload);
      toast.success(`Created staff ${result.staff.first_name ?? ""} ${result.staff.last_name ?? ""}`);
      if (result.temporary_password) {
        toast.message("Temporary password", { description: result.temporary_password });
      }
      staffForm.reset();
    } catch (error) {
      toast.error((error as Error)?.message ?? "Failed to create staff");
    } finally {
      setSingleSubmitting(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setBulkFile(file ?? null);
    setPreviewRows([]);
    setBulkResults([]);

    if (!file) return;

    try {
      const XLSX = await loadXlsx();
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        toast.error("Workbook is empty");
        return;
      }
      const worksheet = workbook.Sheets[sheetName];
      const rows: PreviewRow[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      setPreviewRows(rows);
      toast.success(`Loaded ${rows.length} rows from ${sheetName}`);
    } catch (error) {
      console.error("XLSX parse error", error);
      toast.error("Failed to parse spreadsheet");
    }
  };

  const handleBulkUpload = async () => {
    if (!token || !bulkFile) {
      toast.error("Select a file and ensure you are logged in");
      return;
    }
    try {
      setBulkUploading(true);
      const result = await bulkUploadStaff(token, bulkFile);
      setBulkResults(result.results ?? []);
      toast.success(`Processed ${result.total_rows} rows`);
    } catch (error) {
      toast.error((error as Error)?.message ?? "Bulk upload failed");
    } finally {
      setBulkUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm text-slate-500">Organization {organizationId}</p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Admin console</h1>
              <p className="text-sm text-slate-500">Signed in as {greeting || "admin"}</p>
            </div>
            <Button variant="secondary" onClick={logout} className="self-start">
              Sign out
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Add a staff member</h2>
              <p className="text-sm text-slate-500">Create credentials instantly for a single teammate.</p>
            </div>
            <form className="space-y-4" onSubmit={staffForm.handleSubmit(onSingleSubmit)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="staff-first">First name</Label>
                  <Input id="staff-first" required {...staffForm.register("firstName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-last">Last name</Label>
                  <Input id="staff-last" required {...staffForm.register("lastName")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-email">Work email</Label>
                <Input id="staff-email" type="email" required {...staffForm.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-dept">Department</Label>
                <Input id="staff-dept" placeholder="e.g. Cardiology" {...staffForm.register("department")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-password">Set temporary password (optional)</Label>
                <Input id="staff-password" type="password" minLength={8} placeholder="Leave empty to auto-generate" {...staffForm.register("password")} />
              </div>
              <Button type="submit" disabled={singleSubmitting} className="w-full">
                {singleSubmitting ? "Creating..." : "Create staff"}
              </Button>
            </form>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900">Bulk upload via spreadsheet</h2>
              <p className="text-sm text-slate-500">Supported columns: first_name, last_name, email, department.</p>
            </div>
            <div className="space-y-3">
              <Input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
              {previewRows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Preview (first 5 rows)</p>
                  <ScrollArea className="h-48 border rounded-md">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-100 text-left">
                        <tr>
                          <th className="p-2 font-medium">Email</th>
                          <th className="p-2 font-medium">First name</th>
                          <th className="p-2 font-medium">Last name</th>
                          <th className="p-2 font-medium">Department</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.slice(0, 5).map((row, index) => (
                          <tr key={`${row.email}-${index}`} className="border-t">
                            <td className="p-2">{row.email}</td>
                            <td className="p-2">{row.first_name}</td>
                            <td className="p-2">{row.last_name}</td>
                            <td className="p-2">{row.department || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              )}
              <Button type="button" onClick={handleBulkUpload} disabled={bulkUploading || !bulkFile} className="w-full">
                {bulkUploading ? "Uploading..." : "Upload spreadsheet"}
              </Button>
            </div>
            {bulkResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Upload results</p>
                <ScrollArea className="h-48 border rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-left">
                      <tr>
                        <th className="p-2 font-medium">Email</th>
                        <th className="p-2 font-medium">Status</th>
                        <th className="p-2 font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResults.map((row, index) => (
                        <tr key={`${row.email ?? index}`} className="border-t">
                          <td className="p-2">{String(row.email ?? "")}</td>
                          <td className="p-2 capitalize">{String(row.status ?? "")}</td>
                          <td className="p-2 text-xs text-slate-500">{String(row.reason ?? row.temporary_password ?? "")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
