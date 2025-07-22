const SUPABASE_URL = "https://rdjzeayewevditzekveb.supabase.co";

interface AdminApiOptions {
  sessionToken: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
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
    this.baseUrl = `${SUPABASE_URL}/functions/v1`;
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
        'x-admin-session-token': sessionToken, // Custom header for admin authentication
      };

      const config: RequestInit = {
        method,
        headers,
      };

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseUrl}/${endpoint}`, config);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText || response.statusText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Admin API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Organization Management APIs
   */
  async listOrganizations(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: 'b2b-organization-management/list'
    });
  }

  async createOrganization(sessionToken: string, organizationData: any) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: 'b2b-organization-management/create',
      method: 'POST',
      body: organizationData
    });
  }

  async manageCredits(sessionToken: string, organizationId: string, creditAdjustment: number, description: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: 'b2b-organization-management/credits',
      method: 'POST',
      body: {
        organization_id: organizationId,
        credit_adjustment: creditAdjustment,
        description
      }
    });
  }

  async getUsageStats(sessionToken: string, organizationId: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({
      organization_id: organizationId,
      start_date: startDate,
      end_date: endDate
    });

    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `b2b-organization-management/usage?${params}`
    });
  }

  async rotateApiKey(sessionToken: string, organizationId: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: 'b2b-organization-management/rotate-key',
      method: 'POST',
      body: {
        organization_id: organizationId
      }
    });
  }

  /**
   * System Analytics APIs (when implemented)
   */
  async getSystemStats(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: 'admin/system-stats'
    });
  }

  async getSystemHealth(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: 'admin/system-health'
    });
  }

  /**
   * Admin User Management APIs (for super admins)
   */
  async listAdminUsers(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: 'admin/users'
    });
  }

  async createAdminUser(sessionToken: string, userData: {
    email: string;
    password: string;
    name: string;
    role: string;
    permissions: Record<string, boolean>;
  }) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: 'admin/users',
      method: 'POST',
      body: userData
    });
  }

  async updateAdminUser(sessionToken: string, userId: string, userData: Partial<{
    name: string;
    role: string;
    permissions: Record<string, boolean>;
    is_active: boolean;
  }>) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `admin/users/${userId}`,
      method: 'PUT',
      body: userData
    });
  }

  async deleteAdminUser(sessionToken: string, userId: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: `admin/users/${userId}`,
      method: 'DELETE'
    });
  }

  /**
   * Configuration APIs
   */
  async getSystemConfig(sessionToken: string) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: 'admin/config'
    });
  }

  async updateSystemConfig(sessionToken: string, config: Record<string, any>) {
    return this.makeAdminApiCall({
      sessionToken,
      endpoint: 'admin/config',
      method: 'PUT',
      body: config
    });
  }
}

// Export singleton instance
export const adminApiService = new AdminApiService();
