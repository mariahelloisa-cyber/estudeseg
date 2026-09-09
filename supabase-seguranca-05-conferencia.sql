-- ============================================================================
-- SEGURANÇA 05 — CONFERÊNCIA PÓS-CORREÇÃO (SOMENTE LEITURA)
-- ----------------------------------------------------------------------------
-- Rode este arquivo DEPOIS de 01, 02, 03 e 04 (passo 8.1 do PASSO-A-PASSO.md).
--
-- Ele não altera nada. Só responde: as correções pegaram de verdade?
--
-- ATENÇÃO: se você rodar isto ANTES do arquivo 01, vai dar erro dizendo que
-- `public.admins` não existe. Isso é esperado — a tabela nasce no arquivo 01.
-- Não é bug: é o próprio teste avisando que ainda não foi feito.
--
-- RESULTADO ESPERADO: as 7 linhas dizendo OK.
-- ============================================================================

select
  '1. RLS ligada em todas as tabelas' as verificacao,
  case when not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  ) then 'OK' else 'FALHA' end as resultado

union all
select
  '2. Nenhuma policy de escrita liberada com true',
  case when not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
      and (coalesce(with_check, '') = 'true'
           or (cmd <> 'INSERT' and coalesce(qual, '') = 'true'))
  ) then 'OK' else 'FALHA' end

union all
select
  '3. Visitante anonimo sem acesso as tabelas de PII',
  case when not exists (
    select 1 from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'anon'
      and table_name in ('matriculas', 'matriculados', 'contatos',
                         'sorteio_participantes', 'resgate_vouchers', 'ia_mensagens')
  ) then 'OK' else 'FALHA' end

union all
select
  '4. Tabela de admins inacessivel pela API',
  case when not exists (
    select 1 from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'admins'
      and grantee in ('anon', 'authenticated')
  ) then 'OK' else 'FALHA' end

union all
select
  '5. Funcoes SECURITY DEFINER com search_path travado',
  case when not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and (p.proconfig is null or not exists (
        select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%'
      ))
  ) then 'OK' else 'FALHA' end

union all
select
  '6. Bucket de anexos privado',
  case when exists (
    select 1 from storage.buckets where id = 'matriculas-anexos' and not public
  ) then 'OK' else 'FALHA' end

union all
select
  '7. Existe pelo menos um administrador cadastrado',
  case when exists (select 1 from public.admins) then 'OK' else 'FALHA' end

order by 1;

-- ---------------------------------------------------------------------------
-- Se alguma linha der FALHA, rode a consulta correspondente abaixo para ver
-- exatamente o que ficou para trás.
-- ---------------------------------------------------------------------------

-- FALHA na 1 — quais tabelas estão sem RLS:
-- select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- FALHA na 2 — quais policies continuam permissivas:
-- select tablename, policyname, cmd, qual, with_check from pg_policies
-- where schemaname = 'public' and cmd in ('ALL','INSERT','UPDATE','DELETE')
--   and (coalesce(with_check,'') = 'true'
--        or (cmd <> 'INSERT' and coalesce(qual,'') = 'true'));

-- FALHA na 3 — quais grants sobraram para anon:
-- select table_name, privilege_type from information_schema.role_table_grants
-- where table_schema = 'public' and grantee = 'anon'
--   and table_name in ('matriculas','matriculados','contatos',
--                      'sorteio_participantes','resgate_vouchers','ia_mensagens');

-- FALHA na 5 — quais funções ficaram sem search_path travado:
-- select p.proname, pg_get_function_identity_arguments(p.oid), p.proconfig
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.prosecdef
--   and (p.proconfig is null or not exists (
        select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%'
      ));

-- FALHA na 7 — cadastre o administrador (passo 5 do arquivo 01):
-- select id, email from auth.users order by created_at;
-- insert into public.admins (user_id, observacao) values ('SEU-USER-ID', 'admin');
