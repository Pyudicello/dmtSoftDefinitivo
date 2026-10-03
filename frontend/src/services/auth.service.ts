import { apiClient, setStoredAuthToken } from '@/lib/api-client';
import { LoginResponse, UserSummary } from '@/types';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.accessToken) {
      setStoredAuthToken(response.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('prevenia_user', JSON.stringify(response.user));
      }
    }

    return response;
  },

  logout() {
    setStoredAuthToken(null);
  },

  getStoredUser(): UserSummary | null {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('prevenia_user');
      if (userJson) {
        try {
          return JSON.parse(userJson) as UserSummary;
        } catch {
          return null;
        }
      }
    }
    return null;
  },
};
