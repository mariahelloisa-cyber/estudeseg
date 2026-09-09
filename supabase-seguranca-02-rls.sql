-- ============================================================================
-- SEGURANÇA 02 — RLS DE TODAS AS TABELAS (corrige [H-01], [H-02] e parte de [M-05])
-- ----------------------------------------------------------------------------
-- Substitui TODAS as policies de escrita que hoje usam `to authenticated
-- using (true)` por autorização real via public.eh_admin().
--
-- PRÉ-REQUISITO: arquivo 01 já rodado E pelo menos um admin cadastrado.
--
-- O que este arquivo NÃO faz: não mexe no conteúdo público. Cursos, banners,
-- FAQ, notícias, depoimentos, prêmios e afins continuam legíveis por visitantes
-- anônimos exatamente como hoje — o site público não muda em nada.
--
-- CLASSIFICAÇÃO ADOTADA (derivada do uso real no código, não de suposição):
--
--   PUBLIC_READ   leitura anônima liberada, escrita só admin.
--                 Origem: componentes públicos leem estas tabelas sem sessão.
--
--   ADMIN_ONLY    nenhum acesso anônimo; leitura e escrita só admin.
--                 Origem: contêm PII ou dados operacionais internos.
--
--   VIA_RPC       a escrita pública não passa mais por INSERT direto: vai por
--                 função SECURITY DEFINER validada e com rate limit (arquivo 04).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- TRAVA DE SEGURANÇA: não deixa você se trancar fora do painel
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.admins') is null then
    raise exception
      'public.admins não existe. Rode supabase-seguranca-01-autorizacao.sql antes deste arquivo.';
  end if;

  if not exists (select 1 from public.admins) then
    raise exception
      'public.admins está VAZIA. Cadastre pelo menos um administrador (passo 5 do arquivo 01) '
      'antes de rodar este arquivo, senão ninguém conseguirá administrar o sistema.';
  end if;

  raise notice 'Trava OK: % administrador(es) cadastrado(s).', (select count(*) from public.admins);
end;
$$;

-- ---------------------------------------------------------------------------
-- APLICAÇÃO DAS POLICIES
-- ---------------------------------------------------------------------------
do $$
declare
  -- Conteúdo do site: qualquer visitante lê; só admin escreve.
  v_public_read text[] := array[
    'banners', 'selos', 'frases', 'diferenciais', 'categorias_cursos',
    'cursos_cadastrados', 'depoimentos', 'faqs', 'noticias', 'trajetoria',
    'redes_sociais', 'popups', 'vagas', 'configuracoes',
    'sorteios', 'sorteio_premios', 'sorteio_banners',
    'resgate_premios', 'resgate_funcionarios', 'resgate_banners'
  ];

  -- PII e dados internos: nada de anônimo, nem leitura nem escrita.
  v_admin_only text[] := array[
    'matriculas', 'matriculados', 'sorteio_participantes',
    'resgate_vouchers', 'contatos', 'ia_mensagens'
  ];

  v_tabela   text;
  v_policy   record;
  v_aplicadas integer := 0;
  v_ausentes  text[] := '{}';
begin
  -- ---- 1) Limpa TODAS as policies existentes das tabelas que vamos tratar ----
  -- Necessário porque as policies antigas são permissivas: no Postgres, várias
  -- policies permissivas se somam com OR. Deixar uma única `using (true)` para
  -- trás anularia todo o resto do trabalho.
  foreach v_tabela in array (v_public_read || v_admin_only) loop
    if to_regclass('public.' || quote_ident(v_tabela)) is null then
      v_ausentes := v_ausentes || v_tabela;
      continue;
    end if;

    for v_policy in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = v_tabela
    loop
      execute format('drop policy if exists %I on public.%I', v_policy.policyname, v_tabela);
    end loop;

    execute format('alter table public.%I enable row level security', v_tabela);
  end loop;

  -- ---- 2) PUBLIC_READ: leitura anônima + escrita exclusiva de admin ----
  foreach v_tabela in array v_public_read loop
    continue when to_regclass('public.' || quote_ident(v_tabela)) is null;

    -- GRANTs: leitura para todo mundo, escrita só chega a ser avaliada para
    -- quem está logado (e aí a policy exige eh_admin()).
    execute format('revoke all on public.%I from anon, authenticated', v_tabela);
    execute format('grant select on public.%I to anon, authenticated', v_tabela);
    execute format('grant insert, update, delete on public.%I to authenticated', v_tabela);

    execute format($p$
      create policy "leitura publica" on public.%I
        for select to anon, authenticated
        using (true)
    $p$, v_tabela);

    execute format($p$
      create policy "escrita apenas admin" on public.%I
        for all to authenticated
        using (public.eh_admin())
        with check (public.eh_admin())
    $p$, v_tabela);

    v_aplicadas := v_aplicadas + 1;
  end loop;

  -- ---- 3) ADMIN_ONLY: nem leitura anônima ----
  foreach v_tabela in array v_admin_only loop
    continue when to_regclass('public.' || quote_ident(v_tabela)) is null;

    -- anon perde qualquer privilégio: o PostgREST barra antes da policy.
    execute format('revoke all on public.%I from anon', v_tabela);
    execute format('revoke all on public.%I from authenticated', v_tabela);
    execute format('grant select, insert, update, delete on public.%I to authenticated', v_tabela);

    execute format($p$
      create policy "acesso apenas admin" on public.%I
        for all to authenticated
        using (public.eh_admin())
        with check (public.eh_admin())
    $p$, v_tabela);

    v_aplicadas := v_aplicadas + 1;
  end loop;

  raise notice 'Policies aplicadas em % tabela(s).', v_aplicadas;

  if array_length(v_ausentes, 1) > 0 then
    raise notice 'Tabelas listadas que NÃO existem neste banco (ignoradas): %',
      array_to_string(v_ausentes, ', ');
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- SEQUÊNCIAS
-- ---------------------------------------------------------------------------
-- As tabelas usam `generated by default as identity`, que não depende de GRANT
-- em sequência para o INSERT funcionar. Mas se houver alguma sequência antiga
-- exposta, tirar o acesso de anon evita que alguém consuma/avance os IDs.
do $$
declare
  v_seq record;
begin
  for v_seq in
    select sequencename from pg_sequences where schemaname = 'public'
  loop
    execute format('revoke all on sequence public.%I from anon', v_seq.sequencename);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- VERIFICAÇÃO: nenhuma policy de escrita pode ter sobrado com `true`
-- ---------------------------------------------------------------------------
do $$
declare
  v_ruins integer;
  v_lista text;
begin
  select count(*), string_agg(tablename || '.' || policyname, ', ')
    into v_ruins, v_lista
  from pg_policies
  where schemaname = 'public'
    and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
    and (coalesce(with_check, '') = 'true' or (cmd <> 'INSERT' and coalesce(qual, '') = 'true'));

  if v_ruins > 0 then
    raise warning 'Ainda existem % policy(ies) de escrita permissiva(s): %', v_ruins, v_lista;
  else
    raise notice 'OK: nenhuma policy de escrita com USING/WITH CHECK = true no schema public.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- VERIFICAÇÃO: tabelas do schema public sem RLS
-- ---------------------------------------------------------------------------
do $$
declare
  v_lista text;
begin
  select string_agg(c.relname, ', ')
    into v_lista
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

  if v_lista is not null then
    raise warning 'Tabelas SEM RLS habilitada (revise uma a uma): %', v_lista;
  else
    raise notice 'OK: todas as tabelas do schema public têm RLS habilitada.';
  end if;
end;
$$;
