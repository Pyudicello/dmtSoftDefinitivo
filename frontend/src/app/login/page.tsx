'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Shield, Lock, Mail, ArrowRight, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const { login, quickLoginAs, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('El correo electrónico es requerido');
      return;
    }
    if (!password) {
      setError('La contraseña es requerida');
      return;
    }

    setSubmitting(true);
    try {
      await login(trimmedEmail, password);
      toast.success('Sesión iniciada correctamente');
      router.push(returnUrl);
    } catch (err: any) {
      setError(err?.errorBody?.message || err?.message || 'Credenciales inválidas o servidor no disponible');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string = 'Demo1234!') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setSubmitting(true);
    try {
      await quickLoginAs(demoEmail, demoPass);
      toast.success(`Conectado como ${demoEmail}`);
      router.push(returnUrl);
    } catch (err: any) {
      setError(err?.errorBody?.message || err?.message || 'Error en inicio rápido');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <RefreshCw size={24} className="animate-spin" color="#38bdf8" />
        <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>Verificando credenciales...</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="card" style={{ maxWidth: '480px', margin: '3rem auto', textAlign: 'center' }}>
        <UserCheck size={44} color="#34d399" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Sesión Activa</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem', fontSize: '0.9rem' }}>
          Has iniciado sesión como <strong>{user.email}</strong> ({user.role})
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-refresh"
          style={{ width: '100%', justifyContent: 'center', padding: '0.7rem', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))', color: '#fff', border: 'none' }}
        >
          <span>Ir al Dashboard</span>
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '520px', margin: '2rem auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="logo-icon" style={{ margin: '0 auto 0.75rem', width: '46px', height: '46px' }}>
            <Shield size={24} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Ingresar a DMT-Soft
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Plataforma SaaS • Higiene & Seguridad Laboral
          </p>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '8px',
              color: '#fda4af',
              fontSize: '0.84rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Correo Electrónico</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@demo.com"
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-refresh"
            style={{
              justifyContent: 'center',
              padding: '0.7rem',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              marginTop: '0.5rem',
            }}
          >
            {submitting ? 'Autenticando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Demo Roles Quick Login Switcher (Local & Development only) */}
        {(process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true' ||
          (process.env.NEXT_PUBLIC_APP_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== 'false')) && (
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem',
              }}
            >
              ⚡ Perfiles de Prueba Rápidos (Dev Only):
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@demo.com', 'Demo1234!')}
                style={{
                  padding: '0.5rem 0.65rem',
                  textAlign: 'left',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  color: '#93c5fd',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700 }}>Consultor Admin</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>admin@demo.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('carlos@demo.com', 'Demo1234!')}
                style={{
                  padding: '0.5rem 0.65rem',
                  textAlign: 'left',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '6px',
                  color: '#fcd34d',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700 }}>Técnico Carlos</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>carlos@demo.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('macro@demo.com', 'Demo1234!')}
                style={{
                  padding: '0.5rem 0.65rem',
                  textAlign: 'left',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '6px',
                  color: '#6ee7b7',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700 }}>Cliente Macro</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>macro@demo.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin.b@demo.com', 'Demo1234!')}
                style={{
                  padding: '0.5rem 0.65rem',
                  textAlign: 'left',
                  background: 'rgba(236, 72, 153, 0.1)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  borderRadius: '6px',
                  color: '#f472b6',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700 }}>Admin Org B</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>admin.b@demo.com</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <RefreshCw size={24} className="animate-spin" color="#38bdf8" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
