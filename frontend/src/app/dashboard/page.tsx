'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { dashboardService } from '@/services/dashboard.service';
import { expirationService } from '@/services/expiration.service';
import { queryKeys } from '@/lib/query-keys';
import { formatDateSpanish } from '@/lib/date-utils';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ExpirationStatusBadge } from '@/components/ui/ExpirationStatusBadge';
import { CardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Expiration } from '@/types';
import {
  LayoutDashboard,
  Building2,
  AlertTriangle,
  Clock,
  Calendar,
  PlusCircle,
  ArrowRight,
  Eye,
  Check,
  X,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';

function DashboardContent() {
  const { user, role } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Modals for Complete and Cancel
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<Expiration | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Queries
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: () => dashboardService.getSummary(),
  });

  const {
    data: upcomingList,
    isLoading: upcomingLoading,
    isError: upcomingError,
    refetch: refetchUpcoming,
  } = useQuery({
    queryKey: queryKeys.dashboard.upcoming(10),
    queryFn: () => dashboardService.getUpcomingExpirations(10),
  });

  // Mutations
  const completeMutation = useMutation({
    mutationFn: ({ id, completedAt, notes }: { id: string; completedAt?: string; notes?: string }) =>
      expirationService.completeExpiration(id, { completedAt, notes }),
    onSuccess: () => {
      toast.success('Vencimiento completado con éxito');
      setCompleteModalOpen(false);
      setSelectedExp(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.all });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
    onError: (err: any) => {
      setActionError(err?.errorBody?.message || err?.message || 'Error al cancelar el vencimiento');
    },
  });

  const canCreate = role === 'PLATFORM_ADMIN' || role === 'CONSULTANT_ADMIN' || role === 'TECHNICIAN';
  const canCreateCompany = role === 'PLATFORM_ADMIN' || role === 'CONSULTANT_ADMIN';

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

  if (summaryError && upcomingError) {
    return (
      <ErrorState
        title="Error al cargar el Dashboard"
        message="No se pudo obtener el resumen operativo desde el servidor."
        onRetry={() => {
          refetchSummary();
          refetchUpcoming();
        }}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard Operativo"
        subtitle={`Bienvenido, ${user?.firstName} ${user?.lastName}. Resumen de cumplimiento y plazos vigentes.`}
        icon={<LayoutDashboard size={24} />}
        actions={
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                refetchSummary();
                refetchUpcoming();
              }}
              className="btn-refresh"
              title="Refrescar métricas"
            >
              <RefreshCw size={14} />
              <span>Actualizar</span>
            </button>

            {canCreateCompany && (
              <Link
                href="/companies/new"
                className="btn-refresh"
                style={{ textDecoration: 'none' }}
              >
                <Building2 size={14} />
                <span>Nueva Empresa</span>
              </Link>
            )}

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

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {summaryLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title={role === 'CLIENT' ? 'Mi Empresa' : 'Empresas Autorizadas'}
              value={summary?.companyCount ?? 0}
              subtitle="Ver cartera de empresas"
              icon={<Building2 size={20} />}
              variant="primary"
              href="/companies"
            />

            <StatCard
              title="Obligaciones Vencidas"
              value={summary?.expiredCount ?? 0}
              subtitle="Requieren atención inmediata"
              icon={<AlertTriangle size={20} />}
              variant="danger"
              href="/expirations?deadlineStatus=EXPIRED"
            />

            <StatCard
              title="Urgentes (Próximos 7 días)"
              value={summary?.next7DaysCount ?? 0}
              subtitle="Vencen en ≤ 7 días"
              icon={<Clock size={20} />}
              variant="warning"
              href="/expirations?deadlineStatus=URGENT"
            />

            <StatCard
              title="Próximos (30 días)"
              value={summary?.next30DaysCount ?? 0}
              subtitle="Horizonte operativo del mes"
              icon={<Calendar size={20} />}
              variant="amber"
              href="/expirations?deadlineStatus=UPCOMING"
            />
          </>
        )}
      </div>

      {/* Upcoming Expirations Section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#38bdf8" />
              <span>Próximos Vencimientos a Atender</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
              Obligaciones técnicas y normativas ordenadas por proximidad de fecha.
            </p>
          </div>

          <Link
            href="/expirations"
            className="btn-refresh"
            style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            <span>Ver todos los vencimientos</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {upcomingLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : !upcomingList || upcomingList.length === 0 ? (
          <EmptyState
            title="Sin vencimientos próximos"
            description="No hay obligaciones activas por vencer en los próximos 30 días para las empresas de tu ámbito."
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
          <div style={{ overflowX: 'auto' }}>
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
                {upcomingList.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#f3f4f6' }}>
                        {formatDateSpanish(exp.expirationDate)}
                      </div>
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

                    <td style={{ maxWidth: '260px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
        )}
      </div>

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
                <label className="form-label">Notas de Cumplimiento / Observaciones</label>
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
                  placeholder="Ej: Carga duplicada, equipo retirado de servicio..."
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

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
