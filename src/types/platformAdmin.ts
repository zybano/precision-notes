export interface Tenant {
  id: string;
  name: string;
  apiKey?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  contactEmail?: string;
  contactName?: string;
  industry?: string;
  rateLimitPerHour?: number;
  requestLimit?: number;
  dataStoragePreference?: string;
  allowedDocumentTypes?: string[];
  totalRequests?: number;
  totalTranscriptions?: number;
  totalDocumentsGenerated?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTenantRequest {
  name: string;
  contactEmail?: string;
  contactName?: string;
  industry?: string;
  webhookUrl?: string;
  rateLimitPerHour?: number;
  requestLimit?: number;
  dataStoragePreference?: string;
  allowedDocumentTypes?: string[];
}

export interface Plan {
  id: string;
  stableCode?: string;
  version?: number;
  catalogStatus?: 'DRAFT' | 'ACTIVE' | 'RETIRED';
  name: string;
  description?: string;
  planScope: 'B2B' | 'B2C';
  isDefault?: boolean;
  isActive?: boolean;
  refreshTimezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlanRequest {
  name: string;
  stableCode?: string;
  version?: number;
  description?: string;
  planScope: 'B2B' | 'B2C';
  isDefault?: boolean;
  isActive?: boolean;
  refreshTimezone?: string;
}

export type PlanCapabilityCode =
  | 'PREMIUM_TEMPLATES'
  | 'CUSTOM_TEMPLATES'
  | 'STANDALONE_TRANSLATION'
  | 'ADVANCED_EXPORTS'
  | 'INTEGRATIONS';

export interface PlanCapability {
  code: PlanCapabilityCode;
  enabled: boolean;
}

export interface PaymentTransaction {
  id: string;
  organizationId?: string;
  userId?: string;
  provider?: string;
  amountCents?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface TenantUsage {
  tenantId: string;
  totalRequests: number;
  totalTranscriptions: number;
  totalDocumentsGenerated: number;
  rateLimitPerHour: number;
  requestLimit: number;
}

export interface AdminOrganizationBilling {
  organizationId: string;
  accessStatus: 'ACTIVE' | 'EXPIRED' | string;
  planCode: string;
  planName: string;
  periodStart: string;
  periodEnd: string;
  meters: AdminOrganizationMeterBalance[];
  updatedAt: string;
}

export interface AdminOrganizationMeterBalance {
  metric: BillingUsageUnitCode;
  unit: 'actions' | 'seconds' | string;
  included: number;
  topUps: number;
  adminAdjustments: number;
  allowance: number;
  used: number;
  reserved: number;
  remaining: number;
}

export interface OrganizationUser {
  id: string;
  organizationId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'ADMIN' | 'STAFF' | string;
  department?: string;
  lastLoginAt?: string;
  isActive?: boolean;
}

export interface PlatformAdminSession {
  sessionId: string;
  adminId: string;
  adminUsername?: string;
  adminEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
  expiresAt?: string;
  expired?: boolean;
}

export interface PlanFeature {
  id: string;
  planId: string;
  featureCode: string;
  usageUnit: BillingUsageUnitCode;
  windowType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  limitValue: number;
  isEnabled: boolean;
}

export interface PlanPrice {
  id: string;
  planId: string;
  provider: string;
  providerPriceId?: string;
  currency: string;
  amountCents: number;
  billingInterval: 'MONTH' | 'YEAR';
  regionCode?: string;
  countryCode?: string;
  isDefault: boolean;
  isActive: boolean;
}

export type BillingUsageUnitCode = 'AI_ACTIONS' | 'TRANSCRIPTION_SECONDS';

export interface BillingFeatureCode {
  code: string;
  displayName: string;
  description?: string;
  planScope?: 'B2B' | 'B2C';
}

export interface BillingUsageUnit {
  code: BillingUsageUnitCode;
  displayName: string;
  description?: string;
  decimalScale?: number;
}

export interface PaymentWebhookEvent {
  id: string;
  provider: string;
  providerEventId: string;
  eventType: string;
  status: string;
  processingNote?: string;
  createdAt?: string;
  processedAt?: string;
}
