import {useEffect, useMemo, useState} from 'react';
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
import type {
  AdminContractPlan,
  BillingFeatureCode,
  BillingUsageUnit,
  BillingUsageUnitCode,
  CreatePlanRequest,
  PaymentTransaction,
  PaymentWebhookEvent,
  Plan,
  PlanCapability,
  PlanCapabilityCode,
  Tenant,
} from '@/types/platformAdmin';
import PlatformModuleHeader from '@/components/admin/PlatformModuleHeader';
import {toast} from 'sonner';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  CreditCard,
  Plus,
  Settings2,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';

type PlanScope = 'B2B' | 'B2C';
const capabilityLabels: Record<PlanCapabilityCode, string> = {
  PREMIUM_TEMPLATES: 'Premium templates',
  CUSTOM_TEMPLATES: 'Custom templates',
  STANDALONE_TRANSLATION: 'Standalone translation',
  ADVANCED_EXPORTS: 'Advanced export formats',
  INTEGRATIONS: 'Integrations and API access',
};
const planManagedCapabilityCodes = (Object.keys(capabilityLabels) as PlanCapabilityCode[])
  .filter((code) => code !== 'INTEGRATIONS');

const billingPreviewPlans: Plan[] = [
  {id: 'preview-free', stableCode: 'FREE_INDIVIDUAL', version: 1, catalogStatus: 'ACTIVE', name: 'Free Individual', description: 'One-time access for new individual customers.', planScope: 'B2C', isDefault: true, isActive: true, refreshTimezone: 'UTC'},
  {id: 'preview-personal', stableCode: 'PERSONAL', version: 1, catalogStatus: 'DRAFT', name: 'Personal', description: 'Weekly allowances and premium tools for individual clinicians.', planScope: 'B2C', isActive: false, refreshTimezone: 'UTC'},
  {id: 'preview-enterprise', stableCode: 'ENTERPRISE', version: 1, catalogStatus: 'DRAFT', name: 'Enterprise', description: 'Contact-sales access with configurable contract allowances.', planScope: 'B2C', isActive: false, refreshTimezone: 'UTC'},
  {id: 'preview-org-free', stableCode: 'FREE_ORGANIZATION', version: 1, catalogStatus: 'ACTIVE', name: 'Free Organization', description: 'One-time shared access for a new organization.', planScope: 'B2B', isDefault: true, isActive: true, refreshTimezone: 'UTC'},
  {id: 'preview-org', stableCode: 'ORGANIZATION', version: 1, catalogStatus: 'DRAFT', name: 'Organization', description: 'Shared weekly capacity and team billing controls.', planScope: 'B2B', isActive: false, refreshTimezone: 'UTC'},
];

const billingPreviewUnits: BillingUsageUnit[] = [
  {code: 'AI_ACTIONS', displayName: 'AI actions', description: 'Successfully completed documentation or standalone translation.'},
  {code: 'TRANSCRIPTION_SECONDS', displayName: 'Transcription time', description: 'Exact successfully processed audio time.'},
];

function defaultContractPeriod() {
  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  const toLocalInput = (value: Date) => {
    const localValue = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
    return localValue.toISOString().slice(0, 16);
  };
  return {periodStart: toLocalInput(periodStart), periodEnd: toLocalInput(periodEnd)};
}

function toUtcLocalDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 19);
}

function fromUtcLocalDateTime(value: string) {
  const utcValue = new Date(value.endsWith('Z') ? value : `${value}Z`);
  const localValue = new Date(utcValue.getTime() - utcValue.getTimezoneOffset() * 60_000);
  return localValue.toISOString().slice(0, 16);
}

