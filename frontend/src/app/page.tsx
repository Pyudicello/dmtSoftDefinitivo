'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { SystemStatusCard } from '@/features/system/components/SystemStatusCard';
import { Shield, Users, Building2, Lock, ArrowRight, ShieldCheck, CheckCircle2, Clock, AlertTriangle, CheckCircle, Tag } from 'lucide-react';

export default function HomePage() {
  const { user, role, isAuthenticated, quickLoginAs } = useAuth();

  return (
    <main>
      <section className="hero">
        <div className="hero-subtitle">Plataforma SaaS • Higiene & Seguridad Laboral</div>
        <h1>PREVENIA — Día 3: Core de Vencimientos</h1>
        <p>
          Motor comercial y de cumplimiento técnico para consultoras de Higiene y Seguridad.
          Gestión integral de obligaciones periódicas, ciclo de vida administrativo (<code>ACTIVE</code>, <code>COMPLETED</code>, <code>CANCELLED</code>),
          clasificación temporal dinámica (<code>URGENT</code>, <code>UPCOMING</code>, <code>CURRENT</code>, <code>EXPIRED</code>) y aislamiento multi-tenant estricto.
        </p>
      </section>

      {/* Role Testing Quick Matrix */}
      <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--border-accent)' }}>
        <div className="card-header">
          <div className="card-title">
            <Lock size={20} color="#38bdf8" />
            <span>Matriz de Testing de Roles y Visibilidad de Vencimientos</span>
          </div>
          {isAuthenticated && user && (
            <span className="status-badge status-up">
              Conectado como: {user.role} ({user.email})
            </span>
          )}
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          Alterná entre identidades con un solo click para verificar las políticas de autorización sobre empresas y vencimientos:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}>
            <div style={{ fontWeight: 700, color: '#93c5fd', fontSize: '0.9rem' }}>1. Consultor Admin A</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0.75rem' }}>
              Ve todos los vencimientos de Org A (Macro, Andreani, Coca-Cola). CRUD completo y gestión de categorías.
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
              Ve y opera solo en sus empresas asignadas (Macro, Andreani). Bloqueo IDOR 404 para Coca-Cola.
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
              Solo lectura de vencimientos de Banco Macro. Bloqueo 403 en creación/edición e IDOR 404 en otras empresas.
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
              Consultora B. Aislamiento estricto: no puede ver ni consultar vencimientos de las empresas de Org A.
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

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/companies" className="btn-refresh" style={{ textDecoration: 'none' }}>
            <Building2 size={14} />
            <span>Empresas</span>
          </Link>
          <Link href="/expirations" className="btn-refresh" style={{ textDecoration: 'none', background: 'rgba(59, 130, 246, 0.25)', color: '#ffffff' }}>
            <Clock size={14} />
            <span>Ver Vencimientos Autorizados ({role || 'Anónimo'})</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Deadline Classification Rules Info */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div className="card-title">
            <Clock size={20} color="#38bdf8" />
            <span>Motor de Clasificación Temporal (Calculado al Vuelo vía Clock Inyectable)</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '8px' }}>
            <div style={{ color: '#fb7185', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertTriangle size={15} />
              <span>VENCIDO (EXPIRED)</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              <code>expirationDate &lt; hoy</code>.<br />Obligación atrasada que requiere atención inmediata.
            </div>
          </div>

          <div style={{ padding: '0.85rem', background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.25)', borderRadius: '8px' }}>
            <div style={{ color: '#fb923c', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={15} />
              <span>URGENTE (URGENT)</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              <code>0 ≤ días ≤ 7</code>.<br />Vence hoy o en los próximos 7 días inclusive.
            </div>
          </div>

          <div style={{ padding: '0.85rem', background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '8px' }}>
            <div style={{ color: '#facc15', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={15} />
              <span>PRÓXIMO (UPCOMING)</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              <code>8 ≤ días ≤ 30</code>.<br />Vencimiento en el horizonte mensual operativo.
            </div>
          </div>

          <div style={{ padding: '0.85rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px' }}>
            <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle size={15} />
              <span>VIGENTE (CURRENT)</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              <code>días &gt; 30</code>.<br />Obligación al día con margen holgado.
            </div>
          </div>
        </div>
      </div>

      <div className="grid">
        <SystemStatusCard />

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={20} color="#34d399" />
              <span>Garantías de Dominio & Seguridad (Día 3)</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>Separación Lifecycle vs Deadline:</strong> Estado administrativo persistido; estado temporal calculado dinámicamente.</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>Categorías Globales & Por Tenant:</strong> Seed de 10 categorías globales + extensibilidad por consultora.</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>Filtros JPA Specification:</strong> Predicados multi-tenant aplicados en base de datos sin filtrado en memoria.</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>62 Tests Automatizados:</strong> Cobertura de límites temporales, concurrencia optimista y matriz de permisos.</div>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ marginTop: '3rem' }}>
        <p>PREVENIA SaaS © 2026 • Día 3: Core de Vencimientos Completado • Listo para Día 4</p>
      </footer>
    </main>
  );
}

