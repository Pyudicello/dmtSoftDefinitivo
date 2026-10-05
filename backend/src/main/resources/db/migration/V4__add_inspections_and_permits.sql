-- ====================================================================
-- PREVENIA Database Schema
-- Version: V4__add_inspections_and_permits.sql
-- Description: Add Inspections/Visits and Permits/Habilitations modules
-- ====================================================================

-- 1. Inspections (Visitas e Inspecciones)
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    company_id UUID NOT NULL,
    expiration_id UUID,
    type VARCHAR(50) NOT NULL,
    visit_date DATE NOT NULL,
    authority VARCHAR(255) NOT NULL,
    contact_name VARCHAR(150),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    result TEXT,
    notes TEXT,
    next_visit_date DATE,
    document_reference VARCHAR(255),
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inspections_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_inspections_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_inspections_expiration FOREIGN KEY (expiration_id) REFERENCES expirations(id) ON DELETE SET NULL,
    CONSTRAINT chk_inspections_type CHECK (type IN ('ART', 'MUNICIPAL', 'PROVINCIAL', 'HYGIENE_SAFETY_SERVICE', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_inspections_org_company ON inspections(organization_id, company_id);
CREATE INDEX IF NOT EXISTS idx_inspections_visit_date ON inspections(visit_date);
CREATE INDEX IF NOT EXISTS idx_inspections_next_visit_date ON inspections(next_visit_date);
CREATE INDEX IF NOT EXISTS idx_inspections_type ON inspections(type);

-- 2. Permits (Habilitaciones / Visados)
CREATE TABLE IF NOT EXISTS permits (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    company_id UUID NOT NULL,
    expiration_id UUID,
    type VARCHAR(50) NOT NULL,
    issuing_authority VARCHAR(255) NOT NULL,
    permit_number VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    contact_name VARCHAR(150),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    notes TEXT,
    document_reference VARCHAR(255),
    previous_permit_id UUID,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_permits_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_permits_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_permits_expiration FOREIGN KEY (expiration_id) REFERENCES expirations(id) ON DELETE SET NULL,
    CONSTRAINT fk_permits_previous FOREIGN KEY (previous_permit_id) REFERENCES permits(id) ON DELETE SET NULL,
    CONSTRAINT chk_permits_type CHECK (type IN ('MUNICIPAL', 'PROVINCIAL', 'FIRE_DEPARTMENT', 'OTHER')),
    CONSTRAINT chk_permits_status CHECK (status IN ('ACTIVE', 'RENEWED', 'EXPIRED', 'CANCELLED')),
    CONSTRAINT chk_permits_dates CHECK (issue_date <= expiration_date)
);

CREATE INDEX IF NOT EXISTS idx_permits_org_company ON permits(organization_id, company_id);
CREATE INDEX IF NOT EXISTS idx_permits_org_status ON permits(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_permits_expiration_date ON permits(expiration_date);
CREATE INDEX IF NOT EXISTS idx_permits_type ON permits(type);
