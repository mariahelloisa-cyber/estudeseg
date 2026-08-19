-- Adiciona a coluna usada para controlar manualmente a ordem dos cursos dentro de cada
-- esteira "Quero..." da Home (Cursos Técnicos EAD, Certificação por Competência, Tecnólogos e EJA).
-- Cursos com ordem_home preenchida aparecem primeiro, do menor para o maior número; os que
-- ficarem sem valor continuam aparecendo depois, ordenados pelos mais recentes (comportamento
-- que já existia antes desta coluna existir).

alter table public.cursos_cadastrados
  add column if not exists ordem_home integer;

comment on column public.cursos_cadastrados.ordem_home is
  'Posição manual do curso dentro da esteira "Quero..." da Home (grupo_home). Menor número aparece primeiro; nulo = ordena pelos mais recentes.';
