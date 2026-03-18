-- Enterprise Organization Tables
-- Stage 2.5: Enterprise groundwork schema

-- Organizations table for team/enterprise accounts
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  plan text NOT NULL DEFAULT 'enterprise',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Organization members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Organization settings table
CREATE TABLE IF NOT EXISTS public.organization_settings (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  shared_alerts boolean NOT NULL DEFAULT true,
  shared_calendar boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Update profiles table to support enterprise plan if not already present
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'family', 'enterprise'));

-- Update subscriptions table to support organization association
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS shared_with_organization boolean NOT NULL DEFAULT false;

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- RLS policy for organizations: owners/admins can manage
CREATE POLICY "Users can view their organization" ON public.organizations
  FOR SELECT USING (
    owner_user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Only owners can update organization" ON public.organizations
  FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "Only owners can delete organization" ON public.organizations
  FOR DELETE USING (owner_user_id = auth.uid());

-- Enable RLS on organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view their organization members" ON public.organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    ) OR
    user_id = auth.uid()
  );

CREATE POLICY "Organization owners/admins can manage members" ON public.organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    ) OR
    (
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Enable RLS on organization_settings
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view settings" ON public.organization_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    ) OR
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can update settings" ON public.organization_settings
  FOR UPDATE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_organizations_owner ON public.organizations(owner_user_id);
CREATE INDEX idx_organization_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_user ON public.organization_members(user_id);
CREATE INDEX idx_subscriptions_organization ON public.subscriptions(organization_id) WHERE organization_id IS NOT NULL;
