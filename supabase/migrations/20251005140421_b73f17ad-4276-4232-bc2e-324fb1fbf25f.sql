-- Table for tracking user moods
CREATE TABLE public.user_moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('happy', 'energized', 'neutral', 'tired', 'stressed', 'overwhelmed')),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_moods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own moods"
  ON public.user_moods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own moods"
  ON public.user_moods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Table for tracking commitment completion patterns
CREATE TABLE public.commitment_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  typical_completion_hour INTEGER CHECK (typical_completion_hour >= 0 AND typical_completion_hour <= 23),
  preferred_days TEXT[], -- e.g., ['monday', 'wednesday']
  average_completion_rate DECIMAL(3,2) DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.commitment_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patterns"
  ON public.commitment_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own patterns"
  ON public.commitment_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns"
  ON public.commitment_patterns FOR UPDATE
  USING (auth.uid() = user_id);

-- Table for AI-generated task priorities
CREATE TABLE public.task_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES public.commitments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  priority_score DECIMAL(3,2) CHECK (priority_score >= 0 AND priority_score <= 1),
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.task_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own priorities"
  ON public.task_priorities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own priorities"
  ON public.task_priorities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Table for rescheduled commitments
CREATE TABLE public.commitment_reschedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES public.commitments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_date DATE NOT NULL,
  original_time TIME NOT NULL,
  suggested_date DATE NOT NULL,
  suggested_time TIME NOT NULL,
  reason TEXT,
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.commitment_reschedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reschedules"
  ON public.commitment_reschedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reschedules"
  ON public.commitment_reschedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reschedules"
  ON public.commitment_reschedules FOR UPDATE
  USING (auth.uid() = user_id);