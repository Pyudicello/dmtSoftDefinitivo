'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { expirationService } from '@/services/expiration.service';
import { companyService } from '@/services/company.service';
import { queryKeys } from '@/lib/query-keys';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { Clock, ArrowLeft, PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { CreateExpirationPayload } from '@/types';

function NewExpirationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCompanyId = searchParams.get('companyId') || '';

  const { role } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Form State
  const [companyId, setCompanyId] = useState(preselectedCompanyId);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [responsibleUserId, setResponsibleUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Queries
  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: queryKeys.companies.list(0, 100),
    queryFn: () => companyService.getCompanies(0, 100),
  });
  const companies = React.useMemo(() => companiesData?.content || [], [companiesData]);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: queryKeys.expirations.categories(),
    queryFn: () => expirationService.getCategories(),
  });

  useEffect(() => {
    if (preselectedCompanyId) {
      setCompanyId(preselectedCompanyId);
    } else if (companies.length === 1 && !companyId) {
      setCompanyId(companies[0].id);
    }
  }, [preselectedCompanyId, companies, companyId]);

  // Mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateExpirationPayload) => expirationService.createExpiration(payload),
    onSuccess: (created) => {
      toast.success(`Vencimiento '${created.title}' registrado con éxito`);
      queryClient.invalidateQueries({ queryKey: queryKeys.expirations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      router.push(`/expirations/${created.id}`);
    },
    onError: (err: any) => {
      setFormError(err?.errorBody?.message || err?.message || 'Error al registrar el vencimiento');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!companyId) {
      setFormError('Debés seleccionar una empresa cliente');
      return;
    }
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

    createMutation.mutate({
      companyId,
      categoryId,
      title: title.trim(),
      description: description.trim() || undefined,
      issueDate: issueDate || undefined,
      expirationDate,
      responsibleUserId: responsibleUserId.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  if (companiesLoading || categoriesLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <RefreshCw size={24} className="animate-spin" color="#38bdf8" />
        <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>Cargando formulario...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <PageHeader
        title="Registrar Nuevo Vencimiento"
        subtitle="Alta de obligación técnica, legal o reglamentaria."
        icon={<Clock size={24} />}
        breadcrumbs={[
          { label: 'Vencimientos', href: '/expirations' },
          { label: 'Nuevo Vencimiento' },
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
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
              placeholder="Ej: Recarga correspondiente a los extintores ABC de planta baja y subsuelo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Fecha de Emisión / Inspección Anterior</label>
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
            <Link href="/expirations" className="btn-refresh" style={{ textDecoration: 'none' }}>
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-refresh"
              style={{
                background: 'rgba(16, 185, 129, 0.25)',
                borderColor: 'rgba(16, 185, 129, 0.45)',
                color: '#34d399',
                padding: '0.55rem 1.25rem',
              }}
            >
              <PlusCircle size={16} />
              <span>{createMutation.isPending ? 'Guardando...' : 'Crear Vencimiento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewExpirationPage() {
  return (
    <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN']}>
      <Suspense
        fallback={
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <RefreshCw size={24} className="animate-spin" color="#38bdf8" />
          </div>
        }
      >
        <NewExpirationForm />
      </Suspense>
    </ProtectedRoute>
  );
}
