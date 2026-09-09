-- ============================================================================
-- SEGURANÇA 04 — RPCs PÚBLICAS E ADMINISTRATIVAS
-- Corrige [M-01] (brute force de voucher), [M-02] (oráculo de CPF),
-- parte de [H-04] (rate limit) e o grant excessivo de gerar_vouchers_resgate.
-- ----------------------------------------------------------------------------
-- PRÉ-REQUISITO: arquivos 01, 02 e 03 já rodados (usa eh_admin() e
-- consumir_rate_limit(), definidos lá).
--
-- Nenhuma funcionalidade é removida. A roleta, o resgate e a consulta de status
-- continuam funcionando igual para quem informa os dados corretos. O que muda é
-- o que o sistema responde para quem NÃO informa.
-- ============================================================================

-- Necessária para gen_random_bytes (gerador criptograficamente seguro usado
-- nos códigos de voucher). No Supabase o pgcrypto vive no schema `extensions`.
create extension if not exists pgcrypto with schema extensions;

-- ###########################################################################
-- 1) gerar_vouchers_resgate — era executável por qualquer conta autenticada
-- ###########################################################################
-- Com o signup aberto ([C-01]), "authenticated" era qualquer pessoa do mundo,
-- e qualquer pessoa do mundo podia emitir vouchers de prêmio para si mesma.
-- Duas travas: o GRANT deixa de ser do papel inteiro e a função checa eh_admin()
-- por dentro (defesa em profundidade — se um GRANT for reconcedido por engano,
-- a checagem interna continua barrando).
create or replace function public.gerar_vouchers_resgate(p_quantidade integer)
returns table (id bigint, codigo text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Alfabeto sem 0/O/1/I/L para ninguém errar ao digitar.
  v_alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  -- [M-01] 5 → 10 caracteres. O espaço de busca sai de 31^5 (~28,6 milhões)
  -- para 31^10 (~8,2 x 10^14): ~28 milhões de vezes maior. Combinado com o
  -- rate limit do giro, o brute force deixa de ser viável.
  v_tamanho  constant integer := 10;
  v_codigo text;
  v_tentativas integer;
  i integer;
  j integer;
begin
  if not public.eh_admin() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  if p_quantidade is null or p_quantidade < 1 or p_quantidade > 200 then
    raise exception 'Quantidade de vouchers deve ficar entre 1 e 200.';
  end if;

  for i in 1..p_quantidade loop
    v_tentativas := 0;
    loop
      v_codigo := '';
      for j in 1..v_tamanho loop
        -- gen_random_bytes (pgcrypto) é um gerador criptograficamente seguro.
        -- random() é previsível a partir de saídas observadas — inaceitável
        -- para um código que vale prêmio.
        v_codigo := v_codigo || substr(
          v_alfabeto,
          (get_byte(extensions.gen_random_bytes(1), 0) % length(v_alfabeto)) + 1,
          1
        );
      end loop;

      exit when not exists (
        select 1 from public.resgate_vouchers v where v.codigo = v_codigo
      );

      v_tentativas := v_tentativas + 1;
      if v_tentativas > 50 then
        raise exception 'Não foi possível gerar um código novo. Tente novamente.';
      end if;
    end loop;

    return query
      insert into public.resgate_vouchers (codigo)
      values (v_codigo)
      returning resgate_vouchers.id, resgate_vouchers.codigo;
  end loop;
end;
$$;

alter function public.gerar_vouchers_resgate(integer) owner to postgres;
revoke all on function public.gerar_vouchers_resgate(integer) from public, anon, authenticated;
grant execute on function public.gerar_vouchers_resgate(integer) to authenticated;
-- O GRANT acima é necessário para o painel funcionar; quem barra o não-admin é
-- o eh_admin() de dentro da função.

-- ###########################################################################
-- 2) girar_roleta_resgate — rate limit + resposta genérica
-- ###########################################################################
-- Vouchers de 5 caracteres já distribuídos continuam válidos: a função não olha
-- o tamanho do código. Só os NOVOS nascem com 10 caracteres.
create or replace function public.girar_roleta_resgate(
  p_nome_completo text,
  p_codigo text,
  p_funcionario_id bigint
)
returns table (
  resultado text,
  premio_id bigint,
  premio_nome text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_codigo text;
  v_voucher public.resgate_vouchers%rowtype;
  v_funcionario public.resgate_funcionarios%rowtype;
  v_total integer;
  v_sorteio integer;
  v_premio public.resgate_premios%rowtype;
  v_atualizados integer;
begin
  -- [M-01] 10 tentativas por IP por hora. Mesmo com um alfabeto pequeno, isso
  -- torna a varredura do espaço de códigos inviável na prática.
  if not public.consumir_rate_limit('resgate_giro', 10, interval '1 hour') then
    return query select 'limite_excedido'::text, null::bigint, null::text;
    return;
  end if;

  if p_nome_completo is null or length(trim(p_nome_completo)) < 3 then
    return query select 'voucher_invalido'::text, null::bigint, null::text;
    return;
  end if;

  v_codigo := upper(trim(coalesce(p_codigo, '')));

  select * into v_funcionario
  from public.resgate_funcionarios
  where id = p_funcionario_id and ativo;

  if not found then
    return query select 'funcionario_invalido'::text, null::bigint, null::text;
    return;
  end if;

  select * into v_voucher
  from public.resgate_vouchers
  where codigo = v_codigo
  for update;

  -- [M-01] Oráculo fechado: "não existe" e "já foi usado" passam a devolver
  -- exatamente a mesma resposta. O atacante não consegue mais usar a função
  -- para descobrir QUAIS códigos existem.
  if not found then
    return query select 'voucher_invalido'::text, null::bigint, null::text;
    return;
  end if;

  if v_voucher.usado then
    return query select 'voucher_invalido'::text, null::bigint, null::text;
    return;
  end if;

  select coalesce(sum(peso), 0) into v_total
  from public.resgate_premios
  where ativo and peso > 0;

  if v_total = 0 then
    return query select 'sem_premios'::text, null::bigint, null::text;
    return;
  end if;

  v_sorteio := floor(random() * v_total)::int + 1;

  select p.* into v_premio
  from (
    select
      r.*,
      sum(r.peso) over (order by r.ordem, r.id rows between unbounded preceding and current row) as acumulado
    from public.resgate_premios r
    where r.ativo and r.peso > 0
  ) p
  where p.acumulado >= v_sorteio
  order by p.acumulado
  limit 1;

  if not found then
    return query select 'sem_premios'::text, null::bigint, null::text;
    return;
  end if;

  update public.resgate_vouchers
  set
    usado = true,
    usado_em = now(),
    participante_nome = trim(p_nome_completo),
    funcionario_id = v_funcionario.id,
    funcionario_nome = v_funcionario.nome,
    premio_id = v_premio.id,
    premio_nome = v_premio.nome
  where id = v_voucher.id and usado = false;

  get diagnostics v_atualizados = row_count;
  if v_atualizados = 0 then
    return query select 'voucher_invalido'::text, null::bigint, null::text;
    return;
  end if;

  return query select 'sucesso'::text, v_premio.id, v_premio.nome;
end;
$$;

alter function public.girar_roleta_resgate(text, text, bigint) owner to postgres;
revoke all on function public.girar_roleta_resgate(text, text, bigint) from public;
grant execute on function public.girar_roleta_resgate(text, text, bigint) to anon, authenticated;

-- ###########################################################################
-- 3) girar_roleta_premiada — fecha o oráculo de CPF [M-02]
-- ###########################################################################
-- A ÚNICA mudança de lógica: a checagem "já participou?" saiu do passo 1 e foi
-- para DEPOIS da validação de identidade completa (nome + CPF + matrícula +
-- status certificado). O recurso continua existindo — quem já girou continua
-- vendo o prêmio que ganhou — mas agora só quem prova ser o dono dos dados
-- consegue essa informação. Antes bastava o CPF.
create or replace function public.girar_roleta_premiada(
  p_nome_completo text,
  p_cpf text,
  p_numero_matricula text
)
returns table (
  resultado text,
  premio_nome text,
  premio_tipo text,
  percentual_cashback numeric,
  data_sorteio timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cpf_normalizado text := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
  v_matriculado record;
  v_participacao record;
  v_premio record;
  v_total_peso integer;
  v_sorteio numeric;
  v_acumulado integer := 0;
  v_ip text;
  v_user_agent text;
begin
  -- Rate limit: 10 tentativas por IP por hora impedem varrer CPFs em massa.
  if not public.consumir_rate_limit('roleta_premiada', 10, interval '1 hour') then
    return query select 'nao_encontrado'::text, null::text, null::text, null::numeric, null::timestamptz;
    return;
  end if;

  -- 1) Campanha ativa? (não depende de dado pessoal, pode vir antes)
  if coalesce(
       (select valor from public.configuracoes where chave = 'sorteio_ativo'),
       'true'
     ) = 'false' then
    return query select 'campanha_inativa'::text, null::text, null::text, null::numeric, null::timestamptz;
    return;
  end if;

  -- 2) IDENTIDADE PRIMEIRO. Nada é revelado antes daqui.
  select * into v_matriculado
  from public.matriculados m
  where lower(trim(m.nome_completo)) = lower(trim(p_nome_completo))
    and regexp_replace(m.cpf, '\D', '', 'g') = v_cpf_normalizado
    and lower(trim(m.numero_matricula)) = lower(trim(coalesce(p_numero_matricula, '')))
    and m.status_order = 7
  limit 1;

  if not found then
    -- Resposta única e genérica: não diz se o CPF existe, se o nome bate, se a
    -- matrícula existe ou se o status é outro. Sem sinal para enumerar.
    return query select 'nao_encontrado'::text, null::text, null::text, null::numeric, null::timestamptz;
    return;
  end if;

  -- 3) Só agora, com a identidade provada, olhamos a participação anterior.
  select * into v_participacao
  from public.sorteio_participantes
  where cpf = v_cpf_normalizado
  limit 1;

  if found then
    return query select 'ja_participou'::text, v_participacao.premio, v_participacao.premio_tipo,
      v_participacao.percentual_cashback, v_participacao.data_sorteio;
    return;
  end if;

  -- 4) Sorteio ponderado
  select coalesce(sum(peso), 0) into v_total_peso
  from public.sorteio_premios where ativo = true;

  if v_total_peso <= 0 then
    return query select 'sem_premios'::text, null::text, null::text, null::numeric, null::timestamptz;
    return;
  end if;

  v_sorteio := random() * v_total_peso;

  for v_premio in
    select * from public.sorteio_premios where ativo = true order by ordem asc, id asc
  loop
    v_acumulado := v_acumulado + v_premio.peso;
    exit when v_sorteio <= v_acumulado;
  end loop;

  -- Registro de origem, só para estatística.
  begin
    v_ip := public.identidade_requisicao();
    v_user_agent := current_setting('request.headers', true)::json ->> 'user-agent';
  exception when others then
    v_ip := null;
    v_user_agent := null;
  end;

  begin
    insert into public.sorteio_participantes
      (nome, cpf, numero_matricula, matriculado_id, premio, premio_tipo,
       percentual_cashback, ip, user_agent)
    values
      (trim(p_nome_completo), v_cpf_normalizado, trim(p_numero_matricula),
       v_matriculado.id, v_premio.nome, v_premio.tipo, v_premio.percentual_cashback,
       v_ip, v_user_agent);
  exception when unique_violation then
    select * into v_participacao
    from public.sorteio_participantes where cpf = v_cpf_normalizado limit 1;
    return query select 'ja_participou'::text, v_participacao.premio, v_participacao.premio_tipo,
      v_participacao.percentual_cashback, v_participacao.data_sorteio;
    return;
  end;

  return query select 'sucesso'::text, v_premio.nome, v_premio.tipo,
    v_premio.percentual_cashback, now();
