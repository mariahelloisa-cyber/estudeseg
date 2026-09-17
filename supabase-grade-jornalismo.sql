-- ============================================================================
-- Atualiza a grade curricular do curso "Jornalismo - Bacharelado" com base no
-- PDF enviado (8 semestres). Também atualiza a carga horária total para 3000h.
-- ----------------------------------------------------------------------------
-- Observação: assim como nos outros PDFs, o cabeçalho do 4º bloco de
-- disciplinas está escrito "SEMESTRE VI" (repetindo o número do 6º bloco) —
-- erro de digitação do documento original. Corrigido aqui para "4º Semestre",
-- respeitando a ordem em que os blocos aparecem.
--
-- 1) Rode o SELECT primeiro para confirmar o id do curso certo.
-- 2) Troque o :id no UPDATE pelo id encontrado e rode.
-- ============================================================================

-- Passo 1 — confirme qual curso vai ser atualizado:
select id, titulo, duracao, carga_horaria
from public.cursos_cadastrados
where titulo ilike '%jornalismo%';

-- Passo 2 — depois de confirmar o id certo acima, troque o :id abaixo e rode:
update public.cursos_cadastrados
set
  carga_horaria = '3000h',
  grade_curricular = '[
    {"titulo":"1º Semestre","disciplinas":[
      {"nome":"Fundamentação Matemática","horas":""},
      {"nome":"Gestão no Universo da TI","horas":""},
      {"nome":"Meio Ambiente e Sustentabilidade","horas":""},
      {"nome":"Programação Criativa: da Lógica ao Código","horas":""},
      {"nome":"Pensamento Crítico e Comunicação","horas":""},
      {"nome":"Ambiente de Trabalho Simulado - Gestão Integrada","horas":""},
      {"nome":"Tecnologia Digital","horas":""}
    ]},
    {"titulo":"2º Semestre","disciplinas":[
      {"nome":"Fundamentos do Jornalismo","horas":""},
      {"nome":"Linguagem e Produção Textual","horas":""},
      {"nome":"Teorias da Comunicação","horas":""},
      {"nome":"Introdução à Comunicação Social","horas":""},
      {"nome":"Sociologia da Comunicação","horas":""},
      {"nome":"Ambiente de Trabalho Simulado II","horas":""}
    ]},
    {"titulo":"3º Semestre","disciplinas":[
      {"nome":"História da Comunicação e Memória da Cásper","horas":""},
      {"nome":"Antropologia, Comunicação e Diversidade","horas":""},
      {"nome":"História da Arte","horas":""},
      {"nome":"Filosofia e Comunicação","horas":""},
      {"nome":"Língua Portuguesa","horas":""},
      {"nome":"Ambiente de Trabalho Simulado III","horas":""}
    ]},
    {"titulo":"4º Semestre","disciplinas":[
      {"nome":"Jornalismo Multimídia","horas":""},
      {"nome":"Fotojornalismo","horas":""},
      {"nome":"Produção e Edição de Mídias Sonoras","horas":""},
      {"nome":"Linguagem Visual e Design Editorial","horas":""},
      {"nome":"Ética e Legislação na Comunicação","horas":""},
      {"nome":"Ambiente de Trabalho Simulado IV","horas":""}
    ]},
    {"titulo":"5º Semestre","disciplinas":[
      {"nome":"Jornalismo e Mercado","horas":""},
      {"nome":"Perspectiva Crítica das Narrativas Jornalísticas","horas":""},
      {"nome":"Produção e Edição de Mídias Audiovisuais","horas":""},
      {"nome":"Relacionamento com a Mídia e Influenciadores Digitais","horas":""},
      {"nome":"Práticas Inovadoras no Jornalismo","horas":""},
      {"nome":"Ambiente de Trabalho Simulado V","horas":""}
    ]},
    {"titulo":"6º Semestre","disciplinas":[
      {"nome":"Comunicação, Mídia e Sociedade Contemporânea","horas":""},
      {"nome":"Gestão em Jornalismo e Comunicação Corporativa","horas":""},
      {"nome":"Marketing Digital","horas":""},
      {"nome":"Narrativas e Storytelling","horas":""},
      {"nome":"Educação Midiática","horas":""},
      {"nome":"Ambiente de Trabalho Simulado VI","horas":""}
    ]},
    {"titulo":"7º Semestre","disciplinas":[
      {"nome":"Jornalismo Especializado em Esportes","horas":""},
      {"nome":"Jornalismo Especializado em Cultura e Entretenimento","horas":""},
      {"nome":"Jornalismo Especializado em Política, Economia e Sustentabilidade","horas":""},
      {"nome":"Laboratório de Inovação em Comunicação","horas":""},
      {"nome":"Metodologia e Técnica de Pesquisa","horas":""},
      {"nome":"Ambiente de Trabalho Simulado VII","horas":""}
    ]},
    {"titulo":"8º Semestre","disciplinas":[
      {"nome":"Assessoria de Imprensa","horas":""},
      {"nome":"Produção Audiovisual e Multimídia","horas":""},
      {"nome":"Jornalismo Internacional e Agência de Notícias","horas":""},
      {"nome":"Técnicas de Reportagem e Produção Jornalística","horas":""},
      {"nome":"Gerenciamento de Crise e Reputação","horas":""},
      {"nome":"Ambiente de Trabalho Simulado Final","horas":""}
    ]}
  ]'
where id = :id; -- <-- troque :id pelo id encontrado no Passo 1
