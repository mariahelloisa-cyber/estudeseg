-- ============================================================================
-- SEGURANÇA 07 — CORREÇÃO: upload de anexos da matrícula estava quebrado
-- ----------------------------------------------------------------------------
-- BUG INTRODUZIDO PELO ARQUIVO 03 (erro meu, não seu)
--
-- O arquivo 03 termina com:
--
--   revoke all on function public.upload_matricula_permitido(text)
--     from public, anon, authenticated;
--
-- A intenção era boa — não deixar ninguém chamar a função solta pela API REST.
-- O problema é que essa mesma função é usada DENTRO da policy do bucket:
--
--   create policy "anexos matricula upload vinculado"
--     on storage.objects for insert to anon, authenticated
--     with check ( ... public.upload_matricula_permitido(...) );
--
-- E no PostgreSQL a expressão de uma policy é avaliada com os privilégios de
-- QUEM está fazendo a consulta, não com os do dono da tabela. Sem EXECUTE, o
-- visitante anônimo esbarra em "permission denied for function
-- upload_matricula_permitido" antes mesmo de a regra ser testada.
--
-- Resultado prático: NENHUM anexo de matrícula conseguia ser enviado.
-- Confirmado em produção:
--   POST /storage/v1/object/matriculas-anexos/... →
--   403 "permission denied for function upload_matricula_permitido"
--
-- Por que as outras funções revogadas NÃO têm esse problema:
-- `identidade_requisicao` e `consumir_rate_limit` só são chamadas de dentro de
-- outras funções SECURITY DEFINER (que rodam como `postgres`), nunca a partir
-- de uma policy. Para essas, o revoke está correto e continua valendo.
--
-- PRÉ-REQUISITO: arquivos 01 a 03 já rodados.
-- ============================================================================

grant execute on function public.upload_matricula_permitido(text) to anon, authenticated;

-- Isso NÃO afrouxa a segurança do upload. O que protege continua sendo a
-- própria função, que só devolve true quando:
--   * o texto é um uuid válido;
--   * existe uma matrícula com aquele upload_token;
--   * essa matrícula foi criada há menos de 30 minutos;
--   * a pasta ainda tem menos de 8 arquivos.
--
-- Poder executá-la não dá poder nenhum: ela só responde sim/não sobre um token
-- que o chamador já teria que conhecer. E o token é um uuid v4 devolvido
-- exclusivamente por enviar_matricula a quem acabou de preencher o formulário.

-- ---------------------------------------------------------------------------
-- Verificação
-- ---------------------------------------------------------------------------
do $$
declare
  v_ok boolean;
begin
  select has_function_privilege('anon', 'public.upload_matricula_permitido(text)', 'execute')
    into v_ok;

  if v_ok then
    raise notice 'OK: anon pode avaliar a policy de upload.';
  else
    raise warning 'FALHA: anon ainda não consegue executar upload_matricula_permitido.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Confere se sobrou alguma outra função usada em policy sem EXECUTE
-- ---------------------------------------------------------------------------
-- Lista as funções citadas em policies (public e storage) e diz se os papéis
-- que a policy atinge conseguem executá-las. Qualquer "NAO" aqui é uma policy
-- que vai falhar com permission denied em vez de aplicar a regra.
select
  p.schemaname || '.' || p.tablename           as tabela,
  p.policyname                                  as policy,
  f.proname                                     as funcao_usada,
  has_function_privilege('anon',
    f.oid, 'execute')                           as anon_executa,
  has_function_privilege('authenticated',
    f.oid, 'execute')                           as authenticated_executa
from pg_policies p
join pg_proc f
  on f.pronamespace = 'public'::regnamespace
 and (coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) like '%' || f.proname || '(%'
where p.schemaname in ('public', 'storage')
order by 1, 2, 3;