end;
$$;

alter function public.girar_roleta_premiada(text, text, text) owner to postgres;
revoke all on function public.girar_roleta_premiada(text, text, text) from public;
grant execute on function public.girar_roleta_premiada(text, text, text) to anon, authenticated;

-- ###########################################################################
-- 4) buscar_status_matricula — rate limit contra enumeração
-- ###########################################################################
-- A função já exigia as três credenciais (nome + CPF + nascimento) e já devolvia
-- só os campos de progresso, sem PII. Faltava impedir a tentativa em massa.
create or replace function public.buscar_status_matricula(
  p_nome_completo text,
  p_cpf text,
  p_data_nascimento date
)
returns table (
  numero_matricula text,
  nome_completo text,
  curso text,
  status_order smallint,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.consumir_rate_limit('status_matricula', 15, interval '1 hour') then
    return;  -- silêncio: mesma resposta de "não encontrado"
  end if;

  return query
  select m.numero_matricula, m.nome_completo, m.curso, m.status_order, m.updated_at
  from public.matriculados m
  where lower(trim(m.nome_completo)) = lower(trim(p_nome_completo))
    and regexp_replace(m.cpf, '\D', '', 'g') = regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g')
    and m.data_nascimento = p_data_nascimento
  limit 1;
end;
$$;

alter function public.buscar_status_matricula(text, text, date) owner to postgres;
revoke all on function public.buscar_status_matricula(text, text, date) from public;
grant execute on function public.buscar_status_matricula(text, text, date) to anon, authenticated;

-- ###########################################################################
-- 5) Varredura final: nenhuma função pode continuar aberta a PUBLIC
-- ###########################################################################
do $$
declare
  v_lista text;
