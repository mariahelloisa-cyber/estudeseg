import { XMarkIcon } from '@heroicons/react/24/outline';

// Container comum de todos os modelos de pop-up: fundo escurecido + botão de fechar.
// `variante` decide o formato da caixa: "imagem" ocupa quase a tela toda (modelo Banner),
// "cartao" fica um cartão branco centralizado (demais modelos).
const CONTAINER_POR_VARIANTE = {
  imagem: 'w-[92vw] sm:w-[85vw] md:w-[70vw] max-w-3xl aspect-[2/1] max-h-[420px]',
  cartao: 'w-[92vw] max-w-md',
  dividido: 'w-[92vw] sm:w-[85vw] md:w-[65vw] md:min-w-[600px] max-w-[700px] flex',
};

// No modelo "cartao"/"dividido" o X fica meio pra fora, sobre o fundo escurecido — assim
// nunca sobrepõe o título/texto do card. No "imagem" fica encostado no canto, sobre a própria foto.
const FECHAR_POR_VARIANTE = {
  imagem: 'top-2 right-2 bg-black/30 hover:bg-black/50 text-white/90 hover:text-white backdrop-blur-sm',
  cartao: '-top-3 -right-3 bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 shadow-md',
  dividido: '-top-3 -right-3 bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 shadow-md',
};

export default function PopupModalShell({ variante = 'cartao', onFechar, children }) {
  const classeContainer = CONTAINER_POR_VARIANTE[variante] || CONTAINER_POR_VARIANTE.cartao;
  const classeFechar = FECHAR_POR_VARIANTE[variante] || FECHAR_POR_VARIANTE.cartao;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className={`relative ${classeContainer}`}>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className={`absolute z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${classeFechar}`}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
