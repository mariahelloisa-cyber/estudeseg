-- ============================================================================
-- Adiciona a coluna "ativo" em cursos_cadastrados, para permitir inativar um
-- curso (tirar do site) sem precisar apagar o registro.
-- ----------------------------------------------------------------------------
-- Todo curso existente já cadastrado fica marcado como ativo (true) depois de
-- rodar este script; novos cursos também nascem ativos por padrão.
--
-- Rode este script uma vez no SQL Editor do Supabase.
-- ============================================================================

alter table public.cursos_cadastrados
  add column if not exists ativo boolean not null default true;
