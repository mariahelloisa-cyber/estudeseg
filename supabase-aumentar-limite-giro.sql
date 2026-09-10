-- ============================================================================
-- Aumenta o rate limit do giro de 10 para 30 tentativas por hora
-- ----------------------------------------------------------------------------
-- Só muda o "10" → "30" na primeira linha do corpo da função (o resto é
-- idêntico ao que já está rodando: mesmo rate limit, mesmo sorteio por
-- peso × estoque, mesma proteção de concorrência e de voucher). Útil
-- enquanto vocês ainda estão testando; pode voltar para 10 (ou outro número)
-- antes de divulgar a campanha pra valer — é só trocar o número e rodar de
-- novo.
--
-- Ajuste o "30" abaixo para o número que fizer sentido antes de rodar.
-- ============================================================================

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
  v_total numeric;
  v_sorteio numeric;
  v_premio_id bigint;
  v_premio_nome text;
  v_baixa_estoque boolean := true;
  v_atualizados integer;
begin
  -- ↓↓↓ único número alterado nesta função: 10 → 30 tentativas por hora ↓↓↓
  if not public.consumir_rate_limit('resgate_giro', 30, interval '1 hour') then
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

  if not found then
    return query select 'voucher_invalido'::text, null::bigint, null::text;
    return;
  end if;

  if v_voucher.usado then
    return query select 'voucher_invalido'::text, null::bigint, null::text;
    return;
  end if;

  perform pg_advisory_xact_lock(724531001);

  select coalesce(sum(peso * quantidade_disponivel), 0) into v_total
  from public.resgate_premios
  where ativo and peso > 0 and quantidade_disponivel > 0;

  if v_total > 0 then
    v_sorteio := v_total * random()::numeric;

    select p.id, p.nome into v_premio_id, v_premio_nome
    from (
      select
        r.id,
        r.nome,
        sum(r.peso * r.quantidade_disponivel) over (
          order by r.ordem, r.id
          rows between unbounded preceding and current row
        ) as acumulado
      from public.resgate_premios r
      where r.ativo and r.peso > 0 and r.quantidade_disponivel > 0
    ) p
    where p.acumulado > v_sorteio
    order by p.acumulado
    limit 1;
  end if;

  if v_premio_id is null then
    select id, nome into v_premio_id, v_premio_nome
    from public.resgate_premios
    where eh_consolacao and ativo
    limit 1;

    v_baixa_estoque := false;
  end if;

  if v_premio_id is null then
    return query select 'sem_premios'::text, null::bigint, null::text;
    return;
  end if;

  if v_baixa_estoque then
    update public.resgate_premios
    set quantidade_disponivel = quantidade_disponivel - 1
    where id = v_premio_id and quantidade_disponivel > 0;

    get diagnostics v_atualizados = row_count;
    if v_atualizados = 0 then
      raise exception 'Estoque do prêmio % mudou durante o giro.', v_premio_id;
    end if;
  end if;

  update public.resgate_vouchers
  set
    usado = true,
    usado_em = now(),
    participante_nome = trim(p_nome_completo),
    funcionario_id = v_funcionario.id,
    funcionario_nome = v_funcionario.nome,
    premio_id = v_premio_id,
    premio_nome = v_premio_nome
  where id = v_voucher.id and usado = false;

  get diagnostics v_atualizados = row_count;
  if v_atualizados = 0 then
    raise exception 'Voucher % mudou de estado durante o giro.', v_voucher.id;
  end if;

  return query select 'sucesso'::text, v_premio_id, v_premio_nome;
end;
$$;

alter function public.girar_roleta_resgate(text, text, bigint) owner to postgres;
revoke all on function public.girar_roleta_resgate(text, text, bigint) from public;
grant execute on function public.girar_roleta_resgate(text, text, bigint) to anon, authenticated;
