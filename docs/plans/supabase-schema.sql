-- Supabase Schema for 소개퐝 v2
-- Apply this manually in the Supabase SQL Editor

-- Profiles table (기본 정보만)
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  university TEXT NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Blind profiles table (블라인드 소개팅 상세 프로필)
CREATE TABLE blind_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES matching_events(id) ON DELETE CASCADE,
  height INTEGER,
  height_public BOOLEAN DEFAULT true,
  body_type TEXT NOT NULL,
  face_type TEXT NOT NULL,
  eye_type TEXT NOT NULL,
  mbti TEXT NOT NULL,
  religion TEXT NOT NULL,
  smoking TEXT NOT NULL,
  drinking TEXT NOT NULL,
  tattoo TEXT NOT NULL,
  contact_frequency TEXT NOT NULL,
  interests TEXT[] DEFAULT '{}',
  personality TEXT[] DEFAULT '{}',
  date_style TEXT[] DEFAULT '{}',
  dating_style TEXT,
  contact_method TEXT NOT NULL,
  contact_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Ideal preferences table (이상형 정보)
CREATE TABLE ideal_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES matching_events(id) ON DELETE CASCADE,
  height_min INTEGER,
  height_max INTEGER,
  body_type TEXT,
  face_type TEXT,
  eye_type TEXT,
  mbti TEXT,
  religion TEXT,
  smoking TEXT,
  drinking TEXT,
  tattoo TEXT,
  contact_frequency TEXT,
  interests TEXT[] DEFAULT '{}',
  personality TEXT[] DEFAULT '{}',
  date_style TEXT[] DEFAULT '{}',
  dating_style TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Matching events table (소개팅 이벤트)
CREATE TABLE matching_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('blind_online', 'blind_offline', 'rotation', 'other')),
  description TEXT,
  photo_setting TEXT DEFAULT 'none' CHECK (photo_setting IN ('none', 'optional', 'required')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_male INTEGER NOT NULL,
  max_female INTEGER NOT NULL,
  current_male INTEGER DEFAULT 0,
  current_female INTEGER DEFAULT 0,
  male_domains TEXT[] DEFAULT '{}',
  female_domains TEXT[] DEFAULT '{}',
  allow_all_domains BOOLEAN DEFAULT true,
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
  photo_url TEXT,
  applied_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Matches table (매칭 결과)
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES matching_events(id) ON DELETE CASCADE NOT NULL,
  male_user_id UUID REFERENCES auth.users(id) NOT NULL,
  female_user_id UUID REFERENCES auth.users(id) NOT NULL,
  compatibility_score FLOAT,
  status TEXT DEFAULT 'matched' CHECK (status IN ('matched', 'contacted', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, male_user_id),
  UNIQUE(event_id, female_user_id)
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Users can view their own matches
CREATE POLICY "Users can view own matches" ON matches FOR SELECT
  USING (auth.uid() = male_user_id OR auth.uid() = female_user_id);

-- Chat rooms table
CREATE TABLE chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES matching_events(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat participants
CREATE TABLE chat_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'contact_share')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat RLS: participants can read/write their rooms
CREATE POLICY "Participants can view rooms" ON chat_rooms FOR SELECT
  USING (id IN (SELECT room_id FROM chat_participants WHERE user_id = auth.uid()));

CREATE POLICY "Participants can view participants" ON chat_participants FOR SELECT
  USING (room_id IN (SELECT room_id FROM chat_participants WHERE user_id = auth.uid()));

CREATE POLICY "Participants can view messages" ON chat_messages FOR SELECT
  USING (room_id IN (SELECT room_id FROM chat_participants WHERE user_id = auth.uid()));

CREATE POLICY "Participants can send messages" ON chat_messages FOR INSERT
  WITH CHECK (room_id IN (SELECT room_id FROM chat_participants WHERE user_id = auth.uid()));

-- Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Storage bucket for blind date photos
-- Create via Supabase Dashboard: Storage > New Bucket > "blind-photos" (private)
-- RLS: authenticated users can upload to their own folder, admin can read all

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blind_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideal_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies: blind_profiles
CREATE POLICY "Users can view own blind profile" ON blind_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own blind profile" ON blind_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own blind profile" ON blind_profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies: ideal_preferences
CREATE POLICY "Users can view own preferences" ON ideal_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON ideal_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON ideal_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Matching events are readable by all authenticated users
CREATE POLICY "Authenticated users can view events" ON matching_events FOR SELECT USING (auth.role() = 'authenticated');

-- Applications: users can view/insert their own
CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own application" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
