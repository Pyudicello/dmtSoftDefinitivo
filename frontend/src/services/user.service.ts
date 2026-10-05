import { apiClient } from '@/lib/api-client';
import { CreateUserPayload, PageResponse, User, UserRole } from '@/types';

export interface TechnicianSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  assignedAt?: string;
}

export const userService = {
  getUsers: async (role?: UserRole, page: number = 0, size: number = 50): Promise<PageResponse<User>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (role) {
      params.append('role', role);
    }
    return apiClient<PageResponse<User>>(`/api/v1/users?${params.toString()}`);
  },

  getTechnicians: async (): Promise<User[]> => {
    const response = await userService.getUsers('TECHNICIAN', 0, 100);
    return response.content || [];
  },

  createUser: async (payload: CreateUserPayload): Promise<User> => {
    return apiClient<User>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getAssignedTechnicians: async (companyId: string): Promise<TechnicianSummary[]> => {
    return apiClient<TechnicianSummary[]>(`/api/v1/companies/${companyId}/technicians`);
  },

  assignTechnician: async (companyId: string, userId: string): Promise<void> => {
    return apiClient<void>(`/api/v1/companies/${companyId}/technicians/${userId}`, {
      method: 'POST',
    });
  },

  unassignTechnician: async (companyId: string, userId: string): Promise<void> => {
    return apiClient<void>(`/api/v1/companies/${companyId}/technicians/${userId}`, {
      method: 'DELETE',
    });
  },
};

