// Campos do aluno compartilhados entre o formulário público de matrícula (Matricula.jsx,
// tabela `matriculas`) e o cadastro manual do admin (aba "Matriculados", tabela
// `matriculados`) — mantém as duas telas em sincronia: mesmos dados, mesmos obrigatórios.

export const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const OPCOES_RACA_COR = ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Prefiro não informar'];
export const OPCOES_ESTADO_CIVIL = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'];

export const TIPOS_ANEXO_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
export const TAMANHO_MAXIMO_ANEXO_MB = 10;

// Mesma lista de campos obrigatórios usada nos dois formulários.
export const CAMPOS_OBRIGATORIOS_ALUNO = [
  'curso', 'nomeCompleto', 'cpf', 'dataNascimento', 'rg', 'orgaoEmissor', 'naturalidade',
  'estadoCivil', 'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado', 'telefone', 'email',
];

export const FORM_ALUNO_INICIAL = {
  curso: '',
  nomeCompleto: '',
  cpf: '',
  dataNascimento: '',
  rg: '',
  orgaoEmissor: '',
  dataEmissao: '',
  naturalidade: '',
  racaCor: '',
  estadoCivil: '',
  pai: '',
  mae: '',
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  telefone: '',
  email: '',
  observacoes: '',
};

export function mascaraCEP(valor) {
  return (valor || '').replace(/\D/g, '').replace(/(\d{5})(\d{1,3})/, '$1-$2').slice(0, 9);
}

export function mascaraTelefone(valor) {
  return (valor || '')
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4})$/, '$1-$2')
    .slice(0, 15);
}

export function validarAnexo(arquivo) {
  if (!TIPOS_ANEXO_PERMITIDOS.includes(arquivo.type)) {
    throw new Error(`Formato não suportado: ${arquivo.name}. Envie imagens (PNG/JPEG/WebP) ou PDF.`);
  }
  if (arquivo.size > TAMANHO_MAXIMO_ANEXO_MB * 1024 * 1024) {
    throw new Error(`Arquivo muito grande: ${arquivo.name} (máx. ${TAMANHO_MAXIMO_ANEXO_MB}MB).`);
  }
}
