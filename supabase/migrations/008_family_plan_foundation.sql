-- Family Plan Foundation
-- Creates tables for family groups, members, invites, and seat add-ons
-- F0/F1 Batch: Foundation only, no business logic or triggers

-- A. family_groups table
-- Represents a family plan subscription with one owner and multiple members
CREATE TABLE IF NOT EXISTS public.family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled')),
  included_member_limit INTEGER NOT NULL DEFAULT 4 CHECK (included_member_limit >= 0),
  extra_member_price_inr NUMERIC(10,2) NOT NULL DEFAULT 99 CHECK (extra_member_price_inr >= 0),
  extra_seat_count INTEGER NOT NULL DEFAULT 0 CHECK (extra_seat_count >= 0),
  current_period_start TIMESTAMPTZ NULL,
  current_period_end TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for owner lookup
CREATE INDEX idx_family_groups_owner_user_id ON public.family_groups(owner_user_id);

-- Index for status queries
CREATE INDEX idx_family_groups_status ON public.family_groups(status);

-- Index for renewal period queries
CREATE INDEX idx_family_groups_current_period_end ON public.family_groups(current_period_end);

-- Partial unique index: Owner can only have one active/past_due family group
CREATE UNIQUE INDEX idx_family_groups_owner_active ON public.family_groups(owner_user_id)
  WHERE status IN ('active', 'past_due');

-- Enable RLS
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;

-- RLS: Owner can view their own family group
CREATE POLICY family_groups_owner_select ON public.family_groups
  FOR SELECT
  USING (auth.uid() = owner_user_id);

-- RLS: Active members can view their family group
CREATE POLICY family_groups_members_select ON public.family_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_group_id = family_groups.id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- RLS: Owner can update their own family group
CREATE POLICY family_groups_owner_update ON public.family_groups
  FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- B. family_members table
-- Tracks members in a family group (owner + invited members)
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (email <> ''),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
  seat_type TEXT NOT NULL DEFAULT 'included' CHECK (seat_type IN ('owner', 'included', 'extra')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at TIMESTAMPTZ NULL,
  removed_by UUID NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for family group lookup
CREATE INDEX idx_family_members_family_group_id ON public.family_members(family_group_id);

-- Index for user lookup
CREATE INDEX idx_family_members_user_id ON public.family_members(user_id);

-- Index for email lookup (case-insensitive)
CREATE INDEX idx_family_members_email ON public.family_members(LOWER(email));

-- Index for status queries
CREATE INDEX idx_family_members_status ON public.family_members(status);

-- Index for role queries
CREATE INDEX idx_family_members_role ON public.family_members(role);

-- Partial unique index: User can't have two active memberships in same family group
CREATE UNIQUE INDEX idx_family_members_active_user ON public.family_members(family_group_id, user_id)
  WHERE status = 'active';

-- Partial unique index: Family group can't have duplicate active emails
CREATE UNIQUE INDEX idx_family_members_active_email ON public.family_members(family_group_id, LOWER(email))
  WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- RLS: Owner can view all members in their family group
CREATE POLICY family_members_owner_select ON public.family_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members owner
      WHERE owner.family_group_id = family_members.family_group_id
      AND owner.user_id = auth.uid()
      AND owner.role = 'owner'
      AND owner.status = 'active'
    )
  );

-- RLS: Active members can view members in their family group
CREATE POLICY family_members_members_select ON public.family_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members self
      WHERE self.family_group_id = family_members.family_group_id
      AND self.user_id = auth.uid()
      AND self.status = 'active'
    )
  );

-- RLS: Member can view their own membership
CREATE POLICY family_members_self_select ON public.family_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: Owner can update members in their family group
CREATE POLICY family_members_owner_update ON public.family_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members owner
      WHERE owner.family_group_id = family_members.family_group_id
      AND owner.user_id = auth.uid()
      AND owner.role = 'owner'
      AND owner.status = 'active'
    )
  );

-- C. family_invites table
-- Tracks pending and accepted invitations to join a family group
CREATE TABLE IF NOT EXISTS public.family_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL CHECK (invited_email <> ''),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  seat_type TEXT NOT NULL DEFAULT 'included' CHECK (seat_type IN ('included', 'extra')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_by UUID NULL REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ NULL,
  cancelled_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT expires_after_created CHECK (expires_at > created_at)
);

-- Index for family group lookup
CREATE INDEX idx_family_invites_family_group_id ON public.family_invites(family_group_id);

-- Index for email lookup (case-insensitive)
CREATE INDEX idx_family_invites_email ON public.family_invites(LOWER(invited_email));

-- Index for invited_by lookup
CREATE INDEX idx_family_invites_invited_by ON public.family_invites(invited_by);

-- Index for status queries
CREATE INDEX idx_family_invites_status ON public.family_invites(status);

