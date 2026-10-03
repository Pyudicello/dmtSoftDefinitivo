const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public errorBody?: unknown
  ) {
    super(`API request failed with status ${status} (${statusText})`);
    this.name = 'ApiClientError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // Avoid caching in development / healthchecks
    cache: 'no-store',
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ApiClientError(response.status, response.statusText, errorBody);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? `Network or connection error: ${error.message}`
        : 'Unknown connection failure'
    );
  }
}

export { API_BASE_URL };
