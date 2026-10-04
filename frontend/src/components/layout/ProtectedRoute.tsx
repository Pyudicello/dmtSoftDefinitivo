'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppLayout } from './AppLayout';
import { UserRole } from '@/types';
import { RefreshCw, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, role } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          gap: '1rem',
        }}
      >
        <RefreshCw size={28} className="animate-spin" color="#38bdf8" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Verificando sesión en PREVENIA...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <AppLayout>
        <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
          <ShieldAlert size={48} color="#f43f5e" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ color: '#fb7185', fontSize: '1.4rem', fontWeight: 700 }}>
            Acceso No Autorizado (403 Forbidden)
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.75rem 0 1.5rem', fontSize: '0.9rem' }}>
            Tu usuario con rol <strong>{role}</strong> no tiene permisos para acceder a esta sección del sistema.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link href="/dashboard" className="btn-refresh" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={14} />
              <span>Volver al Dashboard</span>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
