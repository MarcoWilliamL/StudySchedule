-- Create weekly_schedules table to persist generated schedules
CREATE TABLE IF NOT EXISTS weekly_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL,
  schedule_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, week_start_date)
);

-- Enable Row Level Security
ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own schedules" ON weekly_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules" ON weekly_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" ON weekly_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules" ON weekly_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_weekly_schedules_user_id ON weekly_schedules(user_id);
CREATE INDEX idx_weekly_schedules_plan_week ON weekly_schedules(plan_id, week_start_date);
