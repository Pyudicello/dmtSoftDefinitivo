'use client';

import React, { useState, useEffect } from 'react';
import { Inspection, InspectionType, CreateInspectionPayload, UpdateInspectionPayload } from '@/types';
import { X, Calendar, User, Phone, Mail, FileText, CheckCircle2, Building, AlertCircle } from 'lucide-react';

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  companyId: string;
  inspectionToEdit?: Inspection | null;
  isLoading?: boolean;
}

const INSPECTION_TYPES: { value: InspectionType; label: string }[] = [
  { value: 'ART', label: 'ART (Aseguradora de Riesgos del Trabajo)' },
  { value: 'MUNICIPAL', label: 'Municipal / Bromatología / Obras' },
  { value: 'PROVINCIAL', label: 'Provincial / Ministerio de Trabajo / OPDS' },
  { value: 'HYGIENE_SAFETY_SERVICE', label: 'Servicio de Higiene y Seguridad' },
  { value: 'OTHER', label: 'Otro organismo de control' },
];

export function InspectionModal({
  isOpen,
  onClose,
  onSubmit,
  companyId,
  inspectionToEdit,
  isLoading = false,
}: InspectionModalProps) {
  const isEditing = !!inspectionToEdit;

  const [type, setType] = useState<InspectionType>('ART');
  const [visitDate, setVisitDate] = useState('');
  const [authority, setAuthority] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [result, setResult] = useState('');
  const [notes, setNotes] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [documentReference, setDocumentReference] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (inspectionToEdit) {
      setType(inspectionToEdit.type);
      setVisitDate(inspectionToEdit.visitDate);
      setAuthority(inspectionToEdit.authority);
      setContactName(inspectionToEdit.contactName || '');
      setContactPhone(inspectionToEdit.contactPhone || '');
      setContactEmail(inspectionToEdit.contactEmail || '');
      setResult(inspectionToEdit.result || '');
      setNotes(inspectionToEdit.notes || '');
      setNextVisitDate(inspectionToEdit.nextVisitDate || '');
      setDocumentReference(inspectionToEdit.documentReference || '');
    } else {
      setType('ART');
      setVisitDate(new Date().toISOString().split('T')[0]);
      setAuthority('');
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setResult('');
      setNotes('');
      setNextVisitDate('');
      setDocumentReference('');
    }
    setError(null);
  }, [inspectionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!authority.trim()) {
      setError('El organismo o autoridad es obligatorio');
      return;
    }

    if (!visitDate) {
      setError('La fecha de la visita es obligatoria');
      return;
    }

    try {
      if (isEditing) {
        const payload: UpdateInspectionPayload = {
          type,
          visitDate,
          authority: authority.trim(),
          contactName: contactName.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          result: result.trim() || undefined,
          notes: notes.trim() || undefined,
          nextVisitDate: nextVisitDate || undefined,
          documentReference: documentReference.trim() || undefined,
        };
        await onSubmit(payload);
      } else {
        const payload: CreateInspectionPayload = {
          companyId,
          type,
          visitDate,
          authority: authority.trim(),
          contactName: contactName.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          result: result.trim() || undefined,
          notes: notes.trim() || undefined,
          nextVisitDate: nextVisitDate || undefined,
          documentReference: documentReference.trim() || undefined,
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err?.errorBody?.message || err?.message || 'Error al guardar la inspección');
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
              {isEditing ? 'Editar Visita / Inspección' : 'Registrar Nueva Visita / Inspección'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Registro de actas, auditorías y visitas de organismos oficiales.
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ color: 'var(--text-secondary)' }}
            disabled={isLoading}
          >
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
            {/* Tipo de Inspección */}
            <div className="form-group">
              <label className="form-label">
                Tipo de Inspección / Organismo <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <select
                className="form-input"
                value={type}
                onChange={(e) => setType(e.target.value as InspectionType)}
                required
              >
                {INSPECTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha de Visita */}
            <div className="form-group">
              <label className="form-label">
                Fecha de la Visita <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                required
              />
            </div>

            {/* Organismo / Autoridad */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Organismo / Autoridad Interviniente <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Prevención ART, Municipalidad de Córdoba, Ministerio de Trabajo"
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                required
                maxLength={255}
              />
            </div>

            {/* Contact Name */}
            <div className="form-group">
              <label className="form-label">Nombre del Inspector / Contacto</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Ing. Juan Pérez"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  maxLength={150}
                />
              </div>
            </div>

            {/* Contact Phone */}
            <div className="form-group">
              <label className="form-label">Teléfono de Contacto</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: +54 11 4455-6677"
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
                placeholder="inspector@organismo.gob.ar"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                maxLength={255}
              />
            </div>

            {/* Document Reference */}
            <div className="form-group">
              <label className="form-label">N° de Acta / Ref. Documental</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Acta N° 8492/2026"
                value={documentReference}
                onChange={(e) => setDocumentReference(e.target.value)}
                maxLength={255}
              />
            </div>

            {/* Resultado / Conclusiones */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Resultado / Conclusiones de la Visita</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Detalle de observaciones, no conformidades o estado de cumplimiento..."
                value={result}
                onChange={(e) => setResult(e.target.value)}
              />
            </div>

            {/* Notas Generales */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Notas Adicionales / Acuerdos</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Plazos de adecuación, compromisos asumidos o notas internas..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Próxima Visita (Integración con Motor de Expirations) */}
            <div
              className="form-group"
              style={{
                gridColumn: '1 / -1',
                padding: '1rem',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Calendar size={18} color="#818cf8" />
                <label className="form-label" style={{ margin: 0, color: '#c7d2fe', fontWeight: 600 }}>
                  Próxima Visita / Inspección Programada
                </label>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Si se acuerda una fecha futura, DMT-Soft la integrará automáticamente al calendario, dashboard, alertas y listado general de vencimientos técnicos.
              </p>
              <input
                type="date"
                className="form-input"
                value={nextVisitDate}
                onChange={(e) => setNextVisitDate(e.target.value)}
                style={{ maxWidth: '240px' }}
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
            <button
              type="button"
              className="btn-refresh"
              onClick={onClose}
              disabled={isLoading}
            >
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
              {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Visita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
