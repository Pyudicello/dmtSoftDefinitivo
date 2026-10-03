'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { systemService } from '@/services/system.service';
import { HealthStatus, SystemInfo } from '@/types';
import { API_BASE_URL } from '@/lib/api-client';
import { Activity, RefreshCw, Server, Database, CheckCircle2, XCircle } from 'lucide-react';

export function SystemStatusCard() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [info, health] = await Promise.allSettled([
        systemService.getSystemInfo(),
        systemService.getHealth(),
      ]);

      if (info.status === 'fulfilled') {
        setSystemInfo(info.value);
      } else {
        throw new Error(info.reason?.message || 'Failed to fetch system info');
      }

      if (health.status === 'fulfilled') {
        setHealthStatus(health.value);
      }

      setLastCheck(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error contacting backend');
      setSystemInfo(null);
      setHealthStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isConnected = !!systemInfo && !error;

  return (
    <div className="card" id="system-status-card">
      <div className="card-header">
        <div className="card-title">
          <Server size={20} color="#38bdf8" />
          <span>Backend Foundation</span>
        </div>
        <div className="card-actions">
          {isLoading ? (
            <span className="status-badge status-connecting">
              <span className="pulse-dot" /> Checking...
            </span>
          ) : isConnected ? (
            <span className="status-badge status-up" id="backend-status-badge">
              <span className="pulse-dot" /> Connected (UP)
            </span>
          ) : (
            <span className="status-badge status-down" id="backend-status-badge">
              <span className="pulse-dot" /> Disconnected
            </span>
          )}
        </div>
      </div>

      <table className="info-table">
        <tbody>
          <tr>
            <td className="label">Target API URL</td>
            <td className="value">{API_BASE_URL}</td>
          </tr>
          <tr>
            <td className="label">Endpoint Tested</td>
            <td className="value">/api/v1/system/info</td>
          </tr>
          <tr>
            <td className="label">Backend Version</td>
            <td className="value">{systemInfo?.version || '—'}</td>
          </tr>
          <tr>
            <td className="label">Active Profile</td>
            <td className="value">{systemInfo?.environment || '—'}</td>
          </tr>
          <tr>
            <td className="label">Actuator Health</td>
            <td className="value" style={{ color: healthStatus?.status === 'UP' ? '#34d399' : '#fb7185' }}>
              {healthStatus?.status || (isConnected ? 'UP' : 'UNREACHABLE')}
            </td>
          </tr>
          <tr>
            <td className="label">Last Verification</td>
            <td className="value">
              {lastCheck ? lastCheck.toLocaleTimeString() : '—'}
            </td>
          </tr>
        </tbody>
      </table>

      {error && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', fontSize: '0.8rem', color: '#fda4af' }}>
          <strong>Connection Error:</strong> {error}
        </div>
      )}

      {systemInfo && (
        <pre className="json-view">
          {JSON.stringify(systemInfo, null, 2)}
        </pre>
      )}

      <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={fetchStatus}
          disabled={isLoading}
          className="btn-refresh"
          id="btn-recheck-backend"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Re-verify Connection</span>
        </button>
      </div>
    </div>
  );
}
