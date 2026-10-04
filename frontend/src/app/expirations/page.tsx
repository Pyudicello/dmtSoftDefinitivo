'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { expirationService } from '@/services/expiration.service';
import { companyService } from '@/services/company.service';
import { queryKeys } from '@/lib/query-keys';
import { formatDateSpanish } from '@/lib/date-utils';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { ExpirationStatusBadge } from '@/components/ui/ExpirationStatusBadge';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  Expiration,
  ExpirationCategory,
  ExpirationFilterParams,
  ExpirationLifecycleStatus,
  ExpirationDeadlineStatus,
  Company,
} from '@/types';
import {
  Clock,
  PlusCircle,
  Filter,
  RefreshCw,
  Eye,
  Check,
  X,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  Tag,
  Search,
} from 'lucide-react';

function ExpirationsContent() {
  const { user, role } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Active view tab: 'all' | 'upcoming' | 'expired'
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'expired'>('all');

  // Filter state
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const [filterCompanyId, setFilterCompanyId] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [filterLifecycleStatus, setFilterLifecycleStatus] = useState<string>('');
  const [filterDeadlineStatus, setFilterDeadlineStatus] = useState<string>('');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Modals for Complete and Cancel actions
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<Expiration | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Queries for select dropdowns
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.expirations.categories(),
    queryFn: () => expirationService.getCategories(),
  });

  const { data: companiesData } = useQuery({
    queryKey: queryKeys.companies.list(0, 100),
    queryFn: () => companyService.getCompanies(0, 100),
  });
  const companies = companiesData?.content || [];

  // Expirations Query
  const filterParams: ExpirationFilterParams = {
    page,
    size: pageSize,
    companyId: filterCompanyId || undefined,
    categoryId: filterCategoryId || undefined,
    lifecycleStatus: (filterLifecycleStatus as ExpirationLifecycleStatus) || undefined,
    deadlineStatus: (filterDeadlineStatus as ExpirationDeadlineStatus) || undefined,
    from: filterFrom || undefined,
    to: filterTo || undefined,
    search: filterSearch || undefined,
  };

  const {
    data: expirationsData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey:
      activeTab === 'upcoming'
        ? queryKeys.expirations.upcoming(filterCompanyId || undefined)
        : activeTab === 'expired'
        ? queryKeys.expirations.expired(filterCompanyId || undefined)
        : queryKeys.expirations.list(filterParams),
    queryFn: async () => {
      if (activeTab === 'upcoming') {
        const list = await expirationService.getUpcomingExpirations(filterCompanyId || undefined);
        return { content: list, totalElements: list.length, totalPages: 1, number: 0 };
      }
      if (activeTab === 'expired') {
        const list = await expirationService.getExpiredExpirations(filterCompanyId || undefined);
        return { content: list, totalElements: list.length, totalPages: 1, number: 0 };
      }
      return expirationService.getExpirations(filterParams);
    },
  });

  const expirations = expirationsData?.content || [];
  const totalElements = expirationsData?.totalElements || 0;
  const totalPages = expirationsData?.totalPages || 0;

  // Complete / Cancel Mutations
  const completeMutation = useMutation({
    mutationFn: ({ id, completedAt, notes }: { id: string; completedAt?: string; notes?: string }) =>
      expirationService.completeExpiration(id, { completedAt, notes }),
    onSuccess: () => {
      toast.success('Vencimiento completado');
      setCompleteModalOpen(false);
      setSelectedExp(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
    onError: (err: any) => {
      setActionError(err?.errorBody?.message || err?.message || 'Error al completar el vencimiento');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      expirationService.cancelExpiration(id, { reason }),
    onSuccess: () => {
      toast.success('Vencimiento cancelado');
      setCancelModalOpen(false);
      setSelectedExp(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
    onError: (err: any) => {
      setActionError(err?.errorBody?.message || err?.message || 'Error al cancelar el vencimiento');
    },
  });

  const canCreate = role === 'PLATFORM_ADMIN' || role === 'CONSULTANT_ADMIN' || role === 'TECHNICIAN';

  const resetFilters = () => {
    setFilterCompanyId('');
    setFilterCategoryId('');
    setFilterLifecycleStatus('');
    setFilterDeadlineStatus('');
    setFilterFrom('');
    setFilterTo('');
    setFilterSearch('');
    setPage(0);
  };

  const handleOpenComplete = (exp: Expiration) => {
    setSelectedExp(exp);
    setActionNotes('');
    setActionDate('');
    setActionError(null);
    setCompleteModalOpen(true);
  };

  const handleOpenCancel = (exp: Expiration) => {
    setSelectedExp(exp);
    setActionReason('');
    setActionError(null);
    setCancelModalOpen(true);
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExp) return;
    completeMutation.mutate({
      id: selectedExp.id,
      completedAt: actionDate || undefined,
      notes: actionNotes || undefined,
    });
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExp) return;
    cancelMutation.mutate({
      id: selectedExp.id,
      reason: actionReason || undefined,
    });
  };

  return (
    <div>
      <PageHeader
        title="Gestión de Vencimientos"
        subtitle="Control operativo de plazos normativos, técnicos y legales."
        icon={<Clock size={24} />}
        actions={
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => refetch()}
              className="btn-refresh"
              title="Actualizar listado"
              disabled={isFetching}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              <span>Actualizar</span>
            </button>

            {canCreate && (
              <Link
                href="/expirations/new"
                className="btn-refresh"
                style={{
                  background: 'rgba(16, 185, 129, 0.25)',
                  borderColor: 'rgba(16, 185, 129, 0.45)',
                  color: '#34d399',
                  textDecoration: 'none',
                }}
              >
                <PlusCircle size={14} />
                <span>Nuevo Vencimiento</span>
              </Link>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => {
            setActiveTab('all');
            setPage(0);
          }}
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
        >
          Todos los Vencimientos
        </button>
        <button
          onClick={() => {
            setActiveTab('upcoming');
            setPage(0);
          }}
          className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
        >
          Próximos (≤ 30 días)
        </button>
        <button
          onClick={() => {
            setActiveTab('expired');
            setPage(0);
          }}
          className={`tab-button ${activeTab === 'expired' ? 'active' : ''}`}
        >
          Obligaciones Vencidas (&lt; Hoy)
        </button>
      </div>

      {/* Filters Toolbar (Only on 'all' tab) */}
      {activeTab === 'all' && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: '#93c5fd', fontSize: '0.85rem', fontWeight: 600 }}>
            <Filter size={15} />
            <span>Filtros Dinámicos (Consultas Directas al Backend)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Buscar Título</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Matafuegos..."
                value={filterSearch}
                onChange={(e) => {
                  setFilterSearch(e.target.value);
                  setPage(0);
                }}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              />
            </div>

            <div>
              <label className="form-label">Empresa</label>
              <select
                className="form-select"
                value={filterCompanyId}
                onChange={(e) => {
                  setFilterCompanyId(e.target.value);
                  setPage(0);
                }}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              >
                <option value="">Todas las empresas</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.businessName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Categoría</label>
              <select
                className="form-select"
                value={filterCategoryId}
                onChange={(e) => {
                  setFilterCategoryId(e.target.value);
                  setPage(0);
                }}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Estado Administrativo</label>
              <select
                className="form-select"
                value={filterLifecycleStatus}
                onChange={(e) => {
                  setFilterLifecycleStatus(e.target.value);
                  setPage(0);
                }}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVE">Activo</option>
                <option value="COMPLETED">Completado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="form-label">Clasificación Temporal</label>
              <select
                className="form-select"
                value={filterDeadlineStatus}
                onChange={(e) => {
                  setFilterDeadlineStatus(e.target.value);
                  setPage(0);
                }}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              >
                <option value="">Todas</option>
                <option value="EXPIRED">Vencido (&lt; Hoy)</option>
                <option value="URGENT">Urgente (≤ 7 días)</option>
                <option value="UPCOMING">Próximo (8 a 30 días)</option>
                <option value="CURRENT">Vigente (&gt; 30 días)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Desde</label>
              <input
                type="date"
                className="form-input"
                value={filterFrom}
                onChange={(e) => {
                  setFilterFrom(e.target.value);
                  setPage(0);
                }}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              />
            </div>

            <div>
              <label className="form-label">Hasta</label>
              <input
                type="date"
                className="form-input"
                value={filterTo}
                onChange={(e) => {
                  setFilterTo(e.target.value);
                  setPage(0);
                }}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <button
              onClick={resetFilters}
              className="btn-refresh"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Table & List */}
      {isError ? (
        <ErrorState
          title="Error al cargar vencimientos"
          message="No se pudo obtener el listado de vencimientos autorizados."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : expirations.length === 0 ? (
        <EmptyState
          title="No se encontraron vencimientos"
          description="No hay obligaciones que coincidan con los filtros seleccionados o tu ámbito de permisos."
          icon={<Clock size={32} />}
          action={
            canCreate ? (
              <Link
                href="/expirations/new"
                className="btn-refresh"
                style={{
                  background: 'rgba(16, 185, 129, 0.25)',
                  borderColor: 'rgba(16, 185, 129, 0.45)',
                  color: '#34d399',
                  textDecoration: 'none',
                }}
              >
                <PlusCircle size={14} />
                <span>Crear Primer Vencimiento</span>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Desktop Table View */}
          <div className="hidden md:block" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha Venc.</th>
                  <th>Empresa</th>
                  <th>Categoría</th>
                  <th>Título / Obligación</th>
                  <th>Estado</th>
                  <th>Responsable</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expirations.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#f3f4f6' }}>
                        {formatDateSpanish(exp.expirationDate)}
                      </div>
                      {exp.issueDate && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Emisión: {formatDateSpanish(exp.issueDate)}
                        </div>
                      )}
                    </td>

                    <td>
                      <Link
                        href={`/companies/${exp.company?.id}`}
                        style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
                        className="hover:underline"
                      >
                        {exp.company?.businessName}
                      </Link>
                    </td>

                    <td>
                      <span
                        style={{
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          color: '#93c5fd',
                        }}
                      >
                        {exp.category?.name}
                      </span>
                    </td>

                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {exp.title}
                      </div>
                      {exp.description && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {exp.description}
                        </div>
                      )}
                    </td>

                    <td>
                      <ExpirationStatusBadge
                        lifecycleStatus={exp.lifecycleStatus}
                        deadlineStatus={exp.deadlineStatus}
                        daysUntilExpiration={exp.daysUntilExpiration}
                      />
                    </td>

                    <td>
                      {exp.responsible ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {exp.responsible.firstName} {exp.responsible.lastName}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        <Link
                          href={`/expirations/${exp.id}`}
                          className="btn-refresh"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          title="Ver detalle"
                        >
                          <Eye size={13} />
                        </Link>

                        {canCreate && exp.lifecycleStatus === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleOpenComplete(exp)}
                              className="btn-refresh"
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                borderColor: 'rgba(16, 185, 129, 0.4)',
                                color: '#34d399',
                              }}
                              title="Completar"
                            >
                              <Check size={13} />
                            </button>

                            <button
                              onClick={() => handleOpenCancel(exp)}
                              className="btn-refresh"
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                borderColor: 'rgba(244, 63, 94, 0.4)',
                                color: '#fb7185',
                              }}
                              title="Cancelar"
                            >
                              <X size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
            {expirations.map((exp) => (
              <div
                key={exp.id}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {exp.title}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600 }}>
                      {exp.company?.businessName} • {exp.category?.name}
                    </div>
                  </div>
                  <ExpirationStatusBadge
                    lifecycleStatus={exp.lifecycleStatus}
                    deadlineStatus={exp.deadlineStatus}
                    daysUntilExpiration={exp.daysUntilExpiration}
                    size="sm"
                  />
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div><strong>Vence:</strong> {formatDateSpanish(exp.expirationDate)}</div>
                  {exp.responsible && <div><strong>Responsable:</strong> {exp.responsible.firstName} {exp.responsible.lastName}</div>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <Link
                    href={`/expirations/${exp.id}`}
                    className="btn-refresh"
                    style={{ flex: 1, textDecoration: 'none', justifyContent: 'center', fontSize: '0.78rem' }}
                  >
                    <span>Ver Detalle</span>
                    <Eye size={13} />
                  </Link>

                  {canCreate && exp.lifecycleStatus === 'ACTIVE' && (
                    <button
                      onClick={() => handleOpenComplete(exp)}
                      className="btn-refresh"
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.78rem',
                        borderColor: 'rgba(16, 185, 129, 0.4)',
                        color: '#34d399',
                      }}
                      title="Completar"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {activeTab === 'all' && totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1.25rem',
                borderTop: '1px solid var(--border-color)',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div>
                Total: <strong>{totalElements}</strong> vencimientos (Página {page + 1} de {totalPages})
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || isFetching}
                  className="btn-refresh"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page + 1 >= totalPages || isFetching}
                  className="btn-refresh"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete Modal */}
      {completeModalOpen && selectedExp && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} />
                <span>Completar Vencimiento</span>
              </h3>
              <button
                onClick={() => setCompleteModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Marcar como cumplida la obligación <strong>{selectedExp.title}</strong> de <strong>{selectedExp.company?.businessName}</strong>.
            </p>

            {actionError && (
              <div style={{ padding: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', color: '#fda4af', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleCompleteSubmit}>
              <div className="form-group">
                <label className="form-label">Fecha de Cumplimiento (Opcional, por defecto hoy)</label>
                <input
                  type="date"
                  className="form-input"
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notas de Cumplimiento</label>
                <textarea
                  className="form-textarea"
                  placeholder="Ej: Matafuegos recargados con certificado nº 1234..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="btn-refresh"
                  disabled={completeMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={completeMutation.isPending}
                  className="btn-refresh"
                  style={{ background: 'rgba(16, 185, 129, 0.25)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
                >
                  {completeMutation.isPending ? 'Guardando...' : 'Confirmar Cumplimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && selectedExp && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fb7185', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <XCircle size={20} />
                <span>Cancelar Vencimiento</span>
              </h3>
              <button
                onClick={() => setCancelModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              ¿Estás seguro de cancelar el vencimiento <strong>{selectedExp.title}</strong>? Esta acción no borra el registro para preservar la auditoría comercial.
            </p>

            {actionError && (
              <div style={{ padding: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', color: '#fda4af', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleCancelSubmit}>
              <div className="form-group">
                <label className="form-label">Motivo de Cancelación (Opcional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Ej: Carga duplicada o equipo retirado..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="btn-refresh"
                  disabled={cancelMutation.isPending}
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={cancelMutation.isPending}
                  className="btn-refresh"
                  style={{ background: 'rgba(244, 63, 94, 0.25)', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185' }}
                >
                  {cancelMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpirationsPage() {
  return (
    <ProtectedRoute>
      <ExpirationsContent />
    </ProtectedRoute>
  );
}
