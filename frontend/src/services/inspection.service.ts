import { apiClient } from '@/lib/api-client';
import {
  CreateInspectionPayload,
  Inspection,
  InspectionFilterParams,
  PageResponse,
  UpdateInspectionPayload,
} from '@/types';

export const inspectionService = {
  async getInspections(
    params?: InspectionFilterParams
  ): Promise<PageResponse<Inspection>> {
    const query = new URLSearchParams();
    query.set('page', (params?.page ?? 0).toString());
    query.set('size', (params?.size ?? 15).toString());
    query.set('sort', params?.sort || 'visitDate,desc');

    if (params) {
      if (params.companyId) query.set('companyId', params.companyId);
      if (params.type) query.set('type', params.type);
      if (params.from) query.set('from', params.from);
      if (params.to) query.set('to', params.to);
      if (params.search) query.set('search', params.search);
    }

    return apiClient<PageResponse<Inspection>>(`/api/v1/inspections?${query.toString()}`);
  },

  async getCompanyInspections(
    companyId: string,
    params?: InspectionFilterParams
  ): Promise<PageResponse<Inspection>> {
    const query = new URLSearchParams();
    query.set('page', (params?.page ?? 0).toString());
    query.set('size', (params?.size ?? 15).toString());
    query.set('sort', params?.sort || 'visitDate,desc');

    if (params) {
      if (params.type) query.set('type', params.type);
      if (params.from) query.set('from', params.from);
      if (params.to) query.set('to', params.to);
      if (params.search) query.set('search', params.search);
    }

    return apiClient<PageResponse<Inspection>>(
      `/api/v1/companies/${companyId}/inspections?${query.toString()}`
    );
  },

  async getInspectionById(id: string): Promise<Inspection> {
    return apiClient<Inspection>(`/api/v1/inspections/${id}`);
  },

  async createInspection(payload: CreateInspectionPayload): Promise<Inspection> {
    return apiClient<Inspection>('/api/v1/inspections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createCompanyInspection(
    companyId: string,
    payload: CreateInspectionPayload
  ): Promise<Inspection> {
    return apiClient<Inspection>(`/api/v1/companies/${companyId}/inspections`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, companyId }),
    });
  },

  async updateInspection(id: string, payload: UpdateInspectionPayload): Promise<Inspection> {
    return apiClient<Inspection>(`/api/v1/inspections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteInspection(id: string): Promise<void> {
    return apiClient<void>(`/api/v1/inspections/${id}`, {
      method: 'DELETE',
    });
  },
};
