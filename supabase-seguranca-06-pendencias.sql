-- ============================================================================
-- SEGURANÇA 06 — TABELAS QUE FICARAM DE FORA DO ARQUIVO 02
-- ----------------------------------------------------------------------------
-- POR QUE ESTE ARQUIVO EXISTE (assumindo o erro)
--
-- O arquivo 02 cobriu 26 tabelas. Eu montei essa lista varrendo o código atrás
-- de `.from('...')`, e a varredura tinha DOIS defeitos:
--
--   1. O padrão de busca aceitava só letras e underline, então
--      `carrossel_3d_fotos` (tem um "3") passou despercebido.
--   2. A busca não entrava em subpastas, então os pop-ups em
--      src/components/popups/templates/ ficaram de fora.
--
-- Foi por isso que a verificação nº 2 do arquivo 05 acusou FALHA: as policies
-- permissivas dessas tabelas continuavam lá, intactas.
--
-- Este arquivo fecha exatamente o que sobrou. Depois dele, a verificação nº 2
-- passa a dar OK.
--
-- PRÉ-REQUISITO: arquivos 01 e 02 já rodados (usa public.eh_admin()).
-- ============================================================================

do $$
begin
  if to_regclass('public.admins') is null then
    raise exception 'Rode supabase-seguranca-01-autorizacao.sql antes deste arquivo.';
  end if;
end;
$$;

-- ###########################################################################
-- 1) carrossel_3d_fotos — conteúdo público da Home
-- ###########################################################################
-- Lida por qualquer visitante em src/pages/Inicio.jsx:423 (o carrossel 3D da
-- página inicial) e administrada em src/pages/admin.jsx.
--
-- Mesmo tratamento das outras tabelas de conteúdo: leitura livre, escrita só
-- para administrador de verdade. O carrossel do site continua funcionando
-- exatamente como hoje.
do $$
declare
  p record;
begin
  if to_regclass('public.carrossel_3d_fotos') is null then
    raise notice 'Tabela carrossel_3d_fotos não existe neste banco — ignorada.';
    return;
  end if;

  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'carrossel_3d_fotos'
  loop
    execute format('drop policy if exists %I on public.carrossel_3d_fotos', p.policyname);
  end loop;

  alter table public.carrossel_3d_fotos enable row level security;

  revoke all on public.carrossel_3d_fotos from anon, authenticated;
  grant select on public.carrossel_3d_fotos to anon, authenticated;
  grant insert, update, delete on public.carrossel_3d_fotos to authenticated;

  create policy "leitura publica" on public.carrossel_3d_fotos
    for select to anon, authenticated
    using (true);

  create policy "escrita apenas admin" on public.carrossel_3d_fotos
    for all to authenticated
    using (public.eh_admin())
    with check (public.eh_admin());

  raise notice 'OK: carrossel_3d_fotos protegida.';
end;
$$;

-- ###########################################################################
-- 2) popup_newsletter_inscricoes — e-mails de visitantes
-- ###########################################################################
-- ATENÇÃO, LEIA ANTES DE RODAR:
--
-- Esta tabela existe no banco mas NENHUMA linha do código atual escreve ou lê
-- nela (procurei por "newsletter" e por `.from('popup_newsletter_inscricoes')`
-- no projeto inteiro: zero ocorrências). Deve ser resto de um pop-up de
-- newsletter que foi removido ou renomeado.
--
-- Ela guarda e-mails de visitantes, ou seja, dado pessoal. Hoje tem:
--   - INSERT liberado para anônimo  ("Qualquer um pode se inscrever")
--   - DELETE para qualquer autenticado, com using(true)
--
-- DECISÃO ADOTADA: fechar para administrador apenas.
-- O raciocínio: nada no código usa a tabela, então fechá-la não tira
-- funcionalidade nenhuma do site; e deixar um endpoint de escrita anônima
-- aberto numa tabela que ninguém acompanha é superfície de ataque de graça
-- (spam, enchimento de banco).
--
-- SE VOCÊ FOR REATIVAR UM POP-UP DE NEWSLETTER: não recoloque o INSERT anônimo
-- direto. Use o mesmo padrão de public.enviar_contato (arquivo 03) — função
-- SECURITY DEFINER com parâmetros nomeados, validação e rate limit por IP.
-- Há um modelo pronto e comentado no fim deste arquivo.
--
-- Se discordar dessa decisão, me avise antes de rodar.
do $$
declare
  p record;
begin
  if to_regclass('public.popup_newsletter_inscricoes') is null then
    raise notice 'Tabela popup_newsletter_inscricoes não existe neste banco — ignorada.';
    return;
  end if;

  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'popup_newsletter_inscricoes'
  loop
    execute format('drop policy if exists %I on public.popup_newsletter_inscricoes', p.policyname);
  end loop;

  alter table public.popup_newsletter_inscricoes enable row level security;

  revoke all on public.popup_newsletter_inscricoes from anon;
  revoke all on public.popup_newsletter_inscricoes from authenticated;
  grant select, insert, update, delete on public.popup_newsletter_inscricoes to authenticated;

  create policy "acesso apenas admin" on public.popup_newsletter_inscricoes
    for all to authenticated
    using (public.eh_admin())
    with check (public.eh_admin());

  raise notice 'OK: popup_newsletter_inscricoes fechada para admin.';
