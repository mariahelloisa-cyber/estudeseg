-- Só consulta: mostra como a "identidade" usada no rate limit é calculada
-- (confirma se é mesmo por IP, ou se leva em conta outra coisa).
select pg_get_functiondef('public.identidade_requisicao()'::regprocedure);
