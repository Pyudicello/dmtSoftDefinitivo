export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // In the browser on HTTPS, use same-origin relative route so Next.js proxies securely over HTTPS
    if (window.location.protocol === 'https:' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.startsWith('http://'))) {
      return '';
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public errorBody?: any
  ) {
    super(`API request failed with status ${status} (${statusText})`);
    this.name = 'ApiClientError';
  }
}

export function getStoredAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('prevenia_token');
  }
  return null;
}

export function setStoredAuthToken(token: string | null) {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('prevenia_token', token);
    } else {
      localStorage.removeItem('prevenia_token');
      localStorage.removeItem('prevenia_user');
    }
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = getStoredAuthToken();

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    cache: 'no-store',
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      // Clear invalid credentials on 401
      setStoredAuthToken(null);
    }

    if (!response.ok) {
      let errorBody: any;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ApiClientError(response.status, response.statusText, errorBody);
    }

    if (response.status === 204) {
      return null as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Network or connection error contacting PREVENIA backend'
    );
  }
}

