import { sanitizarLinkExterno } from '../../../utils/linkSeguro';

// Modelo "Imagem/Banner": reproduz o comportamento original do pop-up (só a imagem,
// ocupando o quadro inteiro, com link de clique opcional).
export default function PopupBanner({ dados }) {
  const link = sanitizarLinkExterno(dados?.link_redirecionamento);

  if (!dados?.imagem_url) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-medium px-4 text-center">
        Adicione uma imagem para este pop-up
      </div>
    );
  }

  const imagem = (
    <img
      src={dados.imagem_url}
      alt={dados?.titulo || 'Aviso'}
      className="block w-full h-full object-contain"
    />
  );

  return link ? (
    <a href={link} target="_blank" rel="noreferrer" className="block w-full h-full">
      {imagem}
    </a>
  ) : (
    imagem
  );
}
