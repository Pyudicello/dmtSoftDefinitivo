'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { ExpirationStatusBadge } from '@/components/ui/ExpirationStatusBadge';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { queryKeys } from '@/lib/query-keys';
import { alertService } from '@/services/alert.service';
import { companyService } from '@/services/company.service';
import { expirationService } from '@/services/expiration.service';
import { formatDateSpanish, getDaysUntilLabel } from '@/lib/date-utils';
import { AlertItem } from '@/types';
import {
  Activity,
  AlertTriangle,
  Clock,
  Building2,
  CheckCircle2,
  Eye,
  Edit,
  Check,
  Filter,
  Calendar,
  UserCheck
} from 'lucide-react';

export default function AlertsPage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  // State
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  // Complete Modal State
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<AlertItem | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Queries
  const {
    data: alertsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.alerts.list(selectedCompanyId || undefined, priorityFilter),
    queryFn: () => alertService.getAlerts(selectedCompanyId || undefined, priorityFilter),
  });

  const { data: companiesData } = useQuery({
    queryKey: queryKeys.companies.list(0, 100),
    queryFn: () => companyService.getCompanies(0, 100),
  });
  const companies = companiesData?.content || [];

  // Mutations
  const completeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      expirationService.completeExpiration(id, { notes }),
    onSuccess: (data) => {
      toast.success(`Vencimiento '${data.title}' marcado como completado`);
      setCompleteModalOpen(false);
      setSelectedAlertForAction(null);
      setCompletionNotes('');
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
    onError: (err: any) => {
      toast.error(err?.errorBody?.message || err?.message || 'Error al completar el vencimiento');
    },
  });

  const canOperate = role === 'PLATFORM_ADMIN' || role === 'CONSULTANT_ADMIN' || role === 'TECHNICIAN';

  const alerts = alertsData?.alerts || [];
  const criticalCount = alertsData?.criticalCount || 0;
  const highCount = alertsData?.highCount || 0;
  const mediumCount = alertsData?.mediumCount || 0;
  const totalCount = alertsData?.totalCount || 0;

  const handleOpenCompleteModal = (alert: AlertItem) => {
    setSelectedAlertForAction(alert);
    setCompletionNotes('');
    setCompleteModalOpen(true);
  };

  const handleConfirmComplete = () => {
    if (selectedAlertForAction) {
      completeMutation.mutate({
        id: selectedAlertForAction.expirationId,
        notes: completionNotes.trim() || undefined,
      });
    }
  };

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
        <PageHeader
          title="Centro de Alertas Operativas"
          subtitle="Obligaciones priorizadas por urgencia de vencimiento y antigüedad de deuda para el control diario."
          icon={<Activity size={24} color="#38bdf8" />}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Centro de Alertas' },
          ]}
        />

        {/* Priority Summary Cards */}
        <div className="grid-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <div
            onClick={() => setPriorityFilter('ALL')}
            style={{
              cursor: 'pointer',
              padding: '1.25rem',
              borderRadius: '12px',
              background: priorityFilter === 'ALL' ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-secondary)',
              border: `1px solid ${priorityFilter === 'ALL' ? 'var(--primary-color)' : 'var(--border-color)'}`,
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Total Alertas Activas
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
              {totalCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Requieren atención o seguimiento
            </div>
          </div>

          <div
            onClick={() => setPriorityFilter('CRITICAL')}
            style={{
              cursor: 'pointer',
              padding: '1.25rem',
              borderRadius: '12px',
              background: priorityFilter === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)',
              border: `1px solid ${priorityFilter === 'CRITICAL' ? '#ef4444' : 'var(--border-color)'}`,
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f87171', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertTriangle size={14} />
              <span>Críticas • Vencidas</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444', margin: '0.25rem 0' }}>
              {criticalCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Plazo legal expirado (deuda)
            </div>
          </div>

          <div
            onClick={() => setPriorityFilter('HIGH')}
            style={{
              cursor: 'pointer',
              padding: '1.25rem',
              borderRadius: '12px',
              background: priorityFilter === 'HIGH' ? 'rgba(249, 115, 22, 0.15)' : 'var(--bg-secondary)',
              border: `1px solid ${priorityFilter === 'HIGH' ? '#f97316' : 'var(--border-color)'}`,
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fb923c', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={14} />
              <span>Altas • Urgentes (0-7d)</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f97316', margin: '0.25rem 0' }}>
              {highCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Vencen hoy o esta semana
            </div>
          </div>

          <div
            onClick={() => setPriorityFilter('MEDIUM')}
            style={{
              cursor: 'pointer',
              padding: '1.25rem',
              borderRadius: '12px',
              background: priorityFilter === 'MEDIUM' ? 'rgba(234, 179, 8, 0.15)' : 'var(--bg-secondary)',
              border: `1px solid ${priorityFilter === 'MEDIUM' ? '#eab308' : 'var(--border-color)'}`,
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#facc15', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={14} />
              <span>Medias • Próximas (8-30d)</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#eab308', margin: '0.25rem 0' }}>
              {mediumCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Horizonte operativo mensual
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* Priority Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setPriorityFilter('ALL')}
              className="btn"
              style={{
                fontSize: '0.82rem',
                padding: '0.45rem 0.85rem',
                background: priorityFilter === 'ALL' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                color: priorityFilter === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              Todas ({totalCount})
            </button>
            <button
              onClick={() => setPriorityFilter('CRITICAL')}
              className="btn"
              style={{
                fontSize: '0.82rem',
                padding: '0.45rem 0.85rem',
                background: priorityFilter === 'CRITICAL' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.05)',
                color: priorityFilter === 'CRITICAL' ? '#f87171' : 'var(--text-secondary)',
                border: `1px solid ${priorityFilter === 'CRITICAL' ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}`,
              }}
            >
              Críticas ({criticalCount})
            </button>
            <button
              onClick={() => setPriorityFilter('HIGH')}
              className="btn"
              style={{
                fontSize: '0.82rem',
                padding: '0.45rem 0.85rem',
                background: priorityFilter === 'HIGH' ? 'rgba(249, 115, 22, 0.25)' : 'rgba(255,255,255,0.05)',
                color: priorityFilter === 'HIGH' ? '#fb923c' : 'var(--text-secondary)',
                border: `1px solid ${priorityFilter === 'HIGH' ? 'rgba(249,115,22,0.5)' : 'var(--border-color)'}`,
              }}
            >
              Urgentes ({highCount})
            </button>
            <button
              onClick={() => setPriorityFilter('MEDIUM')}
              className="btn"
              style={{
                fontSize: '0.82rem',
                padding: '0.45rem 0.85rem',
                background: priorityFilter === 'MEDIUM' ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255,255,255,0.05)',
                color: priorityFilter === 'MEDIUM' ? '#facc15' : 'var(--text-secondary)',
                border: `1px solid ${priorityFilter === 'MEDIUM' ? 'rgba(234,179,8,0.5)' : 'var(--border-color)'}`,
              }}
            >
              Próximas ({mediumCount})
            </button>
          </div>

          {/* Company Filter Dropdown */}
          {companies.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px' }}>
              <Building2 size={16} color="var(--text-muted)" />
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.82rem',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  width: '100%',
                }}
              >
                <option value="">Todas las empresas</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Alerts Content */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <CardSkeleton count={4} />
          </div>
        ) : isError ? (
          <ErrorState
            title="Error al cargar el Centro de Alertas"
            message="No pudimos recuperar las obligaciones activas. Por favor, reintentá la consulta."
            onRetry={() => refetch()}
          />
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={48} color="#34d399" />}
            title="Todo al día"
            description={
              priorityFilter !== 'ALL' || selectedCompanyId
                ? 'No hay alertas activas para los filtros seleccionados.'
                : 'Excelente trabajo. No hay vencimientos vencidos o urgentes pendientes en este momento.'
            }
            actionLabel={priorityFilter !== 'ALL' || selectedCompanyId ? 'Ver todas las alertas' : undefined}
            onAction={() => {
              setPriorityFilter('ALL');
              setSelectedCompanyId('');
            }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {alerts.map((alert) => {
              const isCritical = alert.priority === 'CRITICAL';
              const isHigh = alert.priority === 'HIGH';

              return (
                <div
                  key={alert.expirationId}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${
                      isCritical
                        ? 'rgba(239, 68, 68, 0.35)'
                        : isHigh
                        ? 'rgba(249, 115, 22, 0.35)'
                        : 'var(--border-color)'
                    }`,
                    borderRadius: '12px',
                    padding: '1.15rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease',
                  }}
                  className="card-hover-border"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Left: Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {/* Priority Pill */}
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '0.12rem 0.5rem',
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            background: isCritical
                              ? 'rgba(239, 68, 68, 0.2)'
                              : isHigh
                              ? 'rgba(249, 115, 22, 0.2)'
                              : 'rgba(234, 179, 8, 0.2)',
                            color: isCritical ? '#f87171' : isHigh ? '#fb923c' : '#facc15',
                            border: `1px solid ${
                              isCritical ? 'rgba(239,68,68,0.4)' : isHigh ? 'rgba(249,115,22,0.4)' : 'rgba(234,179,8,0.4)'
                            }`,
                          }}
                        >
                          {isCritical ? 'Crítica' : isHigh ? 'Alta' : 'Media'}
                        </span>

                        <ExpirationStatusBadge
                          lifecycleStatus="ACTIVE"
                          deadlineStatus={alert.deadlineStatus}
                        />

                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: isCritical ? '#f87171' : isHigh ? '#fb923c' : '#facc15',
                          }}
                        >
                          {getDaysUntilLabel(alert.daysUntilExpiration)}
                        </span>
                      </div>

                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        <Link
                          href={`/expirations/${alert.expirationId}`}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {alert.title}
                        </Link>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <Link
                          href={`/companies/${alert.companyId}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#93c5fd', textDecoration: 'none' }}
                        >
                          <Building2 size={14} />
                          <span>{alert.companyName}</span>
                        </Link>

                        <span style={{ color: 'var(--text-muted)' }}>•</span>

                        <span>Categoría: <strong>{alert.categoryName}</strong></span>

                        {alert.responsibleUserName && (
                          <>
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <UserCheck size={13} color="#38bdf8" />
                              <span>{alert.responsibleUserName}</span>
                            </span>
                          </>
                        )}
                      </div>

                      {alert.description && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {alert.description}
                        </div>
                      )}
                    </div>

                    {/* Right: Date & Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <Calendar size={15} color="var(--text-muted)" />
                        <span>Vence: {formatDateSpanish(alert.expirationDate)}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link
                          href={`/expirations/${alert.expirationId}`}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                        >
                          <Eye size={14} />
                          <span>Ver</span>
                        </Link>

                        {canOperate && (
                          <>
                            <button
                              onClick={() => handleOpenCompleteModal(alert)}
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Check size={14} />
                              <span>Completar</span>
                            </button>

                            <Link
                              href={`/expirations/${alert.expirationId}/edit`}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                            >
                              <Edit size={14} />
                              <span>Editar</span>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Complete Expiration Modal */}
        <ConfirmDialog
          isOpen={completeModalOpen}
          onClose={() => setCompleteModalOpen(false)}
          onConfirm={handleConfirmComplete}
          title="Marcar Vencimiento como Completado"
          description={
            <div>
              <p style={{ marginBottom: '0.75rem' }}>
                ¿Confirmás que la obligación <strong>&ldquo;{selectedAlertForAction?.title}&rdquo;</strong> de la empresa{' '}
                <strong>&ldquo;{selectedAlertForAction?.companyName}&rdquo;</strong> ha sido ejecutada y regularizada?
              </p>
              <div style={{ marginTop: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Notas de resolución / certificado (opcional):
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Ej: Servicio de recarga efectuado por proveedor autorizado, certificado Nº 8492"
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
      </div>
    </ProtectedRoute>
  );
}
