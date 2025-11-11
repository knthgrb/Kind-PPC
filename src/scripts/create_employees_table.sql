-- Create employees table
-- This table stores employee records associated with job posts for KindBossing users

CREATE TABLE IF NOT EXISTS public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kindbossing_user_id uuid NOT NULL,
  kindtao_user_id uuid NOT NULL,
  job_post_id uuid NOT NULL,
  status character varying NOT NULL DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT employees_pkey PRIMARY KEY (id),
  CONSTRAINT employees_kindbossing_user_id_fkey FOREIGN KEY (kindbossing_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT employees_kindtao_user_id_fkey FOREIGN KEY (kindtao_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT employees_job_post_id_fkey FOREIGN KEY (job_post_id) REFERENCES public.job_posts(id) ON DELETE CASCADE,
  CONSTRAINT employees_status_check CHECK (status IN ('active', 'inactive'))
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_employees_kindbossing_user_id ON public.employees(kindbossing_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_kindtao_user_id ON public.employees(kindtao_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_job_post_id ON public.employees(job_post_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);

-- Disable RLS (Row Level Security)
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;

