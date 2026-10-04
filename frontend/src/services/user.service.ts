import { apiClient } from '@/lib/api-client';
import { PageResponse, User, UserRole } from '@/types';

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
};
