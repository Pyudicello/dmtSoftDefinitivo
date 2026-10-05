'use client';

import React from 'react';
import { Permit } from '@/types';
import { formatDateSpanish } from '@/lib/date-utils';
import { ExpirationStatusBadge } from '@/components/ui/ExpirationStatusBadge';
import {
  X,
  Award,
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  Clock,
  Edit2,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  History,
} from 'lucide-react';

interface PermitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  permit: Permit | null;
  onEdit?: (permit: Permit) => void;
  onRenew?: (permit: Permit) => void;
  onCancel?: (permit: Permit) => void;
  onDelete?: (permit: Permit) => void;
  canManage?: boolean;
}

export function PermitDetailModal({
  isOpen,
  onClose,
  permit,
  onEdit,
  onRenew,
  onCancel,
  onDelete,
  canManage = false,
}: PermitDetailModalProps) {
  if (!isOpen || !permit) return null;

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
          maxWidth: '650px',
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
            alignItems: 'flex-start',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#7dd3fc',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                {permit.typeLabel}
              </span>
              <span className={`status-badge status-${permit.status.toLowerCase()}`}>
                {permit.statusLabel}
              </span>
              {permit.previousPermitNumber && (
                <span
                  style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <History size={11} />
                  <span>Renovación de N° {permit.previousPermitNumber}</span>
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {permit.issuingAuthority}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#93c5fd', fontFamily: 'monospace', marginTop: '0.2rem' }}>
              N° / Expediente: {permit.permitNumber}
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Validity & Deadline Badge Card */}
          <div
            style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Vencimiento de habilitación / visado
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {formatDateSpanish(permit.expirationDate)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Emisión original: <strong>{formatDateSpanish(permit.issueDate)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
              {permit.status === 'ACTIVE' && permit.deadlineStatus && (
                <ExpirationStatusBadge
                  deadlineStatus={permit.deadlineStatus}
                  lifecycleStatus="ACTIVE"
                  daysUntilExpiration={permit.daysUntilExpiration}
                />
              )}
              {permit.status === 'RENEWED' && (
                <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Renovación completada</span>
              )}
            </div>
          </div>

          {/* Contact Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Contacto / Gestor</span>
              <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {permit.contactName || 'No especificado'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Teléfono</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {permit.contactPhone || '—'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {permit.contactEmail || '—'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Referencia / Disposición</span>
              <p style={{ fontSize: '0.9rem', color: '#93c5fd', marginTop: '0.15rem', fontFamily: 'monospace' }}>
                {permit.documentReference || '—'}
              </p>
            </div>
          </div>

          {/* Observaciones */}
          {permit.notes && (
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Observaciones del Trámite
              </h4>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {permit.notes}
              </div>
            </div>
          )}

          {/* Audit Info */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
            Registrado el {new Date(permit.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          {canManage && onDelete ? (
            <button
              onClick={() => onDelete(permit)}
              className="btn-refresh"
              style={{
                color: '#f87171',
                borderColor: 'rgba(248, 113, 113, 0.3)',
                background: 'rgba(248, 113, 113, 0.1)',
                fontSize: '0.8rem',
              }}
            >
              <Trash2 size={14} />
              <span>Eliminar</span>
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {canManage && permit.status === 'ACTIVE' && onRenew && (
              <button
                onClick={() => onRenew(permit)}
                className="btn-refresh"
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  fontSize: '0.8rem',
                }}
              >
                <RefreshCw size={14} />
                <span>Renovar Habilitación</span>
              </button>
            )}

            {canManage && onEdit && (
              <button onClick={() => onEdit(permit)} className="btn-refresh" style={{ fontSize: '0.8rem' }}>
                <Edit2 size={14} />
                <span>Editar</span>
              </button>
            )}

            <button onClick={onClose} className="btn-refresh" style={{ fontSize: '0.8rem' }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
