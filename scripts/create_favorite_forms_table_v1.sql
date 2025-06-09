CREATE TABLE IF NOT EXISTS public.favorite_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  form_id uuid REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  favorite boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, form_id)
);

ALTER TABLE public.favorite_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorite forms" ON public.favorite_forms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite forms" ON public.favorite_forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite forms" ON public.favorite_forms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite forms" ON public.favorite_forms
  FOR DELETE USING (auth.uid() = user_id);
