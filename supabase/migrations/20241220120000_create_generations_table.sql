-- Migration: Create generations table
-- Description: Creates the generations table with RLS policies
-- Author: AI Assistant
-- Date: 2025-10-23

-- Create the generations table
create table public.generations (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    model varchar not null,
    generated_count integer not null,
    accepted_unedited_count integer,
    accepted_edited_count integer,
    source_text_hash varchar not null,
    source_text_length integer not null check (source_text_length between 1000 and 10000),
    generation_duration integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create index
create index generations_user_id_idx on public.generations(user_id);

-- Enable Row Level Security
alter table public.generations enable row level security;

-- Create RLS policies for authenticated users
create policy "Users can view their own generations"
    on public.generations
    for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can create their own generations"
    on public.generations
    for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own generations"
    on public.generations
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own generations"
    on public.generations
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- Create handle_updated_at function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create trigger for updating updated_at
create trigger set_updated_at
    before update on public.generations
    for each row
    execute function public.handle_updated_at();

-- Comments
comment on table public.generations is 'Stores information about flashcard generation sessions';
comment on column public.generations.model is 'The AI model used for generation';
comment on column public.generations.generated_count is 'Number of flashcards generated in this session';
comment on column public.generations.accepted_unedited_count is 'Number of flashcards accepted without edits';
comment on column public.generations.accepted_edited_count is 'Number of flashcards accepted after editing';
comment on column public.generations.source_text_hash is 'Hash of the source text used for generation';
comment on column public.generations.source_text_length is 'Length of the source text in characters';
comment on column public.generations.generation_duration is 'Duration of generation process in milliseconds';