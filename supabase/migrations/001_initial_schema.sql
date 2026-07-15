-- Enable necessary extensions
create extension if not exists pgcrypto;

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create exercises table
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  muscle_group text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_exercises_user_lower_name
  on public.exercises(user_id, lower(name));

-- Create workout_templates table
create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create workout_template_exercises table
create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position integer not null default 0,
  default_sets integer not null default 3 check (default_sets > 0),
  created_at timestamptz not null default now(),
  unique(workout_template_id, exercise_id)
);

-- Create workout_sessions table
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_template_id uuid references public.workout_templates(id) on delete set null,
  name text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create session_exercises table
create table if not exists public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- Create exercise_sets table
create table if not exists public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.session_exercises(id) on delete cascade,
  set_number integer not null check (set_number > 0),
  weight numeric(7,2) not null default 0 check (weight >= 0),
  reps integer not null default 0 check (reps >= 0),
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for performance
create index if not exists idx_exercises_user_id on public.exercises(user_id);
create index if not exists idx_workout_templates_user_id on public.workout_templates(user_id);
create index if not exists idx_workout_sessions_user_id on public.workout_sessions(user_id);
create index if not exists idx_workout_sessions_completed on public.workout_sessions(user_id, completed_at);
create index if not exists idx_session_exercises_session_id on public.session_exercises(workout_session_id);
create index if not exists idx_session_exercises_exercise_id on public.session_exercises(exercise_id);
create index if not exists idx_exercise_sets_session_exercise_id on public.exercise_sets(session_exercise_id);
create index if not exists idx_exercise_sets_completed on public.exercise_sets(session_exercise_id, is_completed);
create index if not exists idx_workout_template_exercises_template_id on public.workout_template_exercises(workout_template_id);
create index if not exists idx_workout_template_exercises_exercise_id on public.workout_template_exercises(exercise_id);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.exercise_sets enable row level security;

-- Create RLS policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create RLS policies for exercises
create policy "Users can view their own exercises"
  on public.exercises for select
  using (auth.uid() = user_id);

create policy "Users can insert their own exercises"
  on public.exercises for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own exercises"
  on public.exercises for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own exercises"
  on public.exercises for delete
  using (auth.uid() = user_id);

-- Create RLS policies for workout_templates
create policy "Users can view their own templates"
  on public.workout_templates for select
  using (auth.uid() = user_id);

create policy "Users can insert their own templates"
  on public.workout_templates for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own templates"
  on public.workout_templates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own templates"
  on public.workout_templates for delete
  using (auth.uid() = user_id);

-- Create RLS policies for workout_template_exercises
create policy "Users can view template exercises for their templates"
  on public.workout_template_exercises for select
  using (
    exists(
      select 1 from public.workout_templates wt
      where wt.id = workout_template_id
      and wt.user_id = auth.uid()
    )
  );

create policy "Users can insert template exercises for their templates"
  on public.workout_template_exercises for insert
  with check (
    exists(
      select 1 from public.workout_templates wt
      where wt.id = workout_template_id
      and wt.user_id = auth.uid()
    )
  );

create policy "Users can update template exercises for their templates"
  on public.workout_template_exercises for update
  using (
    exists(
      select 1 from public.workout_templates wt
      where wt.id = workout_template_id
      and wt.user_id = auth.uid()
    )
  )
  with check (
    exists(
      select 1 from public.workout_templates wt
      where wt.id = workout_template_id
      and wt.user_id = auth.uid()
    )
  );

create policy "Users can delete template exercises for their templates"
  on public.workout_template_exercises for delete
  using (
    exists(
      select 1 from public.workout_templates wt
      where wt.id = workout_template_id
      and wt.user_id = auth.uid()
    )
  );

-- Create RLS policies for workout_sessions
create policy "Users can view their own sessions"
  on public.workout_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
  on public.workout_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on public.workout_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own sessions"
  on public.workout_sessions for delete
  using (auth.uid() = user_id);

-- Create RLS policies for session_exercises
create policy "Users can view session exercises for their sessions"
  on public.session_exercises for select
  using (
    exists(
      select 1 from public.workout_sessions ws
      where ws.id = workout_session_id
      and ws.user_id = auth.uid()
    )
  );

create policy "Users can insert session exercises for their sessions"
  on public.session_exercises for insert
  with check (
    exists(
      select 1 from public.workout_sessions ws
      where ws.id = workout_session_id
      and ws.user_id = auth.uid()
    )
  );

create policy "Users can update session exercises for their sessions"
  on public.session_exercises for update
  using (
    exists(
      select 1 from public.workout_sessions ws
      where ws.id = workout_session_id
      and ws.user_id = auth.uid()
    )
  )
  with check (
    exists(
      select 1 from public.workout_sessions ws
      where ws.id = workout_session_id
      and ws.user_id = auth.uid()
    )
  );

create policy "Users can delete session exercises for their sessions"
  on public.session_exercises for delete
  using (
    exists(
      select 1 from public.workout_sessions ws
      where ws.id = workout_session_id
      and ws.user_id = auth.uid()
    )
  );

-- Create RLS policies for exercise_sets
create policy "Users can view exercise sets for their sessions"
  on public.exercise_sets for select
  using (
    exists(
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.workout_session_id
      where se.id = session_exercise_id
      and ws.user_id = auth.uid()
    )
  );

create policy "Users can insert exercise sets for their sessions"
  on public.exercise_sets for insert
  with check (
    exists(
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.workout_session_id
      where se.id = session_exercise_id
      and ws.user_id = auth.uid()
    )
  );

create policy "Users can update exercise sets for their sessions"
  on public.exercise_sets for update
  using (
    exists(
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.workout_session_id
      where se.id = session_exercise_id
      and ws.user_id = auth.uid()
    )
  )
  with check (
    exists(
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.workout_session_id
      where se.id = session_exercise_id
      and ws.user_id = auth.uid()
    )
  );

create policy "Users can delete exercise sets for their sessions"
  on public.exercise_sets for delete
  using (
    exists(
      select 1 from public.session_exercises se
      join public.workout_sessions ws on ws.id = se.workout_session_id
      where se.id = session_exercise_id
      and ws.user_id = auth.uid()
    )
  );

-- Create trigger to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.update_updated_at_column();

drop trigger if exists update_exercises_updated_at on public.exercises;
create trigger update_exercises_updated_at
  before update on public.exercises
  for each row
  execute procedure public.update_updated_at_column();

drop trigger if exists update_workout_templates_updated_at on public.workout_templates;
create trigger update_workout_templates_updated_at
  before update on public.workout_templates
  for each row
  execute procedure public.update_updated_at_column();

drop trigger if exists update_workout_sessions_updated_at on public.workout_sessions;
create trigger update_workout_sessions_updated_at
  before update on public.workout_sessions
  for each row
  execute procedure public.update_updated_at_column();

drop trigger if exists update_exercise_sets_updated_at on public.exercise_sets;
create trigger update_exercise_sets_updated_at
  before update on public.exercise_sets
  for each row
  execute procedure public.update_updated_at_column();
