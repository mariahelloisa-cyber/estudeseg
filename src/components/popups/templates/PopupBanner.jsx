import { sanitizarLinkExterno } from '../../../utils/linkSeguro';

// Modelo "Imagem/Banner": só a imagem, no seu formato original (sem cortar nem esticar
// pra caber numa caixa fixa), com link de clique opcional.
export default function PopupBanner({ dados }) {
  const link = sanitizarLinkExterno(dados?.link_redirecionamento);

  if (!dados?.imagem_url) {
    return (
      <div className="w-[92vw] sm:w-[85vw] md:w-2xl aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-medium px-4 text-center">
        Adicione uma imagem para este pop-up
      </div>
    );
  }

  const imagem = (
    <img
      src={dados.imagem_url}
      alt={dados?.titulo || 'Aviso'}
      className="block max-w-[92vw] sm:max-w-[85vw] md:max-w-2xl max-h-[85vh] w-auto h-auto"
    />
  );

  return link ? (
    <a href={link} target="_blank" rel="noreferrer" className="block">
      {imagem}
    </a>
  ) : (
    imagem
  );
}
