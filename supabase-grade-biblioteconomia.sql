-- ============================================================================
-- Atualiza a grade curricular do curso "Biblioteconomia - Bacharelado" com
-- base no PDF enviado (6 semestres). Também atualiza a carga horária total
-- para 2400h.
-- ----------------------------------------------------------------------------
-- Observações:
-- 1) Assim como nos outros PDFs, o cabeçalho do 4º bloco de disciplinas está
--    escrito "SEMESTRE VI" (repetindo o número do 6º bloco) — erro de
--    digitação do documento original. Corrigido aqui para "4º Semestre".
-- 2) O PDF também tem alguns erros de digitação nos nomes das disciplinas
--    do 2º e 3º semestre ("Documetação", "Represnetação Descritiva",
--    "Documetos", "Representácão Descritiva"). Mantive a grafia exatamente
--    como está no documento — se quiser, ajuste o texto abaixo antes de
--    rodar (os nomes corretos seriam "Documentação" e "Representação
--    Descritiva").
--
-- 1) Rode o SELECT primeiro para confirmar o id do curso certo.
-- 2) Troque o :id no UPDATE pelo id encontrado e rode.
-- ============================================================================

-- Passo 1 — confirme qual curso vai ser atualizado:
select id, titulo, duracao, carga_horaria
from public.cursos_cadastrados
where titulo ilike '%biblioteconomia%';

-- Passo 2 — depois de confirmar o id certo acima, troque o :id abaixo e rode:
update public.cursos_cadastrados
set
  carga_horaria = '2400h',
  grade_curricular = '[
    {"titulo":"1º Semestre","disciplinas":[
      {"nome":"Fundamentação Matemática","horas":""},
      {"nome":"Gestão em Ação - Princípios e Estratégias","horas":""},
      {"nome":"Introdução à Contabilidade","horas":""},
      {"nome":"Meio Ambiente e Sustentabilidade","horas":""},
      {"nome":"Pensamento Crítico e Comunicação","horas":""},
      {"nome":"Ambiente de Trabalho Simulado - Gestão Integrada","horas":""},
      {"nome":"Tecnologia Digital","horas":""}
    ]},
    {"titulo":"2º Semestre","disciplinas":[
      {"nome":"Lógica Aplicada a Documetação","horas":""},
      {"nome":"Represnetação Descritiva","horas":""},
      {"nome":"Tecnologia de Informação e Comunicação - TIC","horas":""},
      {"nome":"Psicologia","horas":""},
      {"nome":"Sociologia","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"3º Semestre","disciplinas":[
      {"nome":"Análise Organizacional","horas":""},
      {"nome":"Gestão de Documetos","horas":""},
      {"nome":"Tratamento Temático da Informação","horas":""},
      {"nome":"Técnicas de Pesquisa","horas":""},
      {"nome":"Representácão Descritiva","horas":""},
      {"nome":"Métodos de Tomada de Decisão","horas":""}
    ]},
    {"titulo":"4º Semestre","disciplinas":[
      {"nome":"Administração de Unidades de Informação","horas":""},
      {"nome":"Indexação e Resumos","horas":""},
      {"nome":"Gestão de Bases de Dados","horas":""},
      {"nome":"Estatística","horas":""},
      {"nome":"Língua Brasileira de Sinais - Libras","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"5º Semestre","disciplinas":[
      {"nome":"Avaliação de Sistemas de Informação","horas":""},
      {"nome":"Logística de Distribuição","horas":""},
      {"nome":"Informática Documentária","horas":""},
      {"nome":"Serviços de Referência","horas":""},
      {"nome":"Bibliotecas Digitais","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"6º Semestre","disciplinas":[
      {"nome":"Gestão de Informação","horas":""},
      {"nome":"Direito Digital e Lei Geral de Proteção de Dados - LGPD","horas":""},
      {"nome":"Comportamento Organizacional","horas":""},
      {"nome":"Ambiente de Trabalho Simulado Final","horas":""},
      {"nome":"Estágio Supervisionado","horas":""},
      {"nome":"Atividades Complementares","horas":""}
    ]}
  ]'
where id = :id; -- <-- troque :id pelo id encontrado no Passo 1
