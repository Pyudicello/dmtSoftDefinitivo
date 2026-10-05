'use client';

import React, { useState, useEffect } from 'react';
import { Permit, PermitType, CreatePermitPayload, UpdatePermitPayload, PermitStatus } from '@/types';
import { X, Calendar, Award, ShieldCheck, AlertCircle, FileText, Phone, Mail, User } from 'lucide-react';

interface PermitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  companyId: string;
  permitToEdit?: Permit | null;
  isLoading?: boolean;
}

const PERMIT_TYPES: { value: PermitType; label: string }[] = [
  { value: 'MUNICIPAL', label: 'Municipal / Comercial' },
  { value: 'PROVINCIAL', label: 'Provincial / Radicación Industrial' },
  { value: 'FIRE_DEPARTMENT', label: 'Bomberos / Certificado Antisiniestral' },
  { value: 'OTHER', label: 'Otra habilitación / visado oficial' },
];

export function PermitModal({
  isOpen,
  onClose,
  onSubmit,
  companyId,
  permitToEdit,
  isLoading = false,
}: PermitModalProps) {
  const isEditing = !!permitToEdit;

  const [type, setType] = useState<PermitType>('MUNICIPAL');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [permitNumber, setPermitNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [status, setStatus] = useState<PermitStatus>('ACTIVE');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [documentReference, setDocumentReference] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (permitToEdit) {
      setType(permitToEdit.type);
      setIssuingAuthority(permitToEdit.issuingAuthority);
      setPermitNumber(permitToEdit.permitNumber);
      setIssueDate(permitToEdit.issueDate);
      setExpirationDate(permitToEdit.expirationDate);
      setStatus(permitToEdit.status);
      setContactName(permitToEdit.contactName || '');
      setContactPhone(permitToEdit.contactPhone || '');
      setContactEmail(permitToEdit.contactEmail || '');
      setNotes(permitToEdit.notes || '');
      setDocumentReference(permitToEdit.documentReference || '');
    } else {
      setType('MUNICIPAL');
      setIssuingAuthority('');
      setPermitNumber('');
      setIssueDate(new Date().toISOString().split('T')[0]);
      setExpirationDate('');
      setStatus('ACTIVE');
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setNotes('');
      setDocumentReference('');
    }
    setError(null);
  }, [permitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!issuingAuthority.trim()) {
      setError('El organismo emisor es obligatorio');
      return;
    }

    if (!permitNumber.trim()) {
      setError('El número de habilitación o expediente es obligatorio');
      return;
    }

    if (!issueDate) {
      setError('La fecha de emisión es obligatoria');
      return;
    }

    if (!expirationDate) {
      setError('La fecha de vencimiento de habilitación / visado es obligatoria');
      return;
    }

    if (new Date(issueDate) > new Date(expirationDate)) {
      setError('La fecha de emisión no puede ser posterior a la fecha de vencimiento');
      return;
    }

    try {
      if (isEditing) {
        const payload: UpdatePermitPayload = {
          type,
          issuingAuthority: issuingAuthority.trim(),
          permitNumber: permitNumber.trim(),
          issueDate,
          expirationDate,
          status,
          contactName: contactName.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          notes: notes.trim() || undefined,
          documentReference: documentReference.trim() || undefined,
        };
        await onSubmit(payload);
      } else {
        const payload: CreatePermitPayload = {
          companyId,
          type,
          issuingAuthority: issuingAuthority.trim(),
          permitNumber: permitNumber.trim(),
          issueDate,
          expirationDate,
          contactName: contactName.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          notes: notes.trim() || undefined,
          documentReference: documentReference.trim() || undefined,
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err?.errorBody?.message || err?.message || 'Error al guardar la habilitación');
    }
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
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          border: '1px solid var(--border-color)',
        }}
      >
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
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isEditing ? 'Editar Habilitación / Visado' : 'Nueva Habilitación / Visado'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Gestión de permisos legales, certificados de bomberos y visados oficiales.
            </p>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ color: 'var(--text-secondary)' }} disabled={isLoading}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Tipo de Habilitación */}
            <div className="form-group">
              <label className="form-label">
                Tipo de Habilitación <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <select
                className="form-input"
                value={type}
                onChange={(e) => setType(e.target.value as PermitType)}
                required
              >
                {PERMIT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Número / Expediente */}
            <div className="form-group">
              <label className="form-label">
                N° de Habilitación / Expediente <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: HAB-2026-8891 o EXP-1244/2026"
                value={permitNumber}
                onChange={(e) => setPermitNumber(e.target.value)}
                required
                maxLength={100}
              />
            </div>

            {/* Organismo Emisor */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Organismo Emisor / Autoridad de Aplicación <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Municipalidad de Vicente López, Dirección de Bomberos PBA"
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                required
                maxLength={255}
              />
            </div>

            {/* Fecha de Emisión */}
            <div className="form-group">
              <label className="form-label">
                Fecha de Emisión <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>

            {/* Vencimiento de Habilitación / Visado */}
            <div
              className="form-group"
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
              }}
            >
              <label className="form-label" style={{ color: '#7dd3fc', fontWeight: 600 }}>
                Vencimiento de habilitación / visado <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                Fecha hasta la cual la habilitación se encuentra vigente.
              </span>
            </div>

            {/* Estado (solo en edición) */}
            {isEditing && (
              <div className="form-group">
                <label className="form-label">Estado Administrativo</label>
                <select
                  className="form-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PermitStatus)}
                >
                  <option value="ACTIVE">Vigente (Activa)</option>
                  <option value="RENEWED">Renovada (Histórica)</option>
                  <option value="EXPIRED">Vencida</option>
                  <option value="CANCELLED">Anulada / Cancelada</option>
                </select>
              </div>
            )}

            {/* Contact Name */}
            <div className="form-group">
              <label className="form-label">Contacto del Organismo / Gestor</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Lic. Martín Rossi"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                maxLength={150}
              />
            </div>

            {/* Contact Phone */}
            <div className="form-group">
              <label className="form-label">Teléfono de Contacto</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: +54 11 4000-0000"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                maxLength={50}
              />
            </div>

            {/* Contact Email */}
            <div className="form-group">
              <label className="form-label">Email de Contacto</label>
              <input
                type="email"
                className="form-input"
                placeholder="habilitaciones@municipio.gob.ar"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                maxLength={255}
              />
            </div>

            {/* Document Reference */}
            <div className="form-group">
              <label className="form-label">Referencia / Disposición</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Disposición N° 2026/89-A"
                value={documentReference}
                onChange={(e) => setDocumentReference(e.target.value)}
                maxLength={255}
              />
            </div>

            {/* Observaciones */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Notas / Observaciones del Trámite</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Condicionamientos especiales, requisitos de renovación, etc..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

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
            <button type="button" className="btn-refresh" onClick={onClose} disabled={isLoading}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-refresh"
              style={{
                background: 'var(--primary-color, #3b82f6)',
                color: '#fff',
                borderColor: 'transparent',
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Habilitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
