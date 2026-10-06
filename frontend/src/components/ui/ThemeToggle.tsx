'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ThemeToggle({ showLabel = false, className = '', style }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          width: showLabel ? '110px' : '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          ...style,
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      aria-label={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: showLabel ? '0.4rem 0.75rem' : '0.45rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        background: 'var(--toggle-bg, rgba(255, 255, 255, 0.05))',
        color: isDark ? '#fbbf24' : '#f59e0b',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '0.82rem',
        fontWeight: 600,
        ...style,
      }}
    >
      {isDark ? (
        <Sun size={17} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.4))' }} />
      ) : (
        <Moon size={17} style={{ color: '#475569' }} />
      )}
      {showLabel && (
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          {isDark ? 'Modo Claro' : 'Modo Oscuro'}
        </span>
      )}
    </button>
  );
}
