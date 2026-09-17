import { Link } from 'react-router-dom';
import { ClockIcon, BoltIcon, BookOpenIcon } from '@heroicons/react/24/outline';

// Mesmo formato de preço usado no card de compra da página do curso (CursoDetalhe.jsx)
function formatarPreco(valor) {
  return (valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- Card de curso cadastrado pelo admin (Supabase) ---
export default function CursoCardNovo({ curso }) {
  const precoAtual = curso.preco || 0;
  const precoOriginal = curso.preco_original && curso.preco_original > precoAtual ? curso.preco_original : null;
  const valorParcela = precoAtual > 0 ? precoAtual / 12 : 0;

  return (
    <Link
      to={`/cursos/${curso.id}`}
      className="flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 group"
    >
      <div className="relative w-full h-44 overflow-hidden bg-gray-100">
        {curso.imagem_url ? (
          <img src={curso.imagem_url} alt={curso.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <BookOpenIcon className="w-10 h-10" />
          </div>
        )}
        {curso.selo_mec && (
          <span className="absolute top-3 left-3 bg-white text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
            <svg className="w-3 h-3 text-[#fed106]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 1l2.39 4.84L18 6.91l-4 3.9.94 5.49L10 13.77l-4.94 2.53L6 10.81l-4-3.9 5.61-1.07L10 1z" />
            </svg>
            MEC
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h4 className="text-base font-black text-gray-900 mb-2 leading-snug uppercase line-clamp-2 h-11">{curso.titulo}</h4>
        {/* `h-10` fixo (não `min-h`) + `line-clamp-2`: todo card reserva exatamente a
            mesma altura pra descrição, curta ou longa. Um limite por número de
            caracteres não funciona pra isso — a mesma quantidade de caracteres quebra
            em 2 ou 3 linhas dependendo do tamanho das palavras, então os cards
            continuavam com alturas diferentes. Com altura fixa, a diferença nunca
            passa de uma linha — pequena e igual em todo card, não um vão gigante. */}
        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2 h-10">{curso.descricao}</p>
        <div className="mt-2">
          {/* Idem aqui: `h-[92px]` fixo, não `min-h` — garante a mesma altura mesmo
              quando o curso não tem desconto (a linha "De R$..." fica só invisível,
              sem sumir o espaço que ela ocuparia). */}
          <div className="mb-2 h-[92px]">
            <p className={`text-gray-400 text-xs mb-0.5 ${!precoOriginal ? 'invisible' : ''}`}>
              De <span className="line-through">R$ {formatarPreco(precoOriginal)}</span>
            </p>
            <p className={`text-gray-500 text-xs mb-0.5 ${precoAtual <= 0 ? 'invisible' : ''}`}>Por</p>
            <p className={`text-2xl font-black text-gray-900 mb-1 ${precoAtual <= 0 ? 'invisible' : ''}`}>R$ {formatarPreco(precoAtual)}</p>
            <p className={`text-xs text-gray-500 ${valorParcela <= 0 ? 'invisible' : ''}`}>
              <span className="font-bold text-gray-800">12x de R$ {formatarPreco(valorParcela)}</span> sem juros no cartão
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-gray-500 font-semibold mb-5 pt-2 border-t border-gray-100">
            <span className="flex items-center gap-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#fff4cc] text-[#c99a00] shrink-0"><ClockIcon className="w-3 h-3" /></span>
              {curso.duracao || '-'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ede9fe] text-[#7c3aed] shrink-0"><BoltIcon className="w-3 h-3" /></span>
              {curso.carga_horaria || '-'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-600 shrink-0"><BookOpenIcon className="w-3 h-3" /></span>
              {curso.modalidade}
            </span>
          </div>
          <span className="w-full text-center bg-gradient-to-r from-[#fed106] to-[#ffeea0] hover:opacity-90 text-black font-black text-xs uppercase tracking-wider py-3.5 rounded-full transition-opacity shadow-sm block">
            Ver Detalhes
          </span>
        </div>
      </div>
    </Link>
  );
}
