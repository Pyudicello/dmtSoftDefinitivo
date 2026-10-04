import { apiClient } from '@/lib/api-client';
import { AlertsSummary } from '@/types';

export const alertService = {
  getAlerts: async (companyId?: string, priority?: string): Promise<AlertsSummary> => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId);
    if (priority && priority !== 'ALL') params.append('priority', priority);

    const queryString = params.toString();
    const endpoint = `/api/v1/alerts${queryString ? `?${queryString}` : ''}`;
    return apiClient<AlertsSummary>(endpoint);
  },
};
