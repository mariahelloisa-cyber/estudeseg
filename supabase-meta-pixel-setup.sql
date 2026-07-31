-- ============================================================
-- Meta Pixel (Facebook/Instagram Ads) — Estude Seguro
-- ============================================================
-- Não cria nenhuma tabela nova nem policy nova: reaproveita a tabela
-- "configuracoes" (já existente, RLS já configurada — select público,
-- insert/update restritos a usuários autenticados do painel admin).
--
-- Este bloco é só para garantir que a chave já existe com um valor vazio
-- (Pixel desativado) antes do primeiro uso — o painel admin funciona
-- normalmente mesmo sem rodar isso, pois lida com a chave ausente.

insert into public.configuracoes (chave, valor)
values ('meta_pixel_id', '')
on conflict (chave) do nothing;
