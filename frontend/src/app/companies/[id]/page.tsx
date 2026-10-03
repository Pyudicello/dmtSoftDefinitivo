'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { companyService } from '@/services/company.service';
import { Company } from '@/types';
import { Building2, ArrowLeft, ShieldCheck, ShieldX, RefreshCw, MapPin, Mail, Phone, Hash } from 'lucide-react';

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const companyId = resolvedParams.id;

  const { user, role, isAuthenticated, isLoading: authLoading } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  const fetchCompany = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    setIsAccessDenied(false);
    try {
      const data = await companyService.getCompanyById(companyId);
      setCompany(data);
    } catch (err: any) {
      const status = err?.status;
      if (status === 404 || status === 403) {
        setIsAccessDenied(true);
      }
      setError(err?.errorBody?.message || err?.message || 'Error al obtener la empresa');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, companyId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchCompany();
    }
  }, [authLoading, isAuthenticated, fetchCompany]);

  if (authLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <RefreshCw size={24} className="animate-spin" color="#38bdf8" />
        <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>Consultando backend con credenciales...</p>
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
            El backend respondió <strong>404 Not Found / 403 Forbidden</strong> porque tu usuario (<strong>{user?.email}</strong>) no tiene autorización para acceder a la empresa con ID:
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
            <li>Si sos <strong>CONSULTANT_ADMIN</strong>: La empresa pertenece a otra consultora (Aislamiento Cross-Tenant).</li>
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

  if (error || !company) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <h3>Error al cargar</h3>
        <p style={{ color: '#fda4af', margin: '0.5rem 0 1.5rem' }}>{error || 'No se pudo cargar la información'}</p>
        <Link href="/companies" className="btn-refresh" style={{ textDecoration: 'none', justifyContent: 'center' }}>
          <ArrowLeft size={14} />
          <span>Volver a Empresas</span>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/companies" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} />
          <span>Volver al listado</span>
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{company.businessName}</h1>
              <span className="status-badge status-up">{company.status}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
              {company.legalName || 'Sin razón social registrada'}
            </p>
          </div>
          <ShieldCheck size={28} color="#34d399" />
        </div>

        <table className="info-table" style={{ margin: '1.5rem 0' }}>
          <tbody>
            <tr>
              <td className="label"><Hash size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />ID Empresa</td>
              <td className="value"><code style={{ color: '#38bdf8' }}>{company.id}</code></td>
            </tr>
            <tr>
              <td className="label">Organization ID (Tenant)</td>
              <td className="value"><code style={{ color: '#a78bfa' }}>{company.organizationId}</code></td>
            </tr>
            <tr>
              <td className="label">CUIT / Identificación Fiscal</td>
              <td className="value">{company.taxId || '—'}</td>
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

        <div style={{
          padding: '1rem',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '8px',
          fontSize: '0.82rem',
          color: '#6ee7b7'
        }}>
          <strong>Validación de Acceso Satisfactoria:</strong> Has accedido a este recurso porque tu rol (<strong>{role}</strong>) cuenta con los permisos y asignaciones correspondientes en el backend.
        </div>
      </div>
    </div>
  );
}
