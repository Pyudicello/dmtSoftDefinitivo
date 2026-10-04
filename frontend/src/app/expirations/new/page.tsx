'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { expirationService } from '@/services/expiration.service';
import { companyService } from '@/services/company.service';
import { Company, ExpirationCategory, CreateExpirationPayload } from '@/types';
import { Clock, ArrowLeft, PlusCircle, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NewExpirationPage() {
  const router = useRouter();
  const { user, role, isAuthenticated, isLoading: authLoading } = useAuth();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<ExpirationCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form State
  const [companyId, setCompanyId] = useState('');
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
        companyService.getCompanies(),
        expirationService.getCategories()
      ])
        .then(([compRes, catList]) => {
          setCompanies(compRes.content || []);
          setCategories(catList || []);
          if (compRes.content?.length === 1) {
            setCompanyId(compRes.content[0].id);
          }
        })
        .catch((err) => {
          setError('Error al cargar datos auxiliares para el formulario');
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  }, [isAuthenticated]);

  if (authLoading || loadingData) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <Clock size={24} className="animate-spin" color="#38bdf8" />
        <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>Cargando formulario...</p>
      </div>
    );
  }

  if (role === 'CLIENT') {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <ShieldAlert size={48} color="#f43f5e" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ color: '#fb7185' }}>Permiso Denegado</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0.75rem 0 1.5rem' }}>
          Los usuarios con rol <strong>CLIENT</strong> tienen acceso de solo lectura y no pueden crear nuevas obligaciones ni vencimientos.
        </p>
        <Link href="/expirations" className="btn-refresh" style={{ textDecoration: 'none', justifyContent: 'center' }}>
          <ArrowLeft size={14} />
          <span>Volver al listado de vencimientos</span>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyId) {
      setError('Debés seleccionar una empresa cliente');
      return;
    }
    if (!categoryId) {
      setError('Debés seleccionar una categoría de vencimiento');
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

    const payload: CreateExpirationPayload = {
      companyId,
      categoryId,
      title: title.trim(),
      description: description.trim() || undefined,
      issueDate: issueDate || undefined,
      expirationDate,
      responsibleUserId: responsibleUserId.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      const created = await expirationService.createExpiration(payload);
      router.push(`/expirations/${created.id}`);
    } catch (err: any) {
      setError(err?.errorBody?.message || err?.message || 'Error al registrar el vencimiento');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/expirations" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} />
          <span>Volver a Vencimientos</span>
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={24} color="#34d399" />
              <span>Registrar Nuevo Vencimiento</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Alta de obligación o requisito técnico bajo el tenant actual.
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Empresa Cliente *</label>
              <select
                className="form-select"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                required
              >
                <option value="">Seleccionar empresa...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName} {c.taxId ? `(CUIT: ${c.taxId})` : ''}
                  </option>
                ))}
              </select>
            </div>

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
          </div>

          <div className="form-group">
            <label className="form-label">Título de la Obligación *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Recarga anual matafuegos sucursal Centro"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción Detallada (Opcional)</label>
            <textarea
              className="form-textarea"
              placeholder="Ej: Recarga anual correspondiente a los extintores ABC del establecimiento..."
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
              placeholder="Ej: 22222222-2222-2222-2222-222222222222"
              value={responsibleUserId}
              onChange={(e) => setResponsibleUserId(e.target.value)}
            />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Debe pertenecer a tu Organization y tener asignada la empresa seleccionada.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Notas Adicionales / Proveedor Habitual</label>
            <textarea
              className="form-textarea"
              placeholder="Ej: Proveedor habitual: Extintores Córdoba. Tel: 351-4567890"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <Link href="/expirations" className="btn-refresh" style={{ textDecoration: 'none' }}>
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-refresh"
              style={{ background: 'rgba(16, 185, 129, 0.25)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '0.55rem 1.25rem' }}
            >
              <PlusCircle size={16} />
              <span>{submitting ? 'Registrando...' : 'Crear Vencimiento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
