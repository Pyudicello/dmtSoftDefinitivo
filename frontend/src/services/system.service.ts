import { apiClient } from '@/lib/api-client';
import { HealthStatus, SystemInfo } from '@/types';

export const systemService = {
  async getSystemInfo(): Promise<SystemInfo> {
    return apiClient<SystemInfo>('/api/v1/system/info');
  },

  async getHealth(): Promise<HealthStatus> {
    return apiClient<HealthStatus>('/actuator/health');
  },
};