end;
$$;

-- ###########################################################################
-- 3) Varredura final: nenhuma tabela pode ficar sem policy de novo
-- ###########################################################################
-- Em vez de confiar numa lista escrita à mão (que foi justamente o que falhou),
-- este bloco percorre TODAS as tabelas do schema public e avisa sobre qualquer
-- uma que ainda esteja com policy de escrita permissiva ou sem RLS.
do $$
declare
  v_lista text;
begin
  select string_agg(distinct tablename || ' (' || policyname || ')', ', ')
    into v_lista
  from pg_policies
  where schemaname = 'public'
    and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
    and (coalesce(with_check, '') = 'true'
         or (cmd <> 'INSERT' and coalesce(qual, '') = 'true'));

  if v_lista is not null then
    raise warning 'AINDA PERMISSIVAS: %', v_lista;
  else
    raise notice 'OK: nenhuma policy de escrita com true no schema public.';
  end if;

  select string_agg(c.relname, ', ')
    into v_lista
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

  if v_lista is not null then
    raise warning 'TABELAS SEM RLS: %', v_lista;
  else
    raise notice 'OK: todas as tabelas do schema public têm RLS.';
  end if;

  -- Tabelas com RLS ligada e nenhuma policy: ninguém acessa (a não ser
  -- service_role). Às vezes é proposital (public.admins é assim de propósito),
  -- às vezes é uma tabela esquecida. Vale conferir a lista.
  select string_agg(c.relname, ', ')
    into v_lista
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
    and not exists (
      select 1 from pg_policies p
      where p.schemaname = 'public' and p.tablename = c.relname
    );

  if v_lista is not null then
    raise notice 'Tabelas com RLS e zero policies (confira se é proposital): %', v_lista;
  end if;
end;
$$;

-- ###########################################################################
-- ANEXO — pop-ups que apontam para tabelas inexistentes
-- ###########################################################################
-- ACHADO FUNCIONAL (não é falha de segurança, mas você precisa saber):
--
-- Dois modelos de pop-up gravam em tabelas que NÃO EXISTEM neste banco:
--
--   src/components/popups/templates/PopupCadastro.jsx  -> popup_cadastros
--   src/components/popups/templates/PopupCaptura.jsx   -> popup_capturas_email
--
-- Confirmado pela API: as duas respondem PGRST205 ("Could not find the table").
-- Ou seja, se um desses modelos for ativado no painel, o visitante que
-- preencher o formulário recebe erro e o dado se perde.
--
-- Isso é anterior a este trabalho de segurança e NÃO foi alterado por ele.
--
-- Se quiser ativar esses pop-ups, descomente o bloco abaixo. Ele já nasce
-- seguro: sem escrita anônima direta, com validação e rate limit por IP, no
-- mesmo padrão de public.enviar_contato.
--
-- create table if not exists public.popup_capturas_email (
--   id         bigint generated by default as identity primary key,
--   email      text not null,
--   created_at timestamptz not null default now()
-- );
--
-- create table if not exists public.popup_cadastros (
--   id         bigint generated by default as identity primary key,
--   nome       text not null,
--   email      text not null,
--   created_at timestamptz not null default now()
-- );
--
-- alter table public.popup_capturas_email enable row level security;
-- alter table public.popup_cadastros      enable row level security;
--
-- revoke all on public.popup_capturas_email from anon, authenticated;
-- revoke all on public.popup_cadastros      from anon, authenticated;
-- grant select, insert, update, delete on public.popup_capturas_email to authenticated;
-- grant select, insert, update, delete on public.popup_cadastros      to authenticated;
--
-- create policy "acesso apenas admin" on public.popup_capturas_email
--   for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
-- create policy "acesso apenas admin" on public.popup_cadastros
--   for all to authenticated using (public.eh_admin()) with check (public.eh_admin());
--
-- create or replace function public.enviar_captura_popup(
--   p_email text,
--   p_nome  text default null
-- )
-- returns text
-- language plpgsql
-- security definer
-- set search_path = ''
-- as $f$
-- begin
--   if not public.consumir_rate_limit('popup', 5, interval '1 hour') then
--     return 'limite_excedido';
--   end if;
--
--   if p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-zA-Z]{2,}$'
--      or length(p_email) > 200 then
--     return 'email_invalido';
--   end if;
--
--   if p_nome is null then
--     insert into public.popup_capturas_email (email) values (lower(trim(p_email)));
--   else
--     if coalesce(trim(p_nome), '') = '' or length(p_nome) > 200 then
--       return 'nome_invalido';
--     end if;
--     insert into public.popup_cadastros (nome, email)
--     values (trim(p_nome), lower(trim(p_email)));
--   end if;
--
--   return 'sucesso';
-- end;
-- $f$;
--
-- alter function public.enviar_captura_popup(text, text) owner to postgres;
-- revoke all on function public.enviar_captura_popup(text, text) from public;
-- grant execute on function public.enviar_captura_popup(text, text) to anon, authenticated;
--
-- Depois disso, os dois templates precisariam trocar o .from(...).insert(...)
-- por supabase.rpc('enviar_captura_popup', { p_email, p_nome }). Me avise que
-- eu faço essa parte.
