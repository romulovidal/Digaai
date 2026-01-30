-- ==========================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS (DIGA)
-- Copie e cole este script no SQL Editor do Supabase
-- ==========================================

-- 1. Tabela de PERFIS (Profiles)
-- Estende a tabela auth.users padrão do Supabase
create table public.profiles (
  id uuid references auth.users not null primary key,
  monthly_income numeric default 0,
  has_onboarded boolean default false,
  daily_quote_text text,
  daily_quote_date text,
  preferences jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar RLS (Row Level Security)
alter table public.profiles enable row level security;

-- Policies para Profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Trigger para criar perfil automaticamente ao cadastrar usuário
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, monthly_income, has_onboarded)
  values (new.id, 0, false);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Tabela de TRANSAÇÕES
create table public.transactions (
  id text not null primary key, -- Usamos text/timestamp gerado no front ou uuid
  user_id uuid references auth.users not null,
  type text check (type in ('INCOME', 'EXPENSE')) not null,
  amount numeric not null,
  category text not null,
  date text not null, -- ISO string YYYY-MM-DD
  description text,
  is_recurring boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions" on transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on transactions for delete using (auth.uid() = user_id);


-- 3. Tabela de METAS (Savings Goals)
create table public.savings_goals (
  id text not null primary key,
  user_id uuid references auth.users not null,
  name text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  image_url text,
  deadline text,
  monthly_plan_amount numeric,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.savings_goals enable row level security;

create policy "Users can view own goals" on savings_goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on savings_goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on savings_goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on savings_goals for delete using (auth.uid() = user_id);


-- 4. Tabela de LIMITES (Budget Limits)
create table public.budget_limits (
  id text not null primary key,
  user_id uuid references auth.users not null,
  category text not null,
  amount numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.budget_limits enable row level security;

create policy "Users can view own limits" on budget_limits for select using (auth.uid() = user_id);
create policy "Users can insert own limits" on budget_limits for insert with check (auth.uid() = user_id);
create policy "Users can update own limits" on budget_limits for update using (auth.uid() = user_id);
create policy "Users can delete own limits" on budget_limits for delete using (auth.uid() = user_id);


-- 5. Tabela de HISTÓRICO DE CHAT
create table public.chat_history (
  id text not null primary key,
  user_id uuid references auth.users not null,
  sender text check (sender in ('user', 'assistant')) not null,
  text text not null,
  timestamp numeric not null,
  is_draft boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.chat_history enable row level security;

create policy "Users can view own chat" on chat_history for select using (auth.uid() = user_id);
create policy "Users can insert own chat" on chat_history for insert with check (auth.uid() = user_id);
create policy "Users can delete own chat" on chat_history for delete using (auth.uid() = user_id);
-- Upserts são cobertos pelo INSERT policy no Supabase se configurado corretamente, 
-- mas UPDATE policy explícita ajuda
create policy "Users can update own chat" on chat_history for update using (auth.uid() = user_id);

