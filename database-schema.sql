-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS plan_subjects CASCADE;
DROP TABLE IF EXISTS study_sessions_detailed CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;

-- Subjects table (updated with user_id, color, weight)
CREATE TABLE subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  weight INTEGER DEFAULT 5 CHECK (weight >= 1 AND weight <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Topics table
CREATE TABLE topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  weight INTEGER DEFAULT 5 CHECK (weight >= 1 AND weight <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans table
CREATE TABLE plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  weekly_hours INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan-Subjects relationship table
CREATE TABLE plan_subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan_id, subject_id)
);

-- Study sessions table (original - for timer)
CREATE TABLE study_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detailed study sessions table (for manual entry)
CREATE TABLE study_sessions_detailed (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  content_type TEXT NOT NULL,
  questions_resolved INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions_detailed ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subjects
CREATE POLICY "Users can view their own subjects" ON subjects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subjects" ON subjects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subjects" ON subjects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subjects" ON subjects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for topics
CREATE POLICY "Users can view their own topics" ON topics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topics" ON topics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topics" ON topics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topics" ON topics
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for plans
CREATE POLICY "Users can view their own plans" ON plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans" ON plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans" ON plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans" ON plans
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for plan_subjects
CREATE POLICY "Users can view their plan subjects" ON plan_subjects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plans WHERE plans.id = plan_subjects.plan_id AND plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their plan subjects" ON plan_subjects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM plans WHERE plans.id = plan_subjects.plan_id AND plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their plan subjects" ON plan_subjects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM plans WHERE plans.id = plan_subjects.plan_id AND plans.user_id = auth.uid()
    )
  );

-- RLS Policies for study_sessions (timer sessions)
CREATE POLICY "Users can view study sessions for their subjects" ON study_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subjects WHERE subjects.id = study_sessions.subject_id AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert study sessions for their subjects" ON study_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM subjects WHERE subjects.id = study_sessions.subject_id AND subjects.user_id = auth.uid()
    )
  );

-- RLS Policies for study_sessions_detailed
CREATE POLICY "Users can view their own detailed sessions" ON study_sessions_detailed
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own detailed sessions" ON study_sessions_detailed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own detailed sessions" ON study_sessions_detailed
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own detailed sessions" ON study_sessions_detailed
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_subjects_user_id ON subjects(user_id);
CREATE INDEX idx_topics_user_id ON topics(user_id);
CREATE INDEX idx_topics_subject_id ON topics(subject_id);
CREATE INDEX idx_plans_user_id ON plans(user_id);
CREATE INDEX idx_plan_subjects_plan_id ON plan_subjects(plan_id);
CREATE INDEX idx_study_sessions_subject_id ON study_sessions(subject_id);
CREATE INDEX idx_study_sessions_detailed_user_id ON study_sessions_detailed(user_id);
CREATE INDEX idx_study_sessions_detailed_date ON study_sessions_detailed(date);
