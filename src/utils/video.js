import { sanitizarLinkExterno } from './linkSeguro';

// Identifica a origem do vídeo e como reproduzi-lo.
//
// O Google Drive é um caso à parte: o iframe de /preview dele não aceita
// autoplay por parâmetro de URL — sempre mostra o próprio botão de play,
// obrigando quem clicou no card a clicar de novo dentro do player. Por isso,
// para Drive devolvemos o link de stream direto do arquivo (`tipo: 'drive'`),
// pensado para tocar num <video> nativo, que sim começa sozinho já no
// primeiro clique. YouTube e links genéricos continuam indo por <iframe>.
export function obterInfoVideo(url) {
  if (!url) return null;

  const youtubeMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return { tipo: 'youtube', src: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1` };
  }

  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return { tipo: 'drive', src: `https://drive.google.com/uc?export=download&id=${driveMatch[1]}` };
  }

  // Não reconhecemos o formato. O valor vem da coluna `video_url` da tabela
  // `depoimentos` e vai direto para o src de um <iframe>, então não pode ser
  // devolvido cru: um valor como `javascript:...` ou `data:text/html,...`
  // gravado no banco viraria execução de script na página.
  // Só passa o que for http(s) de verdade.
  const linkSeguro = sanitizarLinkExterno(url);
  return linkSeguro ? { tipo: 'generico', src: linkSeguro } : null;
}
