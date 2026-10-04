'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Menu, Shield, LogOut } from 'lucide-react';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { user, role, logout } = useAuth();

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
    <header
      style={{
        height: '64px',
        padding: '0 1.5rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(13, 19, 31, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onOpenSidebar}
          className="md:hidden"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Plataforma SaaS • Higiene & Seguridad Laboral
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem' }} className="hidden sm:flex">
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.firstName} {user.lastName}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px',
                  background: badgeStyle.bg,
                  border: `1px solid ${badgeStyle.border}`,
                  color: badgeStyle.color,
                  fontWeight: 700,
                  marginTop: '0.1rem',
                }}
              >
                {user.role}
              </span>
            </div>

            <button
              onClick={logout}
              className="btn-refresh"
              style={{
                padding: '0.35rem 0.65rem',
                borderColor: 'rgba(244, 63, 94, 0.3)',
                color: '#fb7185',
              }}
              title="Cerrar sesión"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
