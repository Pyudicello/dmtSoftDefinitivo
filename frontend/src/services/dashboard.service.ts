import { apiClient } from '@/lib/api-client';
import { CompanyMetricsSummary, DashboardSummary, Expiration } from '@/types';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    return apiClient<DashboardSummary>('/api/v1/dashboard/summary');
  },

  async getUpcomingExpirations(limit: number = 10): Promise<Expiration[]> {
    return apiClient<Expiration[]>(`/api/v1/dashboard/upcoming-expirations?limit=${limit}`);
  },

  async getCompanyMetrics(companyId: string): Promise<CompanyMetricsSummary> {
    return apiClient<CompanyMetricsSummary>(`/api/v1/companies/${companyId}/summary`);
  },
};
