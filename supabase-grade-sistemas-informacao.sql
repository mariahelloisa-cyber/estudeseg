-- ============================================================================
-- Atualiza a grade curricular do curso "Sistemas de Informação - Bacharelado"
-- com base no PDF enviado (8 semestres). Também atualiza a carga horária
-- total para 3000h.
-- ----------------------------------------------------------------------------
-- Observação: no PDF original, o cabeçalho do 4º bloco de disciplinas está
-- escrito "SEMESTRE VI" (repetindo o mesmo número do 6º bloco) — claramente
-- um erro de digitação do documento. Aqui ele foi corrigido para "4º Semestre",
-- respeitando a ordem em que os blocos aparecem.
--
-- 1) Ajuste o WHERE abaixo para apontar para o curso certo (por id é mais
--    seguro). Rode o SELECT primeiro para confirmar que pega 1 linha só.
-- 2) Rode o UPDATE.
-- ============================================================================

-- Passo 1 — confirme qual curso vai ser atualizado:
select id, titulo, duracao, carga_horaria
from public.cursos_cadastrados
where titulo ilike '%sistemas de informa%';

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
      {"nome":"Funções Univariáveis","horas":""},
      {"nome":"Sistemas Operacionais","horas":""},
      {"nome":"Redes de Computadores","horas":""},
      {"nome":"Arquitetura de Computadores","horas":""},
      {"nome":"Banco de Dados","horas":""},
      {"nome":"Meio Ambiente e Sustentabilidade","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"3º Semestre","disciplinas":[
      {"nome":"Projeto de Software","horas":""},
      {"nome":"Programação para Internet","horas":""},
      {"nome":"Inteligência Artificial","horas":""},
      {"nome":"Programação Orientada a Objetos","horas":""},
      {"nome":"Ética, Cidadania e Responsabilidade nas Empresas","horas":""},
      {"nome":"História e Cultura Afro-Brasileira e Indígena","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"4º Semestre","disciplinas":[
      {"nome":"Programação para Dispositivos Móveis","horas":""},
      {"nome":"Design de Games","horas":""},
      {"nome":"Web Services para Mobile","horas":""},
      {"nome":"Prototipação Mobile","horas":""},
      {"nome":"Desenvolvimento de Aplicativos","horas":""},
      {"nome":"Gerenciamento de Conteúdo Mobile","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"5º Semestre","disciplinas":[
      {"nome":"Design de Software","horas":""},
      {"nome":"Gerenciamento Ágil de Projetos de Software","horas":""},
      {"nome":"Segurança da Informação","horas":""},
      {"nome":"Testes e Homologação de Software","horas":""},
      {"nome":"Engenharia de Software","horas":""},
      {"nome":"Governança em TI","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"6º Semestre","disciplinas":[
      {"nome":"Economia de Empresas","horas":""},
      {"nome":"Implantação de ERP","horas":""},
      {"nome":"Gestão Estratégica de Tecnologia da Informação","horas":""},
      {"nome":"Sistema de Informação","horas":""},
      {"nome":"BI e Big Data","horas":""},
      {"nome":"Qualidade: Controle Estatístico do Processo","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"7º Semestre","disciplinas":[
      {"nome":"Otimização de Banco de Dados","horas":""},
      {"nome":"Banco de Dados Distribuídos","horas":""},
      {"nome":"Gestão de Infraestrutura","horas":""},
      {"nome":"Backup e Recuperação de Desastres","horas":""},
      {"nome":"Administração e Escalabilidade em Banco de Dados","horas":""},
      {"nome":"Ambiente de Trabalho Simulado","horas":""}
    ]},
    {"titulo":"8º Semestre","disciplinas":[
      {"nome":"Fundamentos de Gestão Empresarial","horas":""},
      {"nome":"Gestão dos Riscos e Segurança do Trabalho","horas":""},
      {"nome":"Estágio Supervisionado em Sistemas de Informação","horas":""}
    ]}
  ]'
where id = 502; -- <-- troque :id pelo id encontrado no Passo 1
