'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { companyService } from '@/services/company.service';
import { Company } from '@/types';
import { Building2, ShieldAlert, ArrowRight, RefreshCw, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function CompaniesPage() {
  const { user, role, isAuthenticated, isLoading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const response = await companyService.getCompanies();
      setCompanies(response.content || []);
    } catch (err: any) {
      setError(err?.errorBody?.message || err?.message || 'Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchCompanies();
    }
  }, [authLoading, isAuthenticated, fetchCompanies]);

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
          Para visualizar empresas y comprobar las políticas de seguridad multi-tenant y aislamiento por rol, debés iniciar sesión.
        </p>
        <Link href="/login" className="btn-refresh" style={{ textDecoration: 'none', justifyContent: 'center', padding: '0.65rem 1.25rem' }}>
          <span>Ir a Inicio de Sesión</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const getRoleDescription = () => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return 'Visibilidad global: Podés consultar todas las empresas de la plataforma sin importar el tenant.';
      case 'CONSULTANT_ADMIN':
        return 'Visibilidad de consultora: Mostrando todas las empresas clientes administradas por tu Organization.';
      case 'TECHNICIAN':
        return 'Visibilidad técnica estricta: El backend filtra y devuelve exclusivamente las empresas que tenés asignadas.';
      case 'CLIENT':
        return 'Visibilidad corporativa cliente: El backend filtra y devuelve únicamente tu propia empresa.';
      default:
        return '';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestión de Empresas Clientes</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Listado autorizado gobernado por políticas de autorización en backend.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchCompanies} disabled={loading} className="btn-refresh" id="btn-refresh-companies">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <div style={{
        padding: '0.85rem 1.25rem',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: '10px',
        marginBottom: '2rem',
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: '#93c5fd'
      }}>
        <CheckCircle2 size={18} color="#38bdf8" />
        <div>
          <strong>Ámbito actual ({role}):</strong> {getRoleDescription()}
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#fda4af', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading && companies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          Cargando empresas autorizadas...
        </div>
      ) : companies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Building2 size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3>No hay empresas disponibles</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.88rem' }}>
            Tu usuario no tiene empresas asignadas o visibles bajo el ámbito actual.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {companies.map((company) => (
            <div key={company.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {company.businessName}
                  </h3>
                  <span className="status-badge status-up">
                    {company.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
                  <div><strong>Razón Social:</strong> {company.legalName || '—'}</div>
                  <div><strong>CUIT:</strong> {company.taxId || '—'}</div>
                  <div><strong>Ubicación:</strong> {company.city ? `${company.city}, ${company.province || 'AR'}` : '—'}</div>
                  <div><strong>ID:</strong> <code style={{ fontSize: '0.72rem', color: '#a5f3fc' }}>{company.id}</code></div>
                </div>
              </div>

              <Link
                href={`/companies/${company.id}`}
                className="btn-refresh"
                style={{ textDecoration: 'none', justifyContent: 'center', fontSize: '0.8rem' }}
              >
                <span>Ver Detalle y Permisos</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
