
-- Create interns table
CREATE TABLE IF NOT EXISTS interns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  work_experience TEXT,
  education TEXT NOT NULL,
  city TEXT NOT NULL,
  github TEXT,
  linkedin TEXT,
  skills TEXT NOT NULL,
  projects TEXT,
  cv_filename TEXT,
  cv_original_name TEXT,
  profile_image TEXT,
  applied_date TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create admin table
CREATE TABLE IF NOT EXISTS admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Create intern_users table
CREATE TABLE IF NOT EXISTS intern_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL UNIQUE REFERENCES interns(id) ON DELETE CASCADE,
  password TEXT NOT NULL,
  is_approved INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create weekly_updates table
CREATE TABLE IF NOT EXISTS weekly_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES interns(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  program_course_name TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  reporting_period TEXT NOT NULL,
  learning_topics TEXT,
  tasks_completed TEXT,
  work_output TEXT,
  github_repo_link TEXT,
  deployed_url TEXT,
  task_completion_status TEXT,
  self_rating INTEGER,
  time_spent TEXT,
  challenges_faced TEXT,
  solutions_attempted TEXT,
  key_learnings TEXT,
  performance_score INTEGER,
  mentor_feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES interns(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMP,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create time_logs table
CREATE TABLE IF NOT EXISTS time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES interns(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  log_type TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add new columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by_intern UUID REFERENCES interns(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  intern_id UUID NOT NULL REFERENCES interns(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in-progress',
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  repository_url TEXT,
  deployed_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES interns(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create session table for express-session
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
