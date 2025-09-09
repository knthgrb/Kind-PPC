-- Create user_verifications table
CREATE TABLE public.user_verifications (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NULL,
  barangay_clearance_url text NULL,
  clinic_certificate_url text NULL,
  valid_id_url text NULL,
  additional_documents jsonb NULL,
  verification_status public.verification_status NULL DEFAULT 'pending'::verification_status,
  admin_notes text NULL,
  verified_by uuid NULL,
  verified_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT user_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT user_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT user_verifications_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES users (id)
) TABLESPACE pg_default;

-- Create admin_actions table
CREATE TABLE public.admin_actions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  admin_id uuid NULL,
  target_user_id uuid NULL,
  action_type character varying(50) NOT NULL,
  description text NULL,
  details jsonb NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT admin_actions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT admin_actions_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES users (id)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX idx_user_verifications_user_id ON public.user_verifications(user_id);
CREATE INDEX idx_user_verifications_status ON public.user_verifications(verification_status);
CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target_user_id ON public.admin_actions(target_user_id);
CREATE INDEX idx_admin_actions_action_type ON public.admin_actions(action_type);
