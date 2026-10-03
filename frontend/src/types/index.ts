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
