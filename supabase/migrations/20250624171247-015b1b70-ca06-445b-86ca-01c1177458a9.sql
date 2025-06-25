
-- First, we need a function to get the current user's role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update the complaints RLS policy to allow admins to see all complaints
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.complaints;

CREATE POLICY "Users can view complaints based on role" ON public.complaints
  FOR SELECT USING (
    auth.uid() = user_id OR 
    public.get_current_user_role() IN ('admin', 'staff')
  );

-- Also update the comments policy so admins can see all comments
DROP POLICY IF EXISTS "Users can view comments on their complaints" ON public.complaint_comments;

CREATE POLICY "Users can view comments based on role" ON public.complaint_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM complaints 
      WHERE complaints.id = complaint_comments.complaint_id 
      AND (complaints.user_id = auth.uid() OR public.get_current_user_role() IN ('admin', 'staff'))
    )
  );

-- Allow admins and staff to update complaint status
CREATE POLICY "Admins can update complaints" ON public.complaints
  FOR UPDATE USING (public.get_current_user_role() IN ('admin', 'staff'));

-- Allow admins and staff to add comments to any complaint
CREATE POLICY "Admins can add comments to any complaint" ON public.complaint_comments
  FOR INSERT WITH CHECK (
    public.get_current_user_role() IN ('admin', 'staff') OR
    (auth.uid() = user_id AND
     EXISTS (
       SELECT 1 FROM complaints 
       WHERE complaints.id = complaint_id 
       AND complaints.user_id = auth.uid()
     ))
  );
