-- Combo 5: Persistent notifications table for app-wide notification system
-- This replaces the incomplete notification_state approach with a proper audit trail

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Notification classification
  type text not null,
  title text not null,
  message text not null,
  category text not null default 'system',
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  
  -- Action and entity tracking
  action_url text,
  entity_type text,
  entity_id text,
  
  -- Idempotency
  idempotency_key text unique,
  
  -- Status tracking
  read_at timestamptz,
  archived_at timestamptz,
  expires_at timestamptz,
  
  -- Metadata storage
  metadata jsonb not null default '{}'::jsonb,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index notifications_user_id_created_at 
  on notifications(user_id, created_at desc);

create index notifications_user_id_read_at 
  on notifications(user_id, read_at);

create index notifications_user_id_archived_at 
  on notifications(user_id, archived_at);

create index notifications_user_id_unread
  on notifications(user_id) where read_at is null and archived_at is null;

create index notifications_idempotency_key 
  on notifications(idempotency_key) where idempotency_key is not null;

-- RLS Policies
alter table notifications enable row level security;

-- Users can view their own notifications
create policy notifications_select_own
  on notifications for select
  using (auth.uid() = user_id);

-- Users can update read/archive on their own notifications
create policy notifications_update_own
  on notifications for update
  using (auth.uid() = user_id)
  with check (
    -- Only allow updates to read_at, archived_at
    (read_at is not distinct from (select read_at from notifications where id = id))
    or (archived_at is not distinct from (select archived_at from notifications where id = id))
  );

-- Service role can insert notifications
create policy notifications_insert_service_role
  on notifications for insert
  with check (current_user_id = 'service_role');

-- Triggers for updated_at
create or replace function update_notifications_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger notifications_updated_at
  before update on notifications
  for each row
  execute function update_notifications_updated_at();
