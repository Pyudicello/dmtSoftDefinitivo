import { apiClient } from '@/lib/api-client';
import {
  CancelExpirationPayload,
  CompleteExpirationPayload,
  CreateCategoryPayload,
  CreateExpirationPayload,
  Expiration,
  ExpirationCategory,
  ExpirationFilterParams,
  PageResponse,
  UpdateExpirationPayload,
} from '@/types';

export const expirationService = {
  async getExpirations(
    params?: ExpirationFilterParams
  ): Promise<PageResponse<Expiration>> {
    const query = new URLSearchParams();
    query.set('page', (params?.page ?? 0).toString());
    query.set('size', (params?.size ?? 15).toString());
    query.set('sort', params?.sort || 'expirationDate,asc');

    if (params) {
      if (params.companyId) query.set('companyId', params.companyId);
      if (params.categoryId) query.set('categoryId', params.categoryId);
      if (params.lifecycleStatus) query.set('lifecycleStatus', params.lifecycleStatus);
      if (params.deadlineStatus) query.set('deadlineStatus', params.deadlineStatus);
      if (params.responsibleUserId) query.set('responsibleUserId', params.responsibleUserId);
      if (params.from) query.set('from', params.from);
      if (params.to) query.set('to', params.to);
      if (params.search) query.set('search', params.search);
    }

    return apiClient<PageResponse<Expiration>>(`/api/v1/expirations?${query.toString()}`);
  },

  async getExpirationById(id: string): Promise<Expiration> {
    return apiClient<Expiration>(`/api/v1/expirations/${id}`);
  },

  async createExpiration(payload: CreateExpirationPayload): Promise<Expiration> {
    return apiClient<Expiration>('/api/v1/expirations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateExpiration(id: string, payload: UpdateExpirationPayload): Promise<Expiration> {
    return apiClient<Expiration>(`/api/v1/expirations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async completeExpiration(id: string, payload?: CompleteExpirationPayload): Promise<Expiration> {
    return apiClient<Expiration>(`/api/v1/expirations/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },

  async cancelExpiration(id: string, payload?: CancelExpirationPayload): Promise<Expiration> {
    return apiClient<Expiration>(`/api/v1/expirations/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },

  async deleteExpiration(id: string): Promise<void> {
    return apiClient<void>(`/api/v1/expirations/${id}`, {
      method: 'DELETE',
    });
  },

  async getUpcomingExpirations(companyId?: string): Promise<Expiration[]> {
    const query = new URLSearchParams();
    if (companyId) query.set('companyId', companyId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient<Expiration[]>(`/api/v1/expirations/upcoming${qs}`);
  },

  async getExpiredExpirations(companyId?: string): Promise<Expiration[]> {
    const query = new URLSearchParams();
    if (companyId) query.set('companyId', companyId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient<Expiration[]>(`/api/v1/expirations/expired${qs}`);
  },

  async getCompanyExpirations(
    companyId: string,
    params?: ExpirationFilterParams
  ): Promise<PageResponse<Expiration>> {
    const query = new URLSearchParams();
    query.set('page', (params?.page ?? 0).toString());
    query.set('size', (params?.size ?? 15).toString());
    query.set('sort', params?.sort || 'expirationDate,asc');

    if (params) {
      if (params.categoryId) query.set('categoryId', params.categoryId);
      if (params.lifecycleStatus) query.set('lifecycleStatus', params.lifecycleStatus);
      if (params.deadlineStatus) query.set('deadlineStatus', params.deadlineStatus);
      if (params.from) query.set('from', params.from);
      if (params.to) query.set('to', params.to);
    }

    return apiClient<PageResponse<Expiration>>(`/api/v1/companies/${companyId}/expirations?${query.toString()}`);
  },

  async getCategories(): Promise<ExpirationCategory[]> {
    return apiClient<ExpirationCategory[]>('/api/v1/expiration-categories');
  },

  async getCategoryById(id: string): Promise<ExpirationCategory> {
    return apiClient<ExpirationCategory>(`/api/v1/expiration-categories/${id}`);
  },

  async createCategory(payload: CreateCategoryPayload): Promise<ExpirationCategory> {
    return apiClient<ExpirationCategory>('/api/v1/expiration-categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
