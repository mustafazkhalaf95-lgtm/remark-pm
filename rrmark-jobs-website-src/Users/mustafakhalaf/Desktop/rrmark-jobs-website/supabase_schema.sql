-- SQL Script to create the `applications` table and storage bucket policy for CVs

-- 1. Create the applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    role TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    years_experience INTEGER DEFAULT 0 NOT NULL,
    expected_salary TEXT,
    strongest_skill TEXT,
    portfolio_url TEXT,
    why_join TEXT NOT NULL,
    cv_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending'::text NOT NULL
);

-- 2. Setup Row Level Security (RLS) for applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert applications
CREATE POLICY "Enable insert for anonymous users" 
ON public.applications FOR INSERT 
TO anon 
WITH CHECK (true);

-- Allow authenticated users to view applications
CREATE POLICY "Enable read for authenticated users" 
ON public.applications FOR SELECT 
TO authenticated 
USING (true);


-- 3. Storage Setup for CVs
-- Create the cvs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage Policies
-- Allow anyone to upload a CV
CREATE POLICY "Anyone can upload a CV"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'cvs' );

-- Allow anyone to read CVs (so hr can download them)
CREATE POLICY "Anyone can view CVs"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'cvs' );
