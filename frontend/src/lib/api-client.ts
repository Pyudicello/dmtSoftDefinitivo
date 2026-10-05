export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // In the browser on HTTPS, always use same-origin relative /api route so Next.js rewrites proxy it over HTTPS
    if (window.location.protocol === 'https:') {
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
    let detail = '';
    if (errorBody && typeof errorBody === 'object') {
      detail = errorBody.message || errorBody.error || JSON.stringify(errorBody);
    } else if (typeof errorBody === 'string') {
      detail = errorBody;
    }
    super(detail || `Error ${status}: ${statusText || 'Respuesta fallida del servidor'}`);
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

  console.log(`[API Request] ${options.method || 'GET'} -> ${url}`, {
    url,
    headers: config.headers,
    hasBody: !!options.body,
  });

  try {
    const response = await fetch(url, config);
    console.log(`[API Response] ${response.status} ${response.statusText} from ${url}`);

    if (response.status === 401) {
      setStoredAuthToken(null);
    }

    if (!response.ok) {
      let errorBody: any;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      console.error(`[API Error ${response.status}] Details:`, errorBody);
      throw new ApiClientError(response.status, response.statusText, errorBody);
    }

    if (response.status === 204) {
      return null as T;
    }

    const data = await response.json();
    console.log(`[API Success] Payload:`, data);
    return data as T;
  } catch (error) {
    console.error(`[API Network Error] ${url}:`, error);
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Error de conexión o red con el backend de PREVENIA'
    );
  }
}
