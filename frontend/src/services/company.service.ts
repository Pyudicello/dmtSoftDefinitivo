import { apiClient } from '@/lib/api-client';
import { Company, CompanyMetricsSummary, PageResponse } from '@/types';

export const companyService = {
  async getCompanies(page: number = 0, size: number = 20, search?: string): Promise<PageResponse<Company>> {
    const query = new URLSearchParams();
    query.set('page', page.toString());
    query.set('size', size.toString());
    query.set('sort', 'businessName,asc');
    if (search && search.trim()) {
      query.set('search', search.trim());
    }
    return apiClient<PageResponse<Company>>(`/api/v1/companies?${query.toString()}`);
  },

  async getCompanyById(id: string): Promise<Company> {
    return apiClient<Company>(`/api/v1/companies/${id}`);
  },

  async getCompanyMetrics(id: string): Promise<CompanyMetricsSummary> {
    return apiClient<CompanyMetricsSummary>(`/api/v1/companies/${id}/summary`);
  },

  async createCompany(data: {
    businessName: string;
    legalName?: string;
    taxId?: string;
    address?: string;
    city?: string;
    province?: string;
    country?: string;
    email?: string;
    phone?: string;
    organizationId?: string;
  }): Promise<Company> {
    return apiClient<Company>('/api/v1/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
