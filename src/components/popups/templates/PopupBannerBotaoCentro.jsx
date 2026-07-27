import { sanitizarLinkExterno } from '../../../utils/linkSeguro';

// Modelo "Banner com Botão no Centro": igual ao Banner com Botão, mas com o botão de ação
// centralizado sobre a imagem (em vez de fixo perto do rodapé). A imagem mantém seu
// formato original (sem cortar nem esticar pra caber numa caixa fixa).
export default function PopupBannerBotaoCentro({ dados, onFechar }) {
  const link = sanitizarLinkExterno(dados?.botao_link);
  const textoBotao = dados?.botao_texto?.trim() || 'Quero fazer!';

  if (!dados?.imagem_url) {
    return (
      <div className="w-[92vw] sm:w-[85vw] md:w-2xl aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-medium px-4 text-center">
        Adicione uma imagem para este pop-up
      </div>
    );
  }

  return (
    <div className="relative">
      <img src={dados.imagem_url} alt="" className="block max-w-[92vw] sm:max-w-[85vw] md:max-w-2xl max-h-[85vh] w-auto h-auto" />
      <div className="absolute inset-0 flex items-center justify-center px-5 sm:px-8">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-[#fed106] hover:bg-black text-black hover:text-white font-black text-sm uppercase tracking-wider px-6 py-3.5 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            {textoBotao}
          </a>
        ) : (
          <button
            type="button"
            onClick={onFechar}
            className="inline-block bg-[#fed106] hover:bg-black text-black hover:text-white font-black text-sm uppercase tracking-wider px-6 py-3.5 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            {textoBotao}
          </button>
        )}
      </div>
    </div>
  );
}
