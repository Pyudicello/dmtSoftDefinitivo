'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  Clock,
  ClipboardCheck,
  Building2,
  BellRing,
  FileCheck2,
  ArrowRight,
  LogIn,
  LayoutDashboard,
  CheckCircle2
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '1.5rem 1.5rem 3rem' }}>
      {/* Top Header with ThemeToggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <ThemeToggle showLabel={true} />
      </div>

      {/* Hero Header */}
      <section className="hero" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          margin: '0 auto 1.5rem',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          border: '3px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 0 35px rgba(239, 68, 68, 0.45)'
        }}>
          <Image src="/logo.png" alt="DMT-Soft Logo" width={100} height={100} priority style={{ objectFit: 'contain' }} />
        </div>

        <div className="hero-subtitle" style={{
          display: 'inline-block',
          marginBottom: '0.85rem',
          fontSize: '0.85rem',
          letterSpacing: '0.08em',
          fontWeight: 700,
          color: 'var(--accent-cyan)'
        }}>
          PLATAFORMA SAAS • HIGIENE & SEGURIDAD LABORAL
        </div>

        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: 800,
          marginBottom: '1rem',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em'
        }}>
          DMT-Soft
        </h1>

        <p style={{
          maxWidth: '720px',
          margin: '0 auto 2rem',
          color: 'var(--text-secondary)',
          fontSize: '1.15rem',
          lineHeight: 1.6
        }}>
          Plataforma integral para consultoras y profesionales. Control proactivo de obligaciones normativas, auditoría de vencimientos y gestión centralizada de clientes.
        </p>

        {/* Enhanced High-Contrast CTA Button */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              padding: '0.9rem 2.2rem',
              fontSize: '1.05rem',
              fontWeight: 700,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 50%, #2563eb 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 25px rgba(6, 182, 212, 0.5), 0 0 15px rgba(2, 132, 199, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            <LogIn size={20} color="#ffffff" />
            <span>Ingresar a DMT-Soft</span>
            <ArrowRight size={20} color="#ffffff" />
          </Link>

          {isAuthenticated && (
            <Link
              href="/dashboard"
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                padding: '0.9rem 1.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '10px',
              }}
            >
              <LayoutDashboard size={18} />
              <span>Ir al Dashboard</span>
            </Link>
          )}
        </div>
      </section>

      {/* Single Comprehensive Client-Facing Feature Card */}
      <section style={{ marginBottom: '3rem' }}>
        <div className="card" style={{
          padding: '2.25rem',
          background: 'var(--landing-card-bg)',
          border: '1px solid var(--border-accent)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: 'var(--accent-cyan)',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem'
            }}>
              <ShieldCheck size={16} />
              <span>¿Qué ofrece DMT-Soft a tu empresa?</span>
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Control Total y Cumplimiento Normativo en Higiene & Seguridad
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.4rem', maxWidth: '680px', margin: '0.4rem auto 0' }}>
              Una solución centralizada para garantizar que ninguna obligación legal, técnica o preventiva quede desatendida.
            </p>
          </div>

          <div className="landing-grid-2x2">
            {/* Feature 1 */}
            <div style={{
              padding: '1.25rem',
              background: 'var(--landing-inner-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.6rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)'
                }}>
                  <Clock size={20} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Control de Vencimientos
                </h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                Seguimiento continuo de matafuegos, capacitaciones, coberturas de ART, protocolos de medición y análisis periódicos con semáforos temporales automáticos.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{
              padding: '1.25rem',
              background: 'var(--landing-inner-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.6rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(249, 115, 22, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fb923c'
                }}>
                  <BellRing size={20} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Alertas y Prevención
                </h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                Notificaciones priorizadas por urgencia (críticas, próximas y vigentes) para anticiparse a los plazos legales y evitar sanciones o clausuras.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{
              padding: '1.25rem',
              background: 'var(--landing-inner-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.6rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(52, 211, 153, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399'
                }}>
                  <ClipboardCheck size={20} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Auditoría e Inspecciones
                </h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                Registro digital y trazabilidad de visitas a planta, habilitaciones técnicas y controles periódicos por establecimiento con historial detallado.
              </p>
            </div>

            {/* Feature 4 */}
            <div style={{
              padding: '1.25rem',
              background: 'var(--landing-inner-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.6rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c084fc'
                }}>
                  <Building2 size={20} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Portal para Clientes
                </h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                Acceso dedicado y seguro para que las empresas clientes consulten su estado de cumplimiento, cronograma de visitas y documentación 100% al día.
              </p>
            </div>
          </div>

          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            fontSize: '0.84rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="#34d399" />
              <span>Aislamiento seguro multi-empresa</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="#34d399" />
              <span>Acceso en la nube 24/7</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="#34d399" />
              <span>Trazabilidad y auditoría completa</span>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '1.5rem 0 2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>DMT-Soft SaaS © 2026 • Consultores - Servicios Integrales</p>
      </footer>
    </main>
  );
}

