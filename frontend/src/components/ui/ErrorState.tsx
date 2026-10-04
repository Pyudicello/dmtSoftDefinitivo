'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
}

export function ErrorState({
  title = 'Ocurrió un error inesperado',
  message = 'No se pudo cargar la información desde el servidor. Por favor verificá tu conexión e intentá de nuevo.',
  onRetry,
  action,
}: ErrorStateProps) {
  return (
    <div
      className="card"
      style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        maxWidth: '550px',
        margin: '2rem auto',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        background: 'rgba(244, 63, 94, 0.05)',
      }}
    >
      <div
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'rgba(244, 63, 94, 0.15)',
          color: '#fb7185',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}
      >
        <AlertCircle size={26} />
      </div>

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fca5a5', marginBottom: '0.5rem' }}>
        {title}
      </h3>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
        {message}
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-refresh"
            style={{
              background: 'rgba(244, 63, 94, 0.2)',
              borderColor: 'rgba(244, 63, 94, 0.4)',
              color: '#fda4af',
            }}
          >
            <RefreshCw size={14} />
            <span>Reintentar</span>
          </button>
        )}
        {action}
      </div>
    </div>
  );
}
