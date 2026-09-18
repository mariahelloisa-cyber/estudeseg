-- ============================================================================
-- Atualiza carga_horaria e duracao dos cursos da categoria Pós-Técnico.
-- ----------------------------------------------------------------------------
-- Regra: carga_horaria só é sobrescrita quando temos um valor real na lista.
-- Os 7 cursos que ainda estão como "não informada" (Administração de
-- Materiais, Educação Inclusiva, Ergonomia, Instalação Elétrica Predial de
-- Baixa Tensão, Legislação Educacional, Tradução e Interpretação em Libras,
-- Usinagem) NÃO têm a carga_horaria tocada — fica o que já está hoje no banco.
-- A duracao ("3 a 6 meses") é atualizada para todos os 25, já que não foi
-- listada como "não informada" em nenhum deles.
--
-- 1) Rode o SELECT primeiro pra confirmar os 25 cursos e ver, coluna
--    "carga_horaria_nova", quais vão realmente mudar (NULL = fica como está).
-- 2) Depois de confirmar, rode o UPDATE.
-- ============================================================================

with valores (titulo, carga_horaria, duracao) as (
  values
    ('Especialização Técnica em Administração de Materiais', null, '3 a 6 meses'),
    ('Especialização Técnica em Administração de Produção', '480h', '3 a 6 meses'),
    ('Especialização Técnica em Centro de Material e Esterilização', '420h', '3 a 6 meses'),
    ('Especialização Técnica em Comunicação', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Controle da Qualidade em Farmácia', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Educação Inclusiva', null, '3 a 6 meses'),
    ('Especialização Técnica em Energia Solar Fotovoltaica', '420h', '3 a 6 meses'),
    ('Especialização Técnica em Ergonomia', null, '3 a 6 meses'),
    ('Especialização Técnica em Farmácia Hospitalar', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Higiene Ocupacional', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Informação e Documentação Escolar', '480h', '3 a 6 meses'),
    ('Especialização Técnica em Instalação Elétrica Predial de Baixa Tensão', null, '3 a 6 meses'),
    ('Especialização Técnica em Legislação Educacional', null, '3 a 6 meses'),
    ('Especialização Técnica em Manipulação em Laboratório de Farmácia', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Mídias Digitais', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Oncologia', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Prevenção e Combate a Incêndio', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Redação de Contratos', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Saúde do Trabalhador (Segurança do Trabalho)', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Saúde Pública', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Segurança do Trabalho na Construção Civil', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Terapia Intensiva', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Tradução e Interpretação em Libras', null, '3 a 6 meses'),
    ('Especialização Técnica em Urgência e Emergência / APH', '350h', '3 a 6 meses'),
    ('Especialização Técnica em Usinagem', null, '3 a 6 meses')
)

-- Passo 1 — confirme os 25 cursos antes de atualizar:
select
  c.id,
  c.titulo,
  c.duracao as duracao_atual,
  c.carga_horaria as carga_horaria_atual,
  v.duracao as duracao_nova,
  v.carga_horaria as carga_horaria_nova -- NULL aqui = carga_horaria fica como está hoje
from public.cursos_cadastrados c
join valores v on c.titulo ilike v.titulo
join public.categorias_cursos cat on cat.id = c.categoria_id
where cat.nome ilike '%pós-técnico%';

-- Passo 2 — depois de confirmar as 25 linhas no SELECT acima, rode este UPDATE:

with valores (titulo, carga_horaria, duracao) as (
  values
    ('Especialização Técnica em Administração de Materiais', null, '3 a 6 meses'),
    ('Especialização Técnica em Administração de Produção', '480h', '3 a 6 meses'),
    ('Especialização Técnica em Centro de Material e Esterilização', '420h', '3 a 6 meses'),
    ('Especialização Técnica em Comunicação', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Controle da Qualidade em Farmácia', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Educação Inclusiva', null, '3 a 6 meses'),
    ('Especialização Técnica em Energia Solar Fotovoltaica', '420h', '3 a 6 meses'),
    ('Especialização Técnica em Ergonomia', null, '3 a 6 meses'),
    ('Especialização Técnica em Farmácia Hospitalar', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Higiene Ocupacional', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Informação e Documentação Escolar', '480h', '3 a 6 meses'),
    ('Especialização Técnica em Instalação Elétrica Predial de Baixa Tensão', null, '3 a 6 meses'),
    ('Especialização Técnica em Legislação Educacional', null, '3 a 6 meses'),
    ('Especialização Técnica em Manipulação em Laboratório de Farmácia', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Mídias Digitais', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Oncologia', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Prevenção e Combate a Incêndio', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Redação de Contratos', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Saúde do Trabalhador (Segurança do Trabalho)', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Saúde Pública', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Segurança do Trabalho na Construção Civil', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Terapia Intensiva', '400h', '3 a 6 meses'),
    ('Especialização Técnica em Tradução e Interpretação em Libras', null, '3 a 6 meses'),
    ('Especialização Técnica em Urgência e Emergência / APH', '350h', '3 a 6 meses'),
    ('Especialização Técnica em Usinagem', null, '3 a 6 meses')
)
update public.cursos_cadastrados c
set
  carga_horaria = coalesce(v.carga_horaria, c.carga_horaria), -- null na lista = mantém o valor atual
  duracao = v.duracao
from valores v, public.categorias_cursos cat
where c.titulo ilike v.titulo
  and c.categoria_id = cat.id
  and cat.nome ilike '%pós-técnico%';
