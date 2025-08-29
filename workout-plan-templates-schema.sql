-- Workout Plan Templates table for saving plan templates per trainer
create table if not exists public.workout_plan_templates (
  id uuid primary key default gen_random_uuid(),
  trainer_id bigint not null references public.trainer(id) on delete cascade,
  name text not null,
  tags text[] default '{}',
  template_json jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.workout_plan_templates enable row level security;

-- Allow trainers to read their own templates
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_plan_templates' and policyname = 'workout_templates_select_owner'
  ) then
    create policy workout_templates_select_owner on public.workout_plan_templates
      for select using (
        exists (
          select 1 from public.trainer t
          where t.id = workout_plan_templates.trainer_id
            and t.trainer_email = (auth.jwt() ->> 'email')
        )
      );
  end if;
end $$;

-- Allow trainers to insert their own templates
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_plan_templates' and policyname = 'workout_templates_insert_owner'
  ) then
    create policy workout_templates_insert_owner on public.workout_plan_templates
      for insert with check (
        exists (
          select 1 from public.trainer t
          where t.id = workout_plan_templates.trainer_id
            and t.trainer_email = (auth.jwt() ->> 'email')
        )
      );
  end if;
end $$;


