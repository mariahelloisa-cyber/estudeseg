create table if not exists public.configuracoes (
  chave text primary key,
  valor text not null,
  updated_at timestamptz not null default now()
);

alter table public.configuracoes enable row level security;

drop policy if exists "Qualquer um pode ver configuracoes" on public.configuracoes;
create policy "Qualquer um pode ver configuracoes"
  on public.configuracoes for select
  to anon, authenticated using (true);

drop policy if exists "Admin pode inserir configuracoes" on public.configuracoes;
create policy "Admin pode inserir configuracoes"
  on public.configuracoes for insert
  to authenticated with check (true);

drop policy if exists "Admin pode atualizar configuracoes" on public.configuracoes;
create policy "Admin pode atualizar configuracoes"
  on public.configuracoes for update
  to authenticated using (true) with check (true);

create or replace function public.tocar_updated_at_configuracoes()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_configuracoes_updated_at on public.configuracoes;
create trigger trg_configuracoes_updated_at
  before update on public.configuracoes
  for each row
  execute function public.tocar_updated_at_configuracoes();

-- Valor inicial: mantém o texto atual da esteira até o admin editar pelo painel.
insert into public.configuracoes (chave, valor)
values ('titulo_esteira', '-EDITÁVEL ADMIN-')
on conflict (chave) do nothing;
