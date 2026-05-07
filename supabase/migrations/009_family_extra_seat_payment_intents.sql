create table if not exists family_extra_seat_payment_intents (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid not null references family_groups(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  invited_email text not null,
  amount_inr integer not null default 99,
  currency text not null default 'INR',
  status text not null check (status in ('pending', 'qa_confirmed', 'paid', 'cancelled', 'expired', 'failed')) default 'pending',
  source text not null default 'family_extra_seat',
  metadata jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 minutes'),
  qa_confirmed_at timestamptz null,
  paid_at timestamptz null
);

create index if not exists idx_family_extra_seat_payment_intents_owner_user_id on family_extra_seat_payment_intents(owner_user_id);
create index if not exists idx_family_extra_seat_payment_intents_family_group_id on family_extra_seat_payment_intents(family_group_id);
create index if not exists idx_family_extra_seat_payment_intents_status on family_extra_seat_payment_intents(status);
create index if not exists idx_family_extra_seat_payment_intents_email on family_extra_seat_payment_intents(lower(invited_email));

alter table family_extra_seat_payment_intents enable row level security;

create policy "family_extra_seat_payment_intents_select_owner" on family_extra_seat_payment_intents
  for select
  using (owner_user_id = auth.uid());

create policy "family_extra_seat_payment_intents_insert_owner" on family_extra_seat_payment_intents
  for insert
  with check (owner_user_id = auth.uid());

create policy "family_extra_seat_payment_intents_update_owner" on family_extra_seat_payment_intents
  for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
