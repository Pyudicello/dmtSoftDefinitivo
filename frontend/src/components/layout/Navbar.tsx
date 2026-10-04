'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Shield, Building2, LogOut, LogIn, User as UserIcon, Activity, Clock } from 'lucide-react';

export function Navbar() {
  const { user, role, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const getRoleBadgeStyle = (r: string | null) => {
    switch (r) {
      case 'PLATFORM_ADMIN':
        return { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)', color: '#c084fc' };
      case 'CONSULTANT_ADMIN':
        return { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', color: '#93c5fd' };
      case 'TECHNICIAN':
        return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', color: '#fcd34d' };
      case 'CLIENT':
        return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', border: 'rgba(156, 163, 175, 0.3)', color: '#d1d5db' };
    }
  };

  const badgeStyle = getRoleBadgeStyle(role);

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 0',
      marginBottom: '2rem',
      borderBottom: '1px solid var(--border-color)',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div className="logo-icon">
            <Shield size={22} color="#ffffff" />
          </div>
          <div>
            <span className="logo-title">PREVENIA</span>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            href="/"
            style={{
              color: pathname === '/' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: pathname === '/' ? 600 : 400,
              textDecoration: 'none',
              fontSize: '0.9rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              background: pathname === '/' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            }}
          >
            Inicio
          </Link>
          <Link
            href="/companies"
            style={{
              color: pathname.startsWith('/companies') ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: pathname.startsWith('/companies') ? 600 : 400,
              textDecoration: 'none',
              fontSize: '0.9rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              background: pathname.startsWith('/companies') ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Building2 size={16} />
            <span>Empresas</span>
          </Link>
          <Link
            href="/expirations"
            style={{
              color: pathname.startsWith('/expirations') ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: pathname.startsWith('/expirations') ? 600 : 400,
              textDecoration: 'none',
              fontSize: '0.9rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              background: pathname.startsWith('/expirations') ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Clock size={16} />
            <span>Vencimientos</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.firstName} {user.lastName}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px',
                  background: badgeStyle.bg,
                  border: `1px solid ${badgeStyle.border}`,
                  color: badgeStyle.color,
                  fontWeight: 700,
                  marginTop: '0.15rem'
                }}
              >
                {user.role}
              </span>
            </div>

            <button
              onClick={logout}
              className="btn-refresh"
              style={{ padding: '0.35rem 0.75rem', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fb7185' }}
              title="Cerrar sesión"
            >
              <LogOut size={14} />
              <span>Salir</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="btn-refresh"
            style={{ textDecoration: 'none', background: 'rgba(59, 130, 246, 0.25)', color: '#ffffff' }}
          >
            <LogIn size={14} />
            <span>Iniciar Sesión</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
