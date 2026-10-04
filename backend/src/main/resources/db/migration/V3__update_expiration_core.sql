-- ====================================================================
-- PREVENIA Database Schema
-- Version: V3__update_expiration_core.sql
-- Description: Core Expiration engine updates, constraints, and dev seed data
-- ====================================================================

-- 1. Update Expirations Status Constraint to allow ACTIVE, COMPLETED, CANCELLED
ALTER TABLE expirations DROP CONSTRAINT IF EXISTS chk_expirations_status;
UPDATE expirations SET status = 'ACTIVE' WHERE status = 'PENDING';
ALTER TABLE expirations ADD CONSTRAINT chk_expirations_status CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED'));

-- 2. Add Completion, Cancellation, Version, and Constraint columns to Expirations
ALTER TABLE expirations ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE expirations ADD COLUMN IF NOT EXISTS completion_notes TEXT;
ALTER TABLE expirations ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE expirations ADD COLUMN IF NOT EXISTS cancel_reason VARCHAR(255);
ALTER TABLE expirations ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- 3. Add date sanity check constraint
ALTER TABLE expirations DROP CONSTRAINT IF EXISTS chk_expirations_issue_date;
ALTER TABLE expirations ADD CONSTRAINT chk_expirations_issue_date CHECK (issue_date IS NULL OR issue_date <= expiration_date);

-- 4. Category index
CREATE INDEX IF NOT EXISTS idx_categories_org_code ON expiration_categories (organization_id, code);

-- 5. Seed Dev Expirations for Development & Testing
-- Organization A: 11111111-1111-1111-1111-111111111111
-- Banco Macro: 33333333-3333-3333-3333-333333333331
-- Andreani: 33333333-3333-3333-3333-333333333332
-- Coca-Cola: 33333333-3333-3333-3333-333333333333
-- TechCorp (Org B): 33333333-3333-3333-3333-333333333334
-- Users: Carlos (22222222-2222-2222-2222-222222222222), Martin (22222222-2222-2222-2222-222222222223), Admin Org B (22222222-2222-2222-2222-222222222226)
-- Categories: MATAFUEGOS (a0000000-0000-0000-0000-000000000001), CAPACITACION (a0000000-0000-0000-0000-000000000002), ART (a0000000-0000-0000-0000-000000000003), VISITA_TECNICA (a0000000-0000-0000-0000-000000000004), ASCENSOR (a0000000-0000-0000-0000-000000000005), AUTOELEVADOR (a0000000-0000-0000-0000-000000000006), SEGURO (a0000000-0000-0000-0000-000000000007), MEDICION (a0000000-0000-0000-0000-000000000008), DOCUMENTACION (a0000000-0000-0000-0000-000000000009), PLAN_EVACUACION (a0000000-0000-0000-0000-000000000010)

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

