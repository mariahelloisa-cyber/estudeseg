-- ============================================================================
-- Atualiza a grade curricular do curso "Ciências Biológicas - Bacharelado"
-- com base no PDF enviado (8 semestres). Também atualiza a carga horária
-- total para 3200h.
-- ----------------------------------------------------------------------------
-- Observação: no PDF, o 1º semestre lista "Ambiente de Trabalho Simulado"
-- duas vezes (2ª e 7ª linha da tabela). Mantive a duplicata como está no
-- documento — se for engano do PDF, é só remover uma das duas ocorrências
-- abaixo antes de rodar.
--
-- 1) Rode o SELECT primeiro para confirmar o id do curso certo.
-- 2) Troque o :id no UPDATE pelo id encontrado e rode.
-- ============================================================================

-- Passo 1 — confirme qual curso vai ser atualizado:
select id, titulo, duracao, carga_horaria
from public.cursos_cadastrados
where titulo ilike '%ciências biológicas%' or titulo ilike '%ciencias biologicas%';

-- Passo 2 — depois de confirmar o id certo acima, troque o :id abaixo e rode:
update public.cursos_cadastrados
set
  carga_horaria = '3200h',
  grade_curricular = '[
    {"titulo":"1º Semestre","disciplinas":[
      {"nome":"Biologia da Vida - Fundamentos para a Saúde","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""},
      {"nome":"Cuidado Humanizado - Empatia e Ética no Atendimento","horas":""},
      {"nome":"Fundamentação Matemática","horas":""},
      {"nome":"Pensamento Crítico e Comunicação","horas":""},
      {"nome":"Políticas Públicas de Saúde","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"2º Semestre","disciplinas":[
      {"nome":"Ética, Cidadania e Inclusão Social","horas":""},
      {"nome":"Fisiologia Básica","horas":""},
      {"nome":"Histologia","horas":""},
      {"nome":"Microbiologia e Parasitologia","horas":""},
      {"nome":"Anatomia Humana","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"3º Semestre","disciplinas":[
      {"nome":"Biologia Celular e Molecular","horas":""},
      {"nome":"Biologia do Desenvolvimento","horas":""},
      {"nome":"Ecologia de Populações","horas":""},
      {"nome":"Evolução do Pensamento Administrativo","horas":""},
      {"nome":"Química Geral","horas":""},
      {"nome":"Sistemática Biológica","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"4º Semestre","disciplinas":[
      {"nome":"Biofísica","horas":""},
      {"nome":"Anatomia Vegetal","horas":""},
      {"nome":"Bioética","horas":""},
      {"nome":"Biogeografia","horas":""},
      {"nome":"História e Cultura Afro-Brasileira e Indígena","horas":""},
      {"nome":"Metodologia da Pesquisa Científica","horas":""},
      {"nome":"Zoologia dos Invertebrados","horas":""}
    ]},
    {"titulo":"5º Semestre","disciplinas":[
      {"nome":"Ecologia Geral","horas":""},
      {"nome":"Epidemiologia e Bioestatística","horas":""},
      {"nome":"Genética","horas":""},
      {"nome":"Toxicologia","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"6º Semestre","disciplinas":[
      {"nome":"Micologia","horas":""},
      {"nome":"Sistemática de Fanerógamas","horas":""},
      {"nome":"Sistemática de Criptógamas","horas":""},
      {"nome":"Zoologia dos Cordados","horas":""},
      {"nome":"Ambiente de Trabalho Simulado Final","horas":""}
    ]},
    {"titulo":"7º Semestre","disciplinas":[
      {"nome":"Anatomia e Fisiologia Animal Comparada","horas":""},
      {"nome":"Ecologia de Ecossistemas","horas":""},
      {"nome":"Oceanografia","horas":""},
      {"nome":"Paleontologia","horas":""},
      {"nome":"Ecologia de Comunidades","horas":""},
      {"nome":"Biotecnologia","horas":""}
    ]},
    {"titulo":"8º Semestre","disciplinas":[
      {"nome":"Ecologia e Fisiologia Vegetal","horas":""},
      {"nome":"Geologia","horas":""},
      {"nome":"Meio Ambiente e Sustentabilidade","horas":""},
      {"nome":"Estágio Supervisionado","horas":""},
      {"nome":"Atividades Complementares","horas":""}
    ]}
  ]'
where id = :id; -- <-- troque :id pelo id encontrado no Passo 1
