'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { expirationService } from '@/services/expiration.service';
import { Expiration, ExpirationCategory, UpdateExpirationPayload } from '@/types';
import { Clock, ArrowLeft, Edit2, ShieldAlert, AlertCircle, Save } from 'lucide-react';

export default function EditExpirationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const expirationId = resolvedParams.id;
  const router = useRouter();

  const { user, role, isAuthenticated, isLoading: authLoading } = useAuth();
  const [categories, setCategories] = useState<ExpirationCategory[]>([]);
  const [expiration, setExpiration] = useState<Expiration | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        expirationService.getExpirationById(expirationId),
        expirationService.getCategories()
      ])
        .then(([exp, catList]) => {
          setExpiration(exp);
          setCategories(catList || []);
          setCategoryId(exp.category.id);
          setTitle(exp.title);
          setDescription(exp.description || '');
          setIssueDate(exp.issueDate || '');
          setExpirationDate(exp.expirationDate);
          setResponsibleUserId(exp.responsible?.id || '');
          setNotes(exp.notes || '');
        })
        .catch((err: any) => {
          setError(err?.errorBody?.message || err?.message || 'Error al cargar el vencimiento');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isAuthenticated, expirationId]);

  if (authLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <Clock size={24} className="animate-spin" color="#38bdf8" />
        <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>Cargando datos para edición...</p>
      </div>
    );
  }

  if (role === 'CLIENT') {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <ShieldAlert size={48} color="#f43f5e" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ color: '#fb7185' }}>Permiso Denegado</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0.75rem 0 1.5rem' }}>
          Los clientes no tienen permisos de edición sobre los vencimientos.
        </p>
        <Link href="/expirations" className="btn-refresh" style={{ textDecoration: 'none', justifyContent: 'center' }}>
          <ArrowLeft size={14} />
          <span>Volver a Vencimientos</span>
        </Link>
      </div>
    );
  }

  if (error || !expiration) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <h3>Error al cargar</h3>
        <p style={{ color: '#fda4af', margin: '0.5rem 0 1.5rem' }}>{error || 'No se pudo cargar la información'}</p>
        <Link href="/expirations" className="btn-refresh" style={{ textDecoration: 'none', justifyContent: 'center' }}>
          <ArrowLeft size={14} />
          <span>Volver a Vencimientos</span>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError('Debés seleccionar una categoría');
      return;
    }
    if (!title.trim()) {
      setError('El título de la obligación es obligatorio');
      return;
    }
    if (!expirationDate) {
      setError('La fecha de vencimiento es obligatoria');
      return;
    }
    if (issueDate && expirationDate && issueDate > expirationDate) {
      setError('La fecha de emisión no puede ser posterior a la fecha de vencimiento');
      return;
    }

    setSubmitting(true);

    const payload: UpdateExpirationPayload = {
      categoryId,
      title: title.trim(),
      description: description.trim() || undefined,
      issueDate: issueDate || undefined,
      expirationDate,
      responsibleUserId: responsibleUserId.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      await expirationService.updateExpiration(expirationId, payload);
      router.push(`/expirations/${expirationId}`);
    } catch (err: any) {
      setError(err?.errorBody?.message || err?.message || 'Error al actualizar el vencimiento');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href={`/expirations/${expirationId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} />
          <span>Volver al Detalle</span>
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit2 size={22} color="#38bdf8" />
              <span>Editar Vencimiento</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Empresa: <strong>{expiration.company.businessName}</strong> (Inmutable por seguridad)
            </p>
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#fda4af', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Categoría *</label>
            <select
              className="form-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">Seleccionar categoría...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Título de la Obligación *</label>
            <input
              type="text"
              className="form-input"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Fecha de Emisión / Inicio (Opcional)</label>
              <input
                type="date"
                className="form-input"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Vencimiento *</label>
              <input
                type="date"
                className="form-input"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ID Usuario Responsable (Opcional UUID)</label>
            <input
              type="text"
              className="form-input"
              value={responsibleUserId}
              onChange={(e) => setResponsibleUserId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notas Adicionales</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <Link href={`/expirations/${expirationId}`} className="btn-refresh" style={{ textDecoration: 'none' }}>
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-refresh"
              style={{ background: 'rgba(59, 130, 246, 0.25)', borderColor: 'rgba(59, 130, 246, 0.4)', color: '#93c5fd', padding: '0.55rem 1.25rem' }}
            >
              <Save size={16} />
              <span>{submitting ? 'Guardando Cambios...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
