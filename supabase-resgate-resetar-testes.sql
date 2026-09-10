  -- ============================================================================
  -- Resgate seu Prêmio — resetar depois dos testes
  -- ----------------------------------------------------------------------------
  -- Devolve a campanha ao estado "zero giro": repõe o estoque de cada prêmio e
  -- apaga o histórico de vouchers (usados e não usados).
  --
  -- O que NÃO é tocado:
  --   - resgate_funcionarios (a lista de participantes continua igual)
  --   - resgate_premios: nome, rótulo, peso e quantidade_total continuam iguais
  --     — só quantidade_disponivel volta a bater com quantidade_total
  --   - resgate_banners e a configuração de WhatsApp
  --
  -- Rode o PASSO 1 primeiro para conferir o que vai sumir. Rode o PASSO 2 só
  -- quando tiver certeza — ele apaga de vez o histórico de teste (giros e
  -- ranking, que são calculados a partir de resgate_vouchers).
  -- ============================================================================

  -- ---- PASSO 1: conferir antes -----------------------------------------------
  select
    (select count(*) from public.resgate_vouchers) as vouchers_no_total,
    (select count(*) from public.resgate_vouchers where usado) as giros_registrados,
    (select count(*) from public.resgate_vouchers where not usado) as vouchers_ainda_validos;

  select
    nome,
    quantidade_disponivel as disponivel_agora,
    quantidade_total as vai_voltar_para
  from public.resgate_premios
  where ativo
  order by ordem;

  -- ---- PASSO 2: resetar -------------------------------------------------------
  -- Repõe o estoque de todos os prêmios ativos da campanha.
  update public.resgate_premios
  set quantidade_disponivel = quantidade_total
  where ativo;

  -- Apaga todo o histórico de teste: giros realizados e vouchers ainda não usados.
  -- O ranking do admin é contado a partir desta tabela, então ele zera junto.
  delete from public.resgate_vouchers;

  -- ---- PASSO 3: conferir depois -----------------------------------------------
  select
    nome,
    quantidade_disponivel,
    quantidade_total
  from public.resgate_premios
  where ativo
  order by ordem;

  select count(*) as vouchers_restantes from public.resgate_vouchers;
