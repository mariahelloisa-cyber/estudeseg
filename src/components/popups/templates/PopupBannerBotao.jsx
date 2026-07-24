import { sanitizarLinkExterno } from '../../../utils/linkSeguro';

// Modelo "Banner com Botão": imagem retangular (tela cheia, como o Banner) com um botão de
// ação sobreposto no canto inferior. Sem link definido, o botão só fecha o pop-up.
export default function PopupBannerBotao({ dados, onFechar }) {
  const link = sanitizarLinkExterno(dados?.botao_link);
  const textoBotao = dados?.botao_texto?.trim() || 'Quero fazer!';

  if (!dados?.imagem_url) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-medium px-4 text-center">
        Adicione uma imagem para este pop-up
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <img src={dados.imagem_url} alt="" className="block w-full h-full object-cover" />
      <div className="absolute inset-x-0 bottom-12 sm:bottom-14 px-5 sm:px-8">
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
