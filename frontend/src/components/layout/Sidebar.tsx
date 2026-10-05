'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { alertService } from '@/services/alert.service';
import {
  Shield,
  LayoutDashboard,
  Building2,
  Clock,
  LogOut,
  X,
  ChevronRight,
  User,
  Users,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();

  // Define navigation items based on role
  const getNavItems = () => {
    const items = [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard size={18} />,
        match: (path: string) => path === '/dashboard',
      },
      {
        label: role === 'CLIENT' ? 'Mi Empresa' : role === 'TECHNICIAN' ? 'Empresas Asignadas' : 'Empresas',
        href: '/companies',
        icon: <Building2 size={18} />,
        match: (path: string) => path.startsWith('/companies'),
      },
      {
        label: 'Vencimientos',
        href: '/expirations',
        icon: <Clock size={18} />,
        match: (path: string) => path.startsWith('/expirations'),
      },
      {
        label: 'Centro de Alertas',
        href: '/alerts',
        icon: <Activity size={18} />,
        match: (path: string) => path.startsWith('/alerts'),
      },
    ];

    if (role === 'CONSULTANT_ADMIN' || role === 'PLATFORM_ADMIN') {
      items.push({
        label: 'Usuarios y Equipo',
        href: '/users',
        icon: <Users size={18} />,
        match: (path: string) => path.startsWith('/users'),
      });
    }

    return items;
  };

  const navItems = getNavItems();

  const { data: alertsData } = useQuery({
    queryKey: queryKeys.alerts.list(),
    queryFn: () => alertService.getAlerts(),
    enabled: !!user,
  });

  const activeAlertsCount = alertsData?.totalCount ?? 0;
  const criticalCount = alertsData?.criticalCount ?? 0;

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
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 40,
          }}
          className="md:hidden"
        />
      )}

      {/* Sidebar Drawer / Fixed Column */}
      <aside
        style={{
          width: '260px',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 50,
          background: '#0d131f',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'transform 0.25s ease-in-out',
        }}
        className={`sidebar-container ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}
      >
        <div>
          {/* Brand Logo Header */}
          <div
            style={{
              padding: '1.25rem 1.25rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Link
              href="/dashboard"
              onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}
            >
              <div className="logo-icon" style={{ width: '34px', height: '34px' }}>
                <Shield size={19} color="#ffffff" />
              </div>
              <div>
                <span className="logo-title" style={{ fontSize: '1.25rem' }}>DMT-Soft</span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="md:hidden"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav Items */}
          <nav style={{ padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', padding: '0 0.5rem 0.4rem' }}>
              Operaciones
            </div>

            {navItems.map((item) => {
              const active = item.match(pathname);
              const isAlerts = item.href === '/alerts';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 400,
                    background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: active ? '#93c5fd' : 'var(--text-secondary)',
                    border: active ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                    transition: 'all 0.15s ease-in-out',
                  }}
                  className="sidebar-link"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ color: active ? '#38bdf8' : 'var(--text-muted)' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {isAlerts && activeAlertsCount > 0 && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.45rem',
                          borderRadius: '9999px',
                          background: criticalCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                          color: criticalCount > 0 ? '#f87171' : '#fb923c',
                          border: `1px solid ${criticalCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(249, 115, 22, 0.4)'}`,
                        }}
                      >
                        {activeAlertsCount}
                      </span>
                    )}
                    {active && <ChevronRight size={14} color="#38bdf8" />}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Identity Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
          {user && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#93c5fd',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  {user.firstName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '0.12rem 0.5rem',
                    borderRadius: '9999px',
                    background: badgeStyle.bg,
                    border: `1px solid ${badgeStyle.border}`,
                    color: badgeStyle.color,
                    fontWeight: 700,
                  }}
                >
                  {user.role}
                </span>

                <button
                  onClick={logout}
                  className="btn-refresh"
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.72rem',
                    borderColor: 'rgba(244, 63, 94, 0.3)',
                    color: '#fb7185',
                  }}
                  title="Cerrar sesión"
                >
                  <LogOut size={12} />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
