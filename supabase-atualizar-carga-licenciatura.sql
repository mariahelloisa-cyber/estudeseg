-- ============================================================================
-- Atualiza carga_horaria e duracao dos cursos da categoria Licenciatura.
-- ----------------------------------------------------------------------------
-- 1) Rode o SELECT primeiro pra confirmar que todos os 22 títulos casaram
--    com um curso da categoria Licenciatura (compare a contagem: tem que dar
--    22 linhas). Se algum título não bater (nome diferente no banco, acento,
--    "Licenciatura em..." como prefixo etc.), ele NÃO aparece no SELECT — só
--    ajusta o título na lista de valores abaixo antes do UPDATE.
-- 2) Depois de confirmar, rode o UPDATE.
-- ============================================================================

with valores (titulo, carga_horaria, duracao) as (
  values
    ('Andragogia', '3200h', '36 meses'),
    ('Artes', '3300h', '36 meses'),
    ('Artes Visuais', '3200h', '48 meses'),
    ('Ciências Biológicas', '3300h', '36 meses'),
    ('Ciências da Religião', '3400h', '48 meses'),
    ('Ciências Sociais', '3300h', '36 meses'),
    ('Computação e Informática', '3300h', '36 meses'),
    ('Educação Especial', '3400h', '48 meses'),
    ('Filosofia', '3200h', '48 meses'),
    ('Física', '3300h', '36 meses'),
    ('Geografia', '3300h', '48 meses'),
    ('História', '3400h', '48 meses'),
    ('Letras – Língua Portuguesa e Libras', '3400h', '48 meses'),
    ('Letras – Português e Espanhol', '3800h', '48 meses'),
    ('Letras – Português e Francês', '4000h', '48 meses'),
    ('Letras – Português e Inglês', '3400h', '48 meses'),
    ('Licenciatura em Educação Física', '3700h', '48 meses'),
    ('Matemática', '3300h', '48 meses'),
    ('Pedagogia', '3200h', '48 meses'),
    ('Psicopedagogia', '3300h', '48 meses'),
    ('Química', '3300h', '36 meses'),
    ('Sociologia', '3200h', '48 meses')
)

-- Passo 1 — confirme os 22 cursos antes de atualizar:
select
  c.id,
  c.titulo,
  c.duracao as duracao_atual,
  c.carga_horaria as carga_horaria_atual,
  v.duracao as duracao_nova,
  v.carga_horaria as carga_horaria_nova
from public.cursos_cadastrados c
join valores v on c.titulo ilike v.titulo
join public.categorias_cursos cat on cat.id = c.categoria_id
where cat.nome ilike '%licenciatura%';

-- Passo 2 — depois de confirmar as 22 linhas no SELECT acima, rode este UPDATE:

with valores (titulo, carga_horaria, duracao) as (
  values
    ('Andragogia', '3200h', '36 meses'),
    ('Artes', '3300h', '36 meses'),
    ('Artes Visuais', '3200h', '48 meses'),
    ('Ciências Biológicas', '3300h', '36 meses'),
    ('Ciências da Religião', '3400h', '48 meses'),
    ('Ciências Sociais', '3300h', '36 meses'),
    ('Computação e Informática', '3300h', '36 meses'),
    ('Educação Especial', '3400h', '48 meses'),
    ('Filosofia', '3200h', '48 meses'),
    ('Física', '3300h', '36 meses'),
    ('Geografia', '3300h', '48 meses'),
    ('História', '3400h', '48 meses'),
    ('Letras – Língua Portuguesa e Libras', '3400h', '48 meses'),
    ('Letras – Português e Espanhol', '3800h', '48 meses'),
    ('Letras – Português e Francês', '4000h', '48 meses'),
    ('Letras – Português e Inglês', '3400h', '48 meses'),
    ('Licenciatura em Educação Física', '3700h', '48 meses'),
    ('Matemática', '3300h', '48 meses'),
    ('Pedagogia', '3200h', '48 meses'),
    ('Psicopedagogia', '3300h', '48 meses'),
    ('Química', '3300h', '36 meses'),
    ('Sociologia', '3200h', '48 meses')
)
update public.cursos_cadastrados c
set
  carga_horaria = v.carga_horaria,
  duracao = v.duracao
from valores v, public.categorias_cursos cat
where c.titulo ilike v.titulo
  and c.categoria_id = cat.id
  and cat.nome ilike '%licenciatura%';
