'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreateUserPayload, UserRole } from '@/types';
import { companyService } from '@/services/company.service';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Shield,
  Wrench,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserPayload) => Promise<void>;
  isLoading?: boolean;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateUserModalProps) {
  const { role: callerRole } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('TECHNICIAN');
  const [companyId, setCompanyId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch companies for client assignment
  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'all-selector'],
    queryFn: () => companyService.getCompanies(0, 100),
    enabled: isOpen && selectedRole === 'CLIENT',
  });

  const companies = companiesData?.content || [];

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let generated = 'Prev!';
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!lastName.trim()) {
      setError('El apellido es obligatorio');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Ingrese un correo electrónico válido');
      return;
    }

    if (!password || password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (selectedRole === 'CLIENT' && !companyId) {
      setError('Debe seleccionar la empresa asignada para el usuario cliente');
      return;
    }

    try {
      const payload: CreateUserPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: selectedRole,
        companyId: selectedRole === 'CLIENT' ? companyId : undefined,
      };

      await onSubmit(payload);
      handleClose();
    } catch (err: any) {
      const serverMsg = err?.errorBody?.message || err?.message || 'Error al crear el usuario';
      if (serverMsg.includes('already exists') || serverMsg.includes('Duplicate')) {
        setError('Ya existe un usuario registrado con este correo electrónico.');
      } else {
        setError(serverMsg);
      }
    }
  };

  const handleClose = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setSelectedRole('TECHNICIAN');
    setCompanyId('');
    setError(null);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <UserPlus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Nuevo Usuario
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Da de alta a técnicos de tu equipo o accesos de clientes.
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="btn-icon" style={{ color: 'var(--text-secondary)' }} disabled={isLoading}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Nombre */}
            <div className="form-group">
              <label className="form-label">
                Nombre <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Laura"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                maxLength={100}
              />
            </div>

            {/* Apellido */}
            <div className="form-group">
              <label className="form-label">
                Apellido <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Gómez"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                maxLength={100}
              />
            </div>

            {/* Correo Electrónico */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Correo Electrónico (Usuario de acceso) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="laura.gomez@consultora.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={150}
                />
                <Mail
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

            {/* Contraseña Inicial */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Contraseña Inicial <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#60a5fa',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.1rem 0.3rem',
                  }}
                >
                  <RefreshCw size={11} />
                  <span>Generar segura</span>
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '2.4rem', paddingRight: '2.5rem' }}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Rol de Usuario */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Rol del Usuario en el Sistema <span style={{ color: '#f43f5e' }}>*</span>
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '0.75rem',
                  marginTop: '0.35rem',
                }}
              >
                {/* TECHNICIAN Card */}
                <div
                  onClick={() => setSelectedRole('TECHNICIAN')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: `1.5px solid ${selectedRole === 'TECHNICIAN' ? '#f59e0b' : 'var(--border-color)'}`,
                    background: selectedRole === 'TECHNICIAN' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <Wrench size={16} color={selectedRole === 'TECHNICIAN' ? '#f59e0b' : 'var(--text-secondary)'} />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: selectedRole === 'TECHNICIAN' ? '#fbbf24' : 'var(--text-primary)' }}>
                      Técnico / Inspector
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3 }}>
                    Audita, gestiona vencimientos y visitas en empresas asignadas.
                  </p>
                </div>

                {/* CLIENT Card */}
                <div
                  onClick={() => setSelectedRole('CLIENT')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: `1.5px solid ${selectedRole === 'CLIENT' ? '#10b981' : 'var(--border-color)'}`,
                    background: selectedRole === 'CLIENT' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <Building2 size={16} color={selectedRole === 'CLIENT' ? '#10b981' : 'var(--text-secondary)'} />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: selectedRole === 'CLIENT' ? '#34d399' : 'var(--text-primary)' }}>
                      Cliente / Empresa
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3 }}>
                    Acceso exclusivo para visualizar el estado de su propia empresa.
                  </p>
                </div>

                {/* CONSULTANT_ADMIN (Solo si caller es PLATFORM_ADMIN) */}
                {callerRole === 'PLATFORM_ADMIN' && (
                  <div
                    onClick={() => setSelectedRole('CONSULTANT_ADMIN')}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${selectedRole === 'CONSULTANT_ADMIN' ? '#3b82f6' : 'var(--border-color)'}`,
                      background: selectedRole === 'CONSULTANT_ADMIN' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <Shield size={16} color={selectedRole === 'CONSULTANT_ADMIN' ? '#3b82f6' : 'var(--text-secondary)'} />
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: selectedRole === 'CONSULTANT_ADMIN' ? '#60a5fa' : 'var(--text-primary)' }}>
                        Admin Consultora
                      </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3 }}>
                      Control total sobre empresas y técnicos de la consultora.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Empresa Asignada (Obligatorio si es CLIENT) */}
            {selectedRole === 'CLIENT' && (
              <div
                className="form-group"
                style={{
                  gridColumn: '1 / -1',
                  background: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '0.85rem',
                  borderRadius: '8px',
                }}
              >
                <label className="form-label" style={{ color: '#6ee7b7', fontWeight: 600 }}>
                  Empresa del Cliente <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <select
                  className="form-input"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  required
                >
                  <option value="">-- Seleccione una empresa --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} {c.taxId ? `(${c.taxId})` : ''}
                    </option>
                  ))}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                  <Info size={13} color="#34d399" />
                  <span>Este usuario sólo podrá visualizar los datos correspondientes a la empresa seleccionada.</span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button type="button" className="btn-refresh" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </button>
            <button
              type="submit"
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
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Creando usuario...</span>
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Crear Usuario</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
