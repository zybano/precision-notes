import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrgAuth } from "@/contexts/OrgAuthContext";
import {
  OrganizationDetailsResponse,
  UsageSummaryResponse,
  fetchOrganizationDetails,
  fetchUsageSummary
} from "@/services/orgAuthApi";

interface OrgSummary {
  id: string;
  name: string;
  contactEmail?: string;
  industry?: string;
}

export default function StaffDashboardPage() {
  const { session, user, logout } = useOrgAuth();
  const token = session?.token;
  const [org, setOrg] = useState<OrgSummary | null>(null);
  const [usage, setUsage] = useState<UsageSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        setLoading(true);
        const [orgResponse, usageResponse] = await Promise.all([
          fetchOrganizationDetails(token),
          fetchUsageSummary(token)
        ]);
        setOrg(mapOrg(orgResponse));
        setUsage(usageResponse);
      } catch (error) {
        toast.error((error as Error)?.message ?? "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const cards = buildCards(usage);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Precision Notes Organization Authentication</p>
            <h1 className="text-2xl font-semibold text-slate-900">Welcome, {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email}</h1>
            {org && (
              <p className="text-sm text-slate-500">
                {org.name} • <Badge variant="secondary" className="font-mono text-[11px]">{org.id}</Badge>
              </p>
            )}
          </div>
          <Button variant="secondary" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Profile</h2>
          <Card className="p-6 space-y-4">
            <div>
              <p className="text-sm text-slate-500">Full name</p>
              <p className="text-lg font-semibold text-slate-900">
                {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || "—"}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="text-base text-slate-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Department</p>
                <p className="text-base text-slate-900">{user?.department || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Role</p>
                <Badge>{user?.role ?? "staff"}</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">Organization</p>
                <p className="text-base text-slate-900">{org?.name ?? "—"}</p>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-slate-900">Usage</h2>
            <Button variant="outline" size="sm" onClick={() => refreshUsage(token, setUsage)}>
              Refresh
            </Button>
          </div>
          {loading ? (
            <Card className="p-6 text-sm text-slate-500">Loading usage...</Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {cards.map((card) => (
                <Card key={card.label} className="p-4 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
                  <p className="text-xl font-semibold text-slate-900">{card.value}</p>
                  {card.caption && <p className="text-xs text-slate-500">{card.caption}</p>}
                </Card>
              ))}
            </div>
          )}
        </section>

        {org && (
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Organization</h2>
            <Card className="p-6 space-y-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Contact email</p>
                  <p className="text-base text-slate-900">{org.contactEmail || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Industry</p>
                  <p className="text-base text-slate-900">{org.industry || "—"}</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Need help? Contact your administrator or {org.contactEmail || "support"} for access updates.
              </p>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}

function mapOrg(response: OrganizationDetailsResponse): OrgSummary {
  return {
    id: response.organization.id,
    name: response.organization.name,
    contactEmail: response.organization.contact_email ?? undefined,
    industry: response.organization.industry ?? undefined
  };
}

function buildCards(usage: UsageSummaryResponse | null) {
  if (!usage) {
    return [
      { label: "Last login", value: "—" },
      { label: "Session count", value: "—" }
    ];
  }
  return [
    {
      label: "Last login",
      value: usage.userUsage.lastLogin ? new Date(usage.userUsage.lastLogin).toLocaleString() : "Never"
    },
    {
      label: "Active sessions",
      value: usage.userUsage.sessionCount.toString()
    },
    {
      label: "Credits",
      value: `${usage.organizationUsage.credits.toLocaleString()} credits`
    },
    {
      label: "Requests today",
      value: `${usage.organizationUsage.totalRequests.toLocaleString()} / ${usage.organizationUsage.rateLimitPerHour.toLocaleString()}`,
      caption: `${usage.organizationUsage.remainingRequests.toLocaleString()} remaining`
    }
  ];
}

async function refreshUsage(token: string | undefined, setUsage: (value: UsageSummaryResponse | null) => void) {
  if (!token) return;
  try {
    const data = await fetchUsageSummary(token);
    setUsage(data);
  } catch (error) {
    toast.error((error as Error)?.message ?? "Unable to refresh usage");
  }
}
