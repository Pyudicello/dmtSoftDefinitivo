'use client';

import React from 'react';
import { ExpirationLifecycleStatus, ExpirationDeadlineStatus } from '@/types';
import { formatDaysUntilExpiration } from '@/lib/date-utils';
import { AlertTriangle, Clock, CheckCircle2, Check, X, ShieldAlert } from 'lucide-react';

interface ExpirationStatusBadgeProps {
  lifecycleStatus?: ExpirationLifecycleStatus;
  deadlineStatus?: ExpirationDeadlineStatus | null;
  daysUntilExpiration?: number | null;
  showDays?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ExpirationStatusBadge({
  lifecycleStatus = 'ACTIVE',
  deadlineStatus,
  daysUntilExpiration,
  showDays = true,
  size = 'md',
}: ExpirationStatusBadgeProps) {
  const padding = size === 'sm' ? '0.15rem 0.45rem' : size === 'lg' ? '0.35rem 0.85rem' : '0.22rem 0.65rem';
  const fontSize = size === 'sm' ? '0.7rem' : size === 'lg' ? '0.875rem' : '0.78rem';
  const iconSize = size === 'sm' ? 11 : size === 'lg' ? 15 : 13;

  if (lifecycleStatus === 'COMPLETED') {
    return (
      <span
        className="status-badge badge-lifecycle-completed"
        style={{ padding, fontSize }}
        title="Obligación cumplida"
      >
        <Check size={iconSize} />
        <span>COMPLETADO</span>
      </span>
    );
  }

  if (lifecycleStatus === 'CANCELLED') {
    return (
      <span
        className="status-badge badge-lifecycle-cancelled"
        style={{ padding, fontSize }}
        title="Obligación anulada/cancelada"
      >
        <X size={iconSize} />
        <span>CANCELADO</span>
      </span>
    );
  }

  const daysLabel = showDays && daysUntilExpiration !== null && daysUntilExpiration !== undefined
    ? ` (${formatDaysUntilExpiration(daysUntilExpiration)})`
    : '';

  switch (deadlineStatus) {
    case 'EXPIRED':
      return (
        <span
          className="status-badge badge-deadline-expired"
          style={{ padding, fontSize }}
          title={formatDaysUntilExpiration(daysUntilExpiration)}
        >
          <AlertTriangle size={iconSize} />
          <span>VENCIDO{daysLabel}</span>
        </span>
      );
    case 'URGENT':
      return (
        <span
          className="status-badge badge-deadline-urgent"
          style={{ padding, fontSize }}
          title={formatDaysUntilExpiration(daysUntilExpiration)}
        >
          <Clock size={iconSize} />
          <span>{daysUntilExpiration === 0 ? '¡VENCE HOY!' : `URGENTE${daysLabel}`}</span>
        </span>
      );
    case 'UPCOMING':
      return (
        <span
          className="status-badge badge-deadline-upcoming"
          style={{ padding, fontSize }}
          title={formatDaysUntilExpiration(daysUntilExpiration)}
        >
          <Clock size={iconSize} />
          <span>PRÓXIMO{daysLabel}</span>
        </span>
      );
    case 'CURRENT':
      return (
        <span
          className="status-badge badge-deadline-current"
          style={{ padding, fontSize }}
          title={formatDaysUntilExpiration(daysUntilExpiration)}
        >
          <CheckCircle2 size={iconSize} />
          <span>VIGENTE{daysLabel}</span>
        </span>
      );
    default:
      return (
        <span className="status-badge status-up" style={{ padding, fontSize }}>
          {lifecycleStatus}
        </span>
      );
  }
}
