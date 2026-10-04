/**
 * Date utility functions for PREVENIA.
 * Treats LocalDate (YYYY-MM-DD) strings cleanly without timezone drifting.
 */

export function formatDateSpanish(dateString?: string | null): string {
  if (!dateString) return '—';

  // If format is YYYY-MM-DD
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2].substring(0, 2);
    return `${day}/${month}/${year}`;
  }

  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

export function formatDateTimeSpanish(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatDaysUntilExpiration(days?: number | null): string {
  if (days === null || days === undefined) return '';
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  if (days > 1) return `Vence en ${days} días`;
  if (days === -1) return 'Venció ayer';
  return `Venció hace ${Math.abs(days)} días`;
}
