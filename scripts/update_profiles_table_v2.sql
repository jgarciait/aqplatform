-- Add email column to profiles table and create a view for user management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create or replace function to sync email from auth.users
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger AS $$
BEGIN
  -- Update email in profiles when auth.users email changes
  UPDATE public.profiles 
  SET email = NEW.email, updated_at = now()
  WHERE id = NEW.id;
  
  -- Insert profile if it doesn't exist
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.created_at, now())
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync email changes
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
CREATE TRIGGER sync_user_email_trigger
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_email();

-- Update RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Allow authenticated users to view all profiles (for user management)
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to manage all profiles (you can customize this based on your admin logic)
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_users wu
      WHERE wu.user_id = auth.uid() 
      AND wu.role = 'admin'
    )
  );

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Sync existing users
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT 
  au.id, 
  au.email, 
  au.created_at, 
  now()
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  updated_at = now();
