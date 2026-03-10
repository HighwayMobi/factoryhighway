
-- Drop the existing RESTRICTIVE policy
DROP POLICY IF EXISTS "Anyone can read avatars" ON public.user_avatars;

-- Create PERMISSIVE SELECT policy for public read access
CREATE POLICY "Anyone can read avatars"
ON public.user_avatars
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

-- Create PERMISSIVE INSERT policy for edge function (service role)
CREATE POLICY "Service role can insert avatars"
ON public.user_avatars
AS PERMISSIVE
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create PERMISSIVE UPDATE policy for edge function (service role)
CREATE POLICY "Service role can update avatars"
ON public.user_avatars
AS PERMISSIVE
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
