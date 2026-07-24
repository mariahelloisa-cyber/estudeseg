import { useState } from 'react';
import { sanitizarLinkExterno } from '../../../utils/linkSeguro';

// Modelo "Cupom/Oferta": destaca um código de cupom com botão de copiar, mais um CTA opcional.
export default function PopupCupom({ dados, onFechar }) {
  const [copiado, setCopiado] = useState(false);
  const link = sanitizarLinkExterno(dados?.botao_link);
  const textoBotao = dados?.botao_texto?.trim() || 'Aproveitar oferta';
  const codigo = dados?.cupom_codigo?.trim() || 'CUPOM10';

  function copiarCodigo() {
    navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      {dados?.imagem_url && (
        <div className="w-full h-36 sm:h-44 shrink-0 bg-gray-100">
          <img src={dados.imagem_url} alt={dados?.titulo || ''} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-6 sm:p-8 flex flex-col gap-3 overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
          {dados?.titulo || 'Oferta especial'}
        </h2>
        {dados?.descricao && (
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{dados.descricao}</p>
        )}

        <button
          type="button"
          onClick={copiarCodigo}
          className="flex items-center justify-between gap-3 border-2 border-dashed border-[#fed106] bg-[#fffcef] rounded-2xl px-4 py-3 cursor-pointer"
        >
          <span className="font-black text-sm tracking-widest text-[#8a6d00] uppercase">{codigo}</span>
          <span className="text-[10px] font-bold uppercase text-[#8a6d00]">{copiado ? 'Copiado! ✅' : 'Copiar'}</span>
        </button>

        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            onClick={onFechar}
            className="mt-1 w-full text-center bg-[#fed106] hover:bg-black text-black hover:text-white font-black text-sm uppercase tracking-wider py-3.5 rounded-2xl transition-all active:scale-[0.98] cursor-pointer"
          >
            {textoBotao}
          </a>
        ) : (
          <button
            type="button"
            onClick={onFechar}
            className="mt-1 w-full text-center bg-[#fed106] hover:bg-black text-black hover:text-white font-black text-sm uppercase tracking-wider py-3.5 rounded-2xl transition-all active:scale-[0.98] cursor-pointer"
          >
            {textoBotao}
          </button>
        )}
      </div>
    </div>
  );
}
