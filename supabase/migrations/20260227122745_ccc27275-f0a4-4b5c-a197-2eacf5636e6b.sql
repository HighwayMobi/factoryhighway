
-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Allow anyone to read avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow edge functions (service role) to insert/update/delete - no user RLS needed
-- since we authenticate via highway API token in edge function

-- Create a table to map highway user IDs to avatar file paths
CREATE TABLE public.user_avatars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  highway_user_id INTEGER NOT NULL UNIQUE,
  avatar_path TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Public read so frontend can look up avatar by user ID
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read avatars"
ON public.user_avatars FOR SELECT
USING (true);
