

alter table public.cursos_cadastrados
  add column if not exists ordem_home integer;

comment on column public.cursos_cadastrados.ordem_home is
  'Posição manual do curso dentro da esteira "Quero..." da Home (grupo_home). Menor número aparece primeiro; nulo = ordena pelos mais recentes.';
