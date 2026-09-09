-- ============================================================================
-- SEGURANÇA 00 — DIAGNÓSTICO (SOMENTE LEITURA)
-- ----------------------------------------------------------------------------
-- Rode este arquivo PRIMEIRO, no SQL Editor do Supabase, e guarde o resultado.
-- Ele não altera absolutamente nada: só fotografa o estado atual para você
-- comparar depois e confirmar que as correções fizeram o que deveriam.
--
-- Rode cada bloco separadamente e salve a saída.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Todas as tabelas do schema public: RLS está ligada?
-- ---------------------------------------------------------------------------
select
  c.relname                                as tabela,
  c.relrowsecurity                         as rls_habilitada,
  c.relforcerowsecurity                    as rls_forcada,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as qtd_policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relrowsecurity, c.relname;

-- ---------------------------------------------------------------------------
-- 2) Todas as policies, com o texto real do USING / WITH CHECK.
--    Procure por "true" nas colunas usando/com_check em operações de escrita.
-- ---------------------------------------------------------------------------
select
  tablename   as tabela,
  policyname  as policy,
  cmd         as operacao,
  roles       as papeis,
  qual        as usando,
  with_check  as com_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- ---------------------------------------------------------------------------
-- 3) GRANTs de tabela para anon / authenticated.
--    RLS só age depois do GRANT: sem GRANT, o PostgREST nem chega na policy.
-- ---------------------------------------------------------------------------
select
  table_name  as tabela,
  grantee     as papel,
  string_agg(distinct privilege_type, ', ' order by privilege_type) as privilegios
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;

-- ---------------------------------------------------------------------------
-- 4) Funções SECURITY DEFINER e quem pode executá-las.
--    Toda função aqui roda com os privilégios do dono: confira uma a uma.
-- ---------------------------------------------------------------------------
select
  p.proname                                        as funcao,
  pg_get_function_identity_arguments(p.oid)        as argumentos,
  p.prosecdef                                      as security_definer,
  coalesce(array_to_string(p.proconfig, ', '), '(sem search_path fixo)') as config,
  pg_get_userbyid(p.proowner)                      as dono,
  coalesce(array_to_string(p.proacl::text[], ' '), '(padrão: PUBLIC)')   as permissoes
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.prosecdef desc, p.proname;

-- ---------------------------------------------------------------------------
-- 5) Buckets de Storage: quais são públicos e com quais limites.
-- ---------------------------------------------------------------------------
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by name;

-- ---------------------------------------------------------------------------
-- 6) Policies do Storage.
-- ---------------------------------------------------------------------------
select policyname as policy, cmd as operacao, roles as papeis, qual as usando, with_check as com_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by cmd, policyname;

-- ---------------------------------------------------------------------------
-- 7) INVENTÁRIO DE USUÁRIOS (FASE 0, item 3 do plano)
--    E-mail mascarado. Nenhum token, hash de senha ou dado sensível é exibido.
--    NÃO apague ninguém automaticamente: revise a lista e decida manualmente.
-- ---------------------------------------------------------------------------
select
  u.id                                                            as user_id,
  left(split_part(u.email, '@', 1), 2) || '***@'
    || split_part(u.email, '@', 2)                                as email_mascarado,
  u.created_at,
  u.last_sign_in_at,
  u.email_confirmed_at is not null                                as email_confirmado,
  u.role,
  coalesce(u.raw_app_meta_data ->> 'provider', '(desconhecido)')  as provedor,
  exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'admins'
  )                                                               as tabela_admins_existe
from auth.users u
order by u.created_at;

-- ---------------------------------------------------------------------------
-- 8) Quantas contas foram criadas — sinal de abuso do signup aberto.
--    Se aparecer qualquer conta que você não reconhece, trate como incidente.
-- ---------------------------------------------------------------------------
select
  count(*)                                                        as total_de_contas,
  count(*) filter (where created_at > now() - interval '30 days')  as criadas_nos_ultimos_30_dias,
  count(*) filter (where last_sign_in_at is null)                  as nunca_fizeram_login,
  min(created_at)                                                  as conta_mais_antiga,
  max(created_at)                                                  as conta_mais_recente
from auth.users;
