-- Add plan_id to study_sessions_detailed table
ALTER TABLE study_sessions_detailed 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_study_sessions_detailed_plan_id 
ON study_sessions_detailed(plan_id);