begin
  select string_agg(p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', E'\n  ')
    into v_lista
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
    and (p.proconfig is null or not exists (
        select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%'
      ));

  if v_lista is not null then
    raise warning 'Funções SECURITY DEFINER sem search_path travado em vazio:%s  %', E'\n', v_lista;
  else
    raise notice 'OK: toda função SECURITY DEFINER tem search_path travado.';
  end if;
end;
$$;

-- ###########################################################################
-- 6) Assistente de IA — suporte ao rate limit por IP [M-03]
-- ###########################################################################
-- A Edge Function chat-agent contava o limite por `sessao_id`, um valor que o
-- próprio cliente manda no corpo da requisição: bastava gerar outro UUID para
-- zerar o contador. Agora ela conta por IP, e precisa desta coluna.
alter table public.ia_mensagens
  add column if not exists ip text;

comment on column public.ia_mensagens.ip is
  'IP de origem, usado pelo rate limit da Edge Function chat-agent. Preenchido '
  'por ela via service_role. Necessário para limitar custo de IA por pessoa.';

create index if not exists ia_mensagens_ip_created_idx
  on public.ia_mensagens (ip, created_at desc);

-- Índice do teto global por hora.
create index if not exists ia_mensagens_created_idx
  on public.ia_mensagens (created_at desc);
