'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { companyService } from '@/services/company.service';
import { queryKeys } from '@/lib/query-keys';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  Building2,
  PlusCircle,
  Search,
  ArrowRight,
  RefreshCw,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
} from 'lucide-react';

function CompaniesContent() {
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.companies.list(page, pageSize, search),
    queryFn: () => companyService.getCompanies(page, pageSize, search),
  });

  const companies = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 0;

  const canCreate = role === 'PLATFORM_ADMIN' || role === 'CONSULTANT_ADMIN';

  const getRoleDescription = () => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return 'Visibilidad global: Podés consultar todas las empresas de la plataforma.';
      case 'CONSULTANT_ADMIN':
        return 'Visibilidad de consultora: Mostrando todas las empresas clientes administradas por tu Organization.';
      case 'TECHNICIAN':
        return 'Visibilidad técnica estricta: El backend devuelve exclusivamente las empresas que tenés asignadas.';
      case 'CLIENT':
        return 'Visibilidad cliente: Mostrando únicamente tu empresa registrada.';
      default:
        return '';
    }
  };

  return (
    <div>
      <PageHeader
        title={role === 'CLIENT' ? 'Mi Empresa' : 'Gestión de Empresas'}
        subtitle="Cartera de empresas clientes bajo políticas de autorización en backend."
        icon={<Building2 size={24} />}
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
                href="/companies/new"
                className="btn-refresh"
                style={{
                  background: 'rgba(16, 185, 129, 0.25)',
                  borderColor: 'rgba(16, 185, 129, 0.45)',
                  color: '#34d399',
                  textDecoration: 'none',
                }}
              >
                <PlusCircle size={14} />
                <span>Nueva Empresa</span>
              </Link>
            )}
          </div>
        }
      />

      {/* Role Scope Notice */}
      <div
        style={{
          padding: '0.85rem 1.25rem',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#93c5fd',
        }}
      >
        <CheckCircle2 size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
        <div>
          <strong>Ámbito de Acceso ({role}):</strong> {getRoleDescription()}
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar empresa por nombre, razón social o CUIT..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              style={{ paddingLeft: '2.4rem', fontSize: '0.85rem' }}
            />
          </div>
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(0);
              }}
              className="btn-refresh"
              style={{ fontSize: '0.75rem', padding: '0.45rem 0.75rem' }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Companies Content */}
      {isError ? (
        <ErrorState
          title="Error al cargar empresas"
          message="No se pudo obtener el listado de empresas autorizadas."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : companies.length === 0 ? (
        <EmptyState
          title="No se encontraron empresas"
          description={
            search
              ? `No hay empresas que coincidan con el término "${search}".`
              : 'No tenés empresas asignadas o visibles bajo el ámbito actual.'
          }
          icon={<Building2 size={32} />}
          action={
            canCreate && !search ? (
              <Link
                href="/companies/new"
                className="btn-refresh"
                style={{
                  background: 'rgba(16, 185, 129, 0.25)',
                  borderColor: 'rgba(16, 185, 129, 0.45)',
                  color: '#34d399',
                  textDecoration: 'none',
                }}
              >
                <PlusCircle size={14} />
                <span>Registrar Primer Empresa</span>
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
                  <th>Empresa / Razón Social</th>
                  <th>CUIT / Identificación</th>
                  <th>Ubicación</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link
                        href={`/companies/${c.id}`}
                        style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.92rem' }}
                        className="hover:underline"
                      >
                        {c.businessName}
                      </Link>
                      {c.legalName && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {c.legalName}
                        </div>
                      )}
                    </td>

                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: '#93c5fd' }}>
                        {c.taxId || '—'}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={13} color="var(--text-muted)" />
                        <span>{c.city ? `${c.city}, ${c.province || 'AR'}` : '—'}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {c.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Mail size={12} color="var(--text-muted)" />
                            <span>{c.email}</span>
                          </div>
                        )}
                        {c.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                            <Phone size={12} color="var(--text-muted)" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                        {!c.email && !c.phone && '—'}
                      </div>
                    </td>

                    <td>
                      <span className="status-badge status-up" style={{ fontSize: '0.74rem' }}>
                        {c.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/companies/${c.id}`}
                        className="btn-refresh"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', textDecoration: 'none' }}
                      >
                        <span>Ver Detalle</span>
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
            {companies.map((c) => (
              <div
                key={c.id}
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
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {c.businessName}
                    </h4>
                    {c.legalName && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {c.legalName}
                      </div>
                    )}
                  </div>
                  <span className="status-badge status-up" style={{ fontSize: '0.7rem' }}>
                    {c.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div><strong>CUIT:</strong> {c.taxId || '—'}</div>
                  {c.city && <div><strong>Ubicación:</strong> {c.city}, {c.province || 'AR'}</div>}
                </div>

                <Link
                  href={`/companies/${c.id}`}
                  className="btn-refresh"
                  style={{ textDecoration: 'none', justifyContent: 'center', marginTop: '0.35rem', fontSize: '0.8rem' }}
                >
                  <span>Ver Detalle y Vencimientos</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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
                Total: <strong>{totalElements}</strong> empresas (Página {page + 1} de {totalPages})
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
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <ProtectedRoute>
      <CompaniesContent />
    </ProtectedRoute>
  );
}
