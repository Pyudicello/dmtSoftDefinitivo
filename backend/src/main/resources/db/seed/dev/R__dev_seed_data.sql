-- ====================================================================
-- PREVENIA - Development & Testing Seed Data (REPEATABLE MIGRATION)
-- File: R__dev_seed_data.sql
-- Description: Isolated seed data for local development, demo and test environments.
--              NOT executed in production migrations.
-- ====================================================================

-- 1. Seed Organizations
INSERT INTO organizations (id, name, legal_name, tax_id, email, phone, status, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Seguridad Integral Córdoba', 'Seguridad Integral Córdoba S.R.L.', '30-71234567-8', 'contacto@seguridadcordoba.com.ar', '+54 351 4567890', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('11111111-1111-1111-1111-111111111112', 'Prevención Industrial Norte', 'Prevención Norte S.A.', '30-79876543-2', 'contacto@prevencionnorte.com.ar', '+54 381 4123456', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Seed Companies
INSERT INTO companies (id, organization_id, business_name, legal_name, tax_id, address, city, province, country, email, phone, status, created_at, updated_at)
VALUES
    ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Banco Macro', 'Banco Macro S.A.', '30-50001008-4', 'Av. Colón 450', 'Córdoba', 'Córdoba', 'AR', 'seguridad@macro.com.ar', '+54 351 4200000', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Andreani', 'Andreani Logística S.A.', '30-52714245-1', 'Ruta 19 Km 5', 'Córdoba', 'Córdoba', 'AR', 'planta.cordoba@andreani.com', '+54 351 4980000', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Coca-Cola Andina', 'Embotelladora del Atlántico S.A.', '30-58042571-9', 'Av. Circunvalación 1200', 'Córdoba', 'Córdoba', 'AR', 'higiene@cocacolaandina.com.ar', '+54 351 4750000', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111112', 'TechCorp Norte', 'TechCorp Norte S.A.', '30-66778899-0', 'Parque Industrial Tucumán', 'San Miguel de Tucumán', 'Tucumán', 'AR', 'contacto@techcorpnorte.com', '+54 381 4890000', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Seed Users (Passwords: 'Demo1234!' for demo users, 'Admin1234!' for platform admin)
-- Password hash: $2a$10$RUBlm.GW4GtT./ChJ7ThxOZxqky6itlreK3WiUbTeRs2GR4riuckq (Demo1234!)
-- Password hash: $2a$10$Kbdrl6YvoqxHij5DS0oUqe.l.hAcn0sRMKzabxRRqU0k9TnLHT0MS (Admin1234!)
INSERT INTO users (id, organization_id, company_id, first_name, last_name, email, password_hash, role, status, created_at, updated_at)
VALUES
    ('22222222-2222-2222-2222-222222222220', NULL, NULL, 'Super', 'Admin', 'platform@prevenia.com', '$2a$10$Kbdrl6YvoqxHij5DS0oUqe.l.hAcn0sRMKzabxRRqU0k9TnLHT0MS', 'PLATFORM_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', NULL, 'Ana', 'Gutiérrez', 'admin@demo.com', '$2a$10$RUBlm.GW4GtT./ChJ7ThxOZxqky6itlreK3WiUbTeRs2GR4riuckq', 'CONSULTANT_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', NULL, 'Carlos', 'Pérez', 'carlos@demo.com', '$2a$10$RUBlm.GW4GtT./ChJ7ThxOZxqky6itlreK3WiUbTeRs2GR4riuckq', 'TECHNICIAN', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', NULL, 'Martín', 'López', 'martin@demo.com', '$2a$10$RUBlm.GW4GtT./ChJ7ThxOZxqky6itlreK3WiUbTeRs2GR4riuckq', 'TECHNICIAN', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Roberto', 'Macro', 'macro@demo.com', '$2a$10$RUBlm.GW4GtT./ChJ7ThxOZxqky6itlreK3WiUbTeRs2GR4riuckq', 'CLIENT', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111112', NULL, 'Bernardo', 'Norte', 'admin.b@demo.com', '$2a$10$RUBlm.GW4GtT./ChJ7ThxOZxqky6itlreK3WiUbTeRs2GR4riuckq', 'CONSULTANT_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. Seed Technician Assignments
INSERT INTO user_company_assignments (id, organization_id, user_id, company_id, assigned_at, active, created_at, updated_at)
VALUES
    ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333331', CURRENT_TIMESTAMP, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333332', CURRENT_TIMESTAMP, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', '33333333-3333-3333-3333-333333333333', CURRENT_TIMESTAMP, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. Seed Dev Expirations
INSERT INTO expirations (id, organization_id, company_id, category_id, title, description, issue_date, expiration_date, status, responsible_user_id, recurrence_type, notification_days_before, notes, version, created_at, updated_at)
VALUES
    -- 1. Macro: Matafuegos Vencido (2026-09-08) -> EXPIRED
    ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'a0000000-0000-0000-0000-000000000001', 'Recarga anual matafuegos sucursal Centro', 'Control de carga y tarjeta de extintores de polvo ABC y CO2', '2025-09-08', '2026-09-08', 'ACTIVE', '22222222-2222-2222-2222-222222222222', 'YEARLY', 30, 'Proveedor: Extintores Córdoba', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- 2. Macro: Capacitacion Vence Hoy (2026-09-09) -> URGENT
    ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'a0000000-0000-0000-0000-000000000002', 'Capacitación de evacuación y roles de emergencia', 'Capacitación al personal administrativo según Ley 19587', '2026-08-09', '2026-09-09', 'ACTIVE', '22222222-2222-2222-2222-222222222222', 'SEMIANNUAL', 15, 'Sala de conferencias piso 3', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- 3. Macro: ART Vence en 6 dias (2026-09-15) -> URGENT
    ('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'a0000000-0000-0000-0000-000000000003', 'Renovación nómina y cláusula no repetición ART', 'Certificados de cobertura con cláusula de no repetición para contratistas', '2026-08-15', '2026-09-15', 'ACTIVE', '22222222-2222-2222-2222-222222222222', 'MONTHLY', 10, 'Aseguradora: Prevención ART', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- 4. Macro: Visita Tecnica Vence en 16 dias (2026-09-25) -> UPCOMING
    ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'a0000000-0000-0000-0000-000000000004', 'Visita técnica trimestral y relevamiento de riesgos', 'Recorrida en planta, verificación de salidas de emergencia y botiquines', '2026-06-25', '2026-09-25', 'ACTIVE', '22222222-2222-2222-2222-222222222222', 'QUARTERLY', 30, 'Coordinar con Gerencia de Operaciones', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- 5. Macro: Medicion PAT Vence en 41 dias (2026-10-20) -> CURRENT / VIGENTE
    ('44444444-4444-4444-4444-444444444445', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'a0000000-0000-0000-0000-000000000008', 'Protocolo de medición de puesta a tierra (PAT)', 'Medición de continuidad de jabalinas y certificación COPIME', '2025-10-20', '2026-10-20', 'ACTIVE', '22222222-2222-2222-2222-222222222222', 'YEARLY', 30, 'Requiere telurímetro calibrado', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- 6. Macro: Ascensor Completado
    ('44444444-4444-4444-4444-444444444446', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'a0000000-0000-0000-0000-000000000005', 'Mantenimiento semestral de montacargas', 'Revisión de cables de tracción, paracaídas y libro de inspección', '2026-03-01', '2026-09-01', 'COMPLETED', '22222222-2222-2222-2222-222222222222', 'SEMIANNUAL', 30, 'Realizado por Otis SA', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- 7. Andreani: Autoelevador Vence en 3 dias (2026-09-12) -> URGENT
    ('44444444-4444-4444-4444-444444444447', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', 'a0000000-0000-0000-0000-000000000006', 'Verificación técnica vehicular de autoelevadores', 'Checklist de seguridad de uñas, luces de advertencia y cinturón', '2026-08-12', '2026-09-12', 'ACTIVE', '22222222-2222-2222-2222-222222222222', 'MONTHLY', 15, 'Flota de 6 autoelevadores en depósito central', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- 8. Andreani: Seguro Vence en 21 dias (2026-09-30) -> UPCOMING
    ('44444444-4444-4444-4444-444444444448', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', 'a0000000-0000-0000-0000-000000000007', 'Póliza de seguro de responsabilidad civil comprensiva', 'Renovación de póliza anual de operaciones logísticas', '2025-09-30', '2026-09-30', 'ACTIVE', '22222222-2222-2222-2222-222222222222', 'YEARLY', 30, 'Compañía: La Segunda Seguros', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- 9. Coca-Cola: Plan Evacuación Vencido (2026-09-05) -> EXPIRED (Asignado a Martin)
    ('44444444-4444-4444-4444-444444444449', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-000000000010', 'Simulacro general de evacuación planta embotelladora', 'Simulacro semestral de derrame químico y evacuación de líneas de producción', '2026-03-05', '2026-09-05', 'ACTIVE', '22222222-2222-2222-2222-222222222223', 'SEMIANNUAL', 30, 'Participación de Bomberos Voluntarios', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- 10. TechCorp (Org B): Documentación Vence en 5 dias (2026-09-14) -> URGENT
    ('44444444-4444-4444-4444-444444444450', '11111111-1111-1111-1111-111111111112', '33333333-3333-3333-3333-333333333334', 'a0000000-0000-0000-0000-000000000009', 'Habilitación de bomberos edificio corporativo', 'Inspección final y oblea de seguridad contra incendios', '2025-09-14', '2026-09-14', 'ACTIVE', '22222222-2222-2222-2222-222222222225', 'YEARLY', 30, 'Trámite municipal expediente 4482/2025', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
