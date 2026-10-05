'use client';

import React, { useState } from 'react';
import { Inspection, InspectionType } from '@/types';
import { formatDateSpanish } from '@/lib/date-utils';
import { ExpirationStatusBadge } from '@/components/ui/ExpirationStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ClipboardCheck,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Building,
  ArrowUpDown,
  Phone,
  Mail,
  User,
} from 'lucide-react';

interface InspectionListProps {
  inspections: Inspection[];
  isLoading: boolean;
  canManage: boolean;
  onOpenCreate: () => void;
  onOpenDetail: (inspection: Inspection) => void;
  onOpenEdit: (inspection: Inspection) => void;
  onDelete: (inspection: Inspection) => void;
}

export function InspectionList({
  inspections,
  isLoading,
  canManage,
  onOpenCreate,
  onOpenDetail,
  onOpenEdit,
  onDelete,
}: InspectionListProps) {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredInspections = inspections
    .filter((item) => {
      if (filterType !== 'ALL' && item.type !== filterType) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesAuth = item.authority.toLowerCase().includes(query);
        const matchesContact = item.contactName?.toLowerCase().includes(query);
        const matchesDoc = item.documentReference?.toLowerCase().includes(query);
        const matchesNotes = item.notes?.toLowerCase().includes(query);
        return matchesAuth || matchesContact || matchesDoc || matchesNotes;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.visitDate).getTime();
      const dateB = new Date(b.visitDate).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div>
      {/* Header & Filter Bar */}
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
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '220px', flex: 1, maxWidth: '360px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              placeholder="Buscar por organismo, inspector, acta..."
              className="form-input"
              style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={15} color="var(--text-secondary)" />
            <select
              className="form-input"
              style={{ fontSize: '0.85rem', width: 'auto' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">Todos los tipos</option>
              <option value="ART">ART</option>
              <option value="MUNICIPAL">Municipal</option>
              <option value="PROVINCIAL">Provincial</option>
              <option value="HYGIENE_SAFETY_SERVICE">Servicio H&S</option>
              <option value="OTHER">Otros</option>
            </select>
          </div>

          {/* Sort Order Button */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="btn-refresh"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
            title="Cambiar orden cronológico"
          >
            <ArrowUpDown size={14} />
            <span>{sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguas primero'}</span>
          </button>
        </div>

        {canManage && (
          <button
            onClick={onOpenCreate}
            className="btn-refresh"
            style={{
              background: 'rgba(99, 102, 241, 0.25)',
              borderColor: 'rgba(99, 102, 241, 0.45)',
              color: '#818cf8',
              fontSize: '0.85rem',
            }}
          >
            <PlusCircle size={15} />
            <span>Registrar Inspección</span>
          </button>
        )}
      </div>

      {/* Table or Empty State */}
      {filteredInspections.length === 0 ? (
        <EmptyState
          title="No se encontraron visitas o inspecciones"
          description={
            searchTerm || filterType !== 'ALL'
              ? 'No hay registros que coincidan con los filtros seleccionados.'
              : 'Esta empresa aún no cuenta con visitas o inspecciones registradas.'
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
                <span>Registrar Primera Inspección</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha Visita</th>
                <th>Tipo / Organismo</th>
                <th>Autoridad / Inspector</th>
                <th>Ref. / Acta</th>
                <th>Próxima Visita</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInspections.map((item) => (
                <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => onOpenDetail(item)}>
                  {/* Fecha de Visita */}
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} color="#38bdf8" />
                      <span>{formatDateSpanish(item.visitDate)}</span>
                    </div>
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
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#c4b5fd',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                      }}
                    >
                      {item.typeLabel}
                    </span>
                  </td>

                  {/* Autoridad & Inspector */}
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.authority}</div>
                    {item.contactName && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                        <User size={12} />
                        <span>{item.contactName}</span>
                      </div>
                    )}
                  </td>

                  {/* Ref. / Acta */}
                  <td>
                    {item.documentReference ? (
                      <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#93c5fd' }}>
                        {item.documentReference}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>

                  {/* Próxima Visita */}
                  <td>
                    {item.nextVisitDate ? (
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatDateSpanish(item.nextVisitDate)}
                        </div>
                        {item.nextVisitDeadlineStatus && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <ExpirationStatusBadge
                              deadlineStatus={item.nextVisitDeadlineStatus}
                              lifecycleStatus="ACTIVE"
                              daysUntilExpiration={item.nextVisitDaysRemaining}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No programada</span>
                    )}
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

                      {canManage && (
                        <>
                          <button
                            onClick={() => onOpenEdit(item)}
                            className="btn-icon"
                            title="Editar Inspección"
                            style={{ color: '#fbbf24' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => onDelete(item)}
                            className="btn-icon"
                            title="Eliminar Inspección"
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
