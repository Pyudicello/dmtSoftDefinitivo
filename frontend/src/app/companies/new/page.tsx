'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { companyService } from '@/services/company.service';
import { queryKeys } from '@/lib/query-keys';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { Building2, ArrowLeft, PlusCircle, AlertCircle } from 'lucide-react';

function NewCompanyContent() {
  const router = useRouter();
  const { user, role } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [businessName, setBusinessName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('Argentina');
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: any) => companyService.createCompany(data),
    onSuccess: (createdCompany) => {
      toast.success(`Empresa '${createdCompany.businessName}' creada correctamente`);
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      router.push(`/companies/${createdCompany.id}`);
    },
    onError: (err: any) => {
      const msg = err?.errorBody?.message || err?.message || 'Error al registrar la empresa';
      setFormError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedBusiness = businessName.trim();
    if (!trimmedBusiness) {
      setFormError('El nombre comercial de la empresa es obligatorio');
      return;
    }

    createMutation.mutate({
      businessName: trimmedBusiness,
      legalName: legalName.trim() || undefined,
      taxId: taxId.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      province: province.trim() || undefined,
      country: country.trim() || undefined,
    });
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <PageHeader
        title="Registrar Nueva Empresa"
        subtitle="Alta de empresa cliente en la cartera de la consultora."
        icon={<Building2 size={24} />}
        breadcrumbs={[
          { label: 'Empresas', href: '/companies' },
          { label: 'Nueva Empresa' },
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
              marginBottom: '1.5rem',
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
              <label className="form-label">Nombre Comercial / Fantasía *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Banco Macro"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Razón Social (Opcional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Banco Macro S.A."
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">CUIT / Identificación Fiscal</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: 30-50000173-5"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email de Contacto</label>
              <input
                type="email"
                className="form-input"
                placeholder="contacto@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                className="form-input"
                placeholder="0351-4567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dirección / Establecimiento</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Av. Colón 1234"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Ciudad</label>
              <input
                type="text"
                className="form-input"
                placeholder="Córdoba"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Provincia / Región</label>
              <input
                type="text"
                className="form-input"
                placeholder="Córdoba"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">País</label>
              <input
                type="text"
                className="form-input"
                placeholder="Argentina"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
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
            <Link href="/companies" className="btn-refresh" style={{ textDecoration: 'none' }}>
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
              <span>{createMutation.isPending ? 'Guardando...' : 'Crear Empresa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewCompanyPage() {
  return (
    <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'CONSULTANT_ADMIN']}>
      <NewCompanyContent />
    </ProtectedRoute>
  );
}
