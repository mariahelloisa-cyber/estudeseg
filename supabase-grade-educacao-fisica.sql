-- ============================================================================
-- Atualiza a grade curricular do curso "Educação Física - Bacharelado" com
-- base no PDF enviado (8 semestres). Também atualiza a carga horária total
-- para 3200h.
-- ----------------------------------------------------------------------------
-- 1) Rode o SELECT primeiro para confirmar o id do curso certo.
-- 2) Troque o :id no UPDATE pelo id encontrado e rode.
-- ============================================================================

-- Passo 1 — confirme qual curso vai ser atualizado:
select id, titulo, duracao, carga_horaria
from public.cursos_cadastrados
where titulo ilike '%educação física%' or titulo ilike '%educacao fisica%';

-- Passo 2 — depois de confirmar o id certo acima, troque o :id abaixo e rode:
update public.cursos_cadastrados
set
  carga_horaria = '3200h',
  grade_curricular = '[
    {"titulo":"1º Semestre","disciplinas":[
      {"nome":"Biologia da Vida - Fundamentos para a Saúde","horas":""},
      {"nome":"Cuidado Humanizado - Empatia e Ética no Atendimento","horas":""},
      {"nome":"Fundamentação Matemática","horas":""},
      {"nome":"Pensamento Crítico e Comunicação","horas":""},
      {"nome":"Políticas Públicas de Saúde","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"2º Semestre","disciplinas":[
      {"nome":"Introdução à Gestão Esportiva","horas":""},
      {"nome":"Tecnologia Digital","horas":""},
      {"nome":"Marketing Esportivo","horas":""},
      {"nome":"Sociologia do Esporte e do Lazer","horas":""},
      {"nome":"Legislação Esportiva e de Lazer","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"3º Semestre","disciplinas":[
      {"nome":"Gestão Financeira em Esporte e Lazer","horas":""},
      {"nome":"Organização de Eventos Esportivos","horas":""},
      {"nome":"Desenvolvimento de Projetos em Esporte e Lazer","horas":""},
      {"nome":"Gestão de Projetos Esportivos e de Lazer","horas":""},
      {"nome":"Gestão de Infraestrutura Esportiva e de Lazer","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"4º Semestre","disciplinas":[
      {"nome":"Gestão de Pessoas em Esporte e Lazer","horas":""},
      {"nome":"Gestão de Academias","horas":""},
      {"nome":"Nutrição e Saúde no Esporte","horas":""},
      {"nome":"Inovação e Tendências em Tecnologia Esportiva","horas":""},
      {"nome":"Psicologia do Desenvolvimento e do Esporte","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"5º Semestre","disciplinas":[
      {"nome":"Anatomia Aplicada ao Exercício","horas":""},
      {"nome":"Fisiologia Básica","horas":""},
      {"nome":"Controle e Aprendizagem Motora","horas":""},
      {"nome":"Fisiologia do Exercício","horas":""},
      {"nome":"Crescimento e Desenvolvimento","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"6º Semestre","disciplinas":[
      {"nome":"Epidemiologia e Bioestatística","horas":""},
      {"nome":"Atividade Física para Grupos Especiais","horas":""},
      {"nome":"Cinesiologia","horas":""},
      {"nome":"Arte, Cultura e Educação","horas":""},
      {"nome":"Manifestações Rítmicas Expressivas","horas":""},
      {"nome":"Projeto: Análise Estatística em Esporte","horas":""}
    ]},
    {"titulo":"7º Semestre","disciplinas":[
      {"nome":"Treinamento Desportivo: Conceitos","horas":""},
      {"nome":"Avaliação Física e Motora","horas":""},
      {"nome":"Manifestações Esportivas e Alternativas","horas":""},
      {"nome":"Atividades Físicas para Crianças e Adolescentes","horas":""},
      {"nome":"Futebol","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"8º Semestre","disciplinas":[
      {"nome":"Atividades de Academia","horas":""},
      {"nome":"Ginásticas","horas":""},
      {"nome":"Atividades Físicas para o Idoso","horas":""},
      {"nome":"Atividades Físicas para Jovens e Adultos","horas":""},
      {"nome":"Musculação","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]}
  ]'
where id = 323; -- <-- troque :id pelo id encontrado no Passo 1
