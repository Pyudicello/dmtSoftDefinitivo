'use client';

import React from 'react';

export function CardSkeleton() {
  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        animation: 'pulse 1.5s infinite',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '40%', height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} />
        <div style={{ width: '28px', height: '28px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }} />
      </div>
      <div style={{ width: '50%', height: '32px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', margin: '0.75rem 0 0.25rem' }} />
      <div style={{ width: '70%', height: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }} />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} />
        ))}
      </div>
      <div style={{ padding: '0.5rem 1rem' }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            style={{
              padding: '0.85rem 0',
              borderBottom: r < rows - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              display: 'flex',
              gap: '1rem',
              animation: 'pulse 1.5s infinite',
            }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                style={{
                  flex: 1,
                  height: '16px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '4px',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="card" style={{ padding: '1.75rem', animation: 'pulse 1.5s infinite' }}>
      <div style={{ width: '45%', height: '28px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', marginBottom: '1.5rem' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: '30%', height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
            <div style={{ width: '40%', height: '14px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