-- Index for expiry queries
CREATE INDEX idx_family_invites_expires_at ON public.family_invites(expires_at);

-- Index for token lookup (for invite acceptance)
CREATE INDEX idx_family_invites_token_hash ON public.family_invites(token_hash);

-- Partial unique index: Family group can't have duplicate pending invites for same email
CREATE UNIQUE INDEX idx_family_invites_pending_email ON public.family_invites(family_group_id, LOWER(invited_email))
  WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

-- RLS: Owner can view invites for their family group
CREATE POLICY family_invites_owner_select ON public.family_invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members owner
      WHERE owner.family_group_id = family_invites.family_group_id
      AND owner.user_id = auth.uid()
      AND owner.role = 'owner'
      AND owner.status = 'active'
    )
  );

-- RLS: Owner can update invites for their family group
CREATE POLICY family_invites_owner_update ON public.family_invites
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members owner
      WHERE owner.family_group_id = family_invites.family_group_id
      AND owner.user_id = auth.uid()
      AND owner.role = 'owner'
      AND owner.status = 'active'
    )
  );

-- D. family_seat_addons table
-- Tracks extra member seat subscriptions (₹99/month each)
CREATE TABLE IF NOT EXISTS public.family_seat_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_inr_per_seat NUMERIC(10,2) NOT NULL DEFAULT 99 CHECK (price_inr_per_seat >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_start TIMESTAMPTZ NULL,
  current_period_end TIMESTAMPTZ NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for family group lookup
CREATE INDEX idx_family_seat_addons_family_group_id ON public.family_seat_addons(family_group_id);

-- Index for status queries
CREATE INDEX idx_family_seat_addons_status ON public.family_seat_addons(status);

-- Index for renewal period queries
CREATE INDEX idx_family_seat_addons_current_period_end ON public.family_seat_addons(current_period_end);

-- Enable RLS
ALTER TABLE public.family_seat_addons ENABLE ROW LEVEL SECURITY;

-- RLS: Owner can view add-ons for their family group
CREATE POLICY family_seat_addons_owner_select ON public.family_seat_addons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members owner
      WHERE owner.family_group_id = family_seat_addons.family_group_id
      AND owner.user_id = auth.uid()
      AND owner.role = 'owner'
      AND owner.status = 'active'
    )
  );

-- RLS: Owner can update add-ons for their family group
CREATE POLICY family_seat_addons_owner_update ON public.family_seat_addons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members owner
      WHERE owner.family_group_id = family_seat_addons.family_group_id
      AND owner.user_id = auth.uid()
      AND owner.role = 'owner'
      AND owner.status = 'active'
    )
  );

-- Add triggers for updated_at using existing update_updated_at_column function
DROP TRIGGER IF EXISTS update_family_groups_updated_at ON public.family_groups;
CREATE TRIGGER update_family_groups_updated_at BEFORE UPDATE ON public.family_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_members_updated_at ON public.family_members;
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_invites_updated_at ON public.family_invites;
CREATE TRIGGER update_family_invites_updated_at BEFORE UPDATE ON public.family_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_seat_addons_updated_at ON public.family_seat_addons;
CREATE TRIGGER update_family_seat_addons_updated_at BEFORE UPDATE ON public.family_seat_addons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant basic select to authenticated users (can view their own data via RLS)
GRANT SELECT ON public.family_groups TO authenticated;
GRANT SELECT ON public.family_members TO authenticated;
GRANT SELECT ON public.family_invites TO authenticated;
GRANT SELECT ON public.family_seat_addons TO authenticated;

-- Comments
COMMENT ON TABLE public.family_groups IS 'Family plan subscriptions. One owner + up to 4 included members + extra members.';
COMMENT ON TABLE public.family_members IS 'Members in a family group. Owner created group, others were invited.';
COMMENT ON TABLE public.family_invites IS 'Pending and accepted invitations to join a family group.';
COMMENT ON TABLE public.family_seat_addons IS 'Extra member seat subscriptions. Each seat costs ₹99/month.';
COMMENT ON COLUMN public.family_groups.status IS 'active, past_due, or cancelled';
COMMENT ON COLUMN public.family_groups.included_member_limit IS 'Number of members included in base family plan (default 4)';
COMMENT ON COLUMN public.family_groups.extra_seat_count IS 'Number of extra member seats purchased';
COMMENT ON COLUMN public.family_members.seat_type IS 'owner, included (within 4), or extra (additional purchase)';
COMMENT ON COLUMN public.family_invites.status IS 'pending, accepted, expired, or cancelled';
COMMENT ON COLUMN public.family_invites.token_hash IS 'Hashed token used in invite email links';
COMMENT ON COLUMN public.family_seat_addons.status IS 'active, cancelled, or past_due';
COMMENT ON COLUMN public.family_seat_addons.cancel_at_period_end IS 'If true, cancel after current period ends';
