import React from 'react';
import { ShieldCheck, Building2, CalendarClock, Users, Database, Layers } from 'lucide-react';

export function DomainOverviewCard() {
  const domainModules = [
    {
      title: 'Organizations (Multi-Tenancy)',
      description: 'Consultoras de Higiene y Seguridad. Aislamiento total de datos.',
      icon: <Building2 size={18} />,
    },
    {
      title: 'Users & Roles Matrix',
      description: 'PLATFORM_ADMIN, CONSULTANT_ADMIN, TECHNICIAN, CLIENT.',
      icon: <Users size={18} />,
    },
    {
      title: 'Companies & Assignments',
      description: 'Empresas clientes gestionadas y asignación técnica granular.',
      icon: <ShieldCheck size={18} />,
    },
    {
      title: 'Generic Expiration Engine',
      description: 'Matafuegos, ART, Capacitaciones, Ascensores, Seguros, etc.',
      icon: <CalendarClock size={18} />,
    },
    {
      title: 'PostgreSQL & Flyway Migrations',
      description: 'Schema versionado con V1__initial_schema.sql e índices optimizados.',
      icon: <Database size={18} />,
    },
  ];

  return (
    <div className="card" id="domain-overview-card">
      <div className="card-header">
        <div className="card-title">
          <Layers size={20} color="#a78bfa" />
          <span>Domain Architecture Foundation</span>
        </div>
        <span className="status-badge status-up">
          <span className="pulse-dot" /> Day 1 Ready
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {domainModules.map((item, idx) => (
          <div key={idx} className="domain-item">
            <div className="domain-icon">{item.icon}</div>
            <div className="domain-text">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
