import {useEffect, useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {Switch} from '@/components/ui/switch';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import AdminFormField from '@/components/admin/AdminFormField';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import {AdminMetricTile, AdminSectionPanel, AdminTableShell} from '@/components/admin/AdminSurface';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';
import type {AdminOrganizationBilling, BillingUsageUnitCode, CreateTenantRequest, OrganizationUser, Tenant, TenantUsage} from '@/types/platformAdmin';
import {toast} from 'sonner';
import {
  Building2,
  Copy,
  CreditCard,
  Eye,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from 'lucide-react';

type StatusFilter = 'all' | 'active' | 'inactive';

type TenantSettingsForm = {
  name: string;
  contactEmail: string;
  contactName: string;
  industry: string;
  webhookUrl: string;
  rateLimitPerHour: number;
  requestLimit: number;
  dataStoragePreference: string;
  allowedDocumentTypes: string;
  isActive: boolean;
};

const emptyCreateForm: CreateTenantRequest = {
  name: '',
  contactEmail: '',
  contactName: '',
  industry: '',
  webhookUrl: '',
  rateLimitPerHour: 1000,
  requestLimit: 100,
  dataStoragePreference: 'none',
};

function toSettingsForm(tenant: Tenant | null): TenantSettingsForm {
  return {
    name: tenant?.name || '',
    contactEmail: tenant?.contactEmail || '',
    contactName: tenant?.contactName || '',
    industry: tenant?.industry || '',
    webhookUrl: tenant?.webhookUrl || '',
    rateLimitPerHour: tenant?.rateLimitPerHour ?? 1000,
    requestLimit: tenant?.requestLimit ?? 100,
    dataStoragePreference: tenant?.dataStoragePreference || 'none',
    allowedDocumentTypes: (tenant?.allowedDocumentTypes || []).join(', '),
    isActive: tenant?.isActive !== false,
  };
}

function splitDocumentTypes(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function maskSecret(value?: string) {
  if (!value) return '-';
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

export default function OrganizationsPage() {
  const {sessionToken} = useAdminAuth();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [createForm, setCreateForm] = useState<CreateTenantRequest>(emptyCreateForm);
  const [settingsForm, setSettingsForm] = useState<TenantSettingsForm>(toSettingsForm(null));
  const [allowanceMetric, setAllowanceMetric] = useState<BillingUsageUnitCode>('AI_ACTIONS');
  const [allowanceAdjustment, setAllowanceAdjustment] = useState(0);
  const [allowanceAdjustmentTouched, setAllowanceAdjustmentTouched] = useState(false);
  const [allowanceDescription, setAllowanceDescription] = useState('Manual allowance adjustment from platform admin');
  const [usageStartDate, setUsageStartDate] = useState('');
  const [usageEndDate, setUsageEndDate] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const organizationsQuery = useQuery({
    queryKey: ['platform-admin', 'organizations'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.listOrganizations(sessionToken as string);
      if (!response.success) throw new Error(response.error || 'Failed to load organizations');
      return (response.data as Tenant[]) || [];
    },
  });

  const selectedTenantQuery = useQuery({
    queryKey: ['platform-admin', 'organization', selectedTenantId],
    enabled: Boolean(sessionToken && selectedTenantId),
    queryFn: async () => {
      const response = await adminApiService.getOrganization(sessionToken as string, selectedTenantId);
      if (!response.success) throw new Error(response.error || 'Failed to load organization');
      return response.data as Tenant;
    },
  });

  const usageQuery = useQuery({
    queryKey: ['platform-admin', 'organization-usage', selectedTenantId, usageStartDate, usageEndDate],
    enabled: Boolean(sessionToken && selectedTenantId),
    queryFn: async () => {
      const response = await adminApiService.getTenantUsage(
        sessionToken as string,
        selectedTenantId,
        usageStartDate || undefined,
        usageEndDate || undefined
      );
      if (!response.success) throw new Error(response.error || 'Failed to load usage data');
      return response.data as TenantUsage;
    },
  });

  const billingQuery = useQuery({
    queryKey: ['platform-admin', 'organization-billing-v2', selectedTenantId],
    enabled: Boolean(sessionToken && selectedTenantId),
    queryFn: async () => {
      const response = await adminApiService.getOrganizationBilling(sessionToken as string, selectedTenantId);
      if (!response.success) throw new Error(response.error || 'Failed to load Billing V2 balances');
      return response.data as AdminOrganizationBilling;
    },
  });

  const organizationUsersQuery = useQuery({
    queryKey: ['platform-admin', 'organization-users', selectedTenantId],
    enabled: Boolean(sessionToken && selectedTenantId),
    queryFn: async () => {
      const response = await adminApiService.listOrganizationUsers(sessionToken as string, selectedTenantId);
      if (!response.success) throw new Error(response.error || 'Failed to load organization admins');
      return (response.data as OrganizationUser[]) || [];
    },
  });

  const selectedTenant = selectedTenantQuery.data
    || organizationsQuery.data?.find((tenant) => tenant.id === selectedTenantId)
    || null;

  useEffect(() => {
    setSettingsForm(toSettingsForm(selectedTenant));
    setDeleteConfirmation('');
  }, [selectedTenant]);

  const organizations = useMemo(() => organizationsQuery.data || [], [organizationsQuery.data]);

  const filteredOrganizations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return organizations.filter((tenant) => {
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' && tenant.isActive !== false)
        || (statusFilter === 'inactive' && tenant.isActive === false);
      const matchesSearch = !query
        || [tenant.name, tenant.contactEmail, tenant.contactName, tenant.industry]
          .some((value) => value?.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [organizations, searchTerm, statusFilter]);

  const orgSummary = useMemo(() => {
    const active = organizations.filter((org) => org.isActive !== false).length;
    const inactive = Math.max(organizations.length - active, 0);
    const totalRequests = organizations.reduce((sum, org) => sum + (org.totalRequests || 0), 0);
    return {total: organizations.length, active, inactive, totalRequests};
  }, [organizations]);

  const createFormError = useMemo(() => {
    if (!createForm.name.trim()) return 'Organization name is required.';
    if (createForm.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.contactEmail)) return 'Enter a valid email address.';
    if ((createForm.rateLimitPerHour ?? 0) <= 0) return 'Rate limit must be greater than 0.';
    if ((createForm.requestLimit ?? 0) <= 0) return 'Request limit must be greater than 0.';
    return '';
  }, [createForm]);

  const settingsFormError = useMemo(() => {
    if (!settingsForm.name.trim()) return 'Organization name is required.';
    if (settingsForm.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settingsForm.contactEmail)) return 'Enter a valid email address.';
    if (settingsForm.rateLimitPerHour <= 0) return 'Rate limit must be greater than 0.';
    if (settingsForm.requestLimit <= 0) return 'Request limit must be greater than 0.';
    return '';
  }, [settingsForm]);

  const usageDateError = usageStartDate && usageEndDate && usageStartDate > usageEndDate
    ? 'Start date must be before or equal to end date.'
    : '';

  const allowanceAdjustmentError = allowanceAdjustment === 0 ? 'Allowance adjustment cannot be 0.' : '';
  const allowanceDescriptionError = allowanceDescription.trim() ? '' : 'Description is required.';
  const allowanceFormError = allowanceAdjustmentError || allowanceDescriptionError;

  const createTenantMutation = useMutation({
    mutationFn: async (payload: CreateTenantRequest) => {
      const response = await adminApiService.createOrganization(sessionToken as string, {
        ...payload,
        contactEmail: payload.contactEmail || undefined,
        contactName: payload.contactName || undefined,
        industry: payload.industry || undefined,
        webhookUrl: payload.webhookUrl || undefined,
        dataStoragePreference: payload.dataStoragePreference || undefined,
      });
      if (!response.success) throw new Error(response.error || 'Failed to create organization');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Organization created');
      setCreateDialogOpen(false);
      setCreateForm(emptyCreateForm);
      queryClient.invalidateQueries({queryKey: ['platform-admin', 'organizations']});
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateTenantMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTenantId) throw new Error('Select an organization first');
      const response = await adminApiService.updateOrganization(sessionToken as string, selectedTenantId, {
        name: settingsForm.name.trim(),
        contactEmail: settingsForm.contactEmail.trim(),
        contactName: settingsForm.contactName.trim(),
        industry: settingsForm.industry.trim(),
        webhookUrl: settingsForm.webhookUrl.trim(),
        rateLimitPerHour: settingsForm.rateLimitPerHour,
        requestLimit: settingsForm.requestLimit,
        dataStoragePreference: settingsForm.dataStoragePreference.trim() || 'none',
        allowedDocumentTypes: splitDocumentTypes(settingsForm.allowedDocumentTypes),
        isActive: settingsForm.isActive,
      });
      if (!response.success) throw new Error(response.error || 'Failed to update organization');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Organization updated');
      queryClient.invalidateQueries({queryKey: ['platform-admin', 'organizations']});
      queryClient.invalidateQueries({queryKey: ['platform-admin', 'organization', selectedTenantId]});
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTenant) throw new Error('Select an organization first');
      const response = await adminApiService.updateOrganization(sessionToken as string, selectedTenant.id, {
        isActive: selectedTenant.isActive === false,
      });
      if (!response.success) throw new Error(response.error || 'Failed to update organization status');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Organization status updated');
      queryClient.invalidateQueries({queryKey: ['platform-admin', 'organizations']});
      queryClient.invalidateQueries({queryKey: ['platform-admin', 'organization', selectedTenantId]});
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const adjustAllowanceMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiService.adjustOrganizationAllowance(
        sessionToken as string,
        selectedTenantId,
        allowanceMetric,
        allowanceAdjustment,
        allowanceDescription
      );
      if (!response.success) throw new Error(response.error || 'Failed to adjust allowance');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Billing V2 allowance adjusted');
      setAllowanceAdjustment(0);
      setAllowanceAdjustmentTouched(false);
      queryClient.invalidateQueries({queryKey: ['platform-admin', 'organization-billing-v2', selectedTenantId]});
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rotateKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiService.rotateApiKey(sessionToken as string, selectedTenantId);
      if (!response.success) throw new Error(response.error || 'Failed to rotate API key');
      return response.data as {apiKey?: string};
    },
    onSuccess: (data) => {
      toast.success(data?.apiKey ? `API key rotated: ${data.apiKey}` : 'API key rotated');
      queryClient.invalidateQueries({queryKey: ['platform-admin', 'organizations']});
      queryClient.invalidateQueries({queryKey: ['platform-admin', 'organization', selectedTenantId]});
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteTenantMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiService.deleteOrganization(sessionToken as string, selectedTenantId);
      if (!response.success) throw new Error(response.error || 'Failed to delete organization');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Organization deleted');
      setSelectedTenantId('');
      setDeleteConfirmation('');
      queryClient.invalidateQueries({queryKey: ['platform-admin', 'organizations']});
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const copyValue = async (value?: string, label = 'Value') => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Unable to copy ${label.toLowerCase()}`);
    }
  };

  if (!sessionToken) {
    return (
      <div className="space-y-6">
        <PlatformModuleHeader title="Organizations" description="Create, manage, and operate organizations across the platform." />
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">Sign in as platform admin to load organizations.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlatformModuleHeader title="Organizations" description="Create, manage, and operate organizations across the platform." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricTile label="Total Organizations" value={orgSummary.total} helper="Tenant records" icon={<Building2 className="h-4 w-4" />} tone="info" />
        <AdminMetricTile label="Active" value={orgSummary.active} helper="Operational tenants" icon={<ShieldCheck className="h-4 w-4" />} tone="success" />
        <AdminMetricTile label="Inactive" value={orgSummary.inactive} helper="Paused tenants" icon={<ShieldOff className="h-4 w-4" />} tone="warning" />
        <AdminMetricTile label="Total Requests" value={orgSummary.totalRequests} helper="Across organizations" icon={<CreditCard className="h-4 w-4" />} />
      </div>

      <AdminSectionPanel
        title="Organization Directory"
        description="Search tenants, inspect configuration, and perform platform-admin operations."
        actions={(
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Create Organization</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Organization</DialogTitle>
                <DialogDescription>Create a tenant and send the initial admin setup invitation when contact email is present.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-1 md:grid-cols-2">
                <AdminFormField label="Name" htmlFor="org-name">
                  <Input id="org-name" value={createForm.name} onChange={(e) => setCreateForm((prev) => ({...prev, name: e.target.value}))} />
                </AdminFormField>
                <AdminFormField label="Contact Email" htmlFor="org-email">
                  <Input id="org-email" type="email" value={createForm.contactEmail || ''} onChange={(e) => setCreateForm((prev) => ({...prev, contactEmail: e.target.value}))} />
                </AdminFormField>
                <AdminFormField label="Contact Name" htmlFor="org-contact">
                  <Input id="org-contact" value={createForm.contactName || ''} onChange={(e) => setCreateForm((prev) => ({...prev, contactName: e.target.value}))} />
                </AdminFormField>
                <AdminFormField label="Industry" htmlFor="org-industry">
                  <Input id="org-industry" value={createForm.industry || ''} onChange={(e) => setCreateForm((prev) => ({...prev, industry: e.target.value}))} />
                </AdminFormField>
                <AdminFormField label="Webhook URL" htmlFor="org-webhook">
                  <Input id="org-webhook" value={createForm.webhookUrl || ''} onChange={(e) => setCreateForm((prev) => ({...prev, webhookUrl: e.target.value}))} />
                </AdminFormField>
                <AdminFormField label="Data Storage" htmlFor="org-storage">
                  <Input id="org-storage" value={createForm.dataStoragePreference || ''} onChange={(e) => setCreateForm((prev) => ({...prev, dataStoragePreference: e.target.value}))} placeholder="none" />
                </AdminFormField>
                <AdminFormField label="Rate Limit / Hour" htmlFor="org-rate-limit">
                  <Input id="org-rate-limit" type="number" value={createForm.rateLimitPerHour ?? 0} onChange={(e) => setCreateForm((prev) => ({...prev, rateLimitPerHour: Number(e.target.value)}))} />
                </AdminFormField>
                <AdminFormField label="Request Limit" htmlFor="org-request-limit">
                  <Input id="org-request-limit" type="number" value={createForm.requestLimit ?? 0} onChange={(e) => setCreateForm((prev) => ({...prev, requestLimit: Number(e.target.value)}))} />
                </AdminFormField>
              </div>
              {createFormError && <p className="text-xs text-destructive">{createFormError}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => createTenantMutation.mutate(createForm)} disabled={Boolean(createFormError) || createTenantMutation.isPending}>
                  {createTenantMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      >
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Search by name, contact, or industry" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {organizationsQuery.isError && (
          <Alert className="mb-4">
            <AlertTitle>Unable to load organizations</AlertTitle>
            <AlertDescription>{(organizationsQuery.error as Error).message}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 md:hidden">
          {organizationsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading organizations...</p>}
          {filteredOrganizations.map((tenant) => (
            <button
              type="button"
              key={tenant.id}
              onClick={() => setSelectedTenantId(tenant.id)}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{tenant.name}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{tenant.contactEmail || 'No contact email'}</p>
                </div>
                <Badge variant={tenant.isActive === false ? 'secondary' : 'default'}>{tenant.isActive === false ? 'Inactive' : 'Active'}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <span>Requests: <strong className="text-slate-800">{tenant.totalRequests ?? 0}</strong></span>
              </div>
            </button>
          ))}
        </div>

        <AdminTableShell className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizationsQuery.isLoading && (
                <TableRow><TableCell colSpan={6}>Loading organizations...</TableCell></TableRow>
              )}
              {!organizationsQuery.isLoading && filteredOrganizations.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-muted-foreground">No organizations found.</TableCell></TableRow>
              )}
              {filteredOrganizations.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.contactEmail || '-'}</TableCell>
                  <TableCell>{tenant.industry || '-'}</TableCell>
                  <TableCell>{tenant.totalRequests ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.isActive === false ? 'secondary' : 'default'}>{tenant.isActive === false ? 'Inactive' : 'Active'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedTenantId(tenant.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminTableShell>
      </AdminSectionPanel>

      <Sheet open={Boolean(selectedTenantId)} onOpenChange={(open) => !open && setSelectedTenantId('')}>
        <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-3xl">
          <SheetHeader className="border-b border-slate-200 px-5 py-4">
            <SheetTitle>{selectedTenant?.name || 'Organization'}</SheetTitle>
            <SheetDescription>{selectedTenant?.contactEmail || 'Tenant configuration and operations'}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {selectedTenantQuery.isError && (
              <Alert className="mb-4">
                <AlertTitle>Unable to load organization</AlertTitle>
                <AlertDescription>{(selectedTenantQuery.error as Error).message}</AlertDescription>
              </Alert>
            )}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid h-auto grid-cols-2 gap-1 md:grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
                <TabsTrigger value="billing">Billing V2</TabsTrigger>
                <TabsTrigger value="admins">Admins</TabsTrigger>
                <TabsTrigger value="danger">Danger</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminMetricTile label="AI Actions Remaining" value={billingQuery.data?.meters.find((meter) => meter.metric === 'AI_ACTIONS')?.remaining ?? '-'} helper="Billing V2" />
                  <AdminMetricTile label="Total Requests" value={selectedTenant?.totalRequests ?? 0} helper="Recorded on tenant" />
                  <AdminMetricTile label="Rate Limit / Hour" value={selectedTenant?.rateLimitPerHour ?? '-'} />
                  <AdminMetricTile label="Request Limit" value={selectedTenant?.requestLimit ?? '-'} />
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Info label="Contact Name" value={selectedTenant?.contactName} />
                    <Info label="Contact Email" value={selectedTenant?.contactEmail} />
                    <Info label="Industry" value={selectedTenant?.industry} />
                    <Info label="Data Storage" value={selectedTenant?.dataStoragePreference} />
                    <Info label="Created" value={formatDate(selectedTenant?.createdAt)} />
                    <Info label="Updated" value={formatDate(selectedTenant?.updatedAt)} />
                  </div>
                  <div className="mt-4 grid gap-3">
                    <SecretRow label="API Key" value={selectedTenant?.apiKey} onCopy={() => copyValue(selectedTenant?.apiKey, 'API key')} />
                    <SecretRow label="Webhook Secret" value={selectedTenant?.webhookSecret} onCopy={() => copyValue(selectedTenant?.webhookSecret, 'Webhook secret')} />
                    <Info label="Webhook URL" value={selectedTenant?.webhookUrl} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <AdminFormField label="Name" htmlFor="settings-name"><Input id="settings-name" value={settingsForm.name} onChange={(e) => setSettingsForm((prev) => ({...prev, name: e.target.value}))} /></AdminFormField>
                  <AdminFormField label="Contact Email" htmlFor="settings-email"><Input id="settings-email" type="email" value={settingsForm.contactEmail} onChange={(e) => setSettingsForm((prev) => ({...prev, contactEmail: e.target.value}))} /></AdminFormField>
                  <AdminFormField label="Contact Name" htmlFor="settings-contact"><Input id="settings-contact" value={settingsForm.contactName} onChange={(e) => setSettingsForm((prev) => ({...prev, contactName: e.target.value}))} /></AdminFormField>
                  <AdminFormField label="Industry" htmlFor="settings-industry"><Input id="settings-industry" value={settingsForm.industry} onChange={(e) => setSettingsForm((prev) => ({...prev, industry: e.target.value}))} /></AdminFormField>
                  <AdminFormField label="Webhook URL" htmlFor="settings-webhook"><Input id="settings-webhook" value={settingsForm.webhookUrl} onChange={(e) => setSettingsForm((prev) => ({...prev, webhookUrl: e.target.value}))} /></AdminFormField>
                  <AdminFormField label="Data Storage" htmlFor="settings-storage"><Input id="settings-storage" value={settingsForm.dataStoragePreference} onChange={(e) => setSettingsForm((prev) => ({...prev, dataStoragePreference: e.target.value}))} /></AdminFormField>
                  <AdminFormField label="Rate Limit / Hour" htmlFor="settings-rate"><Input id="settings-rate" type="number" value={settingsForm.rateLimitPerHour} onChange={(e) => setSettingsForm((prev) => ({...prev, rateLimitPerHour: Number(e.target.value)}))} /></AdminFormField>
                  <AdminFormField label="Request Limit" htmlFor="settings-request"><Input id="settings-request" type="number" value={settingsForm.requestLimit} onChange={(e) => setSettingsForm((prev) => ({...prev, requestLimit: Number(e.target.value)}))} /></AdminFormField>
                  <div className="md:col-span-2">
                    <AdminFormField label="Allowed Document Types" htmlFor="settings-doc-types">
                      <Input id="settings-doc-types" value={settingsForm.allowedDocumentTypes} onChange={(e) => setSettingsForm((prev) => ({...prev, allowedDocumentTypes: e.target.value}))} placeholder="Leave empty for unrestricted access" />
                    </AdminFormField>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 md:col-span-2">
                    <div>
                      <Label htmlFor="settings-active">Organization active</Label>
                      <p className="text-xs text-slate-500">Inactive tenants cannot operate through tenant auth.</p>
                    </div>
                    <Switch id="settings-active" checked={settingsForm.isActive} onCheckedChange={(checked) => setSettingsForm((prev) => ({...prev, isActive: checked}))} />
                  </div>
                </div>
                {settingsFormError && <p className="text-xs text-destructive">{settingsFormError}</p>}
                <Button onClick={() => updateTenantMutation.mutate()} disabled={Boolean(settingsFormError) || updateTenantMutation.isPending}>
                  {updateTenantMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </TabsContent>

              <TabsContent value="usage" className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <AdminFormField label="Start Date" htmlFor="usage-start"><Input id="usage-start" type="date" value={usageStartDate} onChange={(e) => setUsageStartDate(e.target.value)} /></AdminFormField>
                  <AdminFormField label="End Date" htmlFor="usage-end"><Input id="usage-end" type="date" value={usageEndDate} onChange={(e) => setUsageEndDate(e.target.value)} /></AdminFormField>
                  <div className="flex items-end"><Button className="w-full" onClick={() => usageQuery.refetch()} disabled={usageQuery.isFetching || Boolean(usageDateError)}>{usageQuery.isFetching ? 'Loading...' : 'Refresh'}</Button></div>
                </div>
                {usageDateError && <p className="text-xs text-destructive">{usageDateError}</p>}
                {usageQuery.isError && <p className="text-sm text-destructive">{(usageQuery.error as Error).message}</p>}
                {usageQuery.data && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <AdminMetricTile label="Total Requests" value={usageQuery.data.totalRequests} />
                    <AdminMetricTile label="Transcriptions" value={usageQuery.data.totalTranscriptions} />
                    <AdminMetricTile label="Documents" value={usageQuery.data.totalDocumentsGenerated} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="billing" className="space-y-4">
                {billingQuery.isError && <p className="text-sm text-destructive">{(billingQuery.error as Error).message}</p>}
                <div className="grid gap-3 sm:grid-cols-2">
                  {(billingQuery.data?.meters || []).map((meter) => (
                    <AdminMetricTile
                      key={meter.metric}
                      label={meter.metric === 'AI_ACTIONS' ? 'AI Actions Remaining' : 'Transcription Seconds Remaining'}
                      value={meter.remaining}
                      helper={`${meter.allowance} total · ${meter.used} used · resets ${formatDate(billingQuery.data?.periodEnd)}`}
                      icon={<CreditCard className="h-4 w-4" />}
                    />
                  ))}
                </div>
                <div className="grid gap-3">
                  <AdminFormField label="Billing Meter" htmlFor="allowance-metric">
                    <Select value={allowanceMetric} onValueChange={(value) => setAllowanceMetric(value as BillingUsageUnitCode)}>
                      <SelectTrigger id="allowance-metric"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AI_ACTIONS">AI actions</SelectItem>
                        <SelectItem value="TRANSCRIPTION_SECONDS">Transcription seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </AdminFormField>
                  <AdminFormField
                    label="Allowance Adjustment"
                    htmlFor="allowance-adjustment"
                    errorText={allowanceAdjustmentTouched ? allowanceAdjustmentError || undefined : undefined}
                  >
                    <Input
                      id="allowance-adjustment"
                      type="number"
                      value={allowanceAdjustment}
                      onChange={(e) => {
                        setAllowanceAdjustmentTouched(true);
                        setAllowanceAdjustment(Number(e.target.value));
                      }}
                    />
                  </AdminFormField>
                  <AdminFormField label="Description" htmlFor="allowance-description" errorText={allowanceDescriptionError || undefined}>
                    <Input id="allowance-description" value={allowanceDescription} onChange={(e) => setAllowanceDescription(e.target.value)} />
                  </AdminFormField>
                </div>
                <Button onClick={() => adjustAllowanceMutation.mutate()} disabled={Boolean(allowanceFormError) || adjustAllowanceMutation.isPending}>
                  {adjustAllowanceMutation.isPending ? 'Applying...' : 'Apply Allowance Adjustment'}
                </Button>
              </TabsContent>

              <TabsContent value="admins" className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">View organization users provisioned under this tenant.</p>
                  <Button size="sm" variant="outline" onClick={() => organizationUsersQuery.refetch()} disabled={organizationUsersQuery.isFetching}>
                    {organizationUsersQuery.isFetching ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
                {organizationUsersQuery.isError && <p className="text-sm text-destructive">{(organizationUsersQuery.error as Error).message}</p>}
                <AdminTableShell>
                  <Table>
                    <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Last Login</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {organizationUsersQuery.isLoading && <TableRow><TableCell colSpan={4}>Loading users...</TableCell></TableRow>}
                      {!organizationUsersQuery.isLoading && (organizationUsersQuery.data || []).length === 0 && <TableRow><TableCell colSpan={4} className="text-muted-foreground">No organization users found.</TableCell></TableRow>}
                      {(organizationUsersQuery.data || []).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="font-medium">{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </TableCell>
                          <TableCell>{user.role || '-'}</TableCell>
                          <TableCell><Badge variant={user.isActive === false ? 'secondary' : 'default'}>{user.isActive === false ? 'Inactive' : 'Active'}</Badge></TableCell>
                          <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AdminTableShell>
              </TabsContent>

              <TabsContent value="danger" className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-950">{settingsForm.isActive ? 'Deactivate organization' : 'Activate organization'}</p>
                      <p className="text-sm text-slate-500">Toggle operational access without deleting tenant data.</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => toggleStatusMutation.mutate()}
                      disabled={toggleStatusMutation.isPending}
                    >
                      {selectedTenant?.isActive === false ? 'Activate' : 'Deactivate'}
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <Trash2 className="mt-0.5 h-4 w-4 text-red-700" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-red-950">Permanently delete organization</p>
                      <p className="mt-1 text-sm text-red-700">This calls the backend hard-delete path and cannot be undone.</p>
                      <div className="mt-3 grid gap-2">
                        <Label htmlFor="delete-confirmation">Type {selectedTenant?.name || 'organization name'} to confirm</Label>
                        <Input id="delete-confirmation" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} />
                      </div>
                      <Button
                        className="mt-3"
                        variant="destructive"
                        onClick={() => deleteTenantMutation.mutate()}
                        disabled={!selectedTenant || deleteConfirmation !== selectedTenant.name || deleteTenantMutation.isPending}
                      >
                        {deleteTenantMutation.isPending ? 'Deleting...' : 'Delete Organization'}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Info({label, value}: {label: string; value?: string | number | null}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-950">{value || '-'}</p>
    </div>
  );
}

function SecretRow({label, value, onCopy}: {label: string; value?: string; onCopy: () => void}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className="mt-1 truncate font-mono text-sm text-slate-950">{maskSecret(value)}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onCopy} disabled={!value}>
        <Copy className="mr-2 h-4 w-4" />
        Copy
      </Button>
    </div>
  );
}
