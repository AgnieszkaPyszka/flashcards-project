-- Migration: Create flashcards table
-- Description: Creates the flashcards table with RLS policies
-- Author: AI Assistant
-- Date: 2025-10-23

-- Create the flashcards table
create table public.flashcards (
    id bigserial primary key,
    front varchar(200) not null,
    back varchar(500) not null,
    source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    generation_id bigint,
    user_id uuid not null references auth.users(id) on delete cascade,
    constraint fk_generation foreign key (generation_id) references generations(id) on delete set null
);

-- Create indexes
create index flashcards_user_id_idx on public.flashcards(user_id);
create index flashcards_generation_id_idx on public.flashcards(generation_id);

-- Enable Row Level Security
alter table public.flashcards enable row level security;

-- Create RLS policies for authenticated users
create policy "Users can view their own flashcards"
    on public.flashcards
    for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can create their own flashcards"
    on public.flashcards
    for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own flashcards"
    on public.flashcards
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own flashcards"
    on public.flashcards
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- Create trigger for updating updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at
    before update on public.flashcards
    for each row
    execute function public.handle_updated_at();

-- Comments
comment on table public.flashcards is 'Stores flashcards created by users';
comment on column public.flashcards.front is 'Front side of the flashcard, limited to 200 characters';
comment on column public.flashcards.back is 'Back side of the flashcard, limited to 500 characters';
comment on column public.flashcards.source is 'Source of the flashcard: ai-full (unedited AI generation), ai-edited (edited AI generation), or manual';