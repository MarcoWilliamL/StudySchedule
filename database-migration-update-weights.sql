-- Update weight constraints for subjects and topics to 1-5 range

-- Drop old constraints
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_weight_check;
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_weight_check;

-- Add new constraints (1-5)
ALTER TABLE subjects ADD CONSTRAINT subjects_weight_check CHECK (weight >= 1 AND weight <= 5);
ALTER TABLE topics ADD CONSTRAINT topics_weight_check CHECK (weight >= 1 AND weight <= 5);

-- Update existing weights that are > 5 to fit new range
-- Scale down: if weight > 5, divide by 2 and round
UPDATE subjects SET weight = LEAST(5, GREATEST(1, ROUND(weight::numeric / 2))) WHERE weight > 5;
UPDATE topics SET weight = LEAST(5, GREATEST(1, ROUND(weight::numeric / 2))) WHERE weight > 5;
