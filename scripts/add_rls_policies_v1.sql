-- Enable RLS for tables and set policies for authenticated users

-- forms table
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view forms" ON public.forms
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert forms" ON public.forms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update forms" ON public.forms
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete forms" ON public.forms
  FOR DELETE USING (auth.role() = 'authenticated');

-- form_elements table
ALTER TABLE public.form_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view form_elements" ON public.form_elements
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert form_elements" ON public.form_elements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update form_elements" ON public.form_elements
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete form_elements" ON public.form_elements
  FOR DELETE USING (auth.role() = 'authenticated');

-- workspaces table
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view workspaces" ON public.workspaces
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update workspaces" ON public.workspaces
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete workspaces" ON public.workspaces
  FOR DELETE USING (auth.role() = 'authenticated');

-- workspace_users table
ALTER TABLE public.workspace_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view workspace_users" ON public.workspace_users
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert workspace_users" ON public.workspace_users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update workspace_users" ON public.workspace_users
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete workspace_users" ON public.workspace_users
  FOR DELETE USING (auth.role() = 'authenticated');

-- profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update profiles" ON public.profiles
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete profiles" ON public.profiles
  FOR DELETE USING (auth.role() = 'authenticated');

-- workspace_visits table
ALTER TABLE public.workspace_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view workspace_visits" ON public.workspace_visits
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert workspace_visits" ON public.workspace_visits
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update workspace_visits" ON public.workspace_visits
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete workspace_visits" ON public.workspace_visits
  FOR DELETE USING (auth.role() = 'authenticated');
