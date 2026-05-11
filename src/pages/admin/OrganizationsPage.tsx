import {useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';
import type {CreateTenantRequest, Tenant, TenantUsage} from '@/types/platformAdmin';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import AdminFormField from '@/components/admin/AdminFormField';
import {AdminMetricTile, AdminTableShell} from '@/components/admin/AdminSurface';
import {toast} from 'sonner';
import {Building2, CreditCard, ShieldCheck, ShieldOff} from 'lucide-react';

export default function OrganizationsPage() {
  const { sessionToken } = useAdminAuth();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [createForm, setCreateForm] = useState<CreateTenantRequest>({
    name: '',
    contactEmail: '',
    contactName: '',
    industry: '',
    initialCredits: 0,
    rateLimitPerHour: 1000,
    requestLimit: 100,
  });
  const [creditAdjustment, setCreditAdjustment] = useState<number>(0);
  const [creditDescription, setCreditDescription] = useState('Manual adjustment from platform admin');
  const [usageTenantId, setUsageTenantId] = useState<string>('');
  const [usageStartDate, setUsageStartDate] = useState<string>('');
  const [usageEndDate, setUsageEndDate] = useState<string>('');

  const organizationsQuery = useQuery({
    queryKey: ['platform-admin', 'organizations'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.listOrganizations(sessionToken as string);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load organizations');
      }

      return (response.data as Tenant[]) || [];
    },
  });

  const createTenantMutation = useMutation({
    mutationFn: async (payload: CreateTenantRequest) => {
      const response = await adminApiService.createOrganization(sessionToken as string, payload);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create organization');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Organization created');
      setCreateDialogOpen(false);
      setCreateForm({
        name: '',
        contactEmail: '',
        contactName: '',
        industry: '',
        initialCredits: 0,
        rateLimitPerHour: 1000,
        requestLimit: 100,
      });
      queryClient.invalidateQueries({ queryKey: ['platform-admin', 'organizations'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const adjustCreditsMutation = useMutation({
    mutationFn: async (payload: { tenantId: string; adjustment: number; description: string }) => {
      const response = await adminApiService.manageCredits(
        sessionToken as string,
        payload.tenantId,
        payload.adjustment,
        payload.description
      );
      if (!response.success) {
        throw new Error(response.error || 'Failed to adjust credits');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Credits adjusted');
      setSelectedTenant(null);
      setCreditAdjustment(0);
      queryClient.invalidateQueries({ queryKey: ['platform-admin', 'organizations'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateTenantMutation = useMutation({
    mutationFn: async (payload: { tenantId: string; isActive: boolean }) => {
      const response = await adminApiService.updateOrganization(sessionToken as string, payload.tenantId, {
        isActive: payload.isActive,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to update organization state');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Organization updated');
      queryClient.invalidateQueries({ queryKey: ['platform-admin', 'organizations'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rotateKeyMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await adminApiService.rotateApiKey(sessionToken as string, tenantId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to rotate API key');
      }
      return response.data as { apiKey?: string };
    },
    onSuccess: (data) => {
      toast.success(data?.apiKey ? `API key rotated: ${data.apiKey}` : 'API key rotated');
      queryClient.invalidateQueries({ queryKey: ['platform-admin', 'organizations'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const organizations = useMemo(() => organizationsQuery.data || [], [organizationsQuery.data]);

  const orgSummary = useMemo(() => {
    const active = organizations.filter((org) => Boolean(org.isActive)).length;
    const inactive = Math.max(organizations.length - active, 0);
    const credits = organizations.reduce((sum, org) => sum + (org.credits || 0), 0);
    return {
      total: organizations.length,
      active,
      inactive,
      credits,
    };
  }, [organizations]);

  const createFormErrors = useMemo(() => {
    const errors: Partial<Record<keyof CreateTenantRequest, string>> = {};
    if (!createForm.name?.trim()) {
      errors.name = 'Organization name is required.';
    }
    if (createForm.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.contactEmail)) {
      errors.contactEmail = 'Enter a valid email address.';
    }
    if ((createForm.initialCredits ?? 0) < 0) {
      errors.initialCredits = 'Initial credits cannot be negative.';
    }
    if ((createForm.rateLimitPerHour ?? 0) <= 0) {
      errors.rateLimitPerHour = 'Rate limit must be greater than 0.';
    }
    if ((createForm.requestLimit ?? 0) <= 0) {
      errors.requestLimit = 'Request limit must be greater than 0.';
    }
    return errors;
  }, [createForm]);

  const usageDateError = useMemo(() => {
    if (!usageStartDate || !usageEndDate) {
      return '';
    }
    if (usageStartDate > usageEndDate) {
      return 'Start date must be before or equal to end date.';
    }
    return '';
  }, [usageEndDate, usageStartDate]);

  const creditFormError = useMemo(() => {
    if (!creditDescription.trim()) {
      return 'Description is required.';
    }
    if (creditAdjustment === 0) {
      return 'Credit adjustment cannot be 0.';
    }
    return '';
  }, [creditAdjustment, creditDescription]);

  const isCreateFormValid = Object.keys(createFormErrors).length === 0;

  const usageQuery = useQuery({
    queryKey: ['platform-admin', 'organization-usage', usageTenantId, usageStartDate, usageEndDate],
    enabled: Boolean(sessionToken && usageTenantId),
    queryFn: async () => {
      const response = await adminApiService.getTenantUsage(
        sessionToken as string,
        usageTenantId,
        usageStartDate || undefined,
        usageEndDate || undefined
      );
      if (!response.success) {
        throw new Error(response.error || 'Failed to load usage data');
      }
      return response.data as TenantUsage;
    },
  });

  if (!sessionToken) {
    return (
      <div className="space-y-6">
        <PlatformModuleHeader
          title="Organizations"
          description="Create, manage, and operate organizations across the platform."
        />
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Sign in as platform admin to load organizations.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlatformModuleHeader
        title="Organizations"
        description="Create, manage, and operate organizations across the platform."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricTile label="Total Organizations" value={orgSummary.total} helper="Tenant records" icon={<Building2 className="h-4 w-4" />} tone="info" />
        <AdminMetricTile label="Active" value={orgSummary.active} helper="Operational tenants" icon={<ShieldCheck className="h-4 w-4" />} tone="success" />
        <AdminMetricTile label="Inactive" value={orgSummary.inactive} helper="Paused tenants" icon={<ShieldOff className="h-4 w-4" />} tone="warning" />
        <AdminMetricTile label="Total Credits" value={orgSummary.credits} helper="Credits across tenants" icon={<CreditCard className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tenant Directory</CardTitle>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Create Organization</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Organization</DialogTitle>
                <DialogDescription>Create a new tenant on the platform.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div>
                  <Label htmlFor="org-name">Name</Label>
                  <Input
                    id="org-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  {createFormErrors.name && <p className="text-xs text-destructive mt-1">{createFormErrors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="org-email">Contact Email</Label>
                  <Input
                    id="org-email"
                    type="email"
                    value={createForm.contactEmail || ''}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  />
                  {createFormErrors.contactEmail && (
                    <p className="text-xs text-destructive mt-1">{createFormErrors.contactEmail}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="org-contact">Contact Name</Label>
                  <Input
                    id="org-contact"
                    value={createForm.contactName || ''}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, contactName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="org-industry">Industry</Label>
                  <Input
                    id="org-industry"
                    value={createForm.industry || ''}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, industry: e.target.value }))}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                  <Label htmlFor="org-credits">Initial Credits</Label>
                  <Input
                    id="org-credits"
                    type="number"
                    value={createForm.initialCredits ?? 0}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, initialCredits: Number(e.target.value) }))}
                  />
                    {createFormErrors.initialCredits && (
                      <p className="text-xs text-destructive mt-1">{createFormErrors.initialCredits}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="org-rate-limit">Rate Limit / Hour</Label>
                    <Input
                      id="org-rate-limit"
                      type="number"
                      value={createForm.rateLimitPerHour ?? 0}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, rateLimitPerHour: Number(e.target.value) }))}
                    />
                    {createFormErrors.rateLimitPerHour && (
                      <p className="text-xs text-destructive mt-1">{createFormErrors.rateLimitPerHour}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="org-request-limit">Request Limit</Label>
                    <Input
                      id="org-request-limit"
                      type="number"
                      value={createForm.requestLimit ?? 0}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, requestLimit: Number(e.target.value) }))}
                    />
                    {createFormErrors.requestLimit && (
                      <p className="text-xs text-destructive mt-1">{createFormErrors.requestLimit}</p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createTenantMutation.mutate(createForm)}
                  disabled={!isCreateFormValid || createTenantMutation.isPending}
                >
                  {createTenantMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <AdminTableShell>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizationsQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={6}>Loading organizations...</TableCell>
                </TableRow>
              )}
              {organizationsQuery.isError && (
                <TableRow>
                  <TableCell colSpan={6} className="text-destructive">
                    {(organizationsQuery.error as Error).message}
                  </TableCell>
                </TableRow>
              )}
              {!organizationsQuery.isLoading && organizations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">No organizations found.</TableCell>
                </TableRow>
              )}
              {organizations.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.contactEmail || '-'}</TableCell>
                  <TableCell>{tenant.credits ?? 0}</TableCell>
                  <TableCell>{tenant.totalRequests ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTenant(tenant);
                        setCreditAdjustment(0);
                      }}
                    >
                      Credits
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rotateKeyMutation.mutate(tenant.id)}
                      disabled={rotateKeyMutation.isPending}
                    >
                      Rotate Key
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateTenantMutation.mutate({
                          tenantId: tenant.id,
                          isActive: !tenant.isActive,
                        })
                      }
                      disabled={updateTenantMutation.isPending}
                    >
                      {tenant.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </AdminTableShell>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Organization Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <AdminFormField label="Organization" htmlFor="usage-tenant">
              <Select value={usageTenantId || undefined} onValueChange={setUsageTenantId}>
                <SelectTrigger id="usage-tenant">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AdminFormField>
            <AdminFormField label="Start Date" htmlFor="usage-start">
              <Input
                id="usage-start"
                type="date"
                value={usageStartDate}
                onChange={(e) => setUsageStartDate(e.target.value)}
              />
            </AdminFormField>
            <AdminFormField label="End Date" htmlFor="usage-end">
              <Input
                id="usage-end"
                type="date"
                value={usageEndDate}
                onChange={(e) => setUsageEndDate(e.target.value)}
              />
            </AdminFormField>
            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={() => usageQuery.refetch()}
                disabled={!usageTenantId || usageQuery.isFetching || Boolean(usageDateError)}
              >
                {usageQuery.isFetching ? 'Loading...' : 'Load Usage'}
              </Button>
            </div>
          </div>
          {usageDateError && <p className="text-xs text-destructive mt-2">{usageDateError}</p>}

          <div className="mt-4 text-xs text-muted-foreground">
            Quick select organization:
            <div className="mt-2 flex flex-wrap gap-2">
              {organizations.slice(0, 8).map((org) => (
                <Button
                  key={org.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setUsageTenantId(org.id)}
                >
                  {org.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {usageQuery.isError && (
              <p className="text-sm text-destructive">{(usageQuery.error as Error).message}</p>
            )}
            {!usageQuery.isError && usageQuery.data && (
              <Tabs defaultValue="summary">
                <TabsList>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="limits">Limits</TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="mt-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <AdminMetricTile label="Credits" value={usageQuery.data.credits} />
                    <AdminMetricTile label="Total Requests" value={usageQuery.data.totalRequests} />
                    <AdminMetricTile label="Transcriptions" value={usageQuery.data.totalTranscriptions} />
                    <AdminMetricTile label="Documents Generated" value={usageQuery.data.totalDocumentsGenerated} />
                  </div>
                </TabsContent>
                <TabsContent value="limits" className="mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <AdminMetricTile label="Rate Limit Per Hour" value={usageQuery.data.rateLimitPerHour} />
                    <AdminMetricTile label="Request Limit" value={usageQuery.data.requestLimit} />
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedTenant)} onOpenChange={(open) => !open && setSelectedTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription>
              {selectedTenant ? `Apply credit changes for ${selectedTenant.name}.` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <AdminFormField label="Credit Adjustment" htmlFor="credit-adjustment">
              <Input
                id="credit-adjustment"
                type="number"
                value={creditAdjustment}
                onChange={(e) => setCreditAdjustment(Number(e.target.value))}
              />
            </AdminFormField>
            <AdminFormField label="Description" htmlFor="credit-description" errorText={creditFormError || undefined}>
              <Input
                id="credit-description"
                value={creditDescription}
                onChange={(e) => setCreditDescription(e.target.value)}
              />
            </AdminFormField>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!selectedTenant) {
                  return;
                }
                adjustCreditsMutation.mutate({
                  tenantId: selectedTenant.id,
                  adjustment: creditAdjustment,
                  description: creditDescription,
                });
              }}
              disabled={!selectedTenant || adjustCreditsMutation.isPending || Boolean(creditFormError)}
            >
              {adjustCreditsMutation.isPending ? 'Updating...' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
