-- ====================================================================
-- PREVENIA Database Schema
-- Version: V1__initial_schema.sql
-- Description: Initial Core Multi-tenant Schema (Foundations)
-- ====================================================================

-- 1. Organizations (Tenants / Consultoras de Higiene y Seguridad)
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(30),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_organizations_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE'))
);

CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_tax_id ON organizations(tax_id);

-- 2. Users (Platform Admins, Consultant Admins, Technicians, Clients)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    organization_id UUID,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    external_identity_id VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT chk_users_role CHECK (role IN ('PLATFORM_ADMIN', 'CONSULTANT_ADMIN', 'TECHNICIAN', 'CLIENT')),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED'))
);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- 3. Companies (Client Companies managed by Organizations)
CREATE TABLE companies (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(30),
    address VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(50) NOT NULL DEFAULT 'AR',
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_companies_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT chk_companies_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED'))
);

CREATE INDEX idx_companies_organization_id ON companies(organization_id);
CREATE INDEX idx_companies_org_status ON companies(organization_id, status);
CREATE INDEX idx_companies_tax_id ON companies(tax_id);

-- 4. User Company Assignments (Technicians assigned to Client Companies)
CREATE TABLE user_company_assignments (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assignments_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT uk_assignments_user_company UNIQUE (organization_id, user_id, company_id)
);

CREATE INDEX idx_assignments_org_user ON user_company_assignments(organization_id, user_id);
CREATE INDEX idx_assignments_org_company ON user_company_assignments(organization_id, company_id);

-- 5. Expiration Categories (System standard & Organization custom categories)
CREATE TABLE expiration_categories (
    id UUID PRIMARY KEY,
    organization_id UUID,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color_code VARCHAR(20),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_categories_organization_id ON expiration_categories(organization_id);
CREATE INDEX idx_categories_code ON expiration_categories(code);

-- 6. Expirations (Core business entity: Vencimientos y Obligaciones)
CREATE TABLE expirations (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    company_id UUID NOT NULL,
    category_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    issue_date DATE,
    expiration_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    responsible_user_id UUID,
    recurrence_type VARCHAR(30) NOT NULL DEFAULT 'NONE',
    notification_days_before INTEGER NOT NULL DEFAULT 30,
    notes TEXT,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_expirations_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_expirations_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_expirations_category FOREIGN KEY (category_id) REFERENCES expiration_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_expirations_responsible_user FOREIGN KEY (responsible_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_expirations_status CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_expirations_recurrence CHECK (recurrence_type IN ('NONE', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY', 'CUSTOM'))
);

CREATE INDEX idx_expirations_org_id ON expirations(organization_id);
CREATE INDEX idx_expirations_company_id ON expirations(company_id);
CREATE INDEX idx_expirations_category_id ON expirations(category_id);
CREATE INDEX idx_expirations_date ON expirations(expiration_date);
CREATE INDEX idx_expirations_status ON expirations(status);
CREATE INDEX idx_expirations_org_date_status ON expirations(organization_id, expiration_date, status);
CREATE INDEX idx_expirations_responsible ON expirations(responsible_user_id);

-- 7. Seed System Expiration Categories
INSERT INTO expiration_categories (id, organization_id, code, name, description, icon, color_code, is_system, active, created_at, updated_at)
VALUES
    ('a0000000-0000-0000-0000-000000000001', NULL, 'MATAFUEGOS', 'Matafuegos y Extintores', 'Cargas, pruebas hidráulicas y tarjetas de control de extintores', 'fire-extinguisher', '#EF4444', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000002', NULL, 'CAPACITACION', 'Capacitaciones de Personal', 'Cursos obligatorios, inducciones y entrenamiento de brigadas', 'graduation-cap', '#3B82F6', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000003', NULL, 'ART', 'ART y Cobertura', 'Certificados de cobertura con cláusula de no repetición', 'shield-check', '#10B981', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000004', NULL, 'VISITA_TECNICA', 'Visitas Técnicas', 'Inspecciones periódicas en planta y asesoramiento técnico', 'clipboard-check', '#8B5CF6', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000005', NULL, 'ASCENSOR', 'Ascensores y Montacargas', 'Mantenimiento preventivo, libros de inspección y obleas municipales', 'arrow-up-down', '#F59E0B', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000006', NULL, 'AUTOELEVADOR', 'Autoelevadores y Maquinaria', 'Verificación técnica vehicular, habilitación y check-list', 'truck', '#6366F1', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000007', NULL, 'SEGURO', 'Seguros y Pólizas', 'Seguro de responsabilidad civil, accidentes personales y vida', 'file-protect', '#06B6D4', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000008', NULL, 'MEDICION', 'Mediciones y Protocolos', 'Puesta a tierra (PAT), nivel de ruido, iluminación y contaminantes', 'activity', '#EC4899', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000009', NULL, 'DOCUMENTACION', 'Habilitaciones y Legal', 'Habilitaciones comerciales, medioambientales y registros oficiales', 'file-text', '#64748B', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000010', NULL, 'PLAN_EVACUACION', 'Plan de Evacuación y Simulacros', 'Planes de emergencia, simulacros semestrales y roles asignados', 'bell-ring', '#F97316', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('a0000000-0000-0000-0000-000000000011', NULL, 'OTRO', 'Otras Obligaciones', 'Otras obligaciones o vencimientos no categorizados', 'bookmark', '#94A3B8', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
