
-- First, let's drop ALL existing policies on both tables to start fresh
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins and staff can view all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can create their own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins and staff can update any complaint" ON public.complaints;
DROP POLICY IF EXISTS "Users can update their own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can view comments on their complaints" ON public.complaint_comments;
DROP POLICY IF EXISTS "Admins and staff can view all comments" ON public.complaint_comments;
DROP POLICY IF EXISTS "Users can comment on their own complaints" ON public.complaint_comments;
DROP POLICY IF EXISTS "Admins and staff can comment on any complaint" ON public.complaint_comments;

-- Now create the new policies for complaints table
-- Regular users can only see their own complaints
CREATE POLICY "Users can view their own complaints" ON public.complaints
  FOR SELECT USING (auth.uid() = user_id);

-- Admins and staff can see all complaints
CREATE POLICY "Admins and staff can view all complaints" ON public.complaints
  FOR SELECT USING (public.get_current_user_role() IN ('admin', 'staff'));

-- Allow users to insert their own complaints
CREATE POLICY "Users can create their own complaints" ON public.complaints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow admins and staff to update any complaint
CREATE POLICY "Admins and staff can update any complaint" ON public.complaints
  FOR UPDATE USING (public.get_current_user_role() IN ('admin', 'staff'));

-- Allow users to update their own complaints (before admin review)
CREATE POLICY "Users can update own pending complaints" ON public.complaints
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Create policies for complaint_comments table
-- Users can view comments on their own complaints
CREATE POLICY "Users can view comments on their complaints" ON public.complaint_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.complaints 
      WHERE complaints.id = complaint_comments.complaint_id 
      AND complaints.user_id = auth.uid()
    )
  );

-- Admins and staff can view all comments
CREATE POLICY "Admins and staff can view all comments" ON public.complaint_comments
  FOR SELECT USING (public.get_current_user_role() IN ('admin', 'staff'));

-- Users can add comments to their own complaints
CREATE POLICY "Users can comment on their own complaints" ON public.complaint_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.complaints 
      WHERE complaints.id = complaint_id 
      AND complaints.user_id = auth.uid()
    )
  );

-- Admins and staff can add comments to any complaint
CREATE POLICY "Admins and staff can comment on any complaint" ON public.complaint_comments
  FOR INSERT WITH CHECK (
    public.get_current_user_role() IN ('admin', 'staff') OR
    (auth.uid() = user_id AND
     EXISTS (
       SELECT 1 FROM public.complaints 
       WHERE complaints.id = complaint_id 
       AND complaints.user_id = auth.uid()
     ))
  );

-- Ensure RLS is enabled on both tables
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;
