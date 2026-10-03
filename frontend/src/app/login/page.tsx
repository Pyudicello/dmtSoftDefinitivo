'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, quickLoginAs, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/companies');
    } catch (err: any) {
      setError(err?.errorBody?.message || err?.message || 'Error de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string = 'Demo1234!') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoading(true);
    setError(null);
    try {
      await quickLoginAs(demoEmail, demoPass);
      router.push('/companies');
    } catch (err: any) {
      setError(err?.errorBody?.message || err?.message || 'Error en inicio rápido');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center' }}>
        <UserCheck size={48} color="#34d399" style={{ margin: '0 auto 1rem' }} />
        <h2>Sesión Activa</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem' }}>
          Has iniciado sesión como <strong>{user.email}</strong> ({user.role})
        </p>
        <button
          onClick={() => router.push('/companies')}
          className="btn-refresh"
          style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
        >
          <span>Ir a Gestión de Empresas</span>
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '550px', margin: '2rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-icon" style={{ margin: '0 auto 1rem', width: '50px', height: '50px' }}>
            <Shield size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Iniciar Sesión en PREVENIA</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Acceso seguro con token JWT y control multi-tenant
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '8px',
            color: '#fda4af',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              Correo Electrónico
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@demo.com"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-refresh"
            style={{
              justifyContent: 'center',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            {isLoading ? 'Autenticando...' : 'Entrar al Sistema'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            ⚡ Acceso Rápido para Testing de Roles y Multi-Tenancy:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@demo.com', 'Demo1234!')}
              style={{
                padding: '0.5rem',
                textAlign: 'left',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '6px',
                color: '#93c5fd',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 700 }}>Consultora Admin A</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>admin@demo.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('carlos@demo.com', 'Demo1234!')}
              style={{
                padding: '0.5rem',
                textAlign: 'left',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                color: '#fcd34d',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 700 }}>Técnico Carlos</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>carlos@demo.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('macro@demo.com', 'Demo1234!')}
              style={{
                padding: '0.5rem',
                textAlign: 'left',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                color: '#6ee7b7',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 700 }}>Cliente Macro</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>macro@demo.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin.b@demo.com', 'Demo1234!')}
              style={{
                padding: '0.5rem',
                textAlign: 'left',
                background: 'rgba(236, 72, 153, 0.1)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                borderRadius: '6px',
                color: '#f472b6',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 700 }}>Admin Org B (Cross-Tenant)</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>admin.b@demo.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
