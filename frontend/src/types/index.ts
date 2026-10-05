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
  fullName?: string;
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

export type ExpirationLifecycleStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type ExpirationDeadlineStatus = 'CURRENT' | 'UPCOMING' | 'URGENT' | 'EXPIRED';

export type RecurrenceType =
  | 'NONE'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUAL'
  | 'YEARLY'
  | 'CUSTOM';

export interface CategorySummary {
  id: string;
  code: string;
  name: string;
  icon?: string;
  colorCode?: string;
  isSystem: boolean;
}

export interface CompanySummary {
  id: string;
  businessName: string;
  legalName?: string;
  taxId?: string;
}

export interface ExpirationCategory {
  id: string;
  organizationId?: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  colorCode?: string;
  isSystem: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expiration {
  id: string;
  organizationId: string;
  company: CompanySummary;
  category: CategorySummary;
  title: string;
  description?: string;
  issueDate?: string;
  expirationDate: string;
  lifecycleStatus: ExpirationLifecycleStatus;
  deadlineStatus?: ExpirationDeadlineStatus | null;
  daysUntilExpiration?: number | null;
  responsible?: UserSummary | null;
  recurrenceType: RecurrenceType;
  notificationDaysBefore: number;
  notes?: string;
  completedAt?: string | null;
  completionNotes?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpirationPayload {
  companyId: string;
  categoryId: string;
  title: string;
  description?: string;
  issueDate?: string;
  expirationDate: string;
  responsibleUserId?: string;
  recurrenceType?: RecurrenceType;
  notificationDaysBefore?: number;
  notes?: string;
}

export interface UpdateExpirationPayload {
  categoryId: string;
  title: string;
  description?: string;
  issueDate?: string;
  expirationDate: string;
  responsibleUserId?: string;
  recurrenceType?: RecurrenceType;
  notificationDaysBefore?: number;
  notes?: string;
}

export interface CompleteExpirationPayload {
  completedAt?: string;
  notes?: string;
}

export interface CancelExpirationPayload {
  reason?: string;
}

export interface ExpirationFilterParams {
  page?: number;
  size?: number;
  sort?: string;
  companyId?: string;
  categoryId?: string;
  lifecycleStatus?: ExpirationLifecycleStatus;
  deadlineStatus?: ExpirationDeadlineStatus;
  responsibleUserId?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface CreateCategoryPayload {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  colorCode?: string;
  organizationId?: string;
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

export interface DashboardSummary {
  companyCount: number;
  expiredCount: number;
  next7DaysCount: number;
  next30DaysCount: number;
  completedCount: number;
}

export interface CompanyMetricsSummary {
  company: Company;
  expiredCount: number;
  next7DaysCount: number;
  next30DaysCount: number;
  currentCount: number;
  completedCount: number;
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

export interface AlertItem {
  expirationId: string;
  companyId: string;
  companyName: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description?: string;
  expirationDate: string;
  deadlineStatus?: ExpirationDeadlineStatus | null;
  daysUntilExpiration?: number | null;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  responsibleUserId?: string | null;
  responsibleUserName?: string | null;
}

export interface AlertsSummary {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  totalCount: number;
  alerts: AlertItem[];
}

export interface User {
  id: string;
  organizationId?: string | null;
  companyId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  organizationId?: string;
  companyId?: string;
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

// ==========================================
// 5. INSPECTIONS / VISITAS
// ==========================================

export type InspectionType =
  | 'ART'
  | 'MUNICIPAL'
  | 'PROVINCIAL'
  | 'HYGIENE_SAFETY_SERVICE'
  | 'OTHER';

export interface Inspection {
  id: string;
  organizationId: string;
  company: CompanySummary;
  type: InspectionType;
  typeLabel: string;
  visitDate: string;
  authority: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  result?: string;
  notes?: string;
  nextVisitDate?: string | null;
  documentReference?: string;
  expirationId?: string | null;
  nextVisitDeadlineStatus?: ExpirationDeadlineStatus | null;
  nextVisitDaysRemaining?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInspectionPayload {
  companyId: string;
  type: InspectionType;
  visitDate: string;
  authority: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  result?: string;
  notes?: string;
  nextVisitDate?: string;
  documentReference?: string;
}

export interface UpdateInspectionPayload {
  type: InspectionType;
  visitDate: string;
  authority: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  result?: string;
  notes?: string;
  nextVisitDate?: string;
  documentReference?: string;
}

export interface InspectionFilterParams {
  page?: number;
  size?: number;
  sort?: string;
  companyId?: string;
  type?: InspectionType;
  from?: string;
  to?: string;
  search?: string;
}

// ==========================================
// 6. PERMITS / HABILITACIONES / VISADOS
// ==========================================

export type PermitType =
  | 'MUNICIPAL'
  | 'PROVINCIAL'
  | 'FIRE_DEPARTMENT'
  | 'OTHER';

export type PermitStatus = 'ACTIVE' | 'RENEWED' | 'EXPIRED' | 'CANCELLED';

export interface Permit {
  id: string;
  organizationId: string;
  company: CompanySummary;
  type: PermitType;
  typeLabel: string;
  issuingAuthority: string;
  permitNumber: string;
  issueDate: string;
  expirationDate: string;
  status: PermitStatus;
  statusLabel: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  documentReference?: string;
  previousPermitId?: string | null;
  previousPermitNumber?: string | null;
  expirationId?: string | null;
  deadlineStatus?: ExpirationDeadlineStatus | null;
  daysUntilExpiration?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermitPayload {
  companyId: string;
  type: PermitType;
  issuingAuthority: string;
  permitNumber: string;
  issueDate: string;
  expirationDate: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  documentReference?: string;
  previousPermitId?: string;
}

export interface RenewPermitPayload {
  permitNumber: string;
  issueDate: string;
  expirationDate: string;
  issuingAuthority?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  documentReference?: string;
}

export interface UpdatePermitPayload {
  type: PermitType;
  issuingAuthority: string;
  permitNumber: string;
  issueDate: string;
  expirationDate: string;
  status?: PermitStatus;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  documentReference?: string;
}

export interface CancelPermitPayload {
  reason?: string;
}

export interface PermitFilterParams {
  page?: number;
  size?: number;
  sort?: string;
  companyId?: string;
  type?: PermitType;
  status?: PermitStatus;
  from?: string;
  to?: string;
  search?: string;
}
