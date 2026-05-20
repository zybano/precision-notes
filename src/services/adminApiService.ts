const API_BASE_URL = import.meta.env.VITE_PLATFORM_ADMIN_API_BASE_URL || 'http://localhost:8080';

interface AdminApiOptions {
  sessionToken?: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
}

interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class AdminApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private pathSegment(value: string, label = 'id') {
    const normalized = String(value ?? '').trim();
    if (!normalized) {
      throw new Error(`${label} is required`);
    }
    return encodeURIComponent(normalized);
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    if (response.status === 204) {
      return null;
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      return null;
    }

    const text = await response.text();
    if (!text) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return text;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  /**
   * Make authenticated API call to admin endpoints
   */
  async makeAdminApiCall<T = any>({
    sessionToken,
    endpoint,
    method = 'GET',
    body
  }: AdminApiOptions): Promise<AdminApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (sessionToken) {
        headers['X-Platform-Admin-Token'] = sessionToken;
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const config: RequestInit = {
        method,
        headers,
      };

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await fetch(`${this.baseUrl}${normalizedEndpoint}`, config);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText || response.statusText}`
        };
      }

      const data = await this.parseResponseBody(response);

      // Backend uses { success, message, data } envelope for most endpoints.
      if (data && typeof data === 'object' && 'success' in data) {
        const envelope = data as { success?: boolean; message?: string; data?: unknown };
        if (!envelope.success) {
          return {
            success: false,
            error: envelope.message || 'Request failed'
          };
        }

        return {
          success: true,
          data: (envelope.data ?? data) as T
        };
      }

      return {
        success: true,
        data: data as T
      };
    } catch (error) {
      console.error('Admin API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async makeAdminMultipartCall<T = any>({
    sessionToken,
    endpoint,
    body,
  }: {
    sessionToken?: string;
    endpoint: string;
    body: FormData;
  }): Promise<AdminApiResponse<T>> {
    try {
      const headers: Record<string, string> = {};
      if (sessionToken) {
        headers['X-Platform-Admin-Token'] = sessionToken;
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await fetch(`${this.baseUrl}${normalizedEndpoint}`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText || response.statusText}`,
        };
      }

      const data = await this.parseResponseBody(response);
      if (data && typeof data === 'object' && 'success' in data) {
        const envelope = data as { success?: boolean; message?: string; data?: unknown };
        if (!envelope.success) {
          return {
            success: false,
            error: envelope.message || 'Request failed',
          };
        }

        return {
          success: true,
          data: (envelope.data ?? data) as T,
        };
      }

      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      console.error('Admin multipart API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async login(identifier: string, password: string) {
    return this.makeAdminApiCall<{
      adminId: string;
      username: string;
      email: string;
      fullName?: string;
      sessionToken: string;
    }>({
      endpoint: '/platform-admin/auth/login',
      method: 'POST',
      body: {
        username: identifier,
        password,
      },
    });
  }

  async logout(sessionToken: string) {
    return this.makeAdminApiCall({
      endpoint: '/platform-admin/auth/logout',
      method: 'POST',
      sessionToken,
    });
  }

  /**
   * Organization Management APIs
   */
  async listOrganizations(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/tenants'
    });
  }

  async getOrganization(sessionToken: string, organizationId: string) {
    const organizationPathId = this.pathSegment(organizationId, 'organizationId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/tenants/${organizationPathId}`,
    });
  }

  async createOrganization(sessionToken: string, organizationData: any) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/tenants',
      method: 'POST',
      body: organizationData
    });
  }

  async manageCredits(sessionToken: string, organizationId: string, creditAdjustment: number, description: string) {
    const organizationPathId = this.pathSegment(organizationId, 'organizationId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/tenants/${organizationPathId}/credits`,
      method: 'POST',
      body: {
        creditAdjustment,
        description
      }
    });
  }

  async updateOrganization(sessionToken: string, organizationId: string, organizationData: {
    name?: string;
    contactEmail?: string;
    contactName?: string;
    industry?: string;
    rateLimitPerHour?: number;
    requestLimit?: number;
    dataStoragePreference?: string;
    allowedDocumentTypes?: string[];
    isActive?: boolean;
    webhookUrl?: string;
  }) {
    const organizationPathId = this.pathSegment(organizationId, 'organizationId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/tenants/${organizationPathId}`,
      method: 'PATCH',
      body: organizationData,
    });
  }

  async getUsageStats(sessionToken: string, organizationId: string, startDate: string, endDate: string) {
    const normalizedOrganizationId = String(organizationId ?? '').trim();
    if (!normalizedOrganizationId) {
      throw new Error('organizationId is required');
    }
    const organizationPathId = this.pathSegment(normalizedOrganizationId, 'organizationId');
    const params = new URLSearchParams({
      organization_id: normalizedOrganizationId,
      start_date: startDate,
      end_date: endDate
    });

    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/tenants/${organizationPathId}/usage?${params}`
    });
  }

  async getTenantUsage(sessionToken: string, organizationId: string, startDate?: string, endDate?: string) {
    const organizationPathId = this.pathSegment(organizationId, 'organizationId');
    const params = new URLSearchParams();
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }

    const suffix = params.toString() ? `?${params}` : '';
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/tenants/${organizationPathId}/usage${suffix}`,
    });
  }

  async rotateApiKey(sessionToken: string, organizationId: string) {
    const organizationPathId = this.pathSegment(organizationId, 'organizationId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/tenants/${organizationPathId}/rotate-key`,
      method: 'POST'
    });
  }

  async deleteOrganization(sessionToken: string, organizationId: string) {
    const organizationPathId = this.pathSegment(organizationId, 'organizationId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/tenants/${organizationPathId}`,
      method: 'DELETE',
    });
  }

  async listOrganizationUsers(sessionToken: string, organizationId: string, role?: 'ADMIN' | 'STAFF') {
    const organizationPathId = this.pathSegment(organizationId, 'organizationId');
    const params = new URLSearchParams();
    if (role) {
      params.append('role', role);
    }
    const suffix = params.toString() ? `?${params}` : '';
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/platform-admin/tenants/${organizationPathId}/users${suffix}`,
    });
  }

  /**
   * System Analytics APIs (when implemented)
   */
  async getSystemStats(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/platform-admin/analytics/overview'
    });
  }

  async getPlatformAnalyticsOverview(sessionToken: string) {
    return this.makeAdminApiCall<{
      totalOrganizations: number;
      activeOrganizations: number;
      totalRequests: number;
      totalCreditsBalance: number;
      totalPaymentTransactions: number;
      succeededPaymentTransactions: number;
      failedPaymentTransactions: number;
    }>({
      sessionToken,
      endpoint: '/platform-admin/analytics/overview',
    });
  }

  async getPlatformAnalyticsRevenue(sessionToken: string) {
    return this.makeAdminApiCall<{
      items: Array<{
        currency: string;
        transactionCount: number;
        totalAmountCents: number;
      }>;
      totalTransactions: number;
      generatedAt?: string;
    }>({
      sessionToken,
      endpoint: '/platform-admin/analytics/revenue',
    });
  }

  async getPlatformAnalyticsPlanAdoption(sessionToken: string) {
    return this.makeAdminApiCall<{
      items: Array<{
        planName: string;
        status: string;
        count: number;
      }>;
      totalSubscriptions: number;
    }>({
      sessionToken,
      endpoint: '/platform-admin/analytics/plan-adoption',
    });
  }

  async getPlatformAnalyticsProviderPerformance(sessionToken: string) {
    return this.makeAdminApiCall<{
      items: Array<{
        provider: string;
        totalTransactions: number;
        succeededTransactions: number;
        failedTransactions: number;
        webhookEvents: number;
        successRatePct: number;
      }>;
    }>({
      sessionToken,
      endpoint: '/platform-admin/analytics/provider-performance',
    });
  }

  async getSystemHealth(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/platform-admin/analytics/health'
    });
  }

  /**
   * Admin User Management APIs (for super admins)
   */
  async listAdminUsers(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/platform-admin/users'
    });
  }

  async createAdminUser(sessionToken: string, userData: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    isActive?: boolean;
  }) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/platform-admin/users',
      method: 'POST',
      body: userData
    });
  }

  async updateAdminUser(sessionToken: string, userId: string, userData: Partial<{
    email: string;
    fullName: string;
    isActive: boolean;
  }>) {
    const userPathId = this.pathSegment(userId, 'userId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/platform-admin/users/${userPathId}`,
      method: 'PATCH',
      body: userData
    });
  }

  async deleteAdminUser(sessionToken: string, userId: string) {
    const userPathId = this.pathSegment(userId, 'userId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/platform-admin/users/${userPathId}/disable`,
      method: 'POST'
    });
  }

  async resetAdminUserPassword(sessionToken: string, userId: string, newPassword: string) {
    const userPathId = this.pathSegment(userId, 'userId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/platform-admin/users/${userPathId}/reset-password`,
      method: 'POST',
      body: { newPassword },
    });
  }

  async listAdminSessions(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/platform-admin/sessions',
    });
  }

  async revokeAdminSession(sessionToken: string, sessionId: string) {
    const sessionPathId = this.pathSegment(sessionId, 'sessionId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/platform-admin/sessions/${sessionPathId}`,
      method: 'DELETE',
    });
  }

  async changeAdminPassword(sessionToken: string, currentPassword: string, newPassword: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/platform-admin/auth/change-password',
      method: 'POST',
      body: {
        currentPassword,
        newPassword,
      },
    });
  }

  /**
   * Configuration APIs
   */
  async getSystemConfig(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/platform-admin/config'
    });
  }

  async updateSystemConfig(sessionToken: string, config: Record<string, any>) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/platform-admin/config',
      method: 'PUT',
      body: config
    });
  }

  async listPlans(sessionToken: string, scope: 'B2B' | 'B2C' = 'B2B') {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/admin/plans?scope=${scope}`,
    });
  }

  async createPlan(sessionToken: string, request: {
    name: string;
    description?: string;
    planScope: 'B2B' | 'B2C';
    isDefault?: boolean;
    isActive?: boolean;
    refreshTimezone?: string;
  }) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/admin/plans',
      method: 'POST',
      body: request,
    });
  }

  async addPlanFeature(sessionToken: string, planId: string, request: {
    featureCode: string;
    usageUnit: 'DOCUMENT_INPUT_TOKENS' | 'DOCUMENT_OUTPUT_TOKENS' | 'TRANSCRIPTION_MINUTES';
    windowType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    limitValue: number;
    isEnabled?: boolean;
  }) {
    const planPathId = this.pathSegment(planId, 'planId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/admin/plans/${planPathId}/features`,
      method: 'POST',
      body: request,
    });
  }

  async updatePlanFeature(sessionToken: string, planId: string, featureLimitId: string, request: {
    limitValue?: number;
    isEnabled?: boolean;
  }) {
    const planPathId = this.pathSegment(planId, 'planId');
    const featureLimitPathId = this.pathSegment(featureLimitId, 'featureLimitId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/admin/plans/${planPathId}/features/${featureLimitPathId}`,
      method: 'PATCH',
      body: request,
    });
  }

  async addPlanPrice(sessionToken: string, planId: string, request: {
    provider: string;
    providerPriceId?: string;
    currency: string;
    amountCents: number;
    billingInterval: 'MONTH' | 'YEAR';
    regionCode?: string;
    countryCode?: string;
    isDefault?: boolean;
    isActive?: boolean;
  }) {
    const planPathId = this.pathSegment(planId, 'planId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/admin/plans/${planPathId}/prices`,
      method: 'POST',
      body: request,
    });
  }

  async assignContractPlan(sessionToken: string, organizationId: string, request: {
    planId: string;
    provider?: string;
    status?: string;
    timezone?: string;
  }) {
    const organizationPathId = this.pathSegment(organizationId, 'organizationId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/admin/organizations/${organizationPathId}/contract-plan`,
      method: 'POST',
      body: request,
    });
  }

  async updateContractPlan(sessionToken: string, organizationId: string, request: {
    planId: string;
    provider?: string;
    status?: string;
    timezone?: string;
  }) {
    const organizationPathId = this.pathSegment(organizationId, 'organizationId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/admin/organizations/${organizationPathId}/contract-plan`,
      method: 'PATCH',
      body: request,
    });
  }

  async listPaymentTransactions(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/admin/payments/transactions',
    });
  }

  async getPaymentTransaction(sessionToken: string, transactionId: string) {
    const transactionPathId = this.pathSegment(transactionId, 'transactionId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/admin/payments/transactions/${transactionPathId}`,
    });
  }

  async createManualPaymentAdjustment(sessionToken: string, transactionId: string, request: {
    action: string;
    reason: string;
    note?: string;
  }) {
    const transactionPathId = this.pathSegment(transactionId, 'transactionId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/admin/payments/transactions/${transactionPathId}/manual-adjustment`,
      method: 'POST',
      body: request,
    });
  }

  async listWebhookEvents(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/admin/payments/webhook-events',
    });
  }

  async listBillingFeatureCodes(sessionToken: string, scope: 'B2B' | 'B2C' = 'B2B') {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/admin/billing/feature-codes?scope=${scope}`,
    });
  }

  async listBillingUsageUnits(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/admin/billing/usage-units',
    });
  }

  async getReportingUsage(sessionToken: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const suffix = params.toString() ? `?${params}` : '';

    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/reporting/usage${suffix}`,
    });
  }

  async getOrganizationStaffUtilization(sessionToken: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const suffix = params.toString() ? `?${params}` : '';

    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/reporting/staff-utilization/organization${suffix}`,
    });
  }

  async getTranscriptionProviderConfig(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/platform-admin/transcription-providers',
    });
  }

  async updateTranscriptionProviderConfig(sessionToken: string, request: {
    defaultProvider: 'ASSEMBLY_AI' | 'DEEPGRAM' | 'GOOGLE';
    providers: Array<{
      provider: 'ASSEMBLY_AI' | 'DEEPGRAM' | 'GOOGLE';
      enabled: boolean;
      supportsUploadedMedia?: boolean;
      supportsLive?: boolean;
      liveTransport?: string;
      config?: Record<string, unknown>;
    }>;
  }) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/platform-admin/transcription-providers',
      method: 'PUT',
      body: request,
    });
  }

  async getSupportedTranscriptionLanguages(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/transcriptions/languages',
    });
  }

  async createPlatformLiveSession(sessionToken: string, request: {
    provider: string;
    expiresInSeconds?: number;
    maxSessionDurationSeconds?: number;
    languageCode?: string;
  }) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: '/platform-admin/transcriptions/live/sessions',
      method: 'POST',
      body: request,
    });
  }

  async getPlatformLiveSession(sessionToken: string, sessionId: string) {
    const sessionPathId = this.pathSegment(sessionId, 'sessionId');
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `/platform-admin/transcriptions/live/sessions/${sessionPathId}`,
    });
  }

  async createPlatformTranscription(sessionToken: string, request: {
    audioFile: File;
    provider: string;
    languageCode?: string;
    useSpeechModelNano?: boolean;
    requestId?: string;
  }) {
    const formData = new FormData();
    formData.append('audio', request.audioFile);
    formData.append('provider', request.provider);
    if (request.languageCode) formData.append('languageCode', request.languageCode);
    if (request.useSpeechModelNano !== undefined) {
      formData.append('useSpeechModelNano', String(request.useSpeechModelNano));
    }
    if (request.requestId) formData.append('requestId', request.requestId);

    return this.makeAdminMultipartCall({
      sessionToken,
      endpoint: '/platform-admin/transcriptions',
      body: formData,
    });
  }

  async createPlatformCombinedTranscription(sessionToken: string, request: {
    audioFile: File;
    provider: string;
    documentFormat: string;
    languageCode?: string;
    useSpeechModelNano?: boolean;
    modelName?: string;
    requestId?: string;
    includeSummary?: boolean;
    acceptSuggestions?: boolean;
    templateId?: string;
    templateVariables?: Record<string, unknown>;
  }) {
    const formData = new FormData();
    formData.append('audio', request.audioFile);
    formData.append('provider', request.provider);
    formData.append('documentFormat', request.documentFormat);
    if (request.languageCode) formData.append('languageCode', request.languageCode);
    if (request.useSpeechModelNano !== undefined) {
      formData.append('useSpeechModelNano', String(request.useSpeechModelNano));
    }
    if (request.modelName) formData.append('modelName', request.modelName);
    if (request.requestId) formData.append('requestId', request.requestId);
    if (request.includeSummary !== undefined) {
      formData.append('includeSummary', String(request.includeSummary));
    }
    if (request.acceptSuggestions !== undefined) {
      formData.append('acceptSuggestions', String(request.acceptSuggestions));
    }
    if (request.templateId) formData.append('templateId', request.templateId);
    if (request.templateVariables && Object.keys(request.templateVariables).length > 0) {
      formData.append('templateVariables', JSON.stringify(request.templateVariables));
    }

    return this.makeAdminMultipartCall({
      sessionToken,
      endpoint: '/platform-admin/transcriptions/combined',
      body: formData,
    });
  }

  async getPlatformSandboxCapabilities(sessionToken: string) {
    return this.makeAdminApiCall<{
      defaultProvider?: string;
      enabledProviders?: string[];
      supportedLanguageCount?: number;
      supportedLanguageCodes?: string[];
    }>({
      sessionToken,
      endpoint: '/platform-admin/sandbox/capabilities',
    });
  }

  async getPlatformSandboxTemplates(sessionToken: string) {
    return this.makeAdminApiCall<Array<{
      id: string;
      name: string;
      ownerType?: string;
      updatedAt?: string;
    }>>({
      sessionToken,
      endpoint: '/platform-admin/sandbox/templates',
    });
  }

  async simulateProviderFailover(sessionToken: string, request: {
    currentProvider: string;
    fallbackProvider: string;
    languageCode?: string;
  }) {
    return this.makeAdminApiCall<{
      canFailover: boolean;
      currentProvider: string;
      recommendedProvider?: string;
      languageCode?: string;
      message: string;
    }>({
      sessionToken,
      endpoint: '/platform-admin/sandbox/providers/failover-simulations',
      method: 'POST',
      body: request,
    });
  }

  async createSandboxWebhookTest(sessionToken: string, request: {
    targetUrl: string;
    eventType: string;
    payload?: string;
  }) {
    return this.makeAdminApiCall<{
      eventId: string;
      targetUrl: string;
      eventType: string;
      accepted: boolean;
      message: string;
      requestedAt: string;
    }>({
      sessionToken,
      endpoint: '/platform-admin/sandbox/webhook-tests',
      method: 'POST',
      body: request,
    });
  }

  async createSandboxDocumentation(sessionToken: string, request: {
    documentFormat: string;
    transcriptText?: string;
    conversationText?: string;
    includeSummary?: boolean;
    acceptSuggestions?: boolean;
    modelName?: string;
    templateId?: string;
    templateVariables?: Record<string, unknown>;
  }) {
    return this.makeAdminApiCall<{
      document?: string;
      summary?: string;
      documentFormat?: string;
      modelName?: string;
      templateId?: string;
      templateVariables?: Record<string, unknown>;
      generatedAt?: string;
    }>({
      sessionToken,
      endpoint: '/platform-admin/sandbox/documentation/generate',
      method: 'POST',
      body: request,
    });
  }
}

// Export singleton instance
export const adminApiService = new AdminApiService();
