import { apiClient } from '@/lib/api-client';
import {
  CancelPermitPayload,
  CreatePermitPayload,
  PageResponse,
  Permit,
  PermitFilterParams,
  RenewPermitPayload,
  UpdatePermitPayload,
} from '@/types';

export const permitService = {
  async getPermits(params?: PermitFilterParams): Promise<PageResponse<Permit>> {
    const query = new URLSearchParams();
    query.set('page', (params?.page ?? 0).toString());
    query.set('size', (params?.size ?? 15).toString());
    query.set('sort', params?.sort || 'expirationDate,asc');

    if (params) {
      if (params.companyId) query.set('companyId', params.companyId);
      if (params.type) query.set('type', params.type);
      if (params.status) query.set('status', params.status);
      if (params.from) query.set('from', params.from);
      if (params.to) query.set('to', params.to);
      if (params.search) query.set('search', params.search);
    }

    return apiClient<PageResponse<Permit>>(`/api/v1/permits?${query.toString()}`);
  },

  async getCompanyPermits(
    companyId: string,
    params?: PermitFilterParams
  ): Promise<PageResponse<Permit>> {
    const query = new URLSearchParams();
    query.set('page', (params?.page ?? 0).toString());
    query.set('size', (params?.size ?? 15).toString());
    query.set('sort', params?.sort || 'expirationDate,asc');

    if (params) {
      if (params.type) query.set('type', params.type);
      if (params.status) query.set('status', params.status);
      if (params.from) query.set('from', params.from);
      if (params.to) query.set('to', params.to);
      if (params.search) query.set('search', params.search);
    }

    return apiClient<PageResponse<Permit>>(
      `/api/v1/companies/${companyId}/permits?${query.toString()}`
    );
  },

  async getCompanyPermitHistory(
    companyId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<Permit>> {
    const query = new URLSearchParams();
    query.set('page', page.toString());
    query.set('size', size.toString());

    return apiClient<PageResponse<Permit>>(
      `/api/v1/companies/${companyId}/permits/history?${query.toString()}`
    );
  },

  async getPermitById(id: string): Promise<Permit> {
    return apiClient<Permit>(`/api/v1/permits/${id}`);
  },

  async createPermit(payload: CreatePermitPayload): Promise<Permit> {
    return apiClient<Permit>('/api/v1/permits', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createCompanyPermit(
    companyId: string,
    payload: CreatePermitPayload
  ): Promise<Permit> {
    return apiClient<Permit>(`/api/v1/companies/${companyId}/permits`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, companyId }),
    });
  },

  async renewPermit(id: string, payload: RenewPermitPayload): Promise<Permit> {
    return apiClient<Permit>(`/api/v1/permits/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updatePermit(id: string, payload: UpdatePermitPayload): Promise<Permit> {
    return apiClient<Permit>(`/api/v1/permits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async cancelPermit(id: string, payload?: CancelPermitPayload): Promise<Permit> {
    return apiClient<Permit>(`/api/v1/permits/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },

  async deletePermit(id: string): Promise<void> {
    return apiClient<void>(`/api/v1/permits/${id}`, {
      method: 'DELETE',
    });
  },
};
