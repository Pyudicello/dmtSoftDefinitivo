'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { expirationService } from '@/services/expiration.service';
import { queryKeys } from '@/lib/query-keys';
import { formatDateSpanish, formatDateTimeSpanish } from '@/lib/date-utils';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { ExpirationStatusBadge } from '@/components/ui/ExpirationStatusBadge';
import { DetailSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  Clock,
  ArrowLeft,
  ShieldCheck,
  ShieldX,
  Building2,
  Tag,
  Calendar,
  UserCheck,
  Edit2,
  Check,
  X,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';

function ExpirationDetailContent({ expirationId }: { expirationId: string }) {
  const { user, role } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Complete / Cancel Modal State
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: expiration,
    isLoading,
    isError,
    error: errObj,
  } = useQuery({
    queryKey: queryKeys.expirations.detail(expirationId),
    queryFn: () => expirationService.getExpirationById(expirationId),
  });

  const completeMutation = useMutation({
    mutationFn: ({ completedAt, notes }: { completedAt?: string; notes?: string }) =>
      expirationService.completeExpiration(expirationId, { completedAt, notes }),
    onSuccess: () => {
      toast.success('Vencimiento completado con éxito');
      setCompleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.detail(expirationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
    onError: (err: any) => {
      setActionError(err?.errorBody?.message || err?.message || 'Error al completar el vencimiento');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ reason }: { reason?: string }) =>
      expirationService.cancelExpiration(expirationId, { reason }),
    onSuccess: () => {
      toast.success('Vencimiento cancelado');
      setCancelModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.detail(expirationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
    onError: (err: any) => {
      setActionError(err?.errorBody?.message || err?.message || 'Error al cancelar el vencimiento');
    },
  });

  const canEdit = (role === 'PLATFORM_ADMIN' || role === 'CONSULTANT_ADMIN' || role === 'TECHNICIAN') && expiration?.lifecycleStatus === 'ACTIVE';

  if (isError) {
    const status = (errObj as any)?.status;
    if (status === 404 || status === 403) {
      return (
        <div className="card" style={{ maxWidth: '650px', margin: '2rem auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <ShieldX size={48} color="#f43f5e" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#fb7185', fontSize: '1.4rem' }}>Acceso Denegado (Protección Anti-IDOR)</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              El backend respondió <strong>404 Not Found / 403 Forbidden</strong> porque tu usuario (<strong>{user?.email}</strong>) no tiene autorización para acceder al vencimiento con ID:
            </p>
            <code style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.8rem' }}>
              {expirationId}
            </code>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            <strong>¿Por qué ocurre esto?</strong>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Si sos <strong>TECHNICIAN</strong>: La empresa a la que pertenece esta obligación no está en tus asignaciones activas.</li>
              <li>Si sos <strong>CLIENT</strong>: Este vencimiento pertenece a otra empresa cliente.</li>
              <li>Si sos <strong>CONSULTANT_ADMIN</strong>: El vencimiento pertenece a otra consultora (Aislamiento Multi-Tenant estricto).</li>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link href="/expirations" className="btn-refresh" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={14} />
              <span>Volver a Vencimientos</span>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <ErrorState
        title="Error al cargar vencimiento"
        message="No se pudo obtener la información de la obligación desde el backend."
      />
    );
  }

  if (isLoading || !expiration) {
    return (
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/expirations" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} />
            <span>Volver al listado</span>
          </Link>
        </div>
        <DetailSkeleton />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <PageHeader
        title={expiration.title}
        subtitle={`${expiration.company?.businessName} • Categoría: ${expiration.category?.name}`}
        icon={<Clock size={24} />}
        breadcrumbs={[
          { label: 'Vencimientos', href: '/expirations' },
          { label: expiration.title },
        ]}
        actions={
          canEdit ? (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link
                href={`/expirations/${expiration.id}/edit`}
                className="btn-refresh"
                style={{ textDecoration: 'none' }}
              >
                <Edit2 size={14} />
                <span>Editar</span>
              </Link>

              <button
                onClick={() => {
                  setActionNotes('');
                  setActionDate('');
                  setActionError(null);
                  setCompleteModalOpen(true);
                }}
                className="btn-refresh"
                style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
              >
                <Check size={14} />
                <span>Completar</span>
              </button>

              <button
                onClick={() => {
                  setActionReason('');
                  setActionError(null);
                  setCancelModalOpen(true);
                }}
                className="btn-refresh"
                style={{ background: 'rgba(244, 63, 94, 0.2)', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185' }}
              >
                <X size={14} />
                <span>Cancelar</span>
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="card">
        <div className="card-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{expiration.title}</h2>
              <ExpirationStatusBadge
                lifecycleStatus={expiration.lifecycleStatus}
                deadlineStatus={expiration.deadlineStatus}
                daysUntilExpiration={expiration.daysUntilExpiration}
                size="lg"
              />
            </div>
            <p style={{ color: '#93c5fd', fontSize: '0.9rem', fontWeight: 600 }}>
              <Link href={`/companies/${expiration.company?.id}`} className="hover:underline" style={{ color: 'inherit', textDecoration: 'none' }}>
                {expiration.company?.businessName}
              </Link>
              {' '}• Categoría: {expiration.category?.name}
            </p>
          </div>
          <ShieldCheck size={28} color="#34d399" />
        </div>

        {expiration.description && (
          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', margin: '1rem 0 1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <strong>Descripción:</strong> {expiration.description}
          </div>
        )}

        <table className="info-table" style={{ margin: '1.5rem 0' }}>
          <tbody>
            <tr>
              <td className="label"><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />Fecha de Vencimiento</td>
              <td className="value" style={{ color: '#f3f4f6', fontSize: '1rem' }}>{formatDateSpanish(expiration.expirationDate)}</td>
            </tr>
            <tr>
              <td className="label">Fecha de Emisión / Inicio</td>
              <td className="value">{formatDateSpanish(expiration.issueDate)}</td>
            </tr>
            <tr>
              <td className="label">Estado Administrativo</td>
              <td className="value">{expiration.lifecycleStatus}</td>
            </tr>
            <tr>
              <td className="label">Clasificación Temporal (Calculada)</td>
              <td className="value">{expiration.deadlineStatus || '—'}</td>
            </tr>
            <tr>
              <td className="label"><UserCheck size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />Responsable Técnico</td>
              <td className="value">{expiration.responsible ? `${expiration.responsible.firstName} ${expiration.responsible.lastName} (${expiration.responsible.email})` : 'Sin asignar'}</td>
            </tr>
            <tr>
              <td className="label"><Building2 size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />Empresa ID</td>
              <td className="value"><code style={{ color: '#38bdf8' }}>{expiration.company?.id}</code></td>
            </tr>
            <tr>
              <td className="label"><Tag size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />Categoría ID</td>
              <td className="value"><code style={{ color: '#a78bfa' }}>{expiration.category?.id}</code></td>
            </tr>
            <tr>
              <td className="label">Notas y Observaciones</td>
              <td className="value">{expiration.notes || '—'}</td>
            </tr>
            {expiration.completedAt && (
              <tr>
                <td className="label" style={{ color: '#34d399' }}>Fecha de Cumplimiento</td>
                <td className="value" style={{ color: '#34d399' }}>{formatDateTimeSpanish(expiration.completedAt)}</td>
              </tr>
            )}
            {expiration.completionNotes && (
              <tr>
                <td className="label" style={{ color: '#34d399' }}>Notas de Cumplimiento</td>
                <td className="value" style={{ color: '#34d399' }}>{expiration.completionNotes}</td>
              </tr>
            )}
            {expiration.cancelledAt && (
              <tr>
                <td className="label" style={{ color: '#fb7185' }}>Fecha de Cancelación</td>
                <td className="value" style={{ color: '#fb7185' }}>{formatDateTimeSpanish(expiration.cancelledAt)}</td>
              </tr>
            )}
            {expiration.cancelReason && (
              <tr>
                <td className="label" style={{ color: '#fb7185' }}>Motivo de Cancelación</td>
                <td className="value" style={{ color: '#fb7185' }}>{expiration.cancelReason}</td>
              </tr>
            )}
            <tr>
              <td className="label">Fecha de Creación</td>
              <td className="value">{formatDateTimeSpanish(expiration.createdAt)}</td>
            </tr>
            <tr>
              <td className="label">Última Actualización</td>
              <td className="value">{formatDateTimeSpanish(expiration.updatedAt)}</td>
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
          <span>Este recurso está protegido bajo el tenant <code>{expiration.organizationId}</code> y gobernado por el backend.</span>
        </div>
      </div>

      {/* Complete Modal */}
      {completeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={20} />
              <span>Completar Vencimiento</span>
            </h3>
            {actionError && (
              <div style={{ padding: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', color: '#fda4af', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {actionError}
              </div>
            )}
            <form onSubmit={(e) => {
              e.preventDefault();
              completeMutation.mutate({ completedAt: actionDate || undefined, notes: actionNotes || undefined });
            }}>
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
                  placeholder="Ej: Tarea completada con éxito..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setCompleteModalOpen(false)} className="btn-refresh" disabled={completeMutation.isPending}>
                  Cancelar
                </button>
                <button type="submit" disabled={completeMutation.isPending} className="btn-refresh" style={{ background: 'rgba(16, 185, 129, 0.25)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}>
                  {completeMutation.isPending ? 'Guardando...' : 'Confirmar Cumplimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fb7185', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <XCircle size={20} />
              <span>Cancelar Vencimiento</span>
            </h3>
            {actionError && (
              <div style={{ padding: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', color: '#fda4af', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {actionError}
              </div>
            )}
            <form onSubmit={(e) => {
              e.preventDefault();
              cancelMutation.mutate({ reason: actionReason || undefined });
            }}>
              <div className="form-group">
                <label className="form-label">Motivo de Cancelación (Opcional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Ej: Carga errónea o duplicada..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setCancelModalOpen(false)} className="btn-refresh" disabled={cancelMutation.isPending}>
                  Volver
                </button>
                <button type="submit" disabled={cancelMutation.isPending} className="btn-refresh" style={{ background: 'rgba(244, 63, 94, 0.25)', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185' }}>
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

export default function ExpirationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <ProtectedRoute>
      <ExpirationDetailContent expirationId={resolvedParams.id} />
    </ProtectedRoute>
  );
}
