export type UserRole =
  | 'PLATFORM_ADMIN'
  | 'CONSULTANT_ADMIN'
  | 'TECHNICIAN'
  | 'CLIENT';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string | null;
  companyId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}

export interface Company {
  id: string;
  organizationId: string;
  businessName: string;
  legalName?: string;
  taxId?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  email?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  empty: boolean;
  first: boolean;
  last: boolean;
}

export interface SystemInfo {
  application: string;
  version: string;
  environment: string;
  status: string;
  timestamp: string;
}

export interface HealthStatus {
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  components?: {
    db?: {
      status: string;
      details?: Record<string, unknown>;
    };
    diskSpace?: {
      status: string;
    };
    ping?: {
      status: string;
    };
  };
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  traceId?: string;
  validationErrors?: Record<string, string>;
}
