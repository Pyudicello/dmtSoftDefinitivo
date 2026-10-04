'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { expirationService } from '@/services/expiration.service';
import { Expiration } from '@/types';
import {
  Clock,
  ArrowLeft,
  ShieldCheck,
  ShieldX,
  RefreshCw,
  Building2,
  Tag,
  Calendar,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit2,
  Check,
  X,
  FileText
} from 'lucide-react';

export default function ExpirationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const expirationId = resolvedParams.id;
  const router = useRouter();

  const { user, role, isAuthenticated, isLoading: authLoading } = useAuth();
  const [expiration, setExpiration] = useState<Expiration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Complete / Cancel Modal State
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchExpiration = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    setIsAccessDenied(false);

    try {
      const data = await expirationService.getExpirationById(expirationId);
      setExpiration(data);
    } catch (err: any) {
      const status = err?.status;
      if (status === 404 || status === 403) {
        setIsAccessDenied(true);
      }
      setError(err?.errorBody?.message || err?.message || 'Error al obtener el vencimiento');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, expirationId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchExpiration();
    }
  }, [authLoading, isAuthenticated, fetchExpiration]);

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionSubmitting(true);
    setActionError(null);
    try {
      const updated = await expirationService.completeExpiration(expirationId, {
        completedAt: actionDate || undefined,
        notes: actionNotes || undefined,
      });
      setExpiration(updated);
      setCompleteModalOpen(false);
    } catch (err: any) {
      setActionError(err?.errorBody?.message || err?.message || 'Error al completar el vencimiento');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionSubmitting(true);
    setActionError(null);
    try {
      const updated = await expirationService.cancelExpiration(expirationId, {
        reason: actionReason || undefined,
      });
      setExpiration(updated);
      setCancelModalOpen(false);
    } catch (err: any) {
      setActionError(err?.errorBody?.message || err?.message || 'Error al cancelar el vencimiento');
    } finally {
      setActionSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <RefreshCw size={24} className="animate-spin" color="#38bdf8" />
        <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>Consultando datos del vencimiento...</p>
      </div>
    );
  }

  if (isAccessDenied) {
    return (
      <div className="card" style={{ maxWidth: '650px', margin: '2rem auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <ShieldX size={48} color="#f43f5e" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ color: '#fb7185' }}>Acceso Denegado (Protección Anti-IDOR)</h2>
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

  if (error || !expiration) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <h3>Error al cargar</h3>
        <p style={{ color: '#fda4af', margin: '0.5rem 0 1.5rem' }}>{error || 'No se pudo cargar la información del vencimiento'}</p>
        <Link href="/expirations" className="btn-refresh" style={{ textDecoration: 'none', justifyContent: 'center' }}>
          <ArrowLeft size={14} />
          <span>Volver a Vencimientos</span>
        </Link>
      </div>
    );
  }

  const canEdit = (role === 'PLATFORM_ADMIN' || role === 'CONSULTANT_ADMIN' || role === 'TECHNICIAN') && expiration.lifecycleStatus === 'ACTIVE';

  const getDeadlineBadge = () => {
    if (expiration.lifecycleStatus === 'COMPLETED') {
      return (
        <span className="status-badge badge-lifecycle-completed" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
          <Check size={14} />
          <span>COMPLETADO</span>
        </span>
      );
    }
    if (expiration.lifecycleStatus === 'CANCELLED') {
      return (
        <span className="status-badge badge-lifecycle-cancelled" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
          <X size={14} />
          <span>CANCELADO</span>
        </span>
      );
    }

    switch (expiration.deadlineStatus) {
      case 'EXPIRED':
        return (
          <span className="status-badge badge-deadline-expired" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
            <AlertTriangle size={14} />
            <span>VENCIDO ({expiration.daysUntilExpiration} días)</span>
          </span>
        );
      case 'URGENT':
        return (
          <span className="status-badge badge-deadline-urgent" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
            <Clock size={14} />
            <span>{expiration.daysUntilExpiration === 0 ? '¡VENCE HOY!' : `URGENTE (${expiration.daysUntilExpiration} días)`}</span>
          </span>
        );
      case 'UPCOMING':
        return (
          <span className="status-badge badge-deadline-upcoming" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
            <Clock size={14} />
            <span>PRÓXIMO A VENCER ({expiration.daysUntilExpiration} días)</span>
          </span>
        );
      case 'CURRENT':
        return (
          <span className="status-badge badge-deadline-current" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
            <CheckCircle size={14} />
            <span>VIGENTE ({expiration.daysUntilExpiration} días restantes)</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link href="/expirations" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} />
          <span>Volver a Vencimientos</span>
        </Link>

        {canEdit && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        )}
      </div>

      <div className="card">
        <div className="card-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{expiration.title}</h1>
              {getDeadlineBadge()}
            </div>
            <p style={{ color: '#93c5fd', fontSize: '0.95rem', fontWeight: 600 }}>
              {expiration.company.businessName} • Categoría: {expiration.category.name}
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
              <td className="value" style={{ color: '#f3f4f6', fontSize: '1rem' }}>{expiration.expirationDate}</td>
            </tr>
            <tr>
              <td className="label">Fecha de Emisión / Inicio</td>
              <td className="value">{expiration.issueDate || '—'}</td>
            </tr>
            <tr>
              <td className="label">Días restantes hasta vencer</td>
              <td className="value">{expiration.daysUntilExpiration !== null ? `${expiration.daysUntilExpiration} días` : '—'}</td>
            </tr>
            <tr>
              <td className="label">Estado Administrativo (Lifecycle)</td>
              <td className="value">{expiration.lifecycleStatus}</td>
            </tr>
            <tr>
              <td className="label">Clasificación Temporal (Calculada)</td>
              <td className="value">{expiration.deadlineStatus || '—'}</td>
            </tr>
            <tr>
              <td className="label"><UserCheck size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />Responsable Técnico</td>
              <td className="value">{expiration.responsible ? `${expiration.responsible.fullName} (${expiration.responsible.email})` : 'Sin asignar'}</td>
            </tr>
            <tr>
              <td className="label"><Building2 size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />Empresa ID</td>
              <td className="value"><code style={{ color: '#38bdf8' }}>{expiration.company.id}</code></td>
            </tr>
            <tr>
              <td className="label"><Tag size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />Categoría ID</td>
              <td className="value"><code style={{ color: '#a78bfa' }}>{expiration.category.id}</code></td>
            </tr>
            <tr>
              <td className="label">Notas y Observaciones</td>
              <td className="value">{expiration.notes || '—'}</td>
            </tr>
            {expiration.completedAt && (
              <tr>
                <td className="label" style={{ color: '#34d399' }}>Fecha de Cumplimiento</td>
                <td className="value" style={{ color: '#34d399' }}>{new Date(expiration.completedAt).toLocaleString()}</td>
              </tr>
            )}
            {expiration.cancelledAt && (
              <tr>
                <td className="label" style={{ color: '#fb7185' }}>Fecha de Cancelación</td>
                <td className="value" style={{ color: '#fb7185' }}>{new Date(expiration.cancelledAt).toLocaleString()}</td>
              </tr>
            )}
            <tr>
              <td className="label">Fecha de Creación</td>
              <td className="value">{new Date(expiration.createdAt).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="label">Última Actualización</td>
              <td className="value">{new Date(expiration.updatedAt).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div style={{
          padding: '0.85rem 1rem',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '8px',
          fontSize: '0.82rem',
          color: '#6ee7b7'
        }}>
          <strong>Aislamiento y Permisos Verificados:</strong> Este recurso está protegido bajo el tenant <code>{expiration.organizationId}</code> y gobernado por las reglas de visibilidad para tu rol <strong>{role}</strong>.
        </div>
      </div>

      {/* Modal Complete */}
      {completeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399', marginBottom: '1rem' }}>
              Completar Vencimiento
            </h3>
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
                  placeholder="Ej: Tarea completada con éxito..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setCompleteModalOpen(false)} className="btn-refresh" disabled={actionSubmitting}>
                  Cancelar
                </button>
                <button type="submit" disabled={actionSubmitting} className="btn-refresh" style={{ background: 'rgba(16, 185, 129, 0.25)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}>
                  {actionSubmitting ? 'Guardando...' : 'Confirmar Cumplimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cancel */}
      {cancelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fb7185', marginBottom: '1rem' }}>
              Cancelar Vencimiento
            </h3>
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
                  placeholder="Ej: Carga errónea o duplicada..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setCancelModalOpen(false)} className="btn-refresh" disabled={actionSubmitting}>
                  Volver
                </button>
                <button type="submit" disabled={actionSubmitting} className="btn-refresh" style={{ background: 'rgba(244, 63, 94, 0.25)', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185' }}>
                  {actionSubmitting ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
