import {
  ClipboardDocumentListIcon,
  CheckBadgeIcon,
  BookOpenIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

// Única fonte de verdade das 8 etapas de acompanhamento de matrícula — usada tanto pelo
// seletor de status no admin (aba "Matriculados") quanto pela linha do tempo pública
// (/validacaoRastreio). A ordem do array É a ordem de progressão (status_order no banco).
export const STATUS_MATRICULA = [
  { ordem: 0, chave: 'pre_matricula', label: 'Pré-matrícula', descricao: 'Cadastro inicial do aluno e início da sua jornada.', Icon: ClipboardDocumentListIcon },
  { ordem: 1, chave: 'matriculado', label: 'Matriculado', descricao: 'Sua matrícula foi confirmada com sucesso.', Icon: CheckBadgeIcon },
  { ordem: 2, chave: 'estudar', label: 'Estudar', descricao: 'Etapa de realização dos estudos e atividades do curso.', Icon: BookOpenIcon },
  { ordem: 3, chave: 'solicitada_conclusao', label: 'Solicitada conclusão na plataforma', descricao: 'A conclusão do curso foi solicitada para análise.', Icon: PaperAirplaneIcon },
  { ordem: 4, chave: 'triagem', label: 'Triagem em andamento', descricao: 'Os documentos e informações estão sendo verificados.', Icon: MagnifyingGlassIcon },
  { ordem: 5, chave: 'auditoria', label: 'Auditoria', descricao: 'O processo passa por uma análise final de conformidade.', Icon: ShieldCheckIcon },
  { ordem: 6, chave: 'processo_certificacao', label: 'Em processo de certificação', descricao: 'Seu certificado está sendo preparado e emitido.', Icon: AcademicCapIcon },
  { ordem: 7, chave: 'certificado_concluido', label: 'Certificado concluído', descricao: 'Parabéns! Seu certificado foi concluído com sucesso.', Icon: TrophyIcon },
];

export function rotuloStatusMatricula(ordem) {
  return STATUS_MATRICULA.find((s) => s.ordem === ordem)?.label || 'Pré-matrícula';
}

// Sugestão de número de matrícula (o admin pode editar antes de salvar) — mesmo espírito
// do crypto.randomUUID() já usado em admin.jsx/Matricula.jsx para nomes de arquivo.
export function sugerirNumeroMatricula() {
  const ano = new Date().getFullYear();
  const digitos = String(Math.floor(100000 + Math.random() * 900000));
  return `EST-${ano}-${digitos}`;
}
