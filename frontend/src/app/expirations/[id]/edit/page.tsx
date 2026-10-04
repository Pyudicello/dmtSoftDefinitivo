'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { expirationService } from '@/services/expiration.service';
import { queryKeys } from '@/lib/query-keys';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { DetailSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Clock, ArrowLeft, Edit2, AlertCircle, Save, ShieldX } from 'lucide-react';
import { UpdateExpirationPayload } from '@/types';

function EditExpirationContent({ expirationId }: { expirationId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: expiration,
    isLoading: expLoading,
    isError: expError,
    error: errObj,
  } = useQuery({
    queryKey: queryKeys.expirations.detail(expirationId),
    queryFn: () => expirationService.getExpirationById(expirationId),
  });

  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: queryKeys.expirations.categories(),
    queryFn: () => expirationService.getCategories(),
  });

  useEffect(() => {
    if (expiration) {
      setCategoryId(expiration.category.id);
      setTitle(expiration.title);
      setDescription(expiration.description || '');
      setIssueDate(expiration.issueDate || '');
      setExpirationDate(expiration.expirationDate);
      setResponsibleUserId(expiration.responsible?.id || '');
      setNotes(expiration.notes || '');
    }
  }, [expiration]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateExpirationPayload) =>
      expirationService.updateExpiration(expirationId, payload),
    onSuccess: (updated) => {
      toast.success(`Vencimiento '${updated.title}' actualizado con éxito`);
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.detail(expirationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      router.push(`/expirations/${expirationId}`);
    },
    onError: (err: any) => {
      setFormError(err?.errorBody?.message || err?.message || 'Error al actualizar el vencimiento');
    },
  });

  if (expError) {
    const status = (errObj as any)?.status;
    if (status === 404 || status === 403) {
      return (
        <div className="card" style={{ maxWidth: '650px', margin: '2rem auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <ShieldX size={48} color="#f43f5e" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#fb7185' }}>Acceso Denegado (Protección Anti-IDOR)</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              No tenés autorización para editar el vencimiento con ID:
            </p>
            <code style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.8rem' }}>
              {expirationId}
            </code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link href="/expirations" className="btn-refresh" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={14} />
              <span>Volver a Vencimientos</span>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <ErrorState
        title="Error al cargar datos"
        message="No se pudo obtener la información de la obligación para edición."
      />
    );
  }

  if (expLoading || catLoading || !expiration) {
    return (
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <DetailSkeleton />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!categoryId) {
      setFormError('Debés seleccionar una categoría');
      return;
    }
    if (!title.trim()) {
      setFormError('El título de la obligación es obligatorio');
      return;
    }
    if (!expirationDate) {
      setFormError('La fecha de vencimiento es obligatoria');
      return;
    }
    if (issueDate && expirationDate && issueDate > expirationDate) {
      setFormError('La fecha de emisión no puede ser posterior a la fecha de vencimiento');
      return;
    }

    updateMutation.mutate({
      categoryId,
      title: title.trim(),
      description: description.trim() || undefined,
      issueDate: issueDate || undefined,
      expirationDate,
      responsibleUserId: responsibleUserId.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <PageHeader
        title="Editar Vencimiento"
        subtitle={`Empresa: ${expiration.company.businessName} (Inmutable por seguridad)`}
        icon={<Edit2 size={24} />}
        breadcrumbs={[
          { label: 'Vencimientos', href: '/expirations' },
          { label: expiration.title, href: `/expirations/${expirationId}` },
          { label: 'Editar' },
        ]}
      />

      <div className="card">
        {formError && (
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '8px',
              color: '#fda4af',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{formError}</span>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Fecha de Emisión / Inicio</label>
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

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '1.75rem',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1.25rem',
            }}
          >
            <Link href={`/expirations/${expirationId}`} className="btn-refresh" style={{ textDecoration: 'none' }}>
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-refresh"
              style={{
                background: 'rgba(59, 130, 246, 0.25)',
                borderColor: 'rgba(59, 130, 246, 0.45)',
                color: '#93c5fd',
                padding: '0.55rem 1.25rem',
              }}
            >
              <Save size={16} />
              <span>{updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditExpirationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN']}>
      <EditExpirationContent expirationId={resolvedParams.id} />
    </ProtectedRoute>
  );
}
