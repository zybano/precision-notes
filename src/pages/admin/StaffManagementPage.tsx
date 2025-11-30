import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useOrgAuth } from "@/contexts/OrgAuthContext";
import {
  OrganizationUser,
  StaffBulkEntry,
  bulkUploadStaff,
  createStaff,
  fetchStaffList
} from "@/services/orgAuthApi";
import { loadXlsx } from "@/utils/xlsxLoader";
import { Users, Download } from "lucide-react";

interface StaffFormValues {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  password?: string;
}

export default function StaffManagementPage() {
  const { session } = useOrgAuth();
  const staffForm = useForm<StaffFormValues>({
    defaultValues: { firstName: "", lastName: "", email: "", department: "", password: "" }
  });

  const token = session?.token;
  const [staff, setStaff] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [singleSubmitting, setSingleSubmitting] = useState(false);
  const [previewRows, setPreviewRows] = useState<StaffBulkEntry[]>([]);
  const [previewSource, setPreviewSource] = useState<string | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    if (!token) return;
    loadStaff();
  }, [token]);

  const loadStaff = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const staffResponse = await fetchStaffList(token);
      setStaff(staffResponse.staff ?? []);
    } catch (error) {
      console.error(error);
      toast.error((error as Error)?.message ?? "Unable to load staff data");
    } finally {
      setLoading(false);
    }
  };

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
      loadStaff();
    } catch (error) {
      toast.error((error as Error)?.message ?? "Failed to create staff");
    } finally {
      setSingleSubmitting(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setPreviewRows([]);
    setBulkResults([]);
    setPreviewSource(file?.name ?? null);

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
      const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      const normalized = rawRows
        .map(normalizeRow)
        .filter((row): row is StaffBulkEntry => Boolean(row.email && row.first_name && row.last_name));
      if (!normalized.length) {
        toast.error("No valid rows detected");
        return;
      }
      setPreviewRows(normalized);
      toast.success(`Loaded ${normalized.length} rows from ${sheetName}`);
    } catch (error) {
      console.error("XLSX parse error", error);
      toast.error("Failed to parse spreadsheet");
    }
  };

  const handleRemovePreviewRow = (index: number) => {
    setPreviewRows((rows) => rows.filter((_, idx) => idx !== index));
  };

  const handleDownloadTemplate = async () => {
    try {
      const XLSX = await loadXlsx();

      // Create a new workbook with the required columns
      const templateData = [
        {
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          department: "Cardiology"
        },
        {
          first_name: "Jane",
          last_name: "Smith",
          email: "jane.smith@example.com",
          department: "Pediatrics"
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Template");

      // Set column widths for better readability
      worksheet['!cols'] = [
        { wch: 15 }, // first_name
        { wch: 15 }, // last_name
        { wch: 30 }, // email
        { wch: 20 }  // department
      ];

      // Generate and download the file
      XLSX.writeFile(workbook, "staff_upload_template.xlsx");
      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error("Template download error", error);
      toast.error("Failed to download template");
    }
  };

  const handleBulkUpload = async () => {
    if (!token) {
      toast.error("Session expired. Please log in again.");
      return;
    }
    if (!previewRows.length) {
      toast.error("No staff entries to upload");
      return;
    }
    try {
      setBulkUploading(true);
      const result = await bulkUploadStaff(token, previewRows);
      setBulkResults(result.results ?? []);
      toast.success(`Processed ${result.total_rows} entries`);
      setPreviewRows([]);
      setPreviewSource(null);
      loadStaff();
    } catch (error) {
      toast.error((error as Error)?.message ?? "Bulk upload failed");
    } finally {
      setBulkUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Staff Management</h1>
            <p className="text-slate-600">Manage your organization's team members</p>
          </div>
        </div>

        {/* Team members list */}
        <section className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Team members ({staff.length})</h2>
              <p className="text-sm text-slate-500">View and manage admins and staff members</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadStaff}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <Card className="p-6 text-sm text-slate-500">Loading staff data...</Card>
          ) : (
            <Card>
              <ScrollArea className="rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-left">
                    <tr>
                      <th className="p-3 font-medium">Name</th>
                      <th className="p-3 font-medium">Email</th>
                      <th className="p-3 font-medium">Role</th>
                      <th className="p-3 font-medium">Department</th>
                      <th className="p-3 font-medium">Last login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.length === 0 ? (
                      <tr>
                        <td className="p-4 text-center text-slate-500" colSpan={5}>
                          No team members yet.
                        </td>
                      </tr>
                    ) : (
                      staff.map((member) => (
                        <tr key={member.id} className="border-t">
                          <td className="p-3 font-medium text-slate-900">
                            {[member.first_name, member.last_name].filter(Boolean).join(" ") || member.email}
                          </td>
                          <td className="p-3 text-slate-600">{member.email}</td>
                          <td className="p-3">
                            <Badge variant={member.role === "admin" ? "default" : "secondary"}>{member.role}</Badge>
                          </td>
                          <td className="p-3 text-slate-600">{member.department || "—"}</td>
                          <td className="p-3 text-slate-600 text-xs">
                            {member.last_login_at ? new Date(member.last_login_at).toLocaleString() : "Never"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </Card>
          )}
        </section>

        {/* Add staff forms */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Single staff member */}
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Add a staff member</h2>
              <p className="text-sm text-slate-500">Issue credentials instantly for a single teammate</p>
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
                <Label htmlFor="staff-password">Temporary password (optional)</Label>
                <Input id="staff-password" type="password" minLength={8} placeholder="Leave blank to auto-generate" {...staffForm.register("password")} />
              </div>
              <Button type="submit" disabled={singleSubmitting} className="w-full">
                {singleSubmitting ? "Creating..." : "Create staff"}
              </Button>
            </form>
          </Card>

          {/* Bulk upload */}
          <Card className="p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900">Bulk upload</h2>
              <p className="text-sm text-slate-500">
                Upload a spreadsheet with columns: first_name, last_name, email, department
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="shrink-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <p className="text-xs text-slate-500">Download a sample Excel template to get started</p>
              </div>
              <Input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
              {previewSource && (
                <p className="text-xs text-slate-500">Loaded from {previewSource}</p>
              )}
              {previewRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{previewRows.length} entries ready</span>
                    <Button variant="ghost" size="sm" onClick={() => setPreviewRows([])}>
                      Clear
                    </Button>
                  </div>
                  <ScrollArea className="h-56 border rounded-md">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-100 text-left">
                        <tr>
                          <th className="p-2 font-medium">Email</th>
                          <th className="p-2 font-medium">First name</th>
                          <th className="p-2 font-medium">Last name</th>
                          <th className="p-2 font-medium">Department</th>
                          <th className="p-2 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, index) => (
                          <tr key={`${row.email}-${index}`} className="border-t">
                            <td className="p-2">{row.email}</td>
                            <td className="p-2">{row.first_name}</td>
                            <td className="p-2">{row.last_name}</td>
                            <td className="p-2">{row.department || ""}</td>
                            <td className="p-2">
                              <Button variant="ghost" size="sm" onClick={() => handleRemovePreviewRow(index)}>
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              )}
              <Button type="button" onClick={handleBulkUpload} disabled={bulkUploading || previewRows.length === 0} className="w-full">
                {bulkUploading ? "Uploading..." : previewRows.length ? `Upload ${previewRows.length} entries` : "Upload entries"}
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
        </section>
      </div>
    </div>
  );
}

function normalizeRow(row: Record<string, unknown>): StaffBulkEntry {
  const normalized: Record<string, string> = {};
  Object.entries(row).forEach(([key, value]) => {
    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, "_");
    normalized[cleanKey] = String(value ?? "").trim();
  });
  return {
    email: normalized.email ?? "",
    first_name: normalized.first_name ?? normalized.firstname ?? "",
    last_name: normalized.last_name ?? normalized.lastname ?? "",
    department: normalized.department ?? ""
  };
}
