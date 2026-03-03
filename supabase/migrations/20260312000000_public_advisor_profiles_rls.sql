-- Allow anonymous (logged-out) users to read profiles that belong to advisors.
-- This is needed for the advisor listing page join (advisor_details → profiles)
-- to return full_name and avatar_url when the user is not authenticated.
-- Client profiles remain private — only advisor profiles are exposed.

DROP POLICY IF EXISTS "Public can view advisor profiles" ON public.profiles;
CREATE POLICY "Public can view advisor profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.advisor_details
      WHERE advisor_details.id = profiles.id
    )
  );
