// Grupos usados na seção da Home "Quero terminar meus estudos em EAD..." / "Quero fazer meu
// curso técnico EAD..." / "Quero fazer meu curso técnico por competência EAD...". Cada curso
// cadastrado no admin pode ser marcado para aparecer em, no máximo, um desses grupos (coluna
// `grupo_home` em `cursos_cadastrados`). `linhas` fixa a quebra em exatamente 3 linhas (em vez
// de deixar o navegador quebrar sozinho, o que gera número de linhas diferente por coluna);
// `trechoDestaque` é a parte da frase que recebe o gradiente amarelo-preto — precisa ser um
// trecho literal de alguma das `linhas` (não pode atravessar a quebra de linha).
export const GRUPOS_HOME_CURSO = [
  {
    chave: 'ead',
    rotulo: 'Estudos em EAD',
    linhas: ['Quero terminar meus', 'estudos em EAD com', 'segurança'],
    trechoDestaque: 'estudos em EAD',
  },
  {
    chave: 'tecnico',
    rotulo: 'Curso técnico EAD',
    linhas: ['Quero fazer meu curso', 'técnico EAD com', 'segurança'],
    trechoDestaque: 'técnico EAD',
  },
  {
    chave: 'tecnico_competencia',
    rotulo: 'Curso técnico por competência EAD',
    linhas: ['Quero fazer meu curso', 'técnico por competência EAD', 'com segurança'],
    trechoDestaque: 'técnico por competência EAD',
  },
];

export const MAX_CURSOS_POR_GRUPO_HOME = 3;
