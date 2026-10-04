'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'danger' | 'warning' | 'amber' | 'success' | 'default';
  href?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  href,
  loading = false,
}: StatCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          bg: 'rgba(244, 63, 94, 0.08)',
          border: 'rgba(244, 63, 94, 0.25)',
          iconBg: 'rgba(244, 63, 94, 0.15)',
          iconColor: '#fb7185',
          valueColor: '#f43f5e',
        };
      case 'warning': // Orange/Urgent
        return {
          bg: 'rgba(249, 115, 22, 0.08)',
          border: 'rgba(249, 115, 22, 0.25)',
          iconBg: 'rgba(249, 115, 22, 0.15)',
          iconColor: '#fb923c',
          valueColor: '#f97316',
        };
      case 'amber': // Upcoming
        return {
          bg: 'rgba(234, 179, 8, 0.08)',
          border: 'rgba(234, 179, 8, 0.25)',
          iconBg: 'rgba(234, 179, 8, 0.15)',
          iconColor: '#facc15',
          valueColor: '#eab308',
        };
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.08)',
          border: 'rgba(16, 185, 129, 0.25)',
          iconBg: 'rgba(16, 185, 129, 0.15)',
          iconColor: '#34d399',
          valueColor: '#10b981',
        };
      case 'primary':
        return {
          bg: 'rgba(59, 130, 246, 0.08)',
          border: 'rgba(59, 130, 246, 0.25)',
          iconBg: 'rgba(59, 130, 246, 0.15)',
          iconColor: '#93c5fd',
          valueColor: '#3b82f6',
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.03)',
          border: 'var(--border-color)',
          iconBg: 'rgba(255, 255, 255, 0.06)',
          iconColor: 'var(--text-secondary)',
          valueColor: 'var(--text-primary)',
        };
    }
  };

  const style = getVariantStyles();

  const content = (
    <div
      className="card"
      style={{
        background: style.bg,
        borderColor: style.border,
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: href ? 'pointer' : 'default',
        position: 'relative',
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        <div
          style={{
            padding: '0.45rem',
            borderRadius: '8px',
            background: style.iconBg,
            color: style.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      </div>

      <div>
        {loading ? (
          <div style={{ height: '36px', width: '60px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
        ) : (
          <div style={{ fontSize: '2rem', fontWeight: 800, color: style.valueColor, lineHeight: 1.1, fontFamily: 'var(--font-mono)' }}>
            {value}
          </div>
        )}

        {subtitle && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>{subtitle}</span>
            {href && <ArrowUpRight size={13} style={{ opacity: 0.7 }} />}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {content}
      </Link>
    );
  }

  return content;
}
