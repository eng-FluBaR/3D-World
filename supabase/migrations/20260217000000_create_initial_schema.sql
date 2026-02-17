-- Create initial schema with all required tables
-- Migration: create_initial_schema
-- Created: 2026-02-17

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'super_admin')),
  is_disabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'super_admin')
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Super admin can manage all profiles"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Requests table
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  file_name TEXT,
  file_path TEXT,
  file_url TEXT,
  material TEXT,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'quoted', 'accepted', 'rejected', 'completed')
  ),
  price NUMERIC(10, 2),
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on requests
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Requests RLS policies
CREATE POLICY "Users can view own requests"
  ON public.requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON public.requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'super_admin')
    )
  );

CREATE POLICY "Users can create own requests"
  ON public.requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update requests"
  ON public.requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'super_admin')
    )
  );

-- Materials table
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on materials
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Materials RLS policies
CREATE POLICY "Everyone can view materials"
  ON public.materials FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage materials"
  ON public.materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'super_admin')
    )
  );

-- CMS Pages table
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on cms_pages
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

-- CMS Pages RLS policies
CREATE POLICY "Everyone can view cms pages"
  ON public.cms_pages FOR SELECT
  USING (true);

CREATE POLICY "Super admin can manage cms pages"
  ON public.cms_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_requests_user_id ON public.requests(user_id);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_created_at ON public.requests(created_at);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_cms_pages_slug ON public.cms_pages(slug);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_requests_timestamp BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_materials_timestamp BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_cms_pages_timestamp BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
