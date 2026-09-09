-- ============================================================================
-- SEGURANÇA 01 — AUTORIZAÇÃO REAL (corrige [C-01] e [H-01])
-- ----------------------------------------------------------------------------
-- Separa autenticação ("quem é você?") de autorização ("o que você pode fazer?").
--
-- Até agora o sistema tratava "tem sessão Supabase" como "é administrador".
-- Depois deste arquivo, ser administrador significa UMA coisa só: existir uma
-- linha em public.admins com o seu user_id. Nada além disso.
--
-- ORDEM DE EXECUÇÃO: 00 (diagnóstico) → 01 (este) → 02 → 03 → 04.
--
-- ATENÇÃO — LEIA ANTES DE RODAR:
-- No fim deste arquivo há um passo OBRIGATÓRIO onde você cadastra o seu próprio
-- usuário como administrador. Se você pular esse passo, o arquivo 02 vai se
-- recusar a rodar (de propósito) para não trancar você fora do painel.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) A tabela de administradores
-- ---------------------------------------------------------------------------
-- Chave é o user_id (uuid), nunca o e-mail: e-mail pode ser trocado pelo próprio
-- usuário em /auth/v1/user, então usá-lo como base da autorização permitiria
-- escalar privilégio só mudando o e-mail para o de um admin conhecido.
create table if not exists public.admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  criado_em   timestamptz not null default now(),
  criado_por  uuid references auth.users (id) on delete set null,
  observacao  text
);

comment on table public.admins is
  'Lista branca de administradores. A ÚNICA fonte de verdade sobre quem é admin. '
  'Só pode ser alterada por service_role (Dashboard/SQL Editor) — nunca pela API pública.';

-- ---------------------------------------------------------------------------
-- 2) Blindagem da própria tabela de administradores
-- ---------------------------------------------------------------------------
-- Esta é a parte que impede a escalada de privilégio mais óbvia: um usuário
-- comum inserir a si mesmo em public.admins via PostgREST.
--
-- Duas barreiras independentes, porque uma só não basta:
--
--   (a) REVOKE dos GRANTs: sem privilégio de tabela, o PostgREST responde
--       "permission denied" antes mesmo de olhar qualquer policy. É isto que
--       de fato bloqueia o acesso pela API REST.
--   (b) RLS habilitada e ZERO policies: mesmo que alguém reconceda um GRANT
--       por engano no futuro, sem policy nenhuma linha passa. RLS com zero
--       policies nega tudo por padrão.
--
-- service_role ignora RLS (é BYPASSRLS), então o Dashboard e o SQL Editor
-- continuam conseguindo gerenciar a lista normalmente.
revoke all on public.admins from anon, authenticated;

alter table public.admins enable row level security;
-- Força a RLS inclusive para o dono da tabela, fechando a brecha de uma função
-- SECURITY DEFINER mal escrita no futuro passar por cima das policies.
alter table public.admins force row level security;

-- Remove qualquer policy que exista de execuções anteriores deste arquivo.
do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'admins'
  loop
    execute format('drop policy if exists %I on public.admins', p.policyname);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) A função de autorização
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER é necessário aqui: quem chama é o papel `authenticated`, que
-- (de propósito) não tem permissão nenhuma sobre public.admins. A função roda
-- com os privilégios do dono e faz a consulta por ele.
--
-- Defesas embutidas:
--
--   * `set search_path = ''` — a defesa contra search_path hijacking. Sem isto,
--     um atacante que consiga criar um schema no início do search_path poderia
--     plantar uma tabela `admins` falsa e a função leria a dele. Com search_path
--     vazio, TODO nome precisa ser qualificado (public.admins, auth.uid()), e não
--     há como redirecionar a resolução.
--   * `stable` — não altera nada; o planner pode cachear dentro da query.
--   * Sem parâmetros — não existe entrada do cliente, logo não existe superfície
--     de SQL injection. A identidade vem exclusivamente de auth.uid(), que é
--     derivada da assinatura criptográfica do JWT pelo GoTrue/PostgREST e não
--     pode ser forjada pelo cliente sem a chave secreta do projeto.
--   * `auth.uid()` nulo (visitante anônimo) resulta em false, nunca em erro.
create or replace function public.eh_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = (select auth.uid())
  );
$$;

comment on function public.eh_admin() is
  'true se o usuário autenticado da requisição atual está em public.admins. '
  'Usada por todas as policies administrativas. Não aceita parâmetros: a identidade '
  'vem só de auth.uid(), que é derivada do JWT assinado e não pode ser forjada.';

-- O dono precisa ser um papel que enxergue public.admins apesar da RLS forçada.
alter function public.eh_admin() owner to postgres;

-- Ninguém precisa executar isto além de quem já está logado.
revoke all on function public.eh_admin() from public, anon;
grant execute on function public.eh_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Função auxiliar para o frontend (apenas UX)
-- ---------------------------------------------------------------------------
-- O painel chama isto para decidir se mostra a interface. É uma comodidade de
-- interface, NÃO um controle de segurança: quem responde "não" para a tela e
-- "não" para os dados são as policies do arquivo 02, independentemente.
create or replace function public.meu_status_admin()
returns table (eh_admin boolean)
language sql
security definer
stable
set search_path = ''
as $$
  select public.eh_admin();
$$;

alter function public.meu_status_admin() owner to postgres;
revoke all on function public.meu_status_admin() from public, anon;
grant execute on function public.meu_status_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 5) PASSO OBRIGATÓRIO — cadastre o(s) administrador(es) de verdade
-- ---------------------------------------------------------------------------
-- a) Encontre o user_id do administrador legítimo. Rode:
--
--      select id, email, created_at, last_sign_in_at
--      from auth.users
--      order by created_at;
--
-- b) Confira a lista com atenção. Se houver alguma conta que você NÃO
--    reconhece, ela provavelmente foi criada explorando o signup aberto
--    ([C-01]) — trate como incidente antes de continuar.
--
-- c) Descomente a linha abaixo, troque pelo user_id correto e execute.
--    Repita para cada administrador legítimo.
--
-- insert into public.admins (user_id, observacao)
-- values ('00000000-0000-0000-0000-000000000000', 'admin principal')
-- on conflict (user_id) do nothing;
--
-- d) Confirme que deu certo:
--
--      select a.user_id, u.email, a.criado_em from public.admins a
--      join auth.users u on u.id = a.user_id;

-- ---------------------------------------------------------------------------
-- 6) Verificação automática
-- ---------------------------------------------------------------------------
do $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.admins;

  if v_total = 0 then
    raise warning
      'ATENÇÃO: public.admins está VAZIA. Faça o passo 5 acima ANTES de rodar o arquivo 02, '
      'senão ninguém conseguirá administrar o sistema.';
  else
    raise notice 'OK: % administrador(es) cadastrado(s).', v_total;
  end if;
end;
$$;
