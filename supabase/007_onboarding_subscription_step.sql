alter table onboarding_progress
  add column if not exists step_subscription_active boolean not null default false;

update onboarding_progress op
set step_subscription_active = true,
    updated_at = now()
from clients c
where c.id = op.client_id
  and c.status = 'active';
