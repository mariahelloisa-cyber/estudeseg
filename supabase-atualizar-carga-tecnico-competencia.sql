-- ============================================================================
-- Atualiza carga_horaria e duracao dos cursos da categoria Técnico por
-- competência (id 4).
-- ----------------------------------------------------------------------------
-- Os títulos reais no banco seguem o padrão
-- "Técnico por competência em <assunto> EAD" (confirmado por amostragem),
-- por isso o casamento usa "%em <assunto> EAD" ancorado no fim da string —
-- evita falso positivo tipo "Eletrônica" bater dentro de "Eletroeletrônica".
--
-- Regra: carga_horaria só é sobrescrita quando temos um valor real na lista.
-- Os cursos que estão como "não informada" na lista (Agente Comunitário de
-- Saúde, Análises Clínicas, Cuidador de Idosos, Edificações, Eletrotécnica,
-- Estética, Guia de Turismo, Logística, Mecânica [Industrial], Mecatrônica,
-- Papel e Celulose, Transações Imobiliárias, Veterinária) NÃO têm a
-- carga_horaria tocada — fica o que já está hoje no banco.
-- A duracao é atualizada de "6 a 12 meses" (valor atual) para "1 mês" nos 42,
-- confirmado explicitamente com o usuário.
--
-- Deste conjunto de 47 da lista original, 5 ficaram FORA porque não existem
-- na categoria Técnico por competência:
--   - Construção Naval e Soldagem: existem, mas na categoria "Técnico".
--   - Enfermagem: só existe como cursos específicos de Pós-Graduação.
--   - Óptica e Radiologia: não encontrados em nenhuma categoria.
-- Confirmado com o usuário: ignorar esses 5 e seguir só com os 42 restantes.
--
-- Também 2 nomes foram ajustados pro nome real no banco:
--   - "Mecânica Industrial" -> "Mecânica"
--   - "Sistemas de Energia Renovável" -> "Sistema de Energia Renovável"
--
-- O banco tem mais cursos nessa categoria do que os 42 daqui (ex.:
-- Agrimensura, Compliance, Computação Gráfica) — esses ficam intocados, não
-- fazem parte desta atualização.
--
-- 1) Rode o SELECT primeiro pra confirmar os 42 cursos e ver, na coluna
--    "carga_horaria_nova", quais vão realmente mudar (NULL = fica como está).
-- 2) Depois de confirmar, rode o UPDATE.
-- ============================================================================

with valores (assunto, carga_horaria, duracao) as (
  values
    ('Administração', '880h', '1 mês'),
    ('Agente Comunitário de Saúde', null, '1 mês'),
    ('Análises Clínicas', null, '1 mês'),
    ('Automação Industrial', '1230h', '1 mês'),
    ('Contabilidade', '800h', '1 mês'),
    ('Cuidador de Idosos', null, '1 mês'),
    ('Desenvolvimento de Sistemas', '1200h', '1 mês'),
    ('Edificações', null, '1 mês'),
    ('Eletroeletrônica', '1440h', '1 mês'),
    ('Eletromecânica', '1600h', '1 mês'),
    ('Eletrônica', '1200h', '1 mês'),
    ('Eletrotécnica', null, '1 mês'),
    ('Estética', null, '1 mês'),
    ('Farmácia', '1600h', '1 mês'),
    ('Gastronomia', '800h', '1 mês'),
    ('Guia de Turismo', null, '1 mês'),
    ('Informática', '1600h', '1 mês'),
    ('Logística', null, '1 mês'),
    ('Manutenção de Máquinas Industriais', '1200h', '1 mês'),
    ('Marketing', '800h', '1 mês'),
    ('Mecânica', null, '1 mês'),
    ('Mecatrônica', null, '1 mês'),
    ('Meio Ambiente', '1440h', '1 mês'),
    ('Metalurgia', '1200h', '1 mês'),
    ('Mineração', '1300h', '1 mês'),
    ('Nutrição e Dietética', '1200h', '1 mês'),
    ('Papel e Celulose', null, '1 mês'),
    ('Prevenção e Combate ao Incêndio', '1000h', '1 mês'),
    ('Qualidade', '800h', '1 mês'),
    ('Química', '1200h', '1 mês'),
    ('Recursos Humanos', '800h', '1 mês'),
    ('Redes de Computadores', '1000h', '1 mês'),
    ('Refrigeração e Climatização', '1440h', '1 mês'),
    ('Saúde Bucal', '1200h', '1 mês'),
    ('Secretaria Escolar', '800h', '1 mês'),
    ('Segurança do Trabalho', '1200h', '1 mês'),
    ('Serviços Jurídicos', '800h', '1 mês'),
    ('Sistema de Energia Renovável', '1200h', '1 mês'),
    ('Telecomunicações', '1440h', '1 mês'),
    ('Transações Imobiliárias', null, '1 mês'),
    ('Vendas', '800h', '1 mês'),
    ('Veterinária', null, '1 mês')
)

