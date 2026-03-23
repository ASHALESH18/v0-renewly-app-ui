-- Stage 3: Billing and Payment Infrastructure
-- Add payment and subscription management tables

-- Add billing columns to profiles (only if they don't exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS razorpay_customer_id VARCHAR(255) NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'paused', 'cancelled'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_cycle_start DATE NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_cycle_end DATE NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS next_billing_date DATE NULL;

-- Create billing_orders table (for tracking Razorpay orders)
CREATE TABLE IF NOT EXISTS public.billing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(255) NOT NULL UNIQUE,
  razorpay_payment_id VARCHAR(255) NULL,
  plan_id VARCHAR(50) NOT NULL,
  amount BIGINT NOT NULL, -- Amount in paise
  status VARCHAR(50) NOT NULL DEFAULT 'created', -- created, attempted, completed, failed
  notes JSONB NULL,
  created_at TIMESTAMP DEFAULT now(),
  processed_at TIMESTAMP NULL,
  CONSTRAINT valid_status CHECK (status IN ('created', 'attempted', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_billing_orders_user_id ON public.billing_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_orders_razorpay_order_id ON public.billing_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_billing_orders_status ON public.billing_orders(status);

-- Create billing_records table (for audit trail)
CREATE TABLE IF NOT EXISTS public.billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_payment_id VARCHAR(255) NOT NULL,
  razorpay_order_id VARCHAR(255) NOT NULL,
  plan_id VARCHAR(50) NOT NULL,
  amount BIGINT NOT NULL, -- Amount in paise
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
  notes JSONB NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'failed', 'refunded'))
);

CREATE INDEX IF NOT EXISTS idx_billing_records_user_id ON public.billing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_razorpay_payment_id ON public.billing_records(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_status ON public.billing_records(status);
CREATE INDEX IF NOT EXISTS idx_billing_records_created_at ON public.billing_records(created_at DESC);

-- Enable RLS for billing tables
ALTER TABLE public.billing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own billing orders
CREATE POLICY billing_orders_user_isolation ON public.billing_orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users cannot modify billing orders (server only)
CREATE POLICY billing_orders_no_insert ON public.billing_orders
  FOR INSERT
  WITH CHECK (false);

-- RLS Policy: Users can only see their own billing records
CREATE POLICY billing_records_user_isolation ON public.billing_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users cannot modify billing records (server only)
CREATE POLICY billing_records_no_insert ON public.billing_records
  FOR INSERT
  WITH CHECK (false);

-- Grant access to authenticated users
GRANT SELECT ON public.billing_orders TO authenticated;
GRANT SELECT ON public.billing_records TO authenticated;

-- Comments
COMMENT ON TABLE public.billing_orders IS 'Tracks Razorpay orders for plan upgrades';
COMMENT ON TABLE public.billing_records IS 'Audit trail for all billing transactions';
COMMENT ON COLUMN public.profiles.plan IS 'Current subscription plan: free, pro, family, enterprise';
COMMENT ON COLUMN public.profiles.subscription_status IS 'active, paused, cancelled, expired';

