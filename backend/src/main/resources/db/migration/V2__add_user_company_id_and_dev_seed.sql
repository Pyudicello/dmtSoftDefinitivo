-- ====================================================================
-- PREVENIA Database Schema
-- Version: V2__add_user_company_id_and_dev_seed.sql
-- Description: Add company_id to users and seed development data
-- ====================================================================

-- 1. Alter users table to add direct company_id association (primarily for CLIENT role)
ALTER TABLE users ADD COLUMN company_id UUID;
ALTER TABLE users ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
CREATE INDEX idx_users_company_id ON users(company_id);

-- 2. Seed Organization A (Tenant 1)
INSERT INTO organizations (id, name, legal_name, tax_id, email, phone, status, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Seguridad Integral Córdoba',
    'Seguridad Integral Córdoba S.R.L.',
    '30-71234567-8',
    'contacto@seguridadcordoba.com.ar',
    '+54 351 4567890',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 3. Seed Organization B (Tenant 2 - For multi-tenant & cross-tenant isolation testing)
INSERT INTO organizations (id, name, legal_name, tax_id, email, phone, status, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111112',
    'Prevención Industrial Norte',
    'Prevención Norte S.A.',
    '30-79876543-2',
    'contacto@prevencionnorte.com.ar',
    '+54 381 4123456',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 4. Seed Companies for Organization A
INSERT INTO companies (id, organization_id, business_name, legal_name, tax_id, address, city, province, country, email, phone, status, created_at, updated_at)
VALUES
(
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    'Banco Macro',
    'Banco Macro S.A.',
    '30-50001008-4',
    'Av. Colón 450',
    'Córdoba',
    'Córdoba',
    'AR',
    'seguridad@macro.com.ar',
    '+54 351 4200000',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    'Andreani',
    'Andreani Logística S.A.',
    '30-52714245-1',
    'Ruta 19 Km 5',
    'Córdoba',
    'Córdoba',
    'AR',
    'planta.cordoba@andreani.com',
    '+54 351 4980000',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Coca-Cola Andina',
    'Embotelladora del Atlántico S.A.',
    '30-58042571-9',
    'Av. Circunvalación 1200',
    'Córdoba',
    'Córdoba',
    'AR',
    'higiene@cocacolaandina.com.ar',
    '+54 351 4750000',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 5. Seed Company for Organization B
INSERT INTO companies (id, organization_id, business_name, legal_name, tax_id, address, city, province, country, email, phone, status, created_at, updated_at)
VALUES (
    '33333333-3333-3333-3333-333333333334',
    '11111111-1111-1111-1111-111111111112',
    'TechCorp Norte',
    'TechCorp Norte S.A.',
    '30-66778899-0',
    'Parque Industrial Tucumán',
    'San Miguel de Tucumán',
    'Tucumán',
    'AR',
    'contacto@techcorpnorte.com',
    '+54 381 4890000',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 6. Seed Users (Passwords: 'Demo1234!' for demo users, 'Admin1234!' for platform admin)
-- Password hash: $2a$10$RUBlm.GW4GtT./ChJ7ThxOZxqky6itlreK3WiUbTeRs2GR4riuckq (Demo1234!)
-- Password hash: $2a$10$Kbdrl6YvoqxHij5DS0oUqe.l.hAcn0sRMKzabxRRqU0k9TnLHT0MS (Admin1234!)
INSERT INTO users (id, organization_id, company_id, first_name, last_name, email, password_hash, role, status, created_at, updated_at)
VALUES
-- Platform Global Admin
(
    '22222222-2222-2222-2222-222222222220',
    NULL,
    NULL,
    'Super',
    'Admin',
    'platform@prevenia.com',
    '$2a$10$Kbdrl6YvoqxHij5DS0oUqe.l.hAcn0sRMKzabxRRqU0k9TnLHT0MS',
    'PLATFORM_ADMIN',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Consultant Admin Org A
(
    '22222222-2222-2222-2222-222222222221',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'Ana',
    'Gutiérrez',
    'admin@demo.com',
    '$2a$10$RUBlm.GW4GtT./ChJ7ThxOZxqky6itlreK3WiUbTeRs2GR4riuckq',
    'CONSULTANT_ADMIN',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Technician Carlos (Org A)
(
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'Carlos',
    'Pérez',
    'carlos@demo.com',
    '$2a$10$RUBlm.GW4GtT./ChJ7ThxOZxqky6itlreK3WiUbTeRs2GR4riuckq',
    'TECHNICIAN',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Technician Martín (Org A)
(
    '22222222-2222-2222-2222-222222222223',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'Martín',
    'López',
    'martin@demo.com',
    '$2a$10$RUBlm.GW4GtT./ChJ7ThxOZxqky6itlreK3WiUbTeRs2GR4riuckq',
    'TECHNICIAN',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Client User (Org A -> Banco Macro)
(
    '22222222-2222-2222-2222-222222222224',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333331',
    'Roberto',
    'Macro',
    'macro@demo.com',
    '$2a$10$RUBlm.GW4GtT./ChJ7ThxOZxqky6itlreK3WiUbTeRs2GR4riuckq',
    'CLIENT',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Consultant Admin Org B
(
    '22222222-2222-2222-2222-222222222225',
    '11111111-1111-1111-1111-111111111112',
    NULL,
    'Bernardo',
    'Norte',
    'admin.b@demo.com',
    '$2a$10$RUBlm.GW4GtT./ChJ7ThxOZxqky6itlreK3WiUbTeRs2GR4riuckq',
    'CONSULTANT_ADMIN',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 7. Seed Technician Assignments (Carlos -> Macro, Carlos -> Andreani, Martin -> Coca-Cola)
INSERT INTO user_company_assignments (id, organization_id, user_id, company_id, assigned_at, active, created_at, updated_at)
VALUES
(
    '44444444-4444-4444-4444-444444444441',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333331',
    CURRENT_TIMESTAMP,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '44444444-4444-4444-4444-444444444442',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333332',
    CURRENT_TIMESTAMP,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '44444444-4444-4444-4444-444444444443',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    '33333333-3333-3333-3333-333333333333',
    CURRENT_TIMESTAMP,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
