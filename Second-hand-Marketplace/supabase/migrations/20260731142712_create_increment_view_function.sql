/*
# Create increment_view function

## Purpose
Safely increments the view_count of a listing. Marked SECURITY DEFINER so the
anon/authenticated role can call it without needing UPDATE privileges on the
listings table (which would otherwise let any user edit any listing's view count
or other fields).

## Security
- SECURITY DEFINER: runs with the function owner's privileges.
- Search path set to public to prevent search_path injection.
- Only mutates view_count, nothing else.
*/

CREATE OR REPLACE FUNCTION public.increment_view(listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE listings SET view_count = view_count + 1 WHERE id = listing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_view(uuid) TO anon, authenticated;
