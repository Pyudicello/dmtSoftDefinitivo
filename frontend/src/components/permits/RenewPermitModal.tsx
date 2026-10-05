'use client';

import React, { useState, useEffect } from 'react';
import { Permit, RenewPermitPayload } from '@/types';
import { formatDateSpanish } from '@/lib/date-utils';
import { X, RefreshCw, Calendar, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface RenewPermitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (permitId: string, payload: RenewPermitPayload) => Promise<void>;
  permit: Permit | null;
  isLoading?: boolean;
}

export function RenewPermitModal({
  isOpen,
  onClose,
  onSubmit,
  permit,
  isLoading = false,
}: RenewPermitModalProps) {
  const [permitNumber, setPermitNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [documentReference, setDocumentReference] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (permit) {
      setPermitNumber(permit.permitNumber);
      setIssueDate(new Date().toISOString().split('T')[0]);
      setExpirationDate('');
      setIssuingAuthority(permit.issuingAuthority);
      setContactName(permit.contactName || '');
      setContactPhone(permit.contactPhone || '');
      setContactEmail(permit.contactEmail || '');
      setNotes('');
      setDocumentReference('');
    }
    setError(null);
  }, [permit, isOpen]);

  if (!isOpen || !permit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!permitNumber.trim()) {
      setError('El número o expediente del nuevo trámite es obligatorio');
      return;
    }

    if (!issueDate) {
      setError('La nueva fecha de emisión es obligatoria');
      return;
    }

    if (!expirationDate) {
      setError('La nueva fecha de vencimiento de habilitación / visado es obligatoria');
      return;
    }

    if (new Date(issueDate) > new Date(expirationDate)) {
      setError('La fecha de emisión no puede ser posterior a la fecha de vencimiento');
      return;
    }

    try {
      const payload: RenewPermitPayload = {
        permitNumber: permitNumber.trim(),
        issueDate,
        expirationDate,
        issuingAuthority: issuingAuthority.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        notes: notes.trim() || undefined,
        documentReference: documentReference.trim() || undefined,
      };
      await onSubmit(permit.id, payload);
      onClose();
    } catch (err: any) {
      setError(err?.errorBody?.message || err?.message || 'Error al renovar la habilitación');
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
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
              <RefreshCw size={16} />
              <span>Renovación de Habilitación</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
              {permit.issuingAuthority}
            </h2>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ color: 'var(--text-secondary)' }} disabled={isLoading}>
            <X size={20} />
          </button>
        </div>

        {/* Previous Permit Context Card */}
        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Habilitación Actual a Renovar:
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)' }}>
            <div>N°: <strong style={{ color: '#93c5fd' }}>{permit.permitNumber}</strong></div>
            <div>Tipo: <strong>{permit.typeLabel}</strong></div>
            <div>Vencimiento anterior: <strong style={{ color: '#fca5a5' }}>{formatDateSpanish(permit.expirationDate)}</strong></div>
          </div>
          <p style={{ marginTop: '0.4rem', color: '#6ee7b7', fontSize: '0.76rem' }}>
            Al renovar, esta habilitación se archivará como histórico («Renovada») conservando toda su trazabilidad.
          </p>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {/* New Permit Number */}
            <div className="form-group">
              <label className="form-label">
                Nuevo N° / Expediente de Renovación <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={permitNumber}
                onChange={(e) => setPermitNumber(e.target.value)}
                required
                maxLength={100}
              />
            </div>

            {/* Authority */}
            <div className="form-group">
              <label className="form-label">Organismo Emisor</label>
              <input
                type="text"
                className="form-input"
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                maxLength={255}
              />
            </div>

            {/* Issue Date */}
            <div className="form-group">
              <label className="form-label">
                Nueva Fecha de Emisión <span style={{ color: '#f43f5e' }}>*</span>
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
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
              }}
            >
              <label className="form-label" style={{ color: '#6ee7b7', fontWeight: 600 }}>
                Nuevo vencimiento de habilitación / visado <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                Ingresar la nueva vigencia otorgada por el organismo.
              </span>
            </div>

            {/* Document Reference */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Nueva Disposición / Certificado N°</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: DISP-2026-RENOV-45"
                value={documentReference}
                onChange={(e) => setDocumentReference(e.target.value)}
                maxLength={255}
              />
            </div>

            {/* Notes */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Notas de la Renovación</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Observaciones de la renovación..."
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
                background: 'rgba(16, 185, 129, 0.9)',
                color: '#fff',
                borderColor: 'transparent',
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Renovando...' : 'Confirmar Renovación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
