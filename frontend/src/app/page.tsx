import React from 'react';
import { SystemStatusCard } from '@/features/system/components/SystemStatusCard';
import { DomainOverviewCard } from '@/features/system/components/DomainOverviewCard';
import { Shield, Sparkles, Terminal, BookOpen } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="container">
      <header>
        <div className="logo-group">
          <div className="logo-icon">
            <Shield size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="logo-title">PREVENIA</span>
              <span className="logo-badge">v0.1.0</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a
            href="http://localhost:8080/actuator/health"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-refresh"
            style={{ textDecoration: 'none' }}
          >
            <Terminal size={14} />
            <span>Health Endpoint</span>
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-subtitle">Plataforma SaaS • Higiene & Seguridad Laboral</div>
        <h1>Fundación Técnica Profesional (Día 1)</h1>
        <p>
          Núcleo arquitectónico multi-tenant modular diseñado para la gestión integral de
          vencimientos, obligaciones normativas, auditorías y empresas clientes.
        </p>
      </section>

      <div className="grid">
        <SystemStatusCard />
        <DomainOverviewCard />
      </div>

      <div className="card" style={{ marginBottom: '3rem' }}>
        <div className="card-header">
          <div className="card-title">
            <BookOpen size={20} color="#34d399" />
            <span>Verificaciones y Acceso Rápido del Desarrollador</span>
          </div>
        </div>
        <table className="info-table">
          <tbody>
            <tr>
              <td className="label">Frontend Local</td>
              <td className="value">http://localhost:3000</td>
            </tr>
            <tr>
              <td className="label">Backend Spring Boot API</td>
              <td className="value">http://localhost:8080</td>
            </tr>
            <tr>
              <td className="label">System Info API</td>
              <td className="value">
                <a href="http://localhost:8080/api/v1/system/info" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>
                  /api/v1/system/info
                </a>
              </td>
            </tr>
            <tr>
              <td className="label">Spring Boot Actuator Health</td>
              <td className="value">
                <a href="http://localhost:8080/actuator/health" target="_blank" rel="noreferrer" style={{ color: '#34d399' }}>
                  /actuator/health
                </a>
              </td>
            </tr>
            <tr>
              <td className="label">PostgreSQL Database</td>
              <td className="value">localhost:5432 (DB: prevenia)</td>
            </tr>
            <tr>
              <td className="label">Flyway Migrations</td>
              <td className="value">V1__initial_schema.sql (11 Core Categories seeded)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer>
        <p>
          PREVENIA SaaS © 2026 • Arquitectura Modular Monolith • Fundaciones listas para el Día 2
        </p>
      </footer>
    </main>
  );
}
