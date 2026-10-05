'use client';

import React from 'react';
import { Inspection } from '@/types';
import { formatDateSpanish } from '@/lib/date-utils';
import { ExpirationStatusBadge } from '@/components/ui/ExpirationStatusBadge';
import {
  X,
  Building,
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  Clock,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface InspectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: Inspection | null;
  onEdit?: (inspection: Inspection) => void;
  onDelete?: (inspection: Inspection) => void;
  canManage?: boolean;
}

export function InspectionDetailModal({
  isOpen,
  onClose,
  inspection,
  onEdit,
  onDelete,
  canManage = false,
}: InspectionDetailModalProps) {
  if (!isOpen || !inspection) return null;

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span
                style={{
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                {inspection.typeLabel}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {formatDateSpanish(inspection.visitDate)}
              </span>
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {inspection.authority}
            </h2>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Linked Next Visit Banner */}
          {inspection.nextVisitDate && (
            <div
              style={{
                padding: '0.85rem 1rem',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c7d2fe', fontWeight: 600, fontSize: '0.88rem' }}>
                  <Calendar size={16} />
                  <span>Próxima Visita / Inspección Programada</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Fecha: <strong>{formatDateSpanish(inspection.nextVisitDate)}</strong>
                  {inspection.nextVisitDaysRemaining !== undefined && inspection.nextVisitDaysRemaining !== null && (
                    <span style={{ marginLeft: '0.5rem' }}>
                      ({inspection.nextVisitDaysRemaining > 0
                        ? `en ${inspection.nextVisitDaysRemaining} días`
                        : inspection.nextVisitDaysRemaining === 0
                        ? 'vence hoy'
                        : `venció hace ${Math.abs(inspection.nextVisitDaysRemaining)} días`})
                    </span>
                  )}
                </div>
              </div>

              {inspection.nextVisitDeadlineStatus && (
                <ExpirationStatusBadge
                  deadlineStatus={inspection.nextVisitDeadlineStatus}
                  lifecycleStatus="ACTIVE"
                  daysUntilExpiration={inspection.nextVisitDaysRemaining}
                />
              )}
            </div>
          )}

          {/* Contact Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Inspector / Contacto</span>
              <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {inspection.contactName || 'No especificado'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Teléfono</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {inspection.contactPhone || '—'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {inspection.contactEmail || '—'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>N° de Acta / Ref.</span>
              <p style={{ fontSize: '0.9rem', color: '#93c5fd', marginTop: '0.15rem', fontFamily: 'monospace' }}>
                {inspection.documentReference || '—'}
              </p>
            </div>
          </div>

          {/* Resultado / Conclusiones */}
          {inspection.result && (
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#93c5fd', marginBottom: '0.35rem' }}>
                Resultado / Conclusiones de la Inspección
              </h4>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.88rem',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {inspection.result}
              </div>
            </div>
          )}

          {/* Notas */}
          {inspection.notes && (
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Observaciones y Notas Adicionales
              </h4>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {inspection.notes}
              </div>
            </div>
          )}

          {/* Audit Info */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
            Registrado el {new Date(inspection.createdAt).toLocaleString()}
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
          }}
        >
          {canManage && onDelete ? (
            <button
              onClick={() => onDelete(inspection)}
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

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {canManage && onEdit && (
              <button
                onClick={() => onEdit(inspection)}
                className="btn-refresh"
                style={{ fontSize: '0.8rem' }}
              >
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
