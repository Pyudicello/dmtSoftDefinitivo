'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { ExpirationStatusBadge } from '@/components/ui/ExpirationStatusBadge';
import { TableSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { queryKeys } from '@/lib/query-keys';
import { expirationService } from '@/services/expiration.service';
import { companyService } from '@/services/company.service';
import { userService } from '@/services/user.service';
import {
  formatDateSpanish,
  getDaysUntilLabel,
  buildMonthCalendarGrid,
  MONTH_NAMES_ES,
  WEEKDAYS_SHORT_ES,
  toIsoDateString,
  getTodayIso,
  CalendarDay,
} from '@/lib/date-utils';
import {
  Expiration,
  ExpirationCategory,
  ExpirationFilterParams,
  ExpirationLifecycleStatus,
  ExpirationDeadlineStatus,
  Company,
  User,
} from '@/types';
import {
  Clock,
  PlusCircle,
  Filter,
  RefreshCw,
  Eye,
  Check,
  X,
  Calendar as CalendarIcon,
  List as ListIcon,
  Building2,
  Tag,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

function ExpirationsContent() {
  const { user, role } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Read URL params
  const currentView = (searchParams.get('view') === 'calendar' ? 'calendar' : 'list') as 'list' | 'calendar';
  const urlCompanyId = searchParams.get('companyId') || '';
  const urlCategoryId = searchParams.get('categoryId') || '';
  const urlStatus = searchParams.get('status') || 'ALL';
  const urlResponsibleUserId = searchParams.get('responsibleUserId') || '';
  const urlFrom = searchParams.get('from') || '';
  const urlTo = searchParams.get('to') || '';
  const urlSearch = searchParams.get('search') || '';
  const urlPage = parseInt(searchParams.get('page') || '0', 10);
  const urlSize = parseInt(searchParams.get('size') || '20', 10);
  const urlSort = searchParams.get('sort') || 'expirationDate,asc';

  // Local Filter State synced with URL
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [selectedCompanyId, setSelectedCompanyId] = useState(urlCompanyId);
  const [selectedCategoryId, setSelectedCategoryId] = useState(urlCategoryId);
  const [selectedStatus, setSelectedStatus] = useState(urlStatus);
  const [selectedResponsibleUserId, setSelectedResponsibleUserId] = useState(urlResponsibleUserId);
  const [selectedFrom, setSelectedFrom] = useState(urlFrom);
  const [selectedTo, setSelectedTo] = useState(urlTo);
  const [page, setPage] = useState(urlPage);
  const [pageSize, setPageSize] = useState(urlSize);
  const [sortField, sortDirection] = urlSort.split(',');
  const [currentSort, setCurrentSort] = useState(urlSort);

  // Calendar State
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1); // 1-12
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ day: CalendarDay; events: Expiration[] } | null>(null);

  // Modals for complete and cancel
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<Expiration | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionReason, setActionReason] = useState('');

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync state changes to URL
  const updateUrlParams = React.useCallback((updates: Record<string, string | number | undefined | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '' || (key === 'status' && val === 'ALL') || (key === 'page' && val === 0)) {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
    router.replace(`/expirations?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Sync search debounce to URL
  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      updateUrlParams({ search: debouncedSearch, page: 0 });
      setPage(0);
    }
  }, [debouncedSearch, urlSearch, updateUrlParams]);

  // Map unified status to backend filter params
  const mappedStatus = useMemo(() => {
    let lifecycleStatus: ExpirationLifecycleStatus | undefined;
    let deadlineStatus: ExpirationDeadlineStatus | undefined;

    switch (selectedStatus) {
      case 'EXPIRED':
        lifecycleStatus = 'ACTIVE';
        deadlineStatus = 'EXPIRED';
        break;
      case 'URGENT':
        lifecycleStatus = 'ACTIVE';
        deadlineStatus = 'URGENT';
        break;
      case 'UPCOMING':
        lifecycleStatus = 'ACTIVE';
        deadlineStatus = 'UPCOMING';
        break;
      case 'CURRENT':
        lifecycleStatus = 'ACTIVE';
        deadlineStatus = 'CURRENT';
        break;
      case 'COMPLETED':
        lifecycleStatus = 'COMPLETED';
        break;
      case 'CANCELLED':
        lifecycleStatus = 'CANCELLED';
        break;
      default:
        break;
    }
    return { lifecycleStatus, deadlineStatus };
  }, [selectedStatus]);

  // Queries for select options
  const { data: companiesData } = useQuery({
    queryKey: queryKeys.companies.list(0, 100),
    queryFn: () => companyService.getCompanies(0, 100),
  });
  const companies = companiesData?.content || [];

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.expirations.categories(),
    queryFn: () => expirationService.getCategories(),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: queryKeys.users.technicians(),
    queryFn: () => userService.getTechnicians(),
    enabled: role === 'PLATFORM_ADMIN' || role === 'CONSULTANT_ADMIN',
  });

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCompanyId) count++;
    if (selectedCategoryId) count++;
    if (selectedStatus && selectedStatus !== 'ALL') count++;
    if (selectedResponsibleUserId) count++;
    if (selectedFrom) count++;
    if (selectedTo) count++;
    if (debouncedSearch) count++;
    return count;
  }, [selectedCompanyId, selectedCategoryId, selectedStatus, selectedResponsibleUserId, selectedFrom, selectedTo, debouncedSearch]);

  // Calendar Grid computation
  const calendarGrid = useMemo(() => {
    return buildMonthCalendarGrid(calendarYear, calendarMonth);
  }, [calendarYear, calendarMonth]);

  // List View Query Params
  const listQueryParams: ExpirationFilterParams = useMemo(() => ({
    page,
    size: pageSize,
    sort: currentSort,
    companyId: selectedCompanyId || undefined,
    categoryId: selectedCategoryId || undefined,
    lifecycleStatus: mappedStatus.lifecycleStatus,
    deadlineStatus: mappedStatus.deadlineStatus,
    responsibleUserId: selectedResponsibleUserId || undefined,
    from: selectedFrom || undefined,
    to: selectedTo || undefined,
    search: debouncedSearch || undefined,
  }), [page, pageSize, currentSort, selectedCompanyId, selectedCategoryId, mappedStatus, selectedResponsibleUserId, selectedFrom, selectedTo, debouncedSearch]);

  // Calendar View Query Params (fetches all events in the visible calendar month range)
  const calendarQueryParams: ExpirationFilterParams = useMemo(() => ({
    page: 0,
    size: 150, // sufficient for full visible month grid
    sort: 'expirationDate,asc',
    companyId: selectedCompanyId || undefined,
    categoryId: selectedCategoryId || undefined,
    lifecycleStatus: mappedStatus.lifecycleStatus,
    deadlineStatus: mappedStatus.deadlineStatus,
    responsibleUserId: selectedResponsibleUserId || undefined,
    from: calendarGrid.startDateIso,
    to: calendarGrid.endDateIso,
    search: debouncedSearch || undefined,
  }), [calendarGrid, selectedCompanyId, selectedCategoryId, mappedStatus, selectedResponsibleUserId, debouncedSearch]);

  // Data Queries
  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
  } = useQuery({
    queryKey: queryKeys.expirations.list(listQueryParams),
    queryFn: () => expirationService.getExpirations(listQueryParams),
    enabled: currentView === 'list',
  });

  const {
    data: calendarData,
    isLoading: calendarLoading,
    isError: calendarError,
    refetch: refetchCalendar,
  } = useQuery({
    queryKey: queryKeys.expirations.list(calendarQueryParams),
    queryFn: () => expirationService.getExpirations(calendarQueryParams),
    enabled: currentView === 'calendar',
  });

  // Map calendar events by date string ('YYYY-MM-DD')
  const eventsByDate = useMemo(() => {
    const map: Record<string, Expiration[]> = {};
    if (calendarData?.content) {
      calendarData.content.forEach((exp) => {
        const dateKey = exp.expirationDate;
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(exp);
      });
    }
    return map;
  }, [calendarData]);

  // Mutations
  const completeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      expirationService.completeExpiration(id, { notes }),
    onSuccess: (data) => {
      toast.success(`Vencimiento '${data.title}' marcado como completado`);
      setCompleteModalOpen(false);
      setSelectedExp(null);
      setActionNotes('');
      // Invalidate all affected queries
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
    onError: (err: any) => {
      toast.error(err?.errorBody?.message || err?.message || 'Error al completar el vencimiento');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      expirationService.cancelExpiration(id, { reason }),
    onSuccess: (data) => {
      toast.success(`Vencimiento '${data.title}' cancelado`);
      setCancelModalOpen(false);
      setSelectedExp(null);
      setActionReason('');
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
    onError: (err: any) => {
      toast.error(err?.errorBody?.message || err?.message || 'Error al cancelar el vencimiento');
    },
  });

  const canCreate = role === 'PLATFORM_ADMIN' || role === 'CONSULTANT_ADMIN' || role === 'TECHNICIAN';

  // Clear filters
  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedCompanyId('');
    setSelectedCategoryId('');
    setSelectedStatus('ALL');
    setSelectedResponsibleUserId('');
    setSelectedFrom('');
    setSelectedTo('');
    setPage(0);
    updateUrlParams({
      search: undefined,
      companyId: undefined,
      categoryId: undefined,
      status: undefined,
      responsibleUserId: undefined,
      from: undefined,
      to: undefined,
      page: 0,
    });
  };

  // Quick Date Presets
  const applyDatePreset = (preset: 'today' | 'next7' | 'next30' | 'thisMonth') => {
    const todayIso = getTodayIso();
    const todayObj = new Date();

    if (preset === 'today') {
      setSelectedFrom(todayIso);
      setSelectedTo(todayIso);
      updateUrlParams({ from: todayIso, to: todayIso, page: 0 });
    } else if (preset === 'next7') {
      const next7 = new Date();
      next7.setDate(todayObj.getDate() + 7);
      const toIso = toIsoDateString(next7.getFullYear(), next7.getMonth() + 1, next7.getDate());
      setSelectedFrom(todayIso);
      setSelectedTo(toIso);
      updateUrlParams({ from: todayIso, to: toIso, page: 0 });
    } else if (preset === 'next30') {
      const next30 = new Date();
      next30.setDate(todayObj.getDate() + 30);
      const toIso = toIsoDateString(next30.getFullYear(), next30.getMonth() + 1, next30.getDate());
      setSelectedFrom(todayIso);
      setSelectedTo(toIso);
      updateUrlParams({ from: todayIso, to: toIso, page: 0 });
    } else if (preset === 'thisMonth') {
      const firstDay = toIsoDateString(todayObj.getFullYear(), todayObj.getMonth() + 1, 1);
      const lastDayObj = new Date(todayObj.getFullYear(), todayObj.getMonth() + 1, 0);
      const lastDay = toIsoDateString(lastDayObj.getFullYear(), lastDayObj.getMonth() + 1, lastDayObj.getDate());
      setSelectedFrom(firstDay);
      setSelectedTo(lastDay);
      updateUrlParams({ from: firstDay, to: lastDay, page: 0 });
    }
  };

  // Sort Toggle
  const handleSortToggle = (field: string) => {
    let nextSort = `${field},asc`;
    if (sortField === field) {
      nextSort = sortDirection === 'asc' ? `${field},desc` : `${field},asc`;
    }
    setCurrentSort(nextSort);
    updateUrlParams({ sort: nextSort });
  };

  // Calendar Navigation
  const handlePrevMonth = () => {
    if (calendarMonth === 1) {
      setCalendarMonth(12);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarMonth(1);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleTodayMonth = () => {
    setCalendarYear(today.getFullYear());
    setCalendarMonth(today.getMonth() + 1);
  };

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Header with View Toggle & New Button */}
        <PageHeader
          title="Gestión de Vencimientos"
          subtitle="Agenda operativa de obligaciones técnicas, control periódico y auditoría de cumplimiento normativo."
          icon={<Clock size={24} color="#38bdf8" />}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Vencimientos' },
          ]}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* View Switcher: Lista / Calendario */}
              <div
                style={{
                  display: 'flex',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '3px',
                }}
              >
                <button
                  onClick={() => updateUrlParams({ view: 'list' })}
                  className="btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.82rem',
                    borderRadius: '6px',
                    background: currentView === 'list' ? 'var(--primary-color)' : 'transparent',
                    color: currentView === 'list' ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: currentView === 'list' ? 600 : 400,
                  }}
                  title="Vista en tabla operativa"
                >
                  <ListIcon size={15} />
                  <span>Lista</span>
                </button>
                <button
                  onClick={() => updateUrlParams({ view: 'calendar' })}
                  className="btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.82rem',
                    borderRadius: '6px',
                    background: currentView === 'calendar' ? 'var(--primary-color)' : 'transparent',
                    color: currentView === 'calendar' ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: currentView === 'calendar' ? 600 : 400,
                  }}
                  title="Vista en calendario mensual"
                >
                  <CalendarIcon size={15} />
                  <span>Calendario</span>
                </button>
              </div>

              {canCreate && (
                <Link
                  href="/expirations/new"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                >
                  <PlusCircle size={16} />
                  <span>Nuevo Vencimiento</span>
                </Link>
              )}
            </div>
          }
        />

        {/* Filter Toolbar Card */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Top Row: Search + Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Buscar por título o notas..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                  fontSize: '0.85rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Company Selector */}
            {companies.length > 1 && (
              <select
                value={selectedCompanyId}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value);
                  updateUrlParams({ companyId: e.target.value, page: 0 });
                  setPage(0);
                }}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              >
                <option value="">Todas las empresas</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName}
                  </option>
                ))}
              </select>
            )}

            {/* Category Selector */}
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                updateUrlParams({ categoryId: e.target.value, page: 0 });
                setPage(0);
              }}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
              }}
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Status Selector */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                updateUrlParams({ status: e.target.value, page: 0 });
                setPage(0);
              }}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
              }}
            >
              <option value="ALL">Todos los estados</option>
              <option value="EXPIRED">🔴 Vencido (Expired)</option>
              <option value="URGENT">🟠 Urgente (0 a 7 días)</option>
              <option value="UPCOMING">🟡 Próximo (8 a 30 días)</option>
              <option value="CURRENT">🟢 Vigente (&gt; 30 días)</option>
              <option value="COMPLETED">✔️ Completado</option>
              <option value="CANCELLED">⚪ Cancelado</option>
            </select>

            {/* Technician Filter (for admins) */}
            {(role === 'PLATFORM_ADMIN' || role === 'CONSULTANT_ADMIN') && technicians.length > 0 && (
              <select
                value={selectedResponsibleUserId}
                onChange={(e) => {
                  setSelectedResponsibleUserId(e.target.value);
                  updateUrlParams({ responsibleUserId: e.target.value, page: 0 });
                  setPage(0);
                }}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              >
                <option value="">Todos los técnicos</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} ({t.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Bottom Row: Date Range + Quick Presets + Clear Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Fechas:
              </span>
              <input
                type="date"
                value={selectedFrom}
                onChange={(e) => {
                  setSelectedFrom(e.target.value);
                  updateUrlParams({ from: e.target.value, page: 0 });
                  setPage(0);
                }}
                style={{
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.82rem',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
                title="Fecha desde"
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>hasta</span>
              <input
                type="date"
                value={selectedTo}
                onChange={(e) => {
                  setSelectedTo(e.target.value);
                  updateUrlParams({ to: e.target.value, page: 0 });
                  setPage(0);
                }}
                style={{
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.82rem',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
                title="Fecha hasta"
              />

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: '0.3rem', marginLeft: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => applyDatePreset('today')}
                  className="btn"
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset('next7')}
                  className="btn"
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
                >
                  Próx. 7d
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset('next30')}
                  className="btn"
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
                >
                  Próx. 30d
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset('thisMonth')}
                  className="btn"
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
                >
                  Este Mes
                </button>
              </div>
            </div>

            {/* Clear Filters Button & Active Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {activeFiltersCount > 0 && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '9999px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#93c5fd',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro activo' : 'filtros activos'}
                </span>
              )}

              <button
                type="button"
                onClick={handleClearFilters}
                disabled={activeFiltersCount === 0}
                className="btn btn-secondary"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  opacity: activeFiltersCount === 0 ? 0.5 : 1,
                  cursor: activeFiltersCount === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <RotateCcw size={13} />
                <span>Limpiar filtros</span>
              </button>
            </div>
          </div>
        </div>

        {/* VIEW 1: LIST VIEW */}
        {currentView === 'list' && (
          <div>
            {listLoading ? (
              <TableSkeleton rows={8} cols={7} />
            ) : listError ? (
              <ErrorState
                title="Error al consultar vencimientos"
                message="No pudimos cargar los vencimientos solicitados. Por favor, reintentá."
                onRetry={() => refetchList()}
              />
            ) : !listData || listData.content.length === 0 ? (
              <EmptyState
                icon={<Clock size={48} color="var(--text-muted)" />}
                title={activeFiltersCount > 0 ? 'Sin resultados para estos filtros' : 'No hay vencimientos registrados'}
                description={
                  activeFiltersCount > 0
                    ? 'Probá ajustando o limpiando los filtros para ver otros vencimientos.'
                    : 'Registrá una nueva obligación periódica para comenzar a gestionar el cumplimiento técnico.'
                }
                actionLabel={activeFiltersCount > 0 ? 'Limpiar filtros' : canCreate ? 'Crear vencimiento' : undefined}
                onAction={activeFiltersCount > 0 ? handleClearFilters : canCreate ? () => router.push('/expirations/new') : undefined}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Desktop Table */}
                <div className="table-responsive desktop-only" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        <th
                          style={{ padding: '0.85rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                          onClick={() => handleSortToggle('expirationDate')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>Fecha Vencimiento</span>
                            {sortField === 'expirationDate' ? (
                              sortDirection === 'asc' ? <ArrowUp size={14} color="#38bdf8" /> : <ArrowDown size={14} color="#38bdf8" />
                            ) : (
                              <ArrowUpDown size={14} color="var(--text-muted)" />
                            )}
                          </div>
                        </th>
                        <th style={{ padding: '0.85rem 1rem' }}>Empresa</th>
                        <th
                          style={{ padding: '0.85rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                          onClick={() => handleSortToggle('title')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>Título de Obligación</span>
                            {sortField === 'title' ? (
                              sortDirection === 'asc' ? <ArrowUp size={14} color="#38bdf8" /> : <ArrowDown size={14} color="#38bdf8" />
                            ) : (
                              <ArrowUpDown size={14} color="var(--text-muted)" />
                            )}
                          </div>
                        </th>
                        <th style={{ padding: '0.85rem 1rem' }}>Categoría</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Estado</th>
                        <th style={{ padding: '0.85rem 1rem' }}>Responsable</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listData.content.map((exp) => {
                        const canModify = canCreate;
                        return (
                          <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }} className="table-row-hover">
                            <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {formatDateSpanish(exp.expirationDate)}
                              </div>
                              {exp.daysUntilExpiration !== null && exp.lifecycleStatus === 'ACTIVE' && (
                                <div style={{ fontSize: '0.75rem', color: exp.daysUntilExpiration! < 0 ? '#ef4444' : exp.daysUntilExpiration! <= 7 ? '#f97316' : '#eab308', fontWeight: 600 }}>
                                  {getDaysUntilLabel(exp.daysUntilExpiration)}
                                </div>
                              )}
                            </td>

                            <td style={{ padding: '0.85rem 1rem' }}>
                              <Link
                                href={`/companies/${exp.company.id}`}
                                style={{ color: '#93c5fd', fontWeight: 600, textDecoration: 'none' }}
                              >
                                {exp.company.businessName}
                              </Link>
                            </td>

                            <td style={{ padding: '0.85rem 1rem' }}>
                              <Link
                                href={`/expirations/${exp.id}`}
                                style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none' }}
                              >
                                {exp.title}
                              </Link>
                              {exp.description && (
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {exp.description}
                                </div>
                              )}
                            </td>

                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                {exp.category.name}
                              </span>
                            </td>

                            <td style={{ padding: '0.85rem 1rem' }}>
                              <ExpirationStatusBadge
                                lifecycleStatus={exp.lifecycleStatus}
                                deadlineStatus={exp.deadlineStatus}
                              />
                            </td>

                            <td style={{ padding: '0.85rem 1rem' }}>
                              {exp.responsible ? (
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <UserCheck size={13} color="#38bdf8" />
                                  <span>{exp.responsible.firstName} {exp.responsible.lastName}</span>
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sin asignar</span>
                              )}
                            </td>

                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Link
                                  href={`/expirations/${exp.id}`}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.78rem' }}
                                  title="Ver detalle"
                                >
                                  <Eye size={13} />
                                </Link>

                                {canModify && exp.lifecycleStatus === 'ACTIVE' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedExp(exp);
                                        setActionNotes('');
                                        setCompleteModalOpen(true);
                                      }}
                                      className="btn btn-primary"
                                      style={{ padding: '0.3rem 0.55rem', fontSize: '0.78rem' }}
                                      title="Completar"
                                    >
                                      <Check size={13} />
                                    </button>

                                    <button
                                      onClick={() => {
                                        setSelectedExp(exp);
                                        setActionReason('');
                                        setCancelModalOpen(true);
                                      }}
                                      className="btn-refresh"
                                      style={{ padding: '0.3rem 0.55rem', fontSize: '0.78rem', borderColor: 'rgba(244,63,94,0.3)', color: '#fb7185' }}
                                      title="Cancelar"
                                    >
                                      <X size={13} />
                                    </button>

                                    <Link
                                      href={`/expirations/${exp.id}/edit`}
                                      className="btn btn-secondary"
                                      style={{ padding: '0.3rem 0.55rem', fontSize: '0.78rem' }}
                                      title="Editar"
                                    >
                                      Editar
                                    </Link>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Responsive Cards */}
                <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {listData.content.map((exp) => (
                    <div
                      key={exp.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            <Link href={`/expirations/${exp.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                              {exp.title}
                            </Link>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#93c5fd', fontWeight: 600 }}>
                            <Link href={`/companies/${exp.company.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                              {exp.company.businessName}
                            </Link>
                          </div>
                        </div>
                        <ExpirationStatusBadge
                          lifecycleStatus={exp.lifecycleStatus}
                          deadlineStatus={exp.deadlineStatus}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <div>
                          <span>Vence: <strong>{formatDateSpanish(exp.expirationDate)}</strong></span>
                          {exp.daysUntilExpiration !== null && exp.lifecycleStatus === 'ACTIVE' && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: exp.daysUntilExpiration! < 0 ? '#ef4444' : '#f97316', fontWeight: 600 }}>
                              ({getDaysUntilLabel(exp.daysUntilExpiration)})
                            </span>
                          )}
                        </div>
                        <span style={{ color: 'var(--text-muted)' }}>{exp.category.name}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                        <Link
                          href={`/expirations/${exp.id}`}
                          className="btn btn-secondary"
                          style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem', textDecoration: 'none' }}
                        >
                          Ver Detalle
                        </Link>
                        {canCreate && exp.lifecycleStatus === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              setSelectedExp(exp);
                              setActionNotes('');
                              setCompleteModalOpen(true);
                            }}
                            className="btn btn-primary"
                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem' }}
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Server-Side Pagination Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Mostrando página <strong>{listData.number + 1}</strong> de <strong>{listData.totalPages || 1}</strong> ({listData.totalElements} vencimientos totales)
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <span>Por pág:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          const newSize = parseInt(e.target.value, 10);
                          setPageSize(newSize);
                          setPage(0);
                          updateUrlParams({ size: newSize, page: 0 });
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: 'var(--text-primary)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => {
                          const nextP = Math.max(0, page - 1);
                          setPage(nextP);
                          updateUrlParams({ page: nextP });
                        }}
                        disabled={listData.first}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', opacity: listData.first ? 0.5 : 1, cursor: listData.first ? 'not-allowed' : 'pointer' }}
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => {
                          const nextP = page + 1;
                          setPage(nextP);
                          updateUrlParams({ page: nextP });
                        }}
                        disabled={listData.last}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', opacity: listData.last ? 0.5 : 1, cursor: listData.last ? 'not-allowed' : 'pointer' }}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: CALENDAR VIEW */}
        {currentView === 'calendar' && (
          <div>
            {/* Calendar Controls & Month Header */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {MONTH_NAMES_ES[calendarMonth - 1]} {calendarYear}
                </h2>
                <button
                  type="button"
                  onClick={handleTodayMonth}
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                >
                  Hoy
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem' }}
                  title="Mes anterior"
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem' }}
                  title="Mes siguiente"
                >
                  <span>Siguiente</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Calendar Grid Display */}
            {calendarLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <CardSkeleton count={4} />
              </div>
            ) : calendarError ? (
              <ErrorState
                title="Error al cargar calendario"
                message="No pudimos recuperar las obligaciones del mes visible."
                onRetry={() => refetchCalendar()}
              />
            ) : (
              <div>
                {/* Desktop/Tablet Month Grid */}
                <div
                  className="desktop-only"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Weekday Headers */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderBottom: '1px solid var(--border-color)',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      padding: '0.65rem 0',
                    }}
                  >
                    {WEEKDAYS_SHORT_ES.map((day) => (
                      <div key={day}>{day}</div>
                    ))}
                  </div>

                  {/* Day Cells Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      background: 'var(--border-color)',
                      gap: '1px',
                    }}
                  >
                    {calendarGrid.days.map((day) => {
                      const events = eventsByDate[day.dateString] || [];
                      const isSelectedMonth = day.isCurrentMonth;
                      const hasEvents = events.length > 0;

                      return (
                        <div
                          key={day.dateString}
                          style={{
                            minHeight: '115px',
                            background: isSelectedMonth ? 'var(--bg-secondary)' : '#0b0f19',
                            padding: '0.45rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            opacity: isSelectedMonth ? 1 : 0.45,
                            border: day.isToday ? '2px solid var(--primary-color)' : 'none',
                          }}
                        >
                          {/* Day Number Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: day.isToday ? 800 : 600,
                                color: day.isToday ? '#38bdf8' : 'var(--text-primary)',
                                width: '22px',
                                height: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                background: day.isToday ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                              }}
                            >
                              {day.dayNumber}
                            </span>

                            {events.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDayEvents({ day, events });
                                  setDayModalOpen(true);
                                }}
                                style={{
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  border: 'none',
                                  color: '#93c5fd',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  borderRadius: '4px',
                                  padding: '1px 4px',
                                  cursor: 'pointer',
                                }}
                              >
                                +{events.length - 2} más
                              </button>
                            )}
                          </div>

                          {/* Event Pills */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                            {events.slice(0, 2).map((exp) => {
                              const isExpired = exp.deadlineStatus === 'EXPIRED';
                              const isUrgent = exp.deadlineStatus === 'URGENT';
                              const isUpcoming = exp.deadlineStatus === 'UPCOMING';
                              const isCompleted = exp.lifecycleStatus === 'COMPLETED';

                              const pillBg = isCompleted
                                ? 'rgba(16, 185, 129, 0.15)'
                                : isExpired
                                ? 'rgba(239, 68, 68, 0.2)'
                                : isUrgent
                                ? 'rgba(249, 115, 22, 0.2)'
                                : isUpcoming
                                ? 'rgba(234, 179, 8, 0.2)'
                                : 'rgba(59, 130, 246, 0.15)';

                              const pillBorder = isCompleted
                                ? 'rgba(16, 185, 129, 0.35)'
                                : isExpired
                                ? 'rgba(239, 68, 68, 0.4)'
                                : isUrgent
                                ? 'rgba(249, 115, 22, 0.4)'
                                : isUpcoming
                                ? 'rgba(234, 179, 8, 0.4)'
                                : 'rgba(59, 130, 246, 0.35)';

                              const pillColor = isCompleted
                                ? '#6ee7b7'
                                : isExpired
                                ? '#f87171'
                                : isUrgent
                                ? '#fb923c'
                                : isUpcoming
                                ? '#facc15'
                                : '#93c5fd';

                              return (
                                <Link
                                  key={exp.id}
                                  href={`/expirations/${exp.id}`}
                                  style={{
                                    display: 'block',
                                    padding: '0.2rem 0.35rem',
                                    borderRadius: '4px',
                                    background: pillBg,
                                    border: `1px solid ${pillBorder}`,
                                    color: pillColor,
                                    textDecoration: 'none',
                                    fontSize: '0.72rem',
                                    lineHeight: 1.2,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={`${exp.company.businessName} • ${exp.title}`}
                                >
                                  <strong>{exp.company.businessName}:</strong> {exp.title}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Agenda / Month List */}
                <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Agenda de {MONTH_NAMES_ES[calendarMonth - 1]} {calendarYear}:
                  </div>

                  {Object.keys(eventsByDate).length === 0 ? (
                    <EmptyState
                      icon={<CalendarIcon size={40} color="var(--text-muted)" />}
                      title="Sin vencimientos este mes"
                      description="No hay obligaciones registradas para el período seleccionado."
                    />
                  ) : (
                    Object.entries(eventsByDate)
                      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                      .map(([dateString, events]) => (
                        <div
                          key={dateString}
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#38bdf8', fontSize: '0.88rem' }}>
                            <CalendarIcon size={14} />
                            <span>{formatDateSpanish(dateString)}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                              ({events.length} {events.length === 1 ? 'vencimiento' : 'vencimientos'})
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {events.map((exp) => (
                              <Link
                                key={exp.id}
                                href={`/expirations/${exp.id}`}
                                style={{
                                  padding: '0.5rem',
                                  borderRadius: '6px',
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid var(--border-color)',
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '0.5rem',
                                }}
                              >
                                <div style={{ overflow: 'hidden' }}>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {exp.title}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: '#93c5fd' }}>
                                    {exp.company.businessName}
                                  </div>
                                </div>
                                <ExpirationStatusBadge
                                  lifecycleStatus={exp.lifecycleStatus}
                                  deadlineStatus={exp.deadlineStatus}
                                />
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Day Events Modal (for days with +N events in month view) */}
        <ConfirmDialog
          isOpen={dayModalOpen}
          onClose={() => setDayModalOpen(false)}
          onConfirm={() => setDayModalOpen(false)}
          title={`Vencimientos del ${selectedDayEvents?.day ? formatDateSpanish(selectedDayEvents.day.dateString) : ''}`}
          description={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '350px', overflowY: 'auto' }}>
              {selectedDayEvents?.events.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/expirations/${exp.id}`}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {exp.title}
                    </span>
                    <ExpirationStatusBadge
                      lifecycleStatus={exp.lifecycleStatus}
                      deadlineStatus={exp.deadlineStatus}
                    />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#93c5fd' }}>
                    {exp.company.businessName} • {exp.category.name}
                  </div>
                </Link>
              ))}
            </div>
          }
          confirmLabel="Cerrar"
          variant="primary"
        />

        {/* Complete Expiration Modal */}
        <ConfirmDialog
          isOpen={completeModalOpen}
          onClose={() => setCompleteModalOpen(false)}
          onConfirm={() => {
            if (selectedExp) {
              completeMutation.mutate({
                id: selectedExp.id,
                notes: actionNotes.trim() || undefined,
              });
            }
          }}
          title="Completar Vencimiento"
          description={
            <div>
              <p style={{ marginBottom: '0.75rem' }}>
                ¿Confirmás que la obligación <strong>&ldquo;{selectedExp?.title}&rdquo;</strong> de la empresa{' '}
                <strong>&ldquo;{selectedExp?.company.businessName}&rdquo;</strong> ha sido ejecutada satisfactoriamente?
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Notas de resolución / certificado (opcional):
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Ej: Certificado emitido y archivado correctamente"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>
          }
          confirmLabel="Completar Obligación"
          variant="primary"
          isLoading={completeMutation.isPending}
        />

        {/* Cancel Expiration Modal */}
        <ConfirmDialog
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          onConfirm={() => {
            if (selectedExp) {
              cancelMutation.mutate({
                id: selectedExp.id,
                reason: actionReason.trim() || undefined,
              });
            }
          }}
          title="Cancelar Vencimiento"
          description={
            <div>
              <p style={{ marginBottom: '0.75rem', color: '#f87171' }}>
                Atención: La obligación <strong>&ldquo;{selectedExp?.title}&rdquo;</strong> será cancelada administrativamente y dejará de computar alertas operativas.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Motivo de la cancelación:
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Ej: Carga duplicada o servicio reemplazado"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>
          }
          confirmLabel="Cancelar Obligación"
          variant="danger"
          isLoading={cancelMutation.isPending}
        />
      </div>
    </ProtectedRoute>
  );
}

export default function ExpirationsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} cols={7} />}>
      <ExpirationsContent />
    </Suspense>
  );
}
