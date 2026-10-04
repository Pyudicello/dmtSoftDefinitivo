'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { companyService } from '@/services/company.service';
import { expirationService } from '@/services/expiration.service';
import { queryKeys } from '@/lib/query-keys';
import { formatDateSpanish } from '@/lib/date-utils';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ExpirationStatusBadge } from '@/components/ui/ExpirationStatusBadge';
import { CardSkeleton, DetailSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Expiration } from '@/types';
import {
  Building2,
  ArrowLeft,
  ShieldCheck,
  ShieldX,
  PlusCircle,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  Hash,
  Eye,
  Check,
  X,
  XCircle,
} from 'lucide-react';

function CompanyDetailContent({ companyId }: { companyId: string }) {
  const { user, role } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'resumen' | 'vencimientos'>('resumen');

  // Modals for complete & cancel
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<Expiration | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Queries
  const {
    data: metricsData,
    isLoading: metricsLoading,
    isError: metricsError,
    error: metricsErrObj,
  } = useQuery({
    queryKey: queryKeys.companies.metrics(companyId),
    queryFn: () => companyService.getCompanyMetrics(companyId),
  });

  const {
    data: companyExpirationsData,
    isLoading: expirationsLoading,
    isError: expirationsError,
  } = useQuery({
    queryKey: queryKeys.companies.expirations(companyId),
    queryFn: () => expirationService.getCompanyExpirations(companyId),
    enabled: activeTab === 'vencimientos',
  });

  // Complete / Cancel Mutations
  const completeMutation = useMutation({
    mutationFn: ({ id, completedAt, notes }: { id: string; completedAt?: string; notes?: string }) =>
      expirationService.completeExpiration(id, { completedAt, notes }),
    onSuccess: () => {
      toast.success('Vencimiento completado con éxito');
      setCompleteModalOpen(false);
      setSelectedExp(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.metrics(companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.expirations(companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.all });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.metrics(companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.expirations(companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.all });
    },
    onError: (err: any) => {
      setActionError(err?.errorBody?.message || err?.message || 'Error al cancelar el vencimiento');
    },
  });

  const canCreate = role === 'PLATFORM_ADMIN' || role === 'CONSULTANT_ADMIN' || role === 'TECHNICIAN';

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

  if (metricsError) {
    const status = (metricsErrObj as any)?.status;
    if (status === 404 || status === 403) {
      return (
        <div className="card" style={{ maxWidth: '650px', margin: '2rem auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <ShieldX size={48} color="#f43f5e" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#fb7185', fontSize: '1.4rem' }}>Acceso Denegado (Protección Anti-IDOR)</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              El backend respondió <strong>404 Not Found / 403 Forbidden</strong> porque tu usuario (<strong>{user?.email}</strong>) no tiene autorización para acceder a esta empresa:
            </p>
            <code style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.8rem' }}>
              {companyId}
            </code>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            <strong>¿Por qué ocurre esto?</strong>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Si sos <strong>TECHNICIAN</strong>: No estás asignado activamente a esta empresa.</li>
              <li>Si sos <strong>CLIENT</strong>: Esta empresa no coincide con tu empresa registrada.</li>
              <li>Si sos <strong>CONSULTANT_ADMIN</strong>: La empresa pertenece a otra consultora (Aislamiento Multi-Tenant).</li>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link href="/companies" className="btn-refresh" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={14} />
              <span>Volver a Empresas Permitidas</span>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <ErrorState
        title="Error al cargar empresa"
        message="No se pudo obtener la información de la empresa cliente."
      />
    );
  }

  if (metricsLoading || !metricsData) {
    return (
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/companies" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} />
            <span>Volver al listado</span>
          </Link>
        </div>
        <DetailSkeleton />
      </div>
    );
  }

  const company = metricsData.company;
  const expirations = companyExpirationsData?.content || [];

  return (
    <div>
      <PageHeader
        title={company.businessName}
        subtitle={company.legalName || 'Empresa Cliente'}
        icon={<Building2 size={24} />}
        breadcrumbs={[
          { label: 'Empresas', href: '/companies' },
          { label: company.businessName },
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {canCreate && (
              <Link
                href={`/expirations/new?companyId=${company.id}`}
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

      {/* Company Status & Metrics KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <StatCard
          title="Vencidos"
          value={metricsData.expiredCount}
          subtitle="Obligaciones atrasadas"
          icon={<AlertTriangle size={18} />}
          variant="danger"
          href={`/expirations?companyId=${company.id}&deadlineStatus=EXPIRED`}
        />

        <StatCard
          title="Urgentes (≤ 7 días)"
          value={metricsData.next7DaysCount}
          subtitle="Vencen próximamente"
          icon={<Clock size={18} />}
          variant="warning"
          href={`/expirations?companyId=${company.id}&deadlineStatus=URGENT`}
        />

        <StatCard
          title="Próximos (≤ 30 días)"
          value={metricsData.next30DaysCount}
          subtitle="Ventana mensual"
          icon={<Calendar size={18} />}
          variant="amber"
          href={`/expirations?companyId=${company.id}&deadlineStatus=UPCOMING`}
        />

        <StatCard
          title="Vigentes (> 30 días)"
          value={metricsData.currentCount}
          subtitle="Al día"
          icon={<CheckCircle2 size={18} />}
          variant="success"
          href={`/expirations?companyId=${company.id}&deadlineStatus=CURRENT`}
        />
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('resumen')}
          className={`tab-button ${activeTab === 'resumen' ? 'active' : ''}`}
        >
          Resumen de Empresa
        </button>
        <button
          onClick={() => setActiveTab('vencimientos')}
          className={`tab-button ${activeTab === 'vencimientos' ? 'active' : ''}`}
        >
          Vencimientos ({metricsData.expiredCount + metricsData.next30DaysCount + metricsData.currentCount + metricsData.completedCount})
        </button>
      </div>

      {/* Tab: Resumen */}
      {activeTab === 'resumen' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Building2 size={18} color="#38bdf8" />
              <span>Información General de la Empresa</span>
            </div>
            <span className="status-badge status-up">{company.status}</span>
          </div>

          <table className="info-table" style={{ margin: '1rem 0' }}>
            <tbody>
              <tr>
                <td className="label"><Hash size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />ID de Empresa</td>
                <td className="value"><code style={{ color: '#38bdf8' }}>{company.id}</code></td>
              </tr>
              <tr>
                <td className="label">Organization ID (Tenant)</td>
                <td className="value"><code style={{ color: '#a78bfa' }}>{company.organizationId}</code></td>
              </tr>
              <tr>
                <td className="label">Razón Social</td>
                <td className="value">{company.legalName || '—'}</td>
              </tr>
              <tr>
                <td className="label">CUIT / Identificación Fiscal</td>
                <td className="value" style={{ color: '#93c5fd' }}>{company.taxId || '—'}</td>
              </tr>
              <tr>
                <td className="label"><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />Dirección</td>
                <td className="value">{company.address ? `${company.address}, ${company.city || ''} (${company.province || ''})` : '—'}</td>
              </tr>
              <tr>
                <td className="label"><Mail size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />Email de Contacto</td>
                <td className="value">{company.email || '—'}</td>
              </tr>
              <tr>
                <td className="label"><Phone size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />Teléfono</td>
                <td className="value">{company.phone || '—'}</td>
              </tr>
              <tr>
                <td className="label">Fecha de Alta</td>
                <td className="value">{new Date(company.createdAt).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: '#6ee7b7',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ShieldCheck size={18} color="#34d399" />
            <span>Acceso validado y protegido por aislamiento multi-tenant en backend.</span>
          </div>
        </div>
      )}

      {/* Tab: Vencimientos */}
      {activeTab === 'vencimientos' && (
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
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Obligaciones y Vencimientos de {company.businessName}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                Registro histórico y plazos pendientes de cumplimiento.
              </p>
            </div>

            {canCreate && (
              <Link
                href={`/expirations/new?companyId=${company.id}`}
                className="btn-refresh"
                style={{
                  background: 'rgba(16, 185, 129, 0.25)',
                  borderColor: 'rgba(16, 185, 129, 0.45)',
                  color: '#34d399',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                }}
              >
                <PlusCircle size={14} />
                <span>Nuevo Vencimiento</span>
              </Link>
            )}
          </div>

          {expirationsLoading ? (
            <TableSkeleton rows={4} cols={5} />
          ) : expirations.length === 0 ? (
            <EmptyState
              title="No hay vencimientos registrados"
              description={`Actualmente no existen obligaciones cargadas para ${company.businessName}.`}
              icon={<Clock size={32} />}
              action={
                canCreate ? (
                  <Link
                    href={`/expirations/new?companyId=${company.id}`}
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
              Marcar como cumplida la obligación <strong>{selectedExp.title}</strong> de <strong>{company.businessName}</strong>.
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
                  placeholder="Ej: Inspección técnica realizada con acta nº 5678..."
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
                  placeholder="Ej: Obligación duplicada o no aplicable..."
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

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <ProtectedRoute>
      <CompanyDetailContent companyId={resolvedParams.id} />
    </ProtectedRoute>
  );
}
