-- ============================================================================
-- Libera a cota do rate limit do giro AGORA (destrava pra continuar testando)
-- ----------------------------------------------------------------------------
-- consumir_rate_limit guarda cada tentativa em public.seguranca_rate_limit
-- (chave, identidade, ocorrido_em). Isto apaga só as tentativas do giro da
-- roleta ("resgate_giro"), sem tocar em nenhum outro rate limit do site
-- (login, chat, etc. usam outras chaves e não são afetados).
--
-- PASSO 1 — conferir antes: quantas tentativas tem registradas e de quais
-- identidades (deve aparecer o(s) IP(s) de onde você testou).
select identidade, count(*) as tentativas, max(ocorrido_em) as ultima_tentativa
from public.seguranca_rate_limit
where chave = 'resgate_giro'
group by identidade
order by ultima_tentativa desc;

-- PASSO 2 — apagar tudo dessa chave, liberando a cota pra todo mundo agora:
delete from public.seguranca_rate_limit
where chave = 'resgate_giro';
