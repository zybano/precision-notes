export interface Tenant {
  id: string;
  name: string;
  apiKey?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  contactEmail?: string;
  contactName?: string;
  industry?: string;
  credits?: number;
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
  initialCredits?: number;
  rateLimitPerHour?: number;
  requestLimit?: number;
  dataStoragePreference?: string;
  allowedDocumentTypes?: string[];
}

export interface Plan {
  id: string;
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
  description?: string;
  planScope: 'B2B' | 'B2C';
  isDefault?: boolean;
  isActive?: boolean;
  refreshTimezone?: string;
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
  credits: number;
  totalRequests: number;
  totalTranscriptions: number;
  totalDocumentsGenerated: number;
  rateLimitPerHour: number;
  requestLimit: number;
}

export interface PlanFeature {
  id: string;
  planId: string;
  featureCode: string;
  usageUnit: 'DOCUMENT_INPUT_TOKENS' | 'DOCUMENT_OUTPUT_TOKENS' | 'TRANSCRIPTION_MINUTES';
  windowType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  limitValue: number;
  isEnabled: boolean;
}

export interface PlanPrice {
  id: string;
  planId: string;
  provider: string;
  currency: string;
  amountCents: number;
  billingInterval: 'MONTH' | 'YEAR';
  regionCode?: string;
  countryCode?: string;
  isDefault: boolean;
  isActive: boolean;
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
