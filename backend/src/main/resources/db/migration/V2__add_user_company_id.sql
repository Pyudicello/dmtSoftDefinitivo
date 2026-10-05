-- ====================================================================
-- PREVENIA Database Schema
-- Version: V2__add_user_company_id.sql
-- Description: Add company_id to users for direct company association (CLIENT role)
-- ====================================================================

-- 1. Alter users table to add direct company_id association
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_company;
ALTER TABLE users ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
