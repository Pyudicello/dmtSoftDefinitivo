'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { companyService } from '@/services/company.service';
import { expirationService } from '@/services/expiration.service';
import { inspectionService } from '@/services/inspection.service';
import { permitService } from '@/services/permit.service';
import { queryKeys } from '@/lib/query-keys';
import { formatDateSpanish } from '@/lib/date-utils';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ExpirationStatusBadge } from '@/components/ui/ExpirationStatusBadge';
import { CardSkeleton, DetailSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { InspectionList } from '@/components/inspections/InspectionList';
import { InspectionModal } from '@/components/inspections/InspectionModal';
import { InspectionDetailModal } from '@/components/inspections/InspectionDetailModal';
import { PermitList } from '@/components/permits/PermitList';
import { PermitModal } from '@/components/permits/PermitModal';
import { RenewPermitModal } from '@/components/permits/RenewPermitModal';
import { PermitDetailModal } from '@/components/permits/PermitDetailModal';
import { Expiration, Inspection, Permit, RenewPermitPayload } from '@/types';
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
  ClipboardCheck,
  Award,
} from 'lucide-react';

function CompanyDetailContent({ companyId }: { companyId: string }) {
  const { user, role } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'resumen' | 'vencimientos' | 'inspecciones' | 'habilitaciones'>('resumen');

  // Modals for Expirations
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<Expiration | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals for Inspections
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [inspectionDetailModalOpen, setInspectionDetailModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  // Modals for Permits
  const [permitModalOpen, setPermitModalOpen] = useState(false);
  const [renewPermitModalOpen, setRenewPermitModalOpen] = useState(false);
  const [permitDetailModalOpen, setPermitDetailModalOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);

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
  } = useQuery({
    queryKey: queryKeys.companies.expirations(companyId),
    queryFn: () => expirationService.getCompanyExpirations(companyId),
    enabled: activeTab === 'vencimientos',
  });

  const {
    data: companyInspectionsData,
    isLoading: inspectionsLoading,
  } = useQuery({
    queryKey: queryKeys.inspections.company(companyId),
    queryFn: () => inspectionService.getCompanyInspections(companyId),
    enabled: activeTab === 'inspecciones',
  });

  const {
    data: companyPermitsData,
    isLoading: permitsLoading,
  } = useQuery({
    queryKey: queryKeys.permits.company(companyId),
    queryFn: () => permitService.getCompanyPermits(companyId),
    enabled: activeTab === 'habilitaciones',
  });

  const invalidateAllSync = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.companies.metrics(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.companies.expirations(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.inspections.company(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.permits.company(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.expirations.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
  };

  // Expiration Complete / Cancel Mutations
  const completeMutation = useMutation({
    mutationFn: ({ id, completedAt, notes }: { id: string; completedAt?: string; notes?: string }) =>
      expirationService.completeExpiration(id, { completedAt, notes }),
    onSuccess: () => {
      toast.success('Vencimiento completado con éxito');
      setCompleteModalOpen(false);
      setSelectedExp(null);
      invalidateAllSync();
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
      invalidateAllSync();
    },
    onError: (err: any) => {
      setActionError(err?.errorBody?.message || err?.message || 'Error al cancelar el vencimiento');
    },
  });

  // Inspection Mutations
  const createInspectionMutation = useMutation({
    mutationFn: (data: any) => inspectionService.createCompanyInspection(companyId, data),
    onSuccess: () => {
      toast.success('Visita / Inspección registrada con éxito');
      setInspectionModalOpen(false);
      setSelectedInspection(null);
      invalidateAllSync();
    },
    onError: (err: any) => {
      toast.error(err?.errorBody?.message || err?.message || 'Error al registrar inspección');
    },
  });

  const updateInspectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => inspectionService.updateInspection(id, data),
    onSuccess: () => {
      toast.success('Inspección actualizada correctamente');
      setInspectionModalOpen(false);
      setSelectedInspection(null);
      invalidateAllSync();
    },
    onError: (err: any) => {
      toast.error(err?.errorBody?.message || err?.message || 'Error al actualizar inspección');
    },
  });

  const deleteInspectionMutation = useMutation({
    mutationFn: (id: string) => inspectionService.deleteInspection(id),
    onSuccess: () => {
      toast.success('Inspección eliminada');
      setInspectionDetailModalOpen(false);
      setSelectedInspection(null);
      invalidateAllSync();
    },
    onError: (err: any) => {
      toast.error(err?.errorBody?.message || err?.message || 'Error al eliminar inspección');
    },
  });

  // Permit Mutations
  const createPermitMutation = useMutation({
    mutationFn: (data: any) => permitService.createCompanyPermit(companyId, data),
    onSuccess: () => {
      toast.success('Habilitación / Visado registrado con éxito');
      setPermitModalOpen(false);
      setSelectedPermit(null);
      invalidateAllSync();
    },
    onError: (err: any) => {
      toast.error(err?.errorBody?.message || err?.message || 'Error al registrar habilitación');
    },
  });

  const renewPermitMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RenewPermitPayload }) =>
      permitService.renewPermit(id, payload),
    onSuccess: () => {
      toast.success('Habilitación renovada con éxito. Registro histórico archivado.');
      setRenewPermitModalOpen(false);
      setSelectedPermit(null);
      invalidateAllSync();
    },
    onError: (err: any) => {
      toast.error(err?.errorBody?.message || err?.message || 'Error al renovar habilitación');
    },
  });

  const updatePermitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => permitService.updatePermit(id, data),
    onSuccess: () => {
      toast.success('Habilitación actualizada');
      setPermitModalOpen(false);
      setSelectedPermit(null);
      invalidateAllSync();
    },
    onError: (err: any) => {
      toast.error(err?.errorBody?.message || err?.message || 'Error al actualizar habilitación');
    },
  });

  const deletePermitMutation = useMutation({
    mutationFn: (id: string) => permitService.deletePermit(id),
    onSuccess: () => {
      toast.success('Habilitación eliminada');
      setPermitDetailModalOpen(false);
      setSelectedPermit(null);
      invalidateAllSync();
    },
    onError: (err: any) => {
      toast.error(err?.errorBody?.message || err?.message || 'Error al eliminar habilitación');
    },
  });

  const canManage = role === 'PLATFORM_ADMIN' || role === 'CONSULTANT_ADMIN' || role === 'TECHNICIAN';

  // Expiration modal handlers
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

  // Inspection modal handlers
  const handleOpenInspectionCreate = () => {
    setSelectedInspection(null);
    setInspectionModalOpen(true);
  };

  const handleOpenInspectionEdit = (insp: Inspection) => {
    setSelectedInspection(insp);
    setInspectionDetailModalOpen(false);
    setInspectionModalOpen(true);
  };

  const handleOpenInspectionDetail = (insp: Inspection) => {
    setSelectedInspection(insp);
    setInspectionDetailModalOpen(true);
  };

  const handleInspectionSubmit = async (data: any) => {
    if (selectedInspection) {
      await updateInspectionMutation.mutateAsync({ id: selectedInspection.id, data });
    } else {
      await createInspectionMutation.mutateAsync(data);
    }
  };

  const handleInspectionDelete = (insp: Inspection) => {
    if (confirm(`¿Estás seguro de eliminar la inspección de "${insp.authority}" del ${formatDateSpanish(insp.visitDate)}?`)) {
      deleteInspectionMutation.mutate(insp.id);
    }
  };

  // Permit modal handlers
  const handleOpenPermitCreate = () => {
    setSelectedPermit(null);
    setPermitModalOpen(true);
  };

  const handleOpenPermitEdit = (permit: Permit) => {
    setSelectedPermit(permit);
    setPermitDetailModalOpen(false);
    setPermitModalOpen(true);
  };

  const handleOpenPermitRenew = (permit: Permit) => {
    setSelectedPermit(permit);
    setPermitDetailModalOpen(false);
    setRenewPermitModalOpen(true);
  };

  const handleOpenPermitDetail = (permit: Permit) => {
    setSelectedPermit(permit);
    setPermitDetailModalOpen(true);
  };

  const handlePermitSubmit = async (data: any) => {
    if (selectedPermit) {
      await updatePermitMutation.mutateAsync({ id: selectedPermit.id, data });
    } else {
      await createPermitMutation.mutateAsync(data);
    }
  };

  const handlePermitRenewSubmit = async (permitId: string, payload: RenewPermitPayload) => {
    await renewPermitMutation.mutateAsync({ id: permitId, payload });
  };

  const handlePermitDelete = (permit: Permit) => {
    if (confirm(`¿Estás seguro de eliminar la habilitación "${permit.permitNumber}" (${permit.issuingAuthority})?`)) {
      deletePermitMutation.mutate(permit.id);
    }
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
  const inspections = companyInspectionsData?.content || [];
  const permits = companyPermitsData?.content || [];

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {canManage && (
              <>
                <button
                  onClick={handleOpenInspectionCreate}
                  className="btn-refresh"
                  style={{
                    background: 'rgba(99, 102, 241, 0.18)',
                    borderColor: 'rgba(99, 102, 241, 0.4)',
                    color: '#818cf8',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.8rem',
                    height: '32px',
                    borderRadius: '6px',
                    gap: '0.35rem',
                  }}
                >
                  <ClipboardCheck size={13} />
                  <span>Nueva Visita</span>
                </button>

                <button
                  onClick={handleOpenPermitCreate}
                  className="btn-refresh"
                  style={{
                    background: 'rgba(56, 189, 248, 0.18)',
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.8rem',
                    height: '32px',
                    borderRadius: '6px',
                    gap: '0.35rem',
                  }}
                >
                  <Award size={13} />
                  <span>Nueva Habilitación</span>
                </button>

                <Link
                  href={`/expirations/new?companyId=${company.id}`}
                  className="btn-refresh"
                  style={{
                    background: 'rgba(16, 185, 129, 0.18)',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    textDecoration: 'none',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.8rem',
                    height: '32px',
                    borderRadius: '6px',
                    gap: '0.35rem',
                  }}
                >
                  <PlusCircle size={13} />
                  <span>Nuevo Vencimiento</span>
                </Link>
              </>
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
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
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
        <button
          onClick={() => setActiveTab('inspecciones')}
          className={`tab-button ${activeTab === 'inspecciones' ? 'active' : ''}`}
        >
          <ClipboardCheck size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
          Visitas / Inspecciones
        </button>
        <button
          onClick={() => setActiveTab('habilitaciones')}
          className={`tab-button ${activeTab === 'habilitaciones' ? 'active' : ''}`}
        >
          <Award size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
          Habilitaciones / Visados
        </button>
      </div>

      {/* Tab 1: Resumen */}
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

      {/* Tab 2: Vencimientos */}
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

            {canManage && (
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
            <div style={{ padding: '1.5rem' }}>
              <TableSkeleton rows={4} />
            </div>
          ) : expirations.length === 0 ? (
            <div style={{ padding: '2rem' }}>
              <EmptyState
                title="Sin vencimientos registrados"
                description="Esta empresa no tiene obligaciones ni vencimientos dados de alta."
                action={
                  canManage ? (
                    <Link
                      href={`/expirations/new?companyId=${company.id}`}
                      className="btn-refresh"
                      style={{
                        background: 'var(--primary-color, #3b82f6)',
                        color: '#fff',
                        borderColor: 'transparent',
                        textDecoration: 'none',
                      }}
                    >
                      <PlusCircle size={14} />
                      <span>Crear Primer Vencimiento</span>
                    </Link>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Título / Obligación</th>
                    <th>Fecha Vencimiento</th>
                    <th>Estado de Plazo</th>
                    <th>Estado Ciclo</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {expirations.map((exp) => (
                    <tr key={exp.id}>
                      <td>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: `${exp.category?.colorCode || '#3b82f6'}20`,
                            color: exp.category?.colorCode || '#3b82f6',
                            border: `1px solid ${exp.category?.colorCode || '#3b82f6'}40`,
                          }}
                        >
                          {exp.category?.name}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{exp.title}</div>
                        {exp.description && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                            {exp.description}
                          </div>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {formatDateSpanish(exp.expirationDate)}
                      </td>
                      <td>
                        <ExpirationStatusBadge
                          deadlineStatus={exp.deadlineStatus}
                          lifecycleStatus={exp.lifecycleStatus}
                          daysUntilExpiration={exp.daysUntilExpiration}
                        />
                      </td>
                      <td>
                        <span className={`status-badge status-${exp.lifecycleStatus.toLowerCase()}`}>
                          {exp.lifecycleStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <Link
                            href={`/expirations/${exp.id}`}
                            className="btn-icon"
                            title="Ver Detalle"
                            style={{ color: '#38bdf8' }}
                          >
                            <Eye size={16} />
                          </Link>

                          {canManage && exp.lifecycleStatus === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => handleOpenComplete(exp)}
                                className="btn-icon"
                                title="Marcar como Completado"
                                style={{ color: '#34d399' }}
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => handleOpenCancel(exp)}
                                className="btn-icon"
                                title="Cancelar Vencimiento"
                                style={{ color: '#f87171' }}
                              >
                                <XCircle size={16} />
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

      {/* Tab 3: Visitas e Inspecciones */}
      {activeTab === 'inspecciones' && (
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Visitas e Inspecciones Técnicas
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
              Historial de inspecciones realizadas por ART, organismos municipales, provinciales y servicios de Higiene y Seguridad. Las próximas visitas programadas se sincronizan con el motor central de vencimientos.
            </p>
          </div>

          {inspectionsLoading ? (
            <TableSkeleton rows={4} />
          ) : (
            <InspectionList
              inspections={inspections}
              isLoading={inspectionsLoading}
              canManage={canManage}
              onOpenCreate={handleOpenInspectionCreate}
              onOpenDetail={handleOpenInspectionDetail}
              onOpenEdit={handleOpenInspectionEdit}
              onDelete={handleInspectionDelete}
            />
          )}
        </div>
      )}

      {/* Tab 4: Habilitaciones / Visados */}
      {activeTab === 'habilitaciones' && (
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Habilitaciones y Visados Oficiales
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
              Control de vigencia y plazos de renovación para habilitaciones municipales, provinciales y de bomberos. El vencimiento de visado se gestiona con el clasificador central de vencimientos y conserva su historial de renovaciones.
            </p>
          </div>

          {permitsLoading ? (
            <TableSkeleton rows={4} />
          ) : (
            <PermitList
              permits={permits}
              isLoading={permitsLoading}
              canManage={canManage}
              onOpenCreate={handleOpenPermitCreate}
              onOpenDetail={handleOpenPermitDetail}
              onOpenEdit={handleOpenPermitEdit}
              onOpenRenew={handleOpenPermitRenew}
              onDelete={handlePermitDelete}
            />
          )}
        </div>
      )}

      {/* MODALS SECTION */}

      {/* Complete Expiration Modal */}
      {completeModalOpen && selectedExp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '500px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700 }}>
                <CheckCircle2 size={20} />
                <span>Marcar como Cumplido / Completado</span>
              </div>
              <button onClick={() => setCompleteModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Vas a completar el vencimiento: <strong style={{ color: 'var(--text-primary)' }}>{selectedExp.title}</strong>
            </p>

            {actionError && (
              <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleCompleteSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Fecha de Cumplimiento (Opcional)</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Observaciones / Notas de Cumplimiento</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Detalle de tareas realizadas, certificados emitidos..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-refresh" onClick={() => setCompleteModalOpen(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-refresh"
                  style={{ background: 'rgba(16, 185, 129, 0.9)', color: '#fff', borderColor: 'transparent' }}
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? 'Completando...' : 'Confirmar Cumplimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Expiration Modal */}
      {cancelModalOpen && selectedExp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '500px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 700 }}>
                <XCircle size={20} />
                <span>Cancelar / Anular Vencimiento</span>
              </div>
              <button onClick={() => setCancelModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Vas a anular el vencimiento: <strong style={{ color: 'var(--text-primary)' }}>{selectedExp.title}</strong>
            </p>

            {actionError && (
              <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleCancelSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Motivo de Cancelación</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Cambio de normativa, servicio reemplazado..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-refresh" onClick={() => setCancelModalOpen(false)}>
                  Volver
                </button>
                <button
                  type="submit"
                  className="btn-refresh"
                  style={{ background: 'rgba(239, 68, 68, 0.9)', color: '#fff', borderColor: 'transparent' }}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspection Modals */}
      <InspectionModal
        isOpen={inspectionModalOpen}
        onClose={() => {
          setInspectionModalOpen(false);
          setSelectedInspection(null);
        }}
        onSubmit={handleInspectionSubmit}
        companyId={companyId}
        inspectionToEdit={selectedInspection}
        isLoading={createInspectionMutation.isPending || updateInspectionMutation.isPending}
      />

      <InspectionDetailModal
        isOpen={inspectionDetailModalOpen}
        onClose={() => {
          setInspectionDetailModalOpen(false);
          setSelectedInspection(null);
        }}
        inspection={selectedInspection}
        onEdit={handleOpenInspectionEdit}
        onDelete={handleInspectionDelete}
        canManage={canManage}
      />

      {/* Permit Modals */}
      <PermitModal
        isOpen={permitModalOpen}
        onClose={() => {
          setPermitModalOpen(false);
          setSelectedPermit(null);
        }}
        onSubmit={handlePermitSubmit}
        companyId={companyId}
        permitToEdit={selectedPermit}
        isLoading={createPermitMutation.isPending || updatePermitMutation.isPending}
      />

      <RenewPermitModal
        isOpen={renewPermitModalOpen}
        onClose={() => {
          setRenewPermitModalOpen(false);
          setSelectedPermit(null);
        }}
        onSubmit={handlePermitRenewSubmit}
        permit={selectedPermit}
        isLoading={renewPermitMutation.isPending}
      />

      <PermitDetailModal
        isOpen={permitDetailModalOpen}
        onClose={() => {
          setPermitDetailModalOpen(false);
          setSelectedPermit(null);
        }}
        permit={selectedPermit}
        onEdit={handleOpenPermitEdit}
        onRenew={handleOpenPermitRenew}
        onDelete={handlePermitDelete}
        canManage={canManage}
      />
    </div>
  );
}

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN', 'CLIENT']}>
      <CompanyDetailContent companyId={resolvedParams.id} />
    </ProtectedRoute>
  );
}
