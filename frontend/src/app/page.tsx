'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  Users,
  Building2,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CheckCircle,
  LayoutDashboard,
  LogIn
} from 'lucide-react';

export default function HomePage() {
  const { user, role, isAuthenticated, quickLoginAs, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <section className="hero" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          margin: '0 auto 1.25rem',
          width: '96px',
          height: '96px',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.45)'
        }}>
          <Image src="/logo.png" alt="DMT-Soft Logo" width={96} height={96} priority style={{ objectFit: 'contain' }} />
        </div>
        <div className="hero-subtitle" style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
          Plataforma SaaS • Higiene & Seguridad Laboral
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          DMT-Soft
        </h1>
        <p style={{ maxWidth: '700px', margin: '0 auto 1.5rem', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Gestión integral de vencimientos, auditoría de obligaciones técnicas y control de clientes para consultoras de Higiene y Seguridad.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/login"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
          >
            <LogIn size={18} />
            <span>Ingresar a DMT-Soft</span>
            <ArrowRight size={18} />
          </Link>
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
            >
              <LayoutDashboard size={18} />
              <span>Ir al Dashboard</span>
            </Link>
          )}
        </div>
      </section>

      {/* Role Testing Quick Matrix (Local & Development only) */}
      {process.env.NEXT_PUBLIC_APP_ENV !== 'production' && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--border-accent)' }}>
          <div className="card-header">
            <div className="card-title">
              <Lock size={20} color="#38bdf8" />
              <span>Acceso Rápido por Rol (Demostración y Testing)</span>
            </div>
            {isAuthenticated && user && (
              <span className="status-badge status-up">
                Conectado como: {user.role} ({user.email})
              </span>
            )}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            Hacé click en cualquiera de los roles para autenticarte instantáneamente y acceder al Dashboard con su ámbito de autorización:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, color: '#93c5fd', fontSize: '0.9rem' }}>1. Consultor Admin A</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0.75rem' }}>
                Scope completo de Consultora A (Macro, Andreani, Coca-Cola). CRUD de empresas y vencimientos.
              </div>
              <button
                onClick={async () => {
                  await quickLoginAs('admin@demo.com', 'Demo1234!');
                  router.push('/dashboard');
                }}
                className="btn-refresh"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}
              >
                <span>Ingresar como Admin A</span>
              </button>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, color: '#fcd34d', fontSize: '0.9rem' }}>2. Técnico Carlos</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0.75rem' }}>
                Opera solo en empresas asignadas (Macro, Andreani). Protección anti-IDOR 404 para Coca-Cola.
              </div>
              <button
                onClick={async () => {
                  await quickLoginAs('carlos@demo.com', 'Demo1234!');
                  router.push('/dashboard');
                }}
                className="btn-refresh"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fcd34d' }}
              >
                <span>Ingresar como Técnico</span>
              </button>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, color: '#6ee7b7', fontSize: '0.9rem' }}>3. Cliente Macro</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0.75rem' }}>
                Solo lectura de su empresa Banco Macro. Acciones de creación/edición bloqueadas.
              </div>
              <button
                onClick={async () => {
                  await quickLoginAs('macro@demo.com', 'Demo1234!');
                  router.push('/dashboard');
                }}
                className="btn-refresh"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7' }}
              >
                <span>Ingresar como Cliente</span>
              </button>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, color: '#f472b6', fontSize: '0.9rem' }}>4. Admin Org B (Cross-Tenant)</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0.75rem' }}>
                Consultora B. Aislamiento estricto: no puede ver ni consultar datos de la Consultora A.
              </div>
              <button
                onClick={async () => {
                  await quickLoginAs('admin.b@demo.com', 'Demo1234!');
                  router.push('/dashboard');
                }}
                className="btn-refresh"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', borderColor: 'rgba(236, 72, 153, 0.3)', color: '#f472b6' }}
              >
                <span>Ingresar como Org B</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div className="grid" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={20} color="#34d399" />
              <span>Arquitectura & Seguridad</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.86rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>Multi-tenancy Estricto:</strong> Aislamiento garantizado en backend vía JPA y TenantContext.</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>Autorización por Roles:</strong> Matriz PLATFORM_ADMIN, CONSULTANT_ADMIN, TECHNICIAN, CLIENT.</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>Prevención IDOR:</strong> Recursos no autorizados devuelven 404 Not Found para evitar enumeración.</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={20} color="#38bdf8" />
              <span>Motor de Vencimientos</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.86rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>Clasificación Dinámica:</strong> EXPIRED, URGENT (≤7d), UPCOMING (8-30d), CURRENT (&gt;30d).</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>Ciclo de Vida:</strong> ACTIVE, COMPLETED, CANCELLED con auditoría de usuario y timestamp.</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div><strong>TanStack Query Cache:</strong> Invalidaciones automáticas tras mutaciones para consistencia total.</div>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>DMT-Soft SaaS © 2026 • Plataforma Profesional de Higiene & Seguridad Laboral</p>
      </footer>
    </main>
  );
}
