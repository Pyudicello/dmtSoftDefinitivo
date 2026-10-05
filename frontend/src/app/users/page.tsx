'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/user.service';
import { companyService } from '@/services/company.service';
import { queryKeys } from '@/lib/query-keys';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CreateUserModal } from '@/components/users/CreateUserModal';
import { CreateUserPayload, User, UserRole } from '@/types';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Mail,
  Shield,
  Wrench,
  Building2,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Filter
} from 'lucide-react';

function UsersContent() {
  const { role: callerRole } = useAuth();
  const queryClient = useQueryClient();

  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pageSize = 50;

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.users.list(roleFilter === 'ALL' ? undefined : roleFilter, page, pageSize),
    queryFn: () => userService.getUsers(roleFilter === 'ALL' ? undefined : roleFilter, page, pageSize),
  });

  // Query companies to resolve company names for CLIENT users
  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'all-lookup'],
    queryFn: () => companyService.getCompanies(0, 100),
  });

  const companyMap = React.useMemo(() => {
    const map = new Map<string, string>();
    companiesData?.content?.forEach((c) => {
      map.set(c.id, c.businessName);
    });
    return map;
  }, [companiesData]);

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.createUser(payload),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.technicians() });
      setSuccessMessage(`Usuario ${newUser.firstName} ${newUser.lastName} (${newUser.email}) creado exitosamente.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    },
  });

  const users = data?.content;
  const totalElements = data?.totalElements || 0;

  // Filter users by client search text
  const filteredUsers = React.useMemo(() => {
    const list = users || [];
    if (!search.trim()) return list;
    const s = search.toLowerCase().trim();
    return list.filter((u) => {
      const name = `${u.firstName} ${u.lastName}`.toLowerCase();
      const email = u.email.toLowerCase();
      const companyName = u.companyId ? (companyMap.get(u.companyId) || '').toLowerCase() : '';
      return name.includes(s) || email.includes(s) || companyName.includes(s);
    });
  }, [users, search, companyMap]);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return {
          label: 'Platform Admin',
          icon: <Shield size={13} />,
          bg: 'rgba(168, 85, 247, 0.15)',
          border: 'rgba(168, 85, 247, 0.35)',
          color: '#c084fc',
        };
      case 'CONSULTANT_ADMIN':
        return {
          label: 'Admin Consultora',
          icon: <Shield size={13} />,
          bg: 'rgba(59, 130, 246, 0.15)',
          border: 'rgba(59, 130, 246, 0.35)',
          color: '#93c5fd',
        };
      case 'TECHNICIAN':
        return {
          label: 'Técnico / Inspector',
          icon: <Wrench size={13} />,
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.35)',
          color: '#fcd34d',
        };
      case 'CLIENT':
        return {
          label: 'Cliente',
          icon: <Building2 size={13} />,
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.35)',
          color: '#6ee7b7',
        };
      default:
        return {
          label: role,
          icon: <Users size={13} />,
          bg: 'rgba(156, 163, 175, 0.15)',
          border: 'rgba(156, 163, 175, 0.35)',
          color: '#d1d5db',
        };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const isAccessForbidden = callerRole !== 'PLATFORM_ADMIN' && callerRole !== 'CONSULTANT_ADMIN';

  if (isAccessForbidden) {
    return (
      <EmptyState
        icon={<ShieldAlert size={48} color="#f43f5e" />}
        title="Acceso Restringido"
        description="Solo los administradores de la consultora o de plataforma pueden gestionar usuarios y equipo de trabajo."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Gestión de Usuarios y Equipo"
        subtitle="Administra técnicos de campo, inspectores, usuarios clientes y roles de acceso."
        icon={<Users size={24} />}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Usuarios y Equipo' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={() => refetch()}
              className="btn-refresh"
              title="Actualizar listado"
              disabled={isFetching}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              <span>{isFetching ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-refresh"
              style={{
                background: 'var(--primary-color, #3b82f6)',
                color: '#fff',
                borderColor: 'transparent',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <UserPlus size={15} />
              <span>Nuevo Usuario</span>
            </button>
          </div>
        }
      />

      {/* Success Notification Banner */}
      {successMessage && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '8px',
            color: '#6ee7b7',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <CheckCircle2 size={18} color="#34d399" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Role Filter Tabs & Search Filter Bar */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setRoleFilter('ALL')}
              className="btn-refresh"
              style={{
                fontSize: '0.82rem',
                background: roleFilter === 'ALL' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                borderColor: roleFilter === 'ALL' ? '#3b82f6' : 'var(--border-color)',
                color: roleFilter === 'ALL' ? '#93c5fd' : 'var(--text-secondary)',
                fontWeight: roleFilter === 'ALL' ? 700 : 400,
              }}
            >
              Todos los Usuarios
            </button>
            <button
              onClick={() => setRoleFilter('TECHNICIAN')}
              className="btn-refresh"
              style={{
                fontSize: '0.82rem',
                background: roleFilter === 'TECHNICIAN' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                borderColor: roleFilter === 'TECHNICIAN' ? '#f59e0b' : 'var(--border-color)',
                color: roleFilter === 'TECHNICIAN' ? '#fcd34d' : 'var(--text-secondary)',
                fontWeight: roleFilter === 'TECHNICIAN' ? 700 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Wrench size={13} />
              <span>Técnicos / Inspectores</span>
            </button>
            <button
              onClick={() => setRoleFilter('CLIENT')}
              className="btn-refresh"
              style={{
                fontSize: '0.82rem',
                background: roleFilter === 'CLIENT' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                borderColor: roleFilter === 'CLIENT' ? '#10b981' : 'var(--border-color)',
                color: roleFilter === 'CLIENT' ? '#6ee7b7' : 'var(--text-secondary)',
                fontWeight: roleFilter === 'CLIENT' ? 700 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Building2 size={13} />
              <span>Clientes</span>
            </button>
            <button
              onClick={() => setRoleFilter('CONSULTANT_ADMIN')}
              className="btn-refresh"
              style={{
                fontSize: '0.82rem',
                background: roleFilter === 'CONSULTANT_ADMIN' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                borderColor: roleFilter === 'CONSULTANT_ADMIN' ? '#3b82f6' : 'var(--border-color)',
                color: roleFilter === 'CONSULTANT_ADMIN' ? '#93c5fd' : 'var(--text-secondary)',
                fontWeight: roleFilter === 'CONSULTANT_ADMIN' ? 700 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Shield size={13} />
              <span>Administradores</span>
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <input
              type="text"
              placeholder="Buscar por nombre, email o empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.4rem', fontSize: '0.85rem' }}
            />
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : isError ? (
        <ErrorState
          title="Error al cargar usuarios"
          message="No se pudieron recuperar los usuarios del servidor."
          onRetry={() => refetch()}
        />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title={search ? 'No se encontraron resultados' : 'No hay usuarios registrados'}
          description={
            search
              ? 'Intenta modificando el término de búsqueda o el filtro de rol.'
              : 'Empieza dando de alta técnicos para tu equipo o accesos para clientes de empresas.'
          }
          action={
            !search ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-refresh"
                style={{
                  background: 'var(--primary-color, #3b82f6)',
                  color: '#fff',
                  borderColor: 'transparent',
                  fontWeight: 600,
                  marginTop: '0.5rem',
                }}
              >
                <UserPlus size={15} />
                <span>Crear Primer Usuario</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Usuario / Nombre
                  </th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Rol en Sistema
                  </th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Ámbito / Empresa
                  </th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Estado
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Fecha Alta
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const badge = getRoleBadge(u.role);
                  const clientCompanyName = u.companyId ? companyMap.get(u.companyId) || 'Empresa asignada' : null;

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease',
                      }}
                      className="table-row-hover"
                    >
                      {/* Name & Email */}
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: badge.bg,
                              border: `1px solid ${badge.border}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: badge.color,
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              flexShrink: 0,
                            }}
                          >
                            {u.firstName.charAt(0).toUpperCase()}
                            {u.lastName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                              {u.firstName} {u.lastName}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Mail size={12} />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.color,
                          }}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Scope / Company */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {u.role === 'CLIENT' && clientCompanyName ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.83rem', color: '#6ee7b7' }}>
                            <Building2 size={14} />
                            <span style={{ fontWeight: 500 }}>{clientCompanyName}</span>
                          </div>
                        ) : u.role === 'TECHNICIAN' ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Empresas asignadas por consultora
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Toda la Consultora
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.73rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: u.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(156, 163, 175, 0.12)',
                            color: u.status === 'ACTIVE' ? '#34d399' : '#9ca3af',
                            border: `1px solid ${u.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(156, 163, 175, 0.3)'}`,
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: u.status === 'ACTIVE' ? '#10b981' : '#9ca3af',
                            }}
                          />
                          <span>{u.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</span>
                        </span>
                      </td>

                      {/* Created Date */}
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} />
                          <span>{formatDate(u.createdAt)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.01)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>Mostrando {filteredUsers.length} de {totalElements} usuarios</span>
            <span>PREVENIA Multi-Tenant Security</span>
          </div>
        </div>
      )}

      {/* Modal for creating a new user */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data) => {
          await createUserMutation.mutateAsync(data);
        }}
        isLoading={createUserMutation.isPending}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'CONSULTANT_ADMIN']}>
      <UsersContent />
    </ProtectedRoute>
  );
}
