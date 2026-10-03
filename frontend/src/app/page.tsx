'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { SystemStatusCard } from '@/features/system/components/SystemStatusCard';
import { Shield, Users, Building2, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const { user, role, isAuthenticated, quickLoginAs } = useAuth();

  return (
    <main>
      <section className="hero">
        <div className="hero-subtitle">Plataforma SaaS • Higiene & Seguridad Laboral</div>
        <h1>PREVENIA — Día 2: Usuarios, Empresas y Permisos</h1>
        <p>
          Fundación de seguridad profesional con control multi-tenant estricto, roles granulares
          (<code>PLATFORM_ADMIN</code>, <code>CONSULTANT_ADMIN</code>, <code>TECHNICIAN</code>, <code>CLIENT</code>),
          tokens JWT y protección contra IDOR aplicada en el backend.
        </p>
      </section>

      {/* Role Testing Quick Matrix */}
      <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--border-accent)' }}>
        <div className="card-header">
          <div className="card-title">
            <Lock size={20} color="#38bdf8" />
            <span>Matriz de Testing de Roles y Aislamiento Multi-Tenant</span>
          </div>
          {isAuthenticated && user && (
            <span className="status-badge status-up">
              Conectado como: {user.role} ({user.email})
            </span>
          )}
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          Probá el comportamiento de los filtros de seguridad del backend alternando entre usuarios con un solo click:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 700, color: '#93c5fd', fontSize: '0.9rem' }}>1. Consultor Admin A</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0.75rem' }}>
              Ve las 3 empresas de Org A (Macro, Andreani, Coca-Cola). Puede crear usuarios y empresas.
            </div>
            <button
              onClick={() => quickLoginAs('admin@demo.com', 'Demo1234!')}
              className="btn-refresh"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}
            >
              <span>Activar: admin@demo.com</span>
            </button>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 700, color: '#fcd34d', fontSize: '0.9rem' }}>2. Técnico Carlos</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0.75rem' }}>
              Ve únicamente sus 2 empresas asignadas (Macro, Andreani). IDOR bloqueado en Coca-Cola.
            </div>
            <button
              onClick={() => quickLoginAs('carlos@demo.com', 'Demo1234!')}
              className="btn-refresh"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fcd34d' }}
            >
              <span>Activar: carlos@demo.com</span>
            </button>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 700, color: '#6ee7b7', fontSize: '0.9rem' }}>3. Cliente Macro</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0.75rem' }}>
              Ve únicamente Banco Macro. IDOR bloqueado para cualquier otra empresa.
            </div>
            <button
              onClick={() => quickLoginAs('macro@demo.com', 'Demo1234!')}
              className="btn-refresh"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7' }}
            >
              <span>Activar: macro@demo.com</span>
            </button>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 700, color: '#f472b6', fontSize: '0.9rem' }}>4. Admin Org B (Cross-Tenant)</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0.75rem' }}>
              Pertenece a otra consultora. Aislamiento total frente a los datos de Org A.
            </div>
            <button
              onClick={() => quickLoginAs('admin.b@demo.com', 'Demo1234!')}
              className="btn-refresh"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', borderColor: 'rgba(236, 72, 153, 0.3)', color: '#f472b6' }}
            >
              <span>Activar: admin.b@demo.com</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Link href="/companies" className="btn-refresh" style={{ textDecoration: 'none', background: 'rgba(59, 130, 246, 0.2)' }}>
            <Building2 size={14} />
            <span>Ver Empresas Autorizadas ({role || 'Anónimo'})</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="grid">
        <SystemStatusCard />

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={20} color="#34d399" />
              <span>Garantías de Seguridad Backend (Día 2)</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>Filtro JWT Stateless:</strong> Todas las rutas <code>/api/v1/**</code> protegidas excepto login y healthcheck.</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>Aislamiento por Tenant:</strong> Consultas forzadas por <code>organization_id</code> sin confiar en el cliente.</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>Asignación Técnica Granular:</strong> Técnicos solo ven empresas asignadas en <code>user_company_assignments</code>.</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>Protección Anti-IDOR & Escalación:</strong> Respuestas 404 para ocultación anti-enumeración de recursos ajenos.</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>31 Tests Automáticos:</strong> Validando cada caso de uso y matriz de permisos.</div>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ marginTop: '3rem' }}>
        <p>PREVENIA SaaS © 2026 • Día 2: Usuarios, Empresas y Permisos Completado • Listo para Día 3</p>
      </footer>
    </main>
  );
}
