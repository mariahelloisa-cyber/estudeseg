-- ============================================================================
-- "Não foi dessa vez" em duas fatias da roleta
-- ----------------------------------------------------------------------------
-- Hoje existe uma única linha "Não foi dessa vez" com 40 de estoque e peso
-- 0.7, marcada como o prêmio de consolação (eh_consolacao = true — é ela que
-- a RPC devolve quando todos os prêmios limitados acabam).
--
-- Este arquivo divide o MESMO estoque em duas fatias de 20, mantendo o peso
-- 0.7 nas duas. A chance total de cair em "Não foi dessa vez" não muda: hoje
-- é peso(0.7) × estoque(40) = 28 de "peso efetivo"; depois da divisão é
-- 0.7×20 + 0.7×20 = 28 também, a mesma soma, só espalhada em duas fatias
-- para equilibrar melhor o desenho da roda.
--
-- Só a fatia ORIGINAL continua marcada como consolação (eh_consolacao = true)
-- — é ela que garante resposta mesmo se, um dia, TODOS os prêmios (incluindo
-- as duas fatias de "Não foi dessa vez") estiverem zerados. A fatia nova é um
-- prêmio comum, sorteado normalmente como qualquer outro enquanto tiver
-- estoque; a RPC não precisa de nenhuma alteração para isso — ela já sorteia
-- e baixa estoque por `id`, nunca por nome.
--
-- A fatia nova entra no lado OPOSTO da roda (ordem 6 de 8), para as duas
-- ficarem visualmente espalhadas em vez de juntas.
--
-- Idempotente: rodar de novo não duplica a segunda fatia nem mexe no estoque
-- se ela já existir.
-- ============================================================================

do $$
declare
  v_original_id bigint;
  v_ja_existe boolean;
begin
  select id into v_original_id
  from public.resgate_premios
  where nome = 'Não foi dessa vez' and eh_consolacao
  limit 1;

  if v_original_id is null then
    raise notice 'Linha original de "Não foi dessa vez" (eh_consolacao=true) não encontrada — nada foi alterado. Rode supabase-resgate-estoque.sql antes deste arquivo.';
    return;
  end if;

  select exists(
    select 1 from public.resgate_premios
    where nome = 'Não foi dessa vez' and not eh_consolacao
  ) into v_ja_existe;

  if v_ja_existe then
    raise notice 'A segunda fatia de "Não foi dessa vez" já existe — nada foi alterado.';
    return;
  end if;

  -- Abre espaço na ordem: tudo que vinha depois da posição 5 sobe uma casa,
  -- para a fatia nova entrar em ordem 6 (lado oposto da original, ordem 2).
  update public.resgate_premios
  set ordem = ordem + 1
  where ativo and ordem >= 6;

  -- Reduz a fatia original de 40 para 20. Se ela já tinha estoque consumido
  -- (algum giro de teste), o consumido continua descontado — só o teto cai.
  update public.resgate_premios
  set
    quantidade_total = 20,
    quantidade_disponivel = least(quantidade_disponivel, 20)
  where id = v_original_id;

  -- Fatia nova: mesmo rótulo visual, mesmo peso, estoque cheio, prêmio comum
  -- (não é consolação — só a original tem esse papel).
  insert into public.resgate_premios
    (nome, rotulo, rotulo_secundario, peso, quantidade_total, quantidade_disponivel,
     ordem, ativo, eh_consolacao)
  select
    nome, rotulo, rotulo_secundario, peso, 20, 20,
    6, true, false
  from public.resgate_premios
  where id = v_original_id;

  raise notice 'Feito: "Não foi dessa vez" agora tem duas fatias de 20, peso 0.7 cada.';
end;
$$;

-- Conferir o resultado:
select id, nome, ordem, peso, quantidade_disponivel, quantidade_total, eh_consolacao
from public.resgate_premios
where ativo
order by ordem;
