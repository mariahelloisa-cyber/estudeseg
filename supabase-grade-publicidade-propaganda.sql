-- ============================================================================
-- Atualiza a grade curricular do curso "Publicidade e Propaganda - Bacharelado"
-- com base no PDF enviado (7 semestres). Também atualiza a carga horária
-- total para 3000h.
-- ----------------------------------------------------------------------------
-- Observação: assim como no PDF de Sistemas de Informação, o cabeçalho do 4º
-- bloco de disciplinas está escrito "SEMESTRE VI" (repetindo o número do 6º
-- bloco) — erro de digitação do documento original. Corrigido aqui para
-- "4º Semestre", respeitando a ordem em que os blocos aparecem.
--
-- 1) Rode o SELECT primeiro para confirmar o id do curso certo.
-- 2) Troque o :id no UPDATE pelo id encontrado e rode.
-- ============================================================================

-- Passo 1 — confirme qual curso vai ser atualizado:
select id, titulo, duracao, carga_horaria
from public.cursos_cadastrados
where titulo ilike '%publicidade e propaganda%';

-- Passo 2 — depois de confirmar o id certo acima, troque o :id abaixo e rode:
update public.cursos_cadastrados
set
  carga_horaria = '3000h',
  grade_curricular = '[
    {"titulo":"1º Semestre","disciplinas":[
      {"nome":"Introdução Bíblica","horas":""},
      {"nome":"Gestão no Universo da TI","horas":""},
      {"nome":"Meio Ambiente e Sustentabilidade","horas":""},
      {"nome":"Pensamento Crítico e Comunicação","horas":""},
      {"nome":"Programação Criativa: da Lógica ao Código","horas":""},
      {"nome":"Projeto Multidisciplinar - Base da TI","horas":""},
      {"nome":"Tecnologia Digital","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"2º Semestre","disciplinas":[
      {"nome":"Sociologia da Comunicação","horas":""},
      {"nome":"História da Arte","horas":""},
      {"nome":"Teorias e Técnicas da Publicidade","horas":""},
      {"nome":"Design Gráfico","horas":""},
      {"nome":"Linguagem e Produção Textual","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"3º Semestre","disciplinas":[
      {"nome":"Antropologia, Comunicação e Diversidade","horas":""},
      {"nome":"Comportamento e Tendências de Consumo","horas":""},
      {"nome":"Laboratório de Design e Identidade Visual","horas":""},
      {"nome":"Marketing Digital","horas":""},
      {"nome":"Negócios Eletrônicos","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"4º Semestre","disciplinas":[
      {"nome":"Filosofia e Comunicação","horas":""},
      {"nome":"Processos de Criação","horas":""},
      {"nome":"Planejamento Estratégico e Gestão de Marcas","horas":""},
      {"nome":"Pesquisa e Análise de Dados","horas":""},
      {"nome":"Laboratório de Pesquisa e Visualização de Dados","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"5º Semestre","disciplinas":[
      {"nome":"Criação Publicitária","horas":""},
      {"nome":"Direção de Arte","horas":""},
      {"nome":"Linguagem Fotográfica","horas":""},
      {"nome":"Planejamento de Campanha","horas":""},
      {"nome":"Redação Publicitária","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"6º Semestre","disciplinas":[
      {"nome":"Comunicação Visual","horas":""},
      {"nome":"Planejamento e Gestão de Mídia","horas":""},
      {"nome":"Produção Publicitária","horas":""},
      {"nome":"Mídia e Novas Tecnologias","horas":""},
      {"nome":"Ética e Legislação na Comunicação","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"7º Semestre","disciplinas":[
      {"nome":"Produção Audiovisual","horas":""},
      {"nome":"Linguagem Audiovisual","horas":""},
      {"nome":"Roteiros","horas":""},
      {"nome":"Mensuração e Avaliação de Campanhas","horas":""},
      {"nome":"Live Marketing e Merchandising","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]}
  ]'
where id = :id; -- <-- troque :id pelo id encontrado no Passo 1
