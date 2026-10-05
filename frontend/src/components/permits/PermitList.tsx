'use client';

import React, { useState } from 'react';
import { Permit, PermitType, PermitStatus } from '@/types';
import { formatDateSpanish } from '@/lib/date-utils';
import { ExpirationStatusBadge } from '@/components/ui/ExpirationStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Award,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit2,
  RefreshCw,
  Trash2,
  Calendar,
  Building,
  History,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
} from 'lucide-react';

interface PermitListProps {
  permits: Permit[];
  isLoading: boolean;
  canManage: boolean;
  onOpenCreate: () => void;
  onOpenDetail: (permit: Permit) => void;
  onOpenEdit: (permit: Permit) => void;
  onOpenRenew: (permit: Permit) => void;
  onDelete: (permit: Permit) => void;
}

export function PermitList({
  permits,
  isLoading,
  canManage,
  onOpenCreate,
  onOpenDetail,
  onOpenEdit,
  onOpenRenew,
  onDelete,
}: PermitListProps) {
  const [viewMode, setViewMode] = useState<'active' | 'all'>('active');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredPermits = permits.filter((item) => {
    if (viewMode === 'active' && item.status !== 'ACTIVE') {
      return false;
    }
    if (filterType !== 'ALL' && item.type !== filterType) {
      return false;
    }
    if (filterStatus !== 'ALL' && item.status !== filterStatus) {
      return false;
    }
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const matchesAuth = item.issuingAuthority.toLowerCase().includes(query);
      const matchesNum = item.permitNumber.toLowerCase().includes(query);
      const matchesContact = item.contactName?.toLowerCase().includes(query);
      const matchesDoc = item.documentReference?.toLowerCase().includes(query);
      return matchesAuth || matchesNum || matchesContact || matchesDoc;
    }
    return true;
  });

  return (
    <div>
      {/* View Mode & Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          {/* Active / History Switch */}
          <div
            style={{
              display: 'inline-flex',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.2rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => setViewMode('active')}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'active' ? 'var(--primary-color, #3b82f6)' : 'transparent',
                color: viewMode === 'active' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              Vigentes
            </button>
            <button
              onClick={() => setViewMode('all')}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'all' ? 'var(--primary-color, #3b82f6)' : 'transparent',
                color: viewMode === 'all' ? '#fff' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.15s ease',
              }}
            >
              <History size={13} />
              <span>Historial Completo</span>
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '200px', flex: 1, maxWidth: '320px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              placeholder="Buscar por organismo, N° expediente..."
              className="form-input"
              style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <select
            className="form-input"
            style={{ fontSize: '0.85rem', width: 'auto' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Todos los tipos</option>
            <option value="MUNICIPAL">Municipal</option>
            <option value="PROVINCIAL">Provincial</option>
            <option value="FIRE_DEPARTMENT">Bomberos</option>
            <option value="OTHER">Otros</option>
          </select>

          {/* Status Filter (only if showing all) */}
          {viewMode === 'all' && (
            <select
              className="form-input"
              style={{ fontSize: '0.85rem', width: 'auto' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Vigente</option>
              <option value="RENEWED">Renovada</option>
              <option value="EXPIRED">Vencida</option>
              <option value="CANCELLED">Anulada</option>
            </select>
          )}
        </div>

        {canManage && (
          <button
            onClick={onOpenCreate}
            className="btn-refresh"
            style={{
              background: 'rgba(56, 189, 248, 0.25)',
              borderColor: 'rgba(56, 189, 248, 0.45)',
              color: '#38bdf8',
              fontSize: '0.85rem',
            }}
          >
            <PlusCircle size={15} />
            <span>Nueva Habilitación</span>
          </button>
        )}
      </div>

      {/* Table or Empty State */}
      {filteredPermits.length === 0 ? (
        <EmptyState
          title={viewMode === 'active' ? 'No hay habilitaciones vigentes' : 'No se encontraron habilitaciones'}
          description={
            searchTerm || filterType !== 'ALL'
              ? 'No hay registros que coincidan con los filtros aplicados.'
              : 'Esta empresa aún no cuenta con habilitaciones registradas.'
          }
          action={
            canManage && !searchTerm && filterType === 'ALL' ? (
              <button
                onClick={onOpenCreate}
                className="btn-refresh"
                style={{
                  background: 'var(--primary-color, #3b82f6)',
                  color: '#fff',
                  borderColor: 'transparent',
                }}
              >
                <PlusCircle size={15} />
                <span>Registrar Primera Habilitación</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Organismo / Habilitación</th>
                <th>Tipo</th>
                <th>N° / Expediente</th>
                <th>Emisión</th>
                <th>Vencimiento de habilitación / visado</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPermits.map((item) => (
                <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => onOpenDetail(item)}>
                  {/* Organismo */}
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.issuingAuthority}
                    </div>
                    {item.previousPermitNumber && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                        <History size={11} />
                        <span>Renovó N° {item.previousPermitNumber}</span>
                      </div>
                    )}
                  </td>

                  {/* Tipo */}
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#7dd3fc',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                      }}
                    >
                      {item.typeLabel}
                    </span>
                  </td>

                  {/* N° Expediente */}
                  <td>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#93c5fd', fontWeight: 500 }}>
                      {item.permitNumber}
                    </span>
                  </td>

                  {/* Emisión */}
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatDateSpanish(item.issueDate)}
                  </td>

                  {/* Vencimiento de habilitación / visado */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                      {formatDateSpanish(item.expirationDate)}
                    </div>
                    {item.status === 'ACTIVE' && item.deadlineStatus && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <ExpirationStatusBadge
                          deadlineStatus={item.deadlineStatus}
                          lifecycleStatus="ACTIVE"
                          daysUntilExpiration={item.daysUntilExpiration}
                        />
                      </div>
                    )}
                  </td>

                  {/* Estado */}
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background:
                          item.status === 'ACTIVE'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : item.status === 'RENEWED'
                            ? 'rgba(99, 102, 241, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color:
                          item.status === 'ACTIVE'
                            ? '#34d399'
                            : item.status === 'RENEWED'
                            ? '#a5b4fc'
                            : '#f87171',
                      }}
                    >
                      {item.statusLabel}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <button
                        onClick={() => onOpenDetail(item)}
                        className="btn-icon"
                        title="Ver Detalle"
                        style={{ color: '#38bdf8' }}
                      >
                        <Eye size={16} />
                      </button>

                      {canManage && item.status === 'ACTIVE' && (
                        <button
                          onClick={() => onOpenRenew(item)}
                          className="btn-icon"
                          title="Renovar Habilitación"
                          style={{ color: '#34d399' }}
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}

                      {canManage && (
                        <>
                          <button
                            onClick={() => onOpenEdit(item)}
                            className="btn-icon"
                            title="Editar Habilitación"
                            style={{ color: '#fbbf24' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => onDelete(item)}
                            className="btn-icon"
                            title="Eliminar Habilitación"
                            style={{ color: '#f87171' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
