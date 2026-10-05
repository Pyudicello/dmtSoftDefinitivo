-- ====================================================================
-- PREVENIA Database Schema
-- Version: V3__update_expiration_core.sql
-- Description: Core Expiration engine schema updates, constraints, and indexes
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