export default function PlansBillingPage() {
  const { sessionToken } = useAdminAuth();
  const queryClient = useQueryClient();
  const devFixture = import.meta.env.DEV && window.location.pathname.startsWith('/__dev/plans-billing');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [capabilityPlan, setCapabilityPlan] = useState<Plan | null>(null);
  const [enabledCapabilities, setEnabledCapabilities] = useState<PlanCapabilityCode[]>([]);
  const [planScope, setPlanScope] = useState<PlanScope>('B2C');
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const [planForm, setPlanForm] = useState<CreatePlanRequest>({
    name: '',
    stableCode: '',
    version: 1,
    description: '',
    planScope: 'B2C',
    isActive: false,
    isDefault: false,
    refreshTimezone: 'UTC',
  });

  const [assignment, setAssignment] = useState(() => ({
    organizationId: '',
    planId: '',
    provider: 'manual',
    status: 'ACTIVE',
    timezone: 'UTC',
    ...defaultContractPeriod(),
  }));

  const [featureForm, setFeatureForm] = useState({
    planId: '',
    featureCode: '',
    usageUnit: 'AI_ACTIONS' as BillingUsageUnitCode,
    windowType: 'WEEKLY' as const,
    limitValue: 0,
    isEnabled: true,
  });

  const [priceForm, setPriceForm] = useState({
    planId: '',
    provider: 'stripe',
    providerPriceId: '',
    currency: 'USD',
    amountCents: 0,
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
    queryKey: ['platform-admin', 'plans', planScope],
    enabled: Boolean(sessionToken || devFixture),
    queryFn: async () => {
      if (devFixture) return billingPreviewPlans.filter((plan) => plan.planScope === planScope);
      const response = await adminApiService.listPlans(sessionToken as string, planScope);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load plans');
      }
      return (response.data as Plan[]) || [];
    },
  });

  const capabilitiesQuery = useQuery({
    queryKey: ['platform-admin', 'plan-capabilities', capabilityPlan?.id],
    enabled: Boolean((sessionToken || devFixture) && capabilityPlan?.id),
    queryFn: async () => {
      if (devFixture) {
        const rows = (Object.keys(capabilityLabels) as PlanCapabilityCode[]).map((code, index) => ({code, enabled: index < 2}));
        setEnabledCapabilities(rows.filter((row) => row.enabled).map((row) => row.code));
        return rows;
      }
      const response = await adminApiService.listPlanCapabilities(sessionToken as string, capabilityPlan!.id);
      if (!response.success) throw new Error(response.error || 'Failed to load capabilities');
      const rows = (response.data as PlanCapability[]) || [];
      setEnabledCapabilities(rows.filter((row) => row.enabled).map((row) => row.code));
      return rows;
    },
  });

  const saveCapabilitiesMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiService.replacePlanCapabilities(
        sessionToken as string, capabilityPlan!.id, enabledCapabilities);
      if (!response.success) throw new Error(response.error || 'Failed to save capabilities');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Plan capabilities updated');
      queryClient.invalidateQueries({queryKey: ['platform-admin', 'plan-capabilities', capabilityPlan?.id]});
      setCapabilityPlan(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const featureCodesQuery = useQuery({
    queryKey: ['platform-admin', 'billing-feature-codes', planScope],
    enabled: Boolean(sessionToken || devFixture),
    queryFn: async () => {
      if (devFixture) return [
        {code: 'AI_ACTION', displayName: 'AI actions', description: 'Completed documentation outcomes', planScope},
        {code: 'TRANSCRIPTION', displayName: 'Transcription time', description: 'Successful audio processing', planScope},
      ];
      const response = await adminApiService.listBillingFeatureCodes(sessionToken as string, planScope);
      if (!response.success) throw new Error(response.error || 'Failed to load billing capabilities');
      return (response.data as BillingFeatureCode[]) || [];
    },
  });

  const usageUnitsQuery = useQuery({
    queryKey: ['platform-admin', 'billing-usage-units'],
    enabled: Boolean(sessionToken || devFixture),
    queryFn: async () => {
      if (devFixture) return billingPreviewUnits;
      const response = await adminApiService.listBillingUsageUnits(sessionToken as string);
      if (!response.success) throw new Error(response.error || 'Failed to load billing meters');
      return ((response.data as BillingUsageUnit[]) || []).filter(
        (unit) => unit.code === 'AI_ACTIONS' || unit.code === 'TRANSCRIPTION_SECONDS'
      );
    },
  });

  const organizationsQuery = useQuery({
    queryKey: ['platform-admin', 'organizations', 'for-contracts'],
    enabled: Boolean(sessionToken || devFixture),
    queryFn: async () => {
      if (devFixture) return [
        {id: 'preview-org-1', name: 'Northstar Clinic'},
        {id: 'preview-org-2', name: 'Wellness Group'},
      ] as Tenant[];
      const response = await adminApiService.listOrganizations(sessionToken as string);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load organizations');
      }
      return (response.data as Tenant[]) || [];
    },
  });

  const contractPlanQuery = useQuery({
    queryKey: ['platform-admin', 'organization-contract-plan', assignment.organizationId],
    enabled: Boolean(sessionToken && assignment.organizationId && !devFixture),
    queryFn: async () => {
      const response = await adminApiService.getContractPlan(sessionToken as string, assignment.organizationId);
      if (!response.success) throw new Error(response.error || 'Failed to load the organization contract');
      return response.data as AdminContractPlan | null;
    },
  });

  useEffect(() => {
    const contract = contractPlanQuery.data;
    if (!contract) return;
    setAssignment((current) => current.organizationId ? {
      ...current,
      planId: contract.planId,
      provider: contract.provider || 'manual',
      status: contract.status || 'ACTIVE',
      timezone: contract.timezone || 'UTC',
      periodStart: fromUtcLocalDateTime(contract.periodStart),
      periodEnd: fromUtcLocalDateTime(contract.periodEnd),
    } : current);
  }, [contractPlanQuery.data]);

  const transactionsQuery = useQuery({
    queryKey: ['platform-admin', 'payment-transactions'],
    enabled: Boolean(sessionToken || devFixture),
    queryFn: async () => {
      if (devFixture) return [] as PaymentTransaction[];
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
    enabled: Boolean(sessionToken || devFixture),
    queryFn: async () => {
      if (devFixture) return [] as PaymentWebhookEvent[];
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
        stableCode: '',
        version: 1,
        description: '',
        planScope,
        isActive: false,
        isDefault: false,
        refreshTimezone: 'UTC',
      });
      queryClient.invalidateQueries({ queryKey: ['platform-admin', 'plans', planScope] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const assignContractMutation = useMutation({
    mutationFn: async () => {
      const request = {
        planId: assignment.planId,
        provider: assignment.provider,
        status: assignment.status,
        timezone: assignment.timezone,
        periodStart: toUtcLocalDateTime(assignment.periodStart),
        periodEnd: toUtcLocalDateTime(assignment.periodEnd),
      };
      const response = contractPlanQuery.data
        ? await adminApiService.updateContractPlan(sessionToken as string, assignment.organizationId, request)
        : await adminApiService.assignContractPlan(sessionToken as string, assignment.organizationId, request);
      if (!response.success) {
        throw new Error(response.error || 'Failed to assign contract plan');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Contract plan assigned or updated');
      queryClient.invalidateQueries({queryKey: ['platform-admin', 'organization-contract-plan']});
      setAssignment({
        organizationId: '',
        planId: '',
        provider: 'manual',
        status: 'ACTIVE',
        timezone: 'UTC',
        ...defaultContractPeriod(),
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
        providerPriceId: priceForm.providerPriceId || undefined,
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

  const activatePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await adminApiService.activatePlan(sessionToken as string, planId);
      if (!response.success) throw new Error(response.error || 'Plan failed publish validation');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Plan published');
      queryClient.invalidateQueries({ queryKey: ['platform-admin', 'plans', planScope] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const retirePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await adminApiService.updatePlan(sessionToken as string, planId, { isActive: false });
      if (!response.success) throw new Error(response.error || 'Failed to retire plan');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Plan retired');
      queryClient.invalidateQueries({ queryKey: ['platform-admin', 'plans', planScope] });
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
  const featureCodes = useMemo(() => featureCodesQuery.data || [], [featureCodesQuery.data]);
  const usageUnits = useMemo(() => usageUnitsQuery.data || [], [usageUnitsQuery.data]);
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) || plans[0] || null,
    [plans, selectedPlanId]
  );
  const publishedPlans = useMemo(() => plans.filter((plan) => plan.isActive).length, [plans]);
  const draftPlans = useMemo(() => plans.filter((plan) => !plan.isActive && plan.catalogStatus !== 'RETIRED').length, [plans]);

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
    if (!assignment.periodStart || !assignment.periodEnd) {
      return 'Contract start and end are required.';
    }
    if (new Date(assignment.periodEnd) <= new Date(assignment.periodStart)) {
      return 'Contract end must be after the start.';
    }
    return '';
  }, [assignment.organizationId, assignment.periodEnd, assignment.periodStart, assignment.planId, assignment.provider]);

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
      return 'Enter an approved price greater than 0; paid values are never prefilled.';
    }
    if (!priceForm.countryCode.trim()) return 'Country is required for regional pricing.';
    if (!priceForm.providerPriceId.trim()) return 'A verified provider price ID is required.';
    return '';
  }, [priceForm.amountCents, priceForm.countryCode, priceForm.currency, priceForm.planId, priceForm.provider, priceForm.providerPriceId]);

  const adjustmentError = useMemo(() => {
    if (!adjustmentForm.action.trim()) {
      return 'Action is required.';
    }
    if (!adjustmentForm.reason.trim()) {
      return 'Reason is required.';
    }
    return '';
  }, [adjustmentForm.action, adjustmentForm.reason]);

  if (!sessionToken && !devFixture) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-7">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 md:text-[30px]">Plans & billing</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Configure plan access, weekly allowances, regional pricing, and payment operations.
          </p>
        </div>
        <Button className="self-start" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create plan
        </Button>
      </header>

      <Dialog open={Boolean(capabilityPlan)} onOpenChange={(open) => { if (!open) setCapabilityPlan(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan capabilities</DialogTitle>
            <DialogDescription>
              Control non-metered access for {capabilityPlan?.name}. Usage allowances are configured separately.
            </DialogDescription>
          </DialogHeader>
          {capabilitiesQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading capabilities...</p> : (
            <div className="space-y-3">
              {planManagedCapabilityCodes.map((code) => (
                <label key={code} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input accent-primary"
                    checked={enabledCapabilities.includes(code)}
                    onChange={(event) => setEnabledCapabilities((current) =>
                      event.target.checked ? Array.from(new Set([...current, code])) : current.filter((item) => item !== code))}
                  />
                  <span>{capabilityLabels[code]}</span>
                </label>
              ))}
              {capabilityPlan?.planScope === 'B2B' ? (
                <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Integrations and API access are included for every organization and are not controlled by plan.
                </p>
              ) : null}
            </div>
          )}
          {capabilitiesQuery.isError ? <p className="text-sm text-destructive">{(capabilitiesQuery.error as Error).message}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCapabilityPlan(null)}>Cancel</Button>
            <Button
              onClick={() => saveCapabilitiesMutation.mutate()}
              disabled={capabilitiesQuery.isLoading || capabilitiesQuery.isError || saveCapabilitiesMutation.isPending}>
              {saveCapabilitiesMutation.isPending ? 'Saving...' : 'Save capabilities'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section aria-label="Catalog scope and summary" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Catalog scope</p>
            <p className="mt-1 text-xs text-slate-500">Individual allowances belong to customers; organization allowances are shared.</p>
          </div>
          <div className="inline-flex w-full rounded-lg bg-slate-100 p-1 sm:w-auto" role="group" aria-label="Catalog audience">
            {(['B2C', 'B2B'] as PlanScope[]).map((scope) => (
              <button
                key={scope}
                type="button"
                aria-pressed={planScope === scope}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition sm:flex-none ${planScope === scope ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                onClick={() => {
                  setPlanScope(scope);
                  setSelectedPlanId('');
                  setPlanForm((previous) => ({ ...previous, planScope: scope }));
                  setFeatureForm((previous) => ({ ...previous, planId: '', featureCode: '' }));
                  setPriceForm((previous) => ({ ...previous, planId: '' }));
                }}
              >
                {scope === 'B2C' ? 'Individuals' : 'Organizations'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          {[
            {label: 'Catalog entries', value: plans.length, helper: `${planScope} plan versions`, icon: CreditCard},
            {label: 'Published', value: publishedPlans, helper: 'Available to customers', icon: CheckCircle2},
            {label: 'Drafts', value: draftPlans, helper: 'Require validation', icon: CircleDashed},
            {label: 'Payment activity', value: transactions.length, helper: `${organizations.length} organizations`, icon: Activity},
          ].map(({label, value, helper, icon: Icon}) => (
            <div key={label} className="flex items-center gap-3 px-4 py-4 lg:px-5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><Icon className="h-4 w-4" /></span>
              <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-0.5 text-lg font-semibold text-slate-950">{value}</p><p className="text-[11px] text-slate-400">{helper}</p></div>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-5">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Plan catalog</h2>
              <p className="mt-1 text-xs text-slate-500">Select a plan to review its readiness and configuration.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create {planScope} Plan Draft</DialogTitle>
                    <DialogDescription>Create an unpublished, versioned catalog entry. No paid values are assumed.</DialogDescription>
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
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="plan-stable-code">Stable code</Label>
                        <Input
                          id="plan-stable-code"
                          placeholder="PERSONAL_PRO"
                          value={planForm.stableCode || ''}
                          onChange={(e) => setPlanForm((prev) => ({ ...prev, stableCode: e.target.value.toUpperCase() }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="plan-version">Version</Label>
                        <Input
                          id="plan-version"
                          type="number"
                          min={1}
                          value={planForm.version || 1}
                          onChange={(e) => setPlanForm((prev) => ({ ...prev, version: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Drafts are not available to checkout until the catalog publish check succeeds.</p>
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
                  <Button size="sm" variant="outline"><ShieldCheck className="mr-2 h-4 w-4" /> Add allowance</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Plan Feature</DialogTitle>
                    <DialogDescription>Add a customer-facing weekly outcome allowance. Provider tokens remain internal.</DialogDescription>
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
                      <Label htmlFor="feature-code">Capability</Label>
                      <Select value={featureForm.featureCode || undefined} onValueChange={(value) => setFeatureForm((prev) => ({ ...prev, featureCode: value }))}>
                        <SelectTrigger id="feature-code"><SelectValue placeholder="Select capability" /></SelectTrigger>
                        <SelectContent>
                          {featureCodes.map((feature) => (
                            <SelectItem key={feature.code} value={feature.code}>{feature.displayName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {featureCodesQuery.isError ? <p className="mt-1 text-xs text-destructive">{(featureCodesQuery.error as Error).message}</p> : null}
                    </div>
                    <div>
                      <Label>Usage Unit</Label>
                      <Select
                        value={featureForm.usageUnit}
                        onValueChange={(value) => setFeatureForm((prev) => ({ ...prev, usageUnit: value as typeof featureForm.usageUnit }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {usageUnits.map((unit) => (
                            <SelectItem key={unit.code} value={unit.code}>{unit.displayName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Window Type</Label>
                      <Input value="Weekly (7 days, subscription anchored)" disabled aria-label="Allowance window" />
                    </div>
                    <div>
                      <Label htmlFor="feature-limit">Weekly allowance</Label>
                      <Input
                        id="feature-limit"
                        type="number"
                        min={0}
                        value={featureForm.limitValue}
                        onChange={(e) => setFeatureForm((prev) => ({ ...prev, limitValue: Number(e.target.value) }))}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {featureForm.usageUnit === 'TRANSCRIPTION_SECONDS' ? 'Enter exact seconds; customers see minutes or hours.' : 'One unit is one completed AI action.'}
                      </p>
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
                  <Button size="sm" variant="outline"><WalletCards className="mr-2 h-4 w-4" /> Add price</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Plan Price</DialogTitle>
                    <DialogDescription>Attach an approved regional provider price to the unpublished plan draft.</DialogDescription>
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
                        <Select value={priceForm.provider} onValueChange={(value) => setPriceForm((prev) => ({ ...prev, provider: value }))}>
                          <SelectTrigger id="price-provider"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="paystack">Paystack</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="price-currency">Currency</Label>
                        <Input
                          id="price-currency"
                          value={priceForm.currency}
                          onChange={(e) => setPriceForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="provider-price-id">Provider price ID</Label>
                      <Input
                        id="provider-price-id"
                        placeholder={priceForm.provider === 'paystack' ? 'PLN_...' : 'price_...'}
                        value={priceForm.providerPriceId}
                        onChange={(e) => setPriceForm((prev) => ({ ...prev, providerPriceId: e.target.value }))}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Use a verified Stripe price ID or Paystack plan code. The admin never invents provider values.</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label htmlFor="price-amount">Amount (cents)</Label>
                        <Input
                          id="price-amount"
                          type="number"
                          min={1}
                          value={priceForm.amountCents}
                          onChange={(e) => setPriceForm((prev) => ({ ...prev, amountCents: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label>Billing Interval</Label>
                        <Select
                          value={priceForm.billingInterval}
                          onValueChange={(value) => setPriceForm((prev) => ({ ...prev, billingInterval: value as typeof priceForm.billingInterval }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MONTH">MONTH</SelectItem>
                            <SelectItem value="YEAR">YEAR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Checkout remains disabled while the parent plan is a draft.</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label htmlFor="price-country">Country</Label>
                        <Input
                          id="price-country"
                          value={priceForm.countryCode}
                          onChange={(e) => setPriceForm((prev) => ({ ...prev, countryCode: e.target.value.toUpperCase() }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="price-region">Region</Label>
                        <Input
                          id="price-region"
                          value={priceForm.regionCode}
                          onChange={(e) => setPriceForm((prev) => ({ ...prev, regionCode: e.target.value.toUpperCase() }))}
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
          </div>
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Allowance schedule</TableHead>
                  <TableHead className="w-10"><span className="sr-only">Select</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plansQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={5}>Loading plans...</TableCell>
                  </TableRow>
                )}
                {plansQuery.isError && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-destructive">
                      {(plansQuery.error as Error).message}
                    </TableCell>
                  </TableRow>
                )}
                {!plansQuery.isLoading && plans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No {planScope} plans found. Create a draft to begin.</TableCell>
                  </TableRow>
                )}
                {plans.map((plan) => (
                  <TableRow
                    key={plan.id}
                    tabIndex={0}
                    aria-selected={selectedPlan?.id === plan.id}
                    className={`cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${selectedPlan?.id === plan.id ? 'bg-indigo-50/70 hover:bg-indigo-50' : ''}`}
                    onClick={() => setSelectedPlanId(plan.id)}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedPlanId(plan.id); } }}
                  >
                    <TableCell>
                      <p className="font-medium">{plan.name}</p>
                      <p className="max-w-xs truncate text-xs text-muted-foreground">{plan.description || 'Public description not added'}</p>
                    </TableCell>
                    <TableCell><p className="text-sm">v{plan.version || 1}</p><p className="font-mono text-[11px] text-slate-400">{plan.stableCode || 'NO_KEY'}</p></TableCell>
                    <TableCell>
                      <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                        {plan.catalogStatus === 'RETIRED' ? 'RETIRED' : plan.isActive ? (plan.catalogStatus || 'ACTIVE') : (plan.catalogStatus === 'DRAFT' ? 'DRAFT' : 'INACTIVE')}
                      </Badge>
                      {plan.isDefault ? <Badge variant="outline" className="ml-1">Default</Badge> : null}
                    </TableCell>
                    <TableCell><p className="text-sm">Every 7 days</p><p className="text-xs text-slate-400">{plan.refreshTimezone || 'UTC'} anchor</p></TableCell>
                    <TableCell><ChevronRight className="h-4 w-4 text-slate-400" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="border-t border-slate-100 px-4 py-3 text-xs text-muted-foreground lg:px-5">
              Publication is server-validated. Missing provider prices, regional mismatches, incomplete public copy, or inactive capabilities must prevent checkout activation.
            </p>
            </div>
            <aside className="border-t border-slate-200 bg-slate-50/70 p-4 lg:border-l lg:border-t-0 lg:p-5" aria-label="Selected plan details">
              {selectedPlan ? (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-xs font-medium text-slate-500">Selected plan</p><h3 className="mt-1 font-semibold text-slate-950">{selectedPlan.name}</h3></div>
                      <Badge variant={selectedPlan.isActive ? 'default' : 'secondary'}>{selectedPlan.isActive ? 'Published' : (selectedPlan.catalogStatus || 'Draft')}</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{selectedPlan.description || 'Add customer-facing copy before publishing this plan.'}</p>
                  </div>

                  <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between px-3 py-3"><span className="text-xs text-slate-500">Catalog key</span><span className="font-mono text-xs text-slate-700">{selectedPlan.stableCode || 'Not set'}</span></div>
                    <div className="flex items-center justify-between px-3 py-3"><span className="text-xs text-slate-500">Audience</span><span className="text-xs font-medium text-slate-700">{selectedPlan.planScope === 'B2B' ? 'Organizations' : 'Individuals'}</span></div>
                    <div className="flex items-center justify-between px-3 py-3"><span className="text-xs text-slate-500">Allowance window</span><span className="text-xs font-medium text-slate-700">Weekly</span></div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-700">Configuration</p>
                    <div className="mt-2 grid gap-2">
                      <Button variant="outline" size="sm" className="justify-between bg-white" onClick={() => { setFeatureForm((current) => ({...current, planId: selectedPlan.id})); setFeatureDialogOpen(true); }}>
                        Weekly allowances <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="justify-between bg-white" onClick={() => setCapabilityPlan(selectedPlan)}>
                        Capabilities <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="justify-between bg-white" onClick={() => { setPriceForm((current) => ({...current, planId: selectedPlan.id})); setPriceDialogOpen(true); }}>
                        Regional prices <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    {selectedPlan.isActive ? (
                      <Button variant="outline" className="w-full" onClick={() => retirePlanMutation.mutate(selectedPlan.id)} disabled={retirePlanMutation.isPending}>Retire plan</Button>
                    ) : (
                      <Button className="w-full" onClick={() => activatePlanMutation.mutate(selectedPlan.id)} disabled={activatePlanMutation.isPending}>{activatePlanMutation.isPending ? 'Validating…' : 'Validate & publish'}</Button>
                    )}
                    <p className="mt-2 text-center text-[11px] leading-4 text-slate-400">The server will reject incomplete catalog configuration.</p>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-56 flex-col items-center justify-center text-center"><Settings2 className="h-6 w-6 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">No plan selected</p><p className="mt-1 text-xs text-slate-500">Create or select a plan to configure it.</p></div>
              )}
            </aside>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Capabilities and customer presentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Available {planScope} capabilities</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {featureCodesQuery.isLoading ? <span className="text-sm text-muted-foreground">Loading capabilities...</span> : null}
                {featureCodes.map((feature) => <Badge key={feature.code} variant="outline">{feature.displayName}</Badge>)}
                {!featureCodesQuery.isLoading && featureCodes.length === 0 ? <span className="text-sm text-muted-foreground">No active capabilities are configured for this scope.</span> : null}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {usageUnits.map((unit) => (
                <div key={unit.code} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{unit.displayName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{unit.description || (unit.code === 'AI_ACTIONS' ? 'Completed customer AI actions.' : 'Exact successfully processed audio time.')}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Premium template, export, integration, and public-card copy controls remain read-only until their dedicated admin endpoints are available. They are not modeled as usage units.
            </p>
          </CardContent>
        </Card>

        {planScope === 'B2B' ? <Card>
          <CardHeader>
            <CardTitle>Assign Contract Plan To Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="assignment-org">Organization</Label>
                <Select value={assignment.organizationId || undefined} onValueChange={(value) => setAssignment((prev) => ({
                  ...prev,
                  organizationId: value,
                  planId: '',
                  provider: 'manual',
                  status: 'ACTIVE',
                  timezone: 'UTC',
                  ...defaultContractPeriod(),
                }))}>
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
              <div>
                <Label htmlFor="assignment-period-start">Contract starts</Label>
                <Input
                  id="assignment-period-start"
                  type="datetime-local"
                  value={assignment.periodStart}
                  onChange={(e) => setAssignment((prev) => ({ ...prev, periodStart: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="assignment-period-end">Contract ends</Label>
                <Input
                  id="assignment-period-end"
                  type="datetime-local"
                  value={assignment.periodEnd}
                  min={assignment.periodStart}
                  onChange={(e) => setAssignment((prev) => ({ ...prev, periodEnd: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={() => assignContractMutation.mutate()}
                disabled={Boolean(assignmentError) || assignContractMutation.isPending || contractPlanQuery.isFetching}
              >
                {assignContractMutation.isPending ? 'Saving...' : 'Assign or Update Contract Plan'}
              </Button>
              <p className="text-sm text-muted-foreground">The saved contract period controls when the organization can use the plan.</p>
            </div>
            {contractPlanQuery.isFetching && <p className="text-xs text-muted-foreground mt-2">Loading current contract period...</p>}
            {contractPlanQuery.isError && <p className="text-xs text-destructive mt-2">{(contractPlanQuery.error as Error).message}</p>}
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
                      onClick={() => setAssignment((prev) => ({
                        ...prev,
                        organizationId: org.id,
                        planId: '',
                        provider: 'manual',
                        status: 'ACTIVE',
                        timezone: 'UTC',
                        ...defaultContractPeriod(),
                      }))}
                    >
                      {org.id}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card> : null}

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
