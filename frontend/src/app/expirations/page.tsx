'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { expirationService } from '@/services/expiration.service';
import { companyService } from '@/services/company.service';
import {
  Expiration,
  ExpirationCategory,
  ExpirationFilterParams,
  ExpirationLifecycleStatus,
  ExpirationDeadlineStatus,
  Company
} from '@/types';
import {
  Clock,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Building2,
  Tag,
  UserCheck,
  Check,
  X,
  Eye,
  Edit2
} from 'lucide-react';

export default function ExpirationsPage() {
  const { user, role, isAuthenticated, isLoading: authLoading } = useAuth();

  const [expirations, setExpirations] = useState<Expiration[]>([]);
  const [categories, setCategories] = useState<ExpirationCategory[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active view tab: 'all' | 'upcoming' | 'expired'
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'expired'>('all');

  // Filter state
  const [filterCompanyId, setFilterCompanyId] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [filterLifecycleStatus, setFilterLifecycleStatus] = useState<string>('');
  const [filterDeadlineStatus, setFilterDeadlineStatus] = useState<string>('');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');

  // Modals for Complete and Cancel actions
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedExpiration, setSelectedExpiration] = useState<Expiration | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Load companies & categories for filters
  useEffect(() => {
    if (isAuthenticated) {
      expirationService.getCategories().then(setCategories).catch(() => {});
      companyService.getCompanies().then((res) => setCompanies(res.content || [])).catch(() => {});
    }
  }, [isAuthenticated]);

  const fetchExpirations = useCallback(async (page = 0) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'upcoming') {
        const data = await expirationService.getUpcomingExpirations(filterCompanyId || undefined);
        setExpirations(data);
        setTotalElements(data.length);
        setTotalPages(1);
        setCurrentPage(0);
      } else if (activeTab === 'expired') {
        const data = await expirationService.getExpiredExpirations(filterCompanyId || undefined);
        setExpirations(data);
        setTotalElements(data.length);
        setTotalPages(1);
        setCurrentPage(0);
      } else {
        const params: ExpirationFilterParams = {
          page,
          size: 15,
          companyId: filterCompanyId || undefined,
          categoryId: filterCategoryId || undefined,
          lifecycleStatus: (filterLifecycleStatus as ExpirationLifecycleStatus) || undefined,
          deadlineStatus: (filterDeadlineStatus as ExpirationDeadlineStatus) || undefined,
          from: filterFrom || undefined,
          to: filterTo || undefined,
        };
        const res = await expirationService.getExpirations(params);
        setExpirations(res.content || []);
        setTotalElements(res.totalElements);
        setTotalPages(res.totalPages);
        setCurrentPage(res.number);
      }
    } catch (err: any) {
      setError(err?.errorBody?.message || err?.message || 'Error al cargar vencimientos');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeTab, filterCompanyId, filterCategoryId, filterLifecycleStatus, filterDeadlineStatus, filterFrom, filterTo]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchExpirations(0);
    }
  }, [authLoading, isAuthenticated, fetchExpirations]);

  const handleTabChange = (tab: 'all' | 'upcoming' | 'expired') => {
    setActiveTab(tab);
    setCurrentPage(0);
  };

  const resetFilters = () => {
    setFilterCompanyId('');
    setFilterCategoryId('');
    setFilterLifecycleStatus('');
    setFilterDeadlineStatus('');
    setFilterFrom('');
    setFilterTo('');
  };

  // Open Complete Modal
  const openCompleteModal = (exp: Expiration) => {
    setSelectedExpiration(exp);
    setActionNotes('');
    setActionDate('');
    setActionError(null);
    setCompleteModalOpen(true);
  };

  // Open Cancel Modal
  const openCancelModal = (exp: Expiration) => {
    setSelectedExpiration(exp);
    setActionReason('');
    setActionError(null);
    setCancelModalOpen(true);
  };

  // Submit Complete
  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpiration) return;
    setActionSubmitting(true);
    setActionError(null);
    try {
      await expirationService.completeExpiration(selectedExpiration.id, {
        completedAt: actionDate || undefined,
        notes: actionNotes || undefined,
      });
      setCompleteModalOpen(false);
      setSelectedExpiration(null);
      fetchExpirations(currentPage);
    } catch (err: any) {
      setActionError(err?.errorBody?.message || err?.message || 'Error al completar el vencimiento');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Submit Cancel
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpiration) return;
    setActionSubmitting(true);
    setActionError(null);
    try {
      await expirationService.cancelExpiration(selectedExpiration.id, {
        reason: actionReason || undefined,
      });
      setCancelModalOpen(false);
      setSelectedExpiration(null);
      fetchExpirations(currentPage);
    } catch (err: any) {
      setActionError(err?.errorBody?.message || err?.message || 'Error al cancelar el vencimiento');
    } finally {
      setActionSubmitting(false);
    }
  };

  const getDeadlineBadge = (exp: Expiration) => {
    if (exp.lifecycleStatus === 'COMPLETED') {
      return (
        <span className="status-badge badge-lifecycle-completed" title="Vencimiento completado">
          <Check size={12} />
          <span>COMPLETADO</span>
        </span>
      );
    }
    if (exp.lifecycleStatus === 'CANCELLED') {
      return (
        <span className="status-badge badge-lifecycle-cancelled" title="Vencimiento cancelado">
          <X size={12} />
          <span>CANCELADO</span>
        </span>
      );
    }

    switch (exp.deadlineStatus) {
      case 'EXPIRED':
        return (
          <span className="status-badge badge-deadline-expired" title={`Venció hace ${Math.abs(exp.daysUntilExpiration ?? 0)} días`}>
            <AlertTriangle size={12} />
            <span>VENCIDO ({exp.daysUntilExpiration}d)</span>
          </span>
        );
      case 'URGENT':
        return (
          <span className="status-badge badge-deadline-urgent" title={exp.daysUntilExpiration === 0 ? 'Vence hoy' : `Vence en ${exp.daysUntilExpiration} días`}>
            <Clock size={12} />
            <span>{exp.daysUntilExpiration === 0 ? '¡VENCE HOY!' : `URGENTE (${exp.daysUntilExpiration}d)`}</span>
          </span>
        );
      case 'UPCOMING':
        return (
          <span className="status-badge badge-deadline-upcoming" title={`Vence en ${exp.daysUntilExpiration} días`}>
            <Clock size={12} />
            <span>PRÓXIMO ({exp.daysUntilExpiration}d)</span>
          </span>
        );
      case 'CURRENT':
        return (
          <span className="status-badge badge-deadline-current" title={`Vigente (${exp.daysUntilExpiration} días restantes)`}>
            <CheckCircle size={12} />
            <span>VIGENTE ({exp.daysUntilExpiration}d)</span>
          </span>
        );
      default:
        return (
          <span className="status-badge status-up">
            {exp.lifecycleStatus}
          </span>
        );
    }
  };

  const canCreateOrEdit = role === 'PLATFORM_ADMIN' || role === 'CONSULTANT_ADMIN' || role === 'TECHNICIAN';

  if (authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <RefreshCw size={24} className="animate-spin" color="#38bdf8" />
        <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>Verificando credenciales...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <ShieldAlert size={48} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
        <h2>Autenticación Requerida</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0.75rem 0 1.5rem' }}>
          Para consultar y gestionar el core de vencimientos, debés iniciar sesión.
        </p>
        <Link href="/login" className="btn-refresh" style={{ textDecoration: 'none', justifyContent: 'center', padding: '0.65rem 1.25rem' }}>
          <span>Ir a Inicio de Sesión</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header & New Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Clock size={28} color="#38bdf8" />
            <span>Gestión de Vencimientos</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Control operativo de obligaciones técnicas, plazos legales y estado de cumplimiento.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => fetchExpirations(currentPage)} disabled={loading} className="btn-refresh" id="btn-refresh-expirations">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          {canCreateOrEdit && (
            <Link
              href="/expirations/new"
              className="btn-refresh"
              style={{ background: 'rgba(16, 185, 129, 0.25)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399', textDecoration: 'none' }}
              id="btn-new-expiration"
            >
              <PlusCircle size={15} />
              <span>Nuevo Vencimiento</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => handleTabChange('all')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '6px',
            background: activeTab === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            border: activeTab === 'all' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
            color: activeTab === 'all' ? '#93c5fd' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          Todos los Vencimientos
        </button>
        <button
          onClick={() => handleTabChange('upcoming')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '6px',
            background: activeTab === 'upcoming' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
            border: activeTab === 'upcoming' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
            color: activeTab === 'upcoming' ? '#fcd34d' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          Próximos a Vencer (≤ 30 días)
        </button>
        <button
          onClick={() => handleTabChange('expired')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '6px',
            background: activeTab === 'expired' ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
            border: activeTab === 'expired' ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid transparent',
            color: activeTab === 'expired' ? '#fb7185' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          Obligaciones Vencidas (&lt; Hoy)
        </button>
      </div>

      {/* Filter Toolbar (Visible only on 'all' tab) */}
      {activeTab === 'all' && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: '#93c5fd', fontSize: '0.85rem', fontWeight: 600 }}>
            <Filter size={15} />
            <span>Filtros Dinámicos (Consultas Directas al Backend)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Empresa</label>
              <select
                className="form-select"
                value={filterCompanyId}
                onChange={(e) => setFilterCompanyId(e.target.value)}
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
                onChange={(e) => setFilterCategoryId(e.target.value)}
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
                onChange={(e) => setFilterLifecycleStatus(e.target.value)}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVE">Activo (Pendiente)</option>
                <option value="COMPLETED">Completado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="form-label">Clasificación Temporal</label>
              <select
                className="form-select"
                value={filterDeadlineStatus}
                onChange={(e) => setFilterDeadlineStatus(e.target.value)}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              >
                <option value="">Todas</option>
                <option value="EXPIRED">Vencido</option>
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
                onChange={(e) => setFilterFrom(e.target.value)}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              />
            </div>

            <div>
              <label className="form-label">Hasta</label>
              <input
                type="date"
                className="form-input"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
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

      {/* Error Message */}
      {error && (
        <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#fda4af', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Expirations Table / List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && expirations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-secondary)' }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} color="#38bdf8" />
            <p>Cargando vencimientos autorizados...</p>
          </div>
        ) : expirations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Clock size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h3>No se encontraron vencimientos</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.88rem' }}>
              {activeTab !== 'all' || filterCompanyId || filterCategoryId || filterLifecycleStatus || filterDeadlineStatus || filterFrom || filterTo
                ? 'No hay registros que coincidan con los filtros seleccionados.'
                : 'No hay vencimientos registrados en tu ámbito de acceso.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha Venc.</th>
                  <th>Empresa</th>
                  <th>Categoría</th>
                  <th>Título / Obligación</th>
                  <th>Estado / Plazo</th>
                  <th>Responsable</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expirations.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#f3f4f6' }}>
                        {exp.expirationDate}
                      </div>
                      {exp.issueDate && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Emisión: {exp.issueDate}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {exp.company.businessName}
                      </div>
                    </td>

                    <td>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#93c5fd'
                      }}>
                        {exp.category.name}
                      </span>
                    </td>

                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {exp.title}
                      </div>
                      {exp.description && (
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {exp.description}
                        </div>
                      )}
                    </td>

                    <td>
                      {getDeadlineBadge(exp)}
                    </td>

                    <td>
                      {exp.responsible ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {exp.responsible.fullName}
                        </div>
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

                        {canCreateOrEdit && exp.lifecycleStatus === 'ACTIVE' && (
                          <>
                            <Link
                              href={`/expirations/${exp.id}/edit`}
                              className="btn-refresh"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              title="Editar"
                            >
                              <Edit2 size={13} />
                            </Link>

                            <button
                              onClick={() => openCompleteModal(exp)}
                              className="btn-refresh"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
                              title="Completar vencimiento"
                            >
                              <Check size={13} />
                            </button>

                            <button
                              onClick={() => openCancelModal(exp)}
                              className="btn-refresh"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185' }}
                              title="Cancelar vencimiento"
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

        {/* Pagination bar */}
        {activeTab === 'all' && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div>
              Total: <strong>{totalElements}</strong> registros (Página {currentPage + 1} de {totalPages})
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => fetchExpirations(currentPage - 1)}
                disabled={currentPage === 0 || loading}
                className="btn-refresh"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                Anterior
              </button>
              <button
                onClick={() => fetchExpirations(currentPage + 1)}
                disabled={currentPage + 1 >= totalPages || loading}
                className="btn-refresh"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Complete Expiration */}
      {completeModalOpen && selectedExpiration && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} />
                <span>Completar Vencimiento</span>
              </h3>
              <button onClick={() => setCompleteModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Marcar como cumplida la obligación <strong>{selectedExpiration.title}</strong> de <strong>{selectedExpiration.company.businessName}</strong>.
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
                  disabled={actionSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="btn-refresh"
                  style={{ background: 'rgba(16, 185, 129, 0.25)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
                >
                  {actionSubmitting ? 'Guardando...' : 'Confirmar Cumplimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cancel Expiration */}
      {cancelModalOpen && selectedExpiration && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fb7185', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <XCircle size={20} />
                <span>Cancelar Vencimiento</span>
              </h3>
              <button onClick={() => setCancelModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              ¿Estás seguro de cancelar el vencimiento <strong>{selectedExpiration.title}</strong>? Esta acción no borra el registro para preservar la auditoría comercial.
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
                  disabled={actionSubmitting}
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="btn-refresh"
                  style={{ background: 'rgba(244, 63, 94, 0.25)', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185' }}
                >
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
