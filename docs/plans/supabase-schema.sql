-- Supabase Schema for 소개퐝
-- Apply this manually in the Supabase SQL Editor

-- Profiles table (본인 정보)
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  university TEXT NOT NULL,
  department TEXT NOT NULL,
  height INTEGER,
  height_public BOOLEAN DEFAULT true,
  weight INTEGER,
  weight_public BOOLEAN DEFAULT false,
  body_type TEXT NOT NULL,
  face_type TEXT NOT NULL,
  eye_type TEXT NOT NULL,
  mbti TEXT NOT NULL,
  religion TEXT NOT NULL,
  smoking TEXT NOT NULL,
  drinking TEXT NOT NULL,
  tattoo TEXT NOT NULL,
  contact_frequency TEXT NOT NULL,
  hobbies TEXT[] DEFAULT '{}',
  contact_method TEXT NOT NULL,
  contact_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ideal preferences table (이상형 정보)
CREATE TABLE ideal_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  height INTEGER,
  weight INTEGER,
  body_type TEXT,
  face_type TEXT,
  eye_type TEXT,
  mbti TEXT,
  religion TEXT,
  smoking TEXT,
  drinking TEXT,
  tattoo TEXT,
  contact_frequency TEXT,
  hobbies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Matching events table (소개팅 이벤트)
CREATE TABLE matching_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_male INTEGER NOT NULL,
  max_female INTEGER NOT NULL,
  current_male INTEGER DEFAULT 0,
  current_female INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Applications table (소개팅 신청)
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES matching_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_snapshot JSONB NOT NULL,
  preferences_snapshot JSONB NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideal_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only read/write their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own preferences" ON ideal_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON ideal_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON ideal_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Matching events are readable by all authenticated users
CREATE POLICY "Authenticated users can view events" ON matching_events FOR SELECT USING (auth.role() = 'authenticated');

-- Applications: users can view/insert their own
CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own application" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
