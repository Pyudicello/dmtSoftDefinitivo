import { ExpirationFilterParams } from '@/types';

export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => [...queryKeys.dashboard.all, 'summary'] as const,
    upcoming: (limit: number) => [...queryKeys.dashboard.all, 'upcoming', limit] as const,
  },
  companies: {
    all: ['companies'] as const,
    list: (page: number, size: number, search?: string) =>
      [...queryKeys.companies.all, 'list', { page, size, search }] as const,
    detail: (id: string) => [...queryKeys.companies.all, 'detail', id] as const,
    metrics: (id: string) => [...queryKeys.companies.all, 'metrics', id] as const,
    expirations: (id: string, params?: ExpirationFilterParams) =>
      [...queryKeys.companies.all, 'expirations', id, params] as const,
  },
  expirations: {
    all: ['expirations'] as const,
    list: (params?: ExpirationFilterParams) =>
      [...queryKeys.expirations.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.expirations.all, 'detail', id] as const,
    upcoming: (companyId?: string) =>
      [...queryKeys.expirations.all, 'upcoming', companyId] as const,
    expired: (companyId?: string) =>
      [...queryKeys.expirations.all, 'expired', companyId] as const,
    categories: () => [...queryKeys.expirations.all, 'categories'] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    list: (companyId?: string, priority?: string) =>
      [...queryKeys.alerts.all, 'list', { companyId, priority }] as const,
  },
  inspections: {
    all: ['inspections'] as const,
    list: (params?: any) => [...queryKeys.inspections.all, 'list', params] as const,
    company: (companyId: string, params?: any) =>
      [...queryKeys.inspections.all, 'company', companyId, params] as const,
    detail: (id: string) => [...queryKeys.inspections.all, 'detail', id] as const,
  },
  permits: {
    all: ['permits'] as const,
    list: (params?: any) => [...queryKeys.permits.all, 'list', params] as const,
    company: (companyId: string, params?: any) =>
      [...queryKeys.permits.all, 'company', companyId, params] as const,
    history: (companyId: string) =>
      [...queryKeys.permits.all, 'history', companyId] as const,
    detail: (id: string) => [...queryKeys.permits.all, 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    list: (role?: string, page?: number, size?: number) =>
      [...queryKeys.users.all, 'list', { role, page, size }] as const,
    technicians: () => [...queryKeys.users.all, 'technicians'] as const,
    companyTechnicians: (companyId: string) =>
      [...queryKeys.users.all, 'company', companyId] as const,
  },
};
