import {useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
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
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {adminApiService} from '@/services/adminApiService';
import type {CreatePlanRequest, PaymentTransaction, PaymentWebhookEvent, Plan, Tenant} from '@/types/platformAdmin';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import {toast} from 'sonner';

export default function PlansBillingPage() {
  const { sessionToken } = useAdminAuth();
  const queryClient = useQueryClient();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);

  const [planForm, setPlanForm] = useState<CreatePlanRequest>({
    name: '',
    description: '',
    planScope: 'B2B',
    isActive: true,
    isDefault: false,
    refreshTimezone: 'UTC',
  });

  const [assignment, setAssignment] = useState({
    organizationId: '',
    planId: '',
    provider: 'manual',
    status: 'ACTIVE',
    timezone: 'UTC',
  });

  const [featureForm, setFeatureForm] = useState({
    planId: '',
    featureCode: 'AI_DOCUMENT',
    usageUnit: 'DOCUMENT_INPUT_TOKENS' as 'DOCUMENT_INPUT_TOKENS' | 'DOCUMENT_OUTPUT_TOKENS' | 'TRANSCRIPTION_MINUTES',
    windowType: 'MONTHLY' as 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY',
    limitValue: 0,
    isEnabled: true,
  });

  const [priceForm, setPriceForm] = useState({
    planId: '',
    provider: 'stripe',
    currency: 'USD',
    amountCents: 1000,
    billingInterval: 'MONTH' as 'MONTH' | 'YEAR',
    regionCode: '',
    countryCode: 'US',
    isDefault: true,
    isActive: true,
  });

  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    action: 'NOTE',
    reason: 'manual-review',
    note: '',
  });

  const plansQuery = useQuery({
    queryKey: ['platform-admin', 'plans', 'B2B'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.listPlans(sessionToken as string, 'B2B');
      if (!response.success) {
        throw new Error(response.error || 'Failed to load plans');
      }
      return (response.data as Plan[]) || [];
    },
  });

  const organizationsQuery = useQuery({
    queryKey: ['platform-admin', 'organizations', 'for-contracts'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.listOrganizations(sessionToken as string);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load organizations');
      }
      return (response.data as Tenant[]) || [];
    },
  });

  const transactionsQuery = useQuery({
    queryKey: ['platform-admin', 'payment-transactions'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.listPaymentTransactions(sessionToken as string);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load payment transactions');
      }

      const maybeArray = Array.isArray(response.data)
        ? response.data
        : (response.data as { content?: PaymentTransaction[] })?.content || [];
      return maybeArray as PaymentTransaction[];
    },
  });

  const webhookEventsQuery = useQuery({
    queryKey: ['platform-admin', 'payment-webhook-events'],
    enabled: Boolean(sessionToken),
    queryFn: async () => {
      const response = await adminApiService.listWebhookEvents(sessionToken as string);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load webhook events');
      }

      const maybeArray = Array.isArray(response.data)
        ? response.data
        : (response.data as { content?: PaymentWebhookEvent[] })?.content || [];
      return maybeArray as PaymentWebhookEvent[];
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (payload: CreatePlanRequest) => {
      const response = await adminApiService.createPlan(sessionToken as string, payload);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create plan');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Plan created');
      setCreateDialogOpen(false);
      setPlanForm({
        name: '',
        description: '',
        planScope: 'B2B',
        isActive: true,
        isDefault: false,
        refreshTimezone: 'UTC',
      });
      queryClient.invalidateQueries({ queryKey: ['platform-admin', 'plans', 'B2B'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const assignContractMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiService.assignContractPlan(sessionToken as string, assignment.organizationId, {
        planId: assignment.planId,
        provider: assignment.provider,
        status: assignment.status,
        timezone: assignment.timezone,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to assign contract plan');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Contract plan assigned');
      setAssignment({
        organizationId: '',
        planId: '',
        provider: 'manual',
        status: 'ACTIVE',
        timezone: 'UTC',
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addFeatureMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiService.addPlanFeature(sessionToken as string, featureForm.planId, {
        featureCode: featureForm.featureCode,
        usageUnit: featureForm.usageUnit,
        windowType: featureForm.windowType,
        limitValue: Number(featureForm.limitValue),
        isEnabled: featureForm.isEnabled,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to add plan feature');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Plan feature created');
      setFeatureDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addPriceMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiService.addPlanPrice(sessionToken as string, priceForm.planId, {
        provider: priceForm.provider,
        currency: priceForm.currency,
        amountCents: Number(priceForm.amountCents),
        billingInterval: priceForm.billingInterval,
        regionCode: priceForm.regionCode || undefined,
        countryCode: priceForm.countryCode || undefined,
        isDefault: priceForm.isDefault,
        isActive: priceForm.isActive,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to add plan price');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Plan price created');
      setPriceDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const manualAdjustmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTransaction?.id) {
        throw new Error('No transaction selected');
      }
      const response = await adminApiService.createManualPaymentAdjustment(sessionToken as string, selectedTransaction.id, {
        action: adjustmentForm.action,
        reason: adjustmentForm.reason,
        note: adjustmentForm.note || undefined,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to record manual adjustment');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Manual payment adjustment recorded');
      setAdjustmentDialogOpen(false);
      setAdjustmentForm({ action: 'NOTE', reason: 'manual-review', note: '' });
      queryClient.invalidateQueries({ queryKey: ['platform-admin', 'payment-transactions'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const plans = useMemo(() => plansQuery.data || [], [plansQuery.data]);
  const organizations = useMemo(() => organizationsQuery.data || [], [organizationsQuery.data]);
  const transactions = useMemo(() => transactionsQuery.data || [], [transactionsQuery.data]);
  const webhookEvents = useMemo(() => webhookEventsQuery.data || [], [webhookEventsQuery.data]);

  const sortedPlanOptions = useMemo(
    () => plans.map((plan) => ({ value: plan.id, label: `${plan.name} (${plan.id.slice(0, 8)})` })),
    [plans]
  );
  const sortedOrgOptions = useMemo(
    () => organizations.map((org) => ({ value: org.id, label: `${org.name} (${org.id.slice(0, 8)})` })),
    [organizations]
  );

  const createPlanError = useMemo(() => {
    if (!planForm.name.trim()) {
      return 'Plan name is required.';
    }
    return '';
  }, [planForm.name]);

  const assignmentError = useMemo(() => {
    if (!assignment.organizationId) {
      return 'Select an organization.';
    }
    if (!assignment.planId) {
      return 'Select a plan.';
    }
    if (!assignment.provider.trim()) {
      return 'Provider is required.';
    }
    return '';
  }, [assignment.organizationId, assignment.planId, assignment.provider]);

  const featureError = useMemo(() => {
    if (!featureForm.planId) {
      return 'Select a plan.';
    }
    if (!featureForm.featureCode.trim()) {
      return 'Feature code is required.';
    }
    if (Number(featureForm.limitValue) < 0) {
      return 'Limit value must be 0 or greater.';
    }
    return '';
  }, [featureForm.featureCode, featureForm.limitValue, featureForm.planId]);

  const priceError = useMemo(() => {
    if (!priceForm.planId) {
      return 'Select a plan.';
    }
    if (!priceForm.provider.trim()) {
      return 'Provider is required.';
    }
    if (!priceForm.currency.trim()) {
      return 'Currency is required.';
    }
    if (Number(priceForm.amountCents) <= 0) {
      return 'Amount must be greater than 0.';
    }
    return '';
  }, [priceForm.amountCents, priceForm.currency, priceForm.planId, priceForm.provider]);

  const adjustmentError = useMemo(() => {
    if (!adjustmentForm.action.trim()) {
      return 'Action is required.';
    }
    if (!adjustmentForm.reason.trim()) {
      return 'Reason is required.';
    }
    return '';
  }, [adjustmentForm.action, adjustmentForm.reason]);

  if (!sessionToken) {
    return (
      <div>
        <PlatformModuleHeader
          title="Plans and Billing"
          description="Control plan catalog, pricing, contracts, and operational payment visibility."
        />
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Sign in as platform admin to load billing operations.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PlatformModuleHeader
        title="Plans and Billing"
        description="Control plan catalog, pricing, contracts, and operational payment visibility."
      />

      <div className="grid gap-4 mb-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">B2B Plans</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{plans.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Organizations</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{organizations.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{transactions.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Webhook Events</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{webhookEvents.length}</CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>B2B Plans</CardTitle>
            <div className="flex items-center gap-2">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">Create Plan</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create B2B Plan</DialogTitle>
                    <DialogDescription>Create a platform-managed plan for organizations.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div>
                      <Label htmlFor="plan-name">Name</Label>
                      <Input
                        id="plan-name"
                        value={planForm.name}
                        onChange={(e) => setPlanForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                      {createPlanError && <p className="text-xs text-destructive mt-1">{createPlanError}</p>}
                    </div>
                    <div>
                      <Label htmlFor="plan-description">Description</Label>
                      <Input
                        id="plan-description"
                        value={planForm.description || ''}
                        onChange={(e) => setPlanForm((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => createPlanMutation.mutate(planForm)}
                      disabled={Boolean(createPlanError) || createPlanMutation.isPending}
                    >
                      {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">Add Feature</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Plan Feature</DialogTitle>
                    <DialogDescription>Add a usage entitlement to a plan.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div>
                      <Label htmlFor="feature-plan-id">Plan</Label>
                      <Select value={featureForm.planId || undefined} onValueChange={(value) => setFeatureForm((prev) => ({ ...prev, planId: value }))}>
                        <SelectTrigger id="feature-plan-id">
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedPlanOptions.map((plan) => (
                            <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="feature-code">Feature Code</Label>
                      <Input
                        id="feature-code"
                        value={featureForm.featureCode}
                        onChange={(e) => setFeatureForm((prev) => ({ ...prev, featureCode: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Usage Unit</Label>
                      <Select
                        value={featureForm.usageUnit}
                        onValueChange={(value) => setFeatureForm((prev) => ({ ...prev, usageUnit: value as any }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DOCUMENT_INPUT_TOKENS">DOCUMENT_INPUT_TOKENS</SelectItem>
                          <SelectItem value="DOCUMENT_OUTPUT_TOKENS">DOCUMENT_OUTPUT_TOKENS</SelectItem>
                          <SelectItem value="TRANSCRIPTION_MINUTES">TRANSCRIPTION_MINUTES</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Window Type</Label>
                      <Select
                        value={featureForm.windowType}
                        onValueChange={(value) => setFeatureForm((prev) => ({ ...prev, windowType: value as any }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HOURLY">HOURLY</SelectItem>
                          <SelectItem value="DAILY">DAILY</SelectItem>
                          <SelectItem value="WEEKLY">WEEKLY</SelectItem>
                          <SelectItem value="MONTHLY">MONTHLY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="feature-limit">Limit Value</Label>
                      <Input
                        id="feature-limit"
                        type="number"
                        value={featureForm.limitValue}
                        onChange={(e) => setFeatureForm((prev) => ({ ...prev, limitValue: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => addFeatureMutation.mutate()}
                      disabled={Boolean(featureError) || addFeatureMutation.isPending}
                    >
                      {addFeatureMutation.isPending ? 'Adding...' : 'Add Feature'}
                    </Button>
                  </DialogFooter>
                  {featureError && <p className="text-xs text-destructive">{featureError}</p>}
                </DialogContent>
              </Dialog>

              <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">Add Price</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Plan Price</DialogTitle>
                    <DialogDescription>Attach a provider price entry to a plan.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div>
                      <Label htmlFor="price-plan-id">Plan</Label>
                      <Select value={priceForm.planId || undefined} onValueChange={(value) => setPriceForm((prev) => ({ ...prev, planId: value }))}>
                        <SelectTrigger id="price-plan-id">
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedPlanOptions.map((plan) => (
                            <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label htmlFor="price-provider">Provider</Label>
                        <Input
                          id="price-provider"
                          value={priceForm.provider}
                          onChange={(e) => setPriceForm((prev) => ({ ...prev, provider: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="price-currency">Currency</Label>
                        <Input
                          id="price-currency"
                          value={priceForm.currency}
                          onChange={(e) => setPriceForm((prev) => ({ ...prev, currency: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label htmlFor="price-amount">Amount (cents)</Label>
                        <Input
                          id="price-amount"
                          type="number"
                          value={priceForm.amountCents}
                          onChange={(e) => setPriceForm((prev) => ({ ...prev, amountCents: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label>Billing Interval</Label>
                        <Select
                          value={priceForm.billingInterval}
                          onValueChange={(value) => setPriceForm((prev) => ({ ...prev, billingInterval: value as any }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MONTH">MONTH</SelectItem>
                            <SelectItem value="YEAR">YEAR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label htmlFor="price-country">Country</Label>
                        <Input
                          id="price-country"
                          value={priceForm.countryCode}
                          onChange={(e) => setPriceForm((prev) => ({ ...prev, countryCode: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="price-region">Region</Label>
                        <Input
                          id="price-region"
                          value={priceForm.regionCode}
                          onChange={(e) => setPriceForm((prev) => ({ ...prev, regionCode: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => addPriceMutation.mutate()}
                      disabled={Boolean(priceError) || addPriceMutation.isPending}
                    >
                      {addPriceMutation.isPending ? 'Adding...' : 'Add Price'}
                    </Button>
                  </DialogFooter>
                  {priceError && <p className="text-xs text-destructive">{priceError}</p>}
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timezone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plansQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={6}>Loading plans...</TableCell>
                  </TableRow>
                )}
                {plansQuery.isError && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-destructive">
                      {(plansQuery.error as Error).message}
                    </TableCell>
                  </TableRow>
                )}
                {!plansQuery.isLoading && plans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">No plans found.</TableCell>
                  </TableRow>
                )}
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-mono text-xs">{plan.id}</TableCell>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{plan.description || '-'}</TableCell>
                    <TableCell>{plan.planScope}</TableCell>
                    <TableCell>
                      <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{plan.refreshTimezone || 'UTC'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-3">
              Tip: click a plan row ID from your API tooling and paste it into Add Feature/Add Price forms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign Contract Plan To Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="assignment-org">Organization</Label>
                <Select value={assignment.organizationId || undefined} onValueChange={(value) => setAssignment((prev) => ({ ...prev, organizationId: value }))}>
                  <SelectTrigger id="assignment-org">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedOrgOptions.map((org) => (
                      <SelectItem key={org.value} value={org.value}>{org.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assignment-plan">Plan</Label>
                <Select value={assignment.planId || undefined} onValueChange={(value) => setAssignment((prev) => ({ ...prev, planId: value }))}>
                  <SelectTrigger id="assignment-plan">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedPlanOptions.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assignment-provider">Provider</Label>
                <Input
                  id="assignment-provider"
                  value={assignment.provider}
                  onChange={(e) => setAssignment((prev) => ({ ...prev, provider: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="assignment-timezone">Timezone</Label>
                <Input
                  id="assignment-timezone"
                  value={assignment.timezone}
                  onChange={(e) => setAssignment((prev) => ({ ...prev, timezone: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={() => assignContractMutation.mutate()}
                disabled={Boolean(assignmentError) || assignContractMutation.isPending}
              >
                {assignContractMutation.isPending ? 'Assigning...' : 'Assign Contract Plan'}
              </Button>
              <p className="text-sm text-muted-foreground">Use B2B plan IDs from the table above.</p>
            </div>
            {assignmentError && <p className="text-xs text-destructive mt-2">{assignmentError}</p>}

            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Organization IDs</p>
              <div className="space-y-1 text-sm text-muted-foreground max-h-40 overflow-auto">
                {organizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between border rounded px-2 py-1">
                    <span>{org.name}</span>
                    <button
                      type="button"
                      className="text-primary"
                      onClick={() => setAssignment((prev) => ({ ...prev, organizationId: org.id }))}
                    >
                      {org.id}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={6}>Loading transactions...</TableCell>
                  </TableRow>
                )}
                {transactionsQuery.isError && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-destructive">
                      {(transactionsQuery.error as Error).message}
                    </TableCell>
                  </TableRow>
                )}
                {!transactionsQuery.isLoading && transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">No transactions available.</TableCell>
                  </TableRow>
                )}
                {transactions.slice(0, 30).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-xs">{transaction.id}</TableCell>
                    <TableCell>{transaction.provider || '-'}</TableCell>
                    <TableCell>{transaction.amountCents ?? '-'}</TableCell>
                    <TableCell>{transaction.currency || '-'}</TableCell>
                    <TableCell>{transaction.status || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setAdjustmentDialogOpen(true);
                        }}
                      >
                        Manual Adjustment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Webhook Events</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => webhookEventsQuery.refetch()}
              disabled={webhookEventsQuery.isFetching}
            >
              {webhookEventsQuery.isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhookEventsQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={5}>Loading webhook events...</TableCell>
                  </TableRow>
                )}
                {webhookEventsQuery.isError && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-destructive">
                      {(webhookEventsQuery.error as Error).message}
                    </TableCell>
                  </TableRow>
                )}
                {!webhookEventsQuery.isLoading && webhookEvents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">No webhook events available.</TableCell>
                  </TableRow>
                )}
                {webhookEvents.slice(0, 30).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.provider}</TableCell>
                    <TableCell>{event.eventType}</TableCell>
                    <TableCell>
                      <Badge variant={event.status === 'FAILED' ? 'destructive' : 'secondary'}>{event.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{event.providerEventId}</TableCell>
                    <TableCell>{event.createdAt || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Payment Adjustment</DialogTitle>
            <DialogDescription>
              {selectedTransaction ? `Record manual action for transaction ${selectedTransaction.id}` : 'Select a transaction.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label htmlFor="adjustment-action">Action</Label>
              <Select
                value={adjustmentForm.action}
                onValueChange={(value) => setAdjustmentForm((prev) => ({ ...prev, action: value }))}
              >
                <SelectTrigger id="adjustment-action">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOTE">NOTE</SelectItem>
                  <SelectItem value="APPROVED">APPROVED</SelectItem>
                  <SelectItem value="REJECTED">REJECTED</SelectItem>
                  <SelectItem value="FLAGGED">FLAGGED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="adjustment-reason">Reason</Label>
              <Input
                id="adjustment-reason"
                value={adjustmentForm.reason}
                onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="adjustment-note">Note</Label>
              <Textarea
                id="adjustment-note"
                rows={3}
                value={adjustmentForm.note}
                onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, note: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => manualAdjustmentMutation.mutate()}
              disabled={!selectedTransaction || Boolean(adjustmentError) || manualAdjustmentMutation.isPending}
            >
              {manualAdjustmentMutation.isPending ? 'Saving...' : 'Save Adjustment'}
            </Button>
          </DialogFooter>
          {adjustmentError && <p className="text-xs text-destructive">{adjustmentError}</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
