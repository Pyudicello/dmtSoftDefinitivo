import { apiClient } from '@/lib/api-client';
import { Company, PageResponse } from '@/types';

export const companyService = {
  async getCompanies(page: number = 0, size: number = 20): Promise<PageResponse<Company>> {
    return apiClient<PageResponse<Company>>(`/api/v1/companies?page=${page}&size=${size}&sort=businessName,asc`);
  },

  async getCompanyById(id: string): Promise<Company> {
    return apiClient<Company>(`/api/v1/companies/${id}`);
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
