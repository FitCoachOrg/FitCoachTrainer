-- Add UPDATE and DELETE policies for workout_plan_templates table
-- This ensures trainers can update and delete their own templates

-- Allow trainers to update their own templates
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_plan_templates' and policyname = 'workout_templates_update_owner'
  ) then
    create policy workout_templates_update_owner on public.workout_plan_templates
      for update using (
        exists (
          select 1 from public.trainer t
          where t.id = workout_plan_templates.trainer_id
            and t.trainer_email = (auth.jwt() ->> 'email')
        )
      );
  end if;
end $$;

-- Allow trainers to delete their own templates
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'workout_plan_templates' and policyname = 'workout_templates_delete_owner'
  ) then
    create policy workout_templates_delete_owner on public.workout_plan_templates
      for delete using (
        exists (
          select 1 from public.trainer t
          where t.id = workout_plan_templates.trainer_id
            and t.trainer_email = (auth.jwt() ->> 'email')
        )
      );
  end if;
end $$;
