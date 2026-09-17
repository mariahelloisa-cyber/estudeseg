-- ============================================================================
-- Atualiza a grade curricular do curso "Teologia - Bacharelado" com base no
-- PDF enviado (7 semestres). Também atualiza a carga horária total para 3000h.
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
where titulo ilike '%teologia%';

-- Passo 2 — depois de confirmar o id certo acima, troque o :id abaixo e rode:
update public.cursos_cadastrados
set
  carga_horaria = '3000h',
  grade_curricular = '[
    {"titulo":"1º Semestre","disciplinas":[
      {"nome":"Introdução Bíblica","horas":""},
      {"nome":"Hermenêutica Histórica e Teológica","horas":""},
      {"nome":"Produção de Texto","horas":""},
      {"nome":"História e Geografia Bíblica","horas":""},
      {"nome":"Filosofia e Comunicação","horas":""},
      {"nome":"Ambiente de Trabalho Simulado: Fundamentos da Fé","horas":""}
    ]},
    {"titulo":"2º Semestre","disciplinas":[
      {"nome":"Grego Bíblico","horas":""},
      {"nome":"Hermenêutica Bíblica","horas":""},
      {"nome":"Antigo Testamento: Pentateuco e Livros Históricos","horas":""},
      {"nome":"Ciências Sociais","horas":""},
      {"nome":"Teologia Pastoral","horas":""},
      {"nome":"Ambiente de Trabalho Simulado: Texto e Contexto","horas":""}
    ]},
    {"titulo":"3º Semestre","disciplinas":[
      {"nome":"Teologia da Missão","horas":""},
      {"nome":"Educação Cristã","horas":""},
      {"nome":"Hebraico Bíblico","horas":""},
      {"nome":"Ambiente de Trabalho Simulado: Evangelhos em Prática","horas":""}
    ]},
    {"titulo":"4º Semestre","disciplinas":[
      {"nome":"Antigo Testamento: Livros Poéticos, Sapenciais e Proféticos","horas":""},
      {"nome":"Novo Testamento: Cartas e Apocalipse","horas":""},
      {"nome":"História da Igreja Moderna e Contemporânea","horas":""},
      {"nome":"Homilética","horas":""},
      {"nome":"Exegese do Novo Testamento","horas":""},
      {"nome":"Ambiente de Trabalho Simulado: História e Mensagem","horas":""}
    ]},
    {"titulo":"5º Semestre","disciplinas":[
      {"nome":"Teologia Sistemática: Trindade, Cristologia e Pneumatologia","horas":""},
      {"nome":"Aconselhamento","horas":""},
      {"nome":"Religião e Sociedade Contemporânea","horas":""},
      {"nome":"Estudos Interdisciplinares da Religião","horas":""},
      {"nome":"Ambiente de Trabalho Simulado: Diálogo Inter-Religioso","horas":""},
      {"nome":"Teologia Sistemática","horas":""}
    ]},
    {"titulo":"6º Semestre","disciplinas":[
      {"nome":"Cristianismo e Religiões Mundiais","horas":""},
      {"nome":"Ética","horas":""},
      {"nome":"Ambiente de Trabalho Simulado: Preparação para o Ministério","horas":""},
      {"nome":"Prática Pastoral, Eclesiástica e Denominacional","horas":""}
    ]},
    {"titulo":"7º Semestre","disciplinas":[
      {"nome":"Estudos da Humanidade e seu Ambiente","horas":""},
      {"nome":"Realidade Brasileira","horas":""},
      {"nome":"Ambiente de Trabalho Simulado: Ética e Sociedade","horas":""},
      {"nome":"Trabalho de Conclusão de Curso","horas":""},
      {"nome":"Estágio Supervisionado","horas":""}
    ]}
  ]'
where id = :id; -- <-- troque :id pelo id encontrado no Passo 1
