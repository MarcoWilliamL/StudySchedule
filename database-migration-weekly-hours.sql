-- Add weekly_hours column to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS weekly_hours INTEGER DEFAULT 20;

-- Update existing plans to have default value
UPDATE plans SET weekly_hours = 20 WHERE weekly_hours IS NULL;
