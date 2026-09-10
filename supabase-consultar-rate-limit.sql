-- ============================================================================
-- Diagnóstico: rate limit do giro da roleta "Resgate seu Prêmio"
-- ----------------------------------------------------------------------------
-- girar_roleta_resgate chama consumir_rate_limit('resgate_giro', 10, interval
-- '1 hour') como primeiro passo — 10 tentativas por hora, por IP, e TODA
-- chamada conta (inclusive voucher digitado errado, nome inválido etc.), não
-- só os giros que deram certo.
--
-- Este arquivo só CONSULTA. Rode o PASSO 1 no SQL Editor do Supabase e me
-- mande o resultado — a partir daí eu te dou a instrução exata (aumentar o
-- limite, ou liberar sua cota agora) sem eu ter que adivinhar o nome da
-- tabela por trás da função.
-- ============================================================================

-- PASSO 1: mostra o código-fonte da função — de onde vem o "10 por hora" e em
-- qual tabela/coluna ela guarda a contagem.
select pg_get_functiondef('public.consumir_rate_limit(text, integer, interval)'::regprocedure);
