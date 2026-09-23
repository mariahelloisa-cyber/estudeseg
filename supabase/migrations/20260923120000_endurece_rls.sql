-- Endurecimento de RLS, storage e RPCs.
--
-- Políticas se combinam com OU: as antigas "<tabela>: * autenticado" com
-- using(true) anulavam as regras eh_admin() e deixavam QUALQUER usuário logado
-- editar/apagar o conteúdo do site. Aqui elas saem e só a regra de admin fica.

-- 1. Tabelas que já têm política ALL com eh_admin(): basta remover as antigas.
drop policy if exists "banners: delete autenticado" on public.banners;
drop policy if exists "banners: insert autenticado" on public.banners;
drop policy if exists "cursos_cadastrados: delete autenticado" on public.cursos_cadastrados;
drop policy if exists "cursos_cadastrados: insert autenticado" on public.cursos_cadastrados;
drop policy if exists "cursos_cadastrados: update autenticado" on public.cursos_cadastrados;
drop policy if exists "depoimentos: delete autenticado" on public.depoimentos;
drop policy if exists "depoimentos: insert autenticado" on public.depoimentos;
drop policy if exists "diferenciais: delete autenticado" on public.diferenciais;
drop policy if exists "diferenciais: insert autenticado" on public.diferenciais;
drop policy if exists "faqs: delete autenticado" on public.faqs;
drop policy if exists "faqs: insert autenticado" on public.faqs;
drop policy if exists "noticias: delete autenticado" on public.noticias;
drop policy if exists "noticias: insert autenticado" on public.noticias;
drop policy if exists "selos: delete autenticado" on public.selos;
drop policy if exists "selos: insert autenticado" on public.selos;
drop policy if exists "vagas: delete autenticado" on public.vagas;
drop policy if exists "vagas: insert autenticado" on public.vagas;

-- 2. Tabelas cuja ÚNICA escrita era a política antiga: troca por eh_admin(),
--    senão o painel admin perderia a edição delas.
drop policy if exists "banner_blog_lateral: delete autenticado" on public.banner_blog_lateral;
drop policy if exists "banner_blog_lateral: insert autenticado" on public.banner_blog_lateral;
create policy "banner_blog_lateral escrita admin" on public.banner_blog_lateral
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "cursos_destaque: delete autenticado" on public.cursos_destaque;
drop policy if exists "cursos_destaque: insert autenticado" on public.cursos_destaque;
drop policy if exists "cursos_destaque: update autenticado" on public.cursos_destaque;
create policy "cursos_destaque escrita admin" on public.cursos_destaque
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "sobre_historia: delete autenticado" on public.sobre_historia;
drop policy if exists "sobre_historia: insert autenticado" on public.sobre_historia;
create policy "sobre_historia escrita admin" on public.sobre_historia
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- 3. Bucket "banners": ficam só leitura pública + escrita/atualização/exclusão admin.
drop policy if exists "banners bucket: delete autenticado" on storage.objects;
drop policy if exists "banners bucket: upload autenticado" on storage.objects;
drop policy if exists "delete apenas autenticado" on storage.objects;
drop policy if exists "update apenas autenticado" on storage.objects;
drop policy if exists "upload apenas autenticado" on storage.objects;

-- 4. consumir_cota_chat é de uso exclusivo da Edge Function (service_role).
--    Aberta ao anon, qualquer um lotava o teto global e derrubava o chat.
revoke execute on function public.consumir_cota_chat(text, uuid, text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consumir_cota_chat(text, uuid, text, integer, integer, integer)
  to service_role;

-- 5. search_path fixo nas triggers (aviso do linter do Supabase).
create or replace function public.tocar_updated_at_configuracoes()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;
create or replace function public.tocar_updated_at_matriculados()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

-- 6. Leads dos popups: os formulários gravavam em tabelas que não existiam
--    (popup_capturas_email / popup_cadastros). Os dois passam a usar
--    popup_newsletter_inscricoes, que ganha "nome" e aceita INSERT público.
alter table public.popup_newsletter_inscricoes add column if not exists nome text;

alter table public.popup_newsletter_inscricoes
  add constraint popup_newsletter_email_valido
    check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  add constraint popup_newsletter_nome_tamanho
    check (nome is null or char_length(nome) between 1 and 120);

grant insert (popup_id, email, nome) on public.popup_newsletter_inscricoes to anon, authenticated;
grant usage on sequence public.popup_newsletter_inscricoes_id_seq to anon, authenticated;

create policy "popup_newsletter inscricao publica" on public.popup_newsletter_inscricoes
  for insert to anon, authenticated with check (true);