-- Passo 1 — confirme os 42 cursos antes de atualizar:
select
  c.id,
  c.titulo,
  c.duracao as duracao_atual,
  c.carga_horaria as carga_horaria_atual,
  v.duracao as duracao_nova,
  v.carga_horaria as carga_horaria_nova -- NULL aqui = carga_horaria fica como está hoje
from public.cursos_cadastrados c
join valores v on c.titulo ilike '%em ' || v.assunto || ' EAD'
join public.categorias_cursos cat on cat.id = c.categoria_id
where cat.id = 4;

-- Passo 2 — depois de confirmar as 42 linhas no SELECT acima, rode este UPDATE:

with valores (assunto, carga_horaria, duracao) as (
  values
    ('Administração', '880h', '1 mês'),
    ('Agente Comunitário de Saúde', null, '1 mês'),
    ('Análises Clínicas', null, '1 mês'),
    ('Automação Industrial', '1230h', '1 mês'),
    ('Contabilidade', '800h', '1 mês'),
    ('Cuidador de Idosos', null, '1 mês'),
    ('Desenvolvimento de Sistemas', '1200h', '1 mês'),
    ('Edificações', null, '1 mês'),
    ('Eletroeletrônica', '1440h', '1 mês'),
    ('Eletromecânica', '1600h', '1 mês'),
    ('Eletrônica', '1200h', '1 mês'),
    ('Eletrotécnica', null, '1 mês'),
    ('Estética', null, '1 mês'),
    ('Farmácia', '1600h', '1 mês'),
    ('Gastronomia', '800h', '1 mês'),
    ('Guia de Turismo', null, '1 mês'),
    ('Informática', '1600h', '1 mês'),
    ('Logística', null, '1 mês'),
    ('Manutenção de Máquinas Industriais', '1200h', '1 mês'),
    ('Marketing', '800h', '1 mês'),
    ('Mecânica', null, '1 mês'),
    ('Mecatrônica', null, '1 mês'),
    ('Meio Ambiente', '1440h', '1 mês'),
    ('Metalurgia', '1200h', '1 mês'),
    ('Mineração', '1300h', '1 mês'),
    ('Nutrição e Dietética', '1200h', '1 mês'),
    ('Papel e Celulose', null, '1 mês'),
    ('Prevenção e Combate ao Incêndio', '1000h', '1 mês'),
    ('Qualidade', '800h', '1 mês'),
    ('Química', '1200h', '1 mês'),
    ('Recursos Humanos', '800h', '1 mês'),
    ('Redes de Computadores', '1000h', '1 mês'),
    ('Refrigeração e Climatização', '1440h', '1 mês'),
    ('Saúde Bucal', '1200h', '1 mês'),
    ('Secretaria Escolar', '800h', '1 mês'),
    ('Segurança do Trabalho', '1200h', '1 mês'),
    ('Serviços Jurídicos', '800h', '1 mês'),
    ('Sistema de Energia Renovável', '1200h', '1 mês'),
    ('Telecomunicações', '1440h', '1 mês'),
    ('Transações Imobiliárias', null, '1 mês'),
    ('Vendas', '800h', '1 mês'),
    ('Veterinária', null, '1 mês')
)
update public.cursos_cadastrados c
set
  carga_horaria = coalesce(v.carga_horaria, c.carga_horaria), -- null na lista = mantém o valor atual
  duracao = v.duracao
from valores v, public.categorias_cursos cat
where c.titulo ilike '%em ' || v.assunto || ' EAD'
  and c.categoria_id = cat.id
  and cat.id = 4;
