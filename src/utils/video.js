import { sanitizarLinkExterno } from './linkSeguro';

export function obterUrlEmbedVideo(url) {
  if (!url) return null;

  const youtubeMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
  }

  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }

  // Não reconhecemos o formato. O valor vem da coluna `video_url` da tabela
  // `depoimentos` e vai direto para o src de um <iframe>, então não pode ser
  // devolvido cru: um valor como `javascript:...` ou `data:text/html,...`
  // gravado no banco viraria execução de script na página.
  // Só passa o que for http(s) de verdade.
  return sanitizarLinkExterno(url);
}
