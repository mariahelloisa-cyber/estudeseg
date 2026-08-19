// Grupos usados nas esteiras horizontais da Home "Cursos Técnicos EAD" / "Cursos de Certificação
// por Competência EAD" / "Curso EJA EAD". Cada curso cadastrado no admin pode ser marcado para
// aparecer em, no máximo, um desses grupos (coluna `grupo_home` em `cursos_cadastrados`). Cada
// item de `linhas` vira uma linha do título (quebra forçada, não depende da largura da tela);
// `trechoDestaque` é a parte que recebe o gradiente amarelo-preto — precisa ser um trecho literal
// de uma única linha (não pode atravessar a quebra).
export const GRUPOS_HOME_CURSO = [
  {
    chave: 'tecnico',
    rotulo: 'Cursos Técnicos EAD',
    linhas: ['Cursos Técnicos EAD'],
    trechoDestaque: 'Técnicos EAD',
  },
  {
    chave: 'tecnico_competencia',
    rotulo: 'Cursos de Certificação por Competência EAD',
    linhas: ['Cursos de Certificação', 'por Competência EAD'],
    trechoDestaque: 'por Competência EAD',
  },
  {
    chave: 'ead',
    rotulo: 'Curso EJA EAD',
    linhas: ['Curso EJA EAD'],
    trechoDestaque: 'EJA EAD',
  },
];

export const MAX_CURSOS_POR_GRUPO_HOME = 10;
