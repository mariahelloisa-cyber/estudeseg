import { sanitizarLinkExterno } from './linkSeguro';

// Identifica a origem do vídeo e como reproduzi-lo.
//
// O Google Drive é um caso à parte: o iframe de /preview dele não aceita
// autoplay por parâmetro de URL — sempre mostra o próprio botão de play,
// obrigando quem clicou no card a clicar de novo dentro do player.
//
// Já existiu aqui uma tentativa de contornar isso trocando o /preview pelo
// link de download direto do arquivo (`uc?export=download`) para tocar num
// <video> nativo com autoplay de verdade. Não é confiável: para boa parte dos
// arquivos o Drive devolve uma página HTML de confirmação/aviso de vírus em
// vez dos bytes do vídeo, e o <video> fica preso em 0:00 sem tocar nada — pior
// que o clique extra. Por isso o Drive volta a usar o /preview oficial.
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
    return { tipo: 'drive', src: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  }

  const linkSeguro = sanitizarLinkExterno(url);
  if (!linkSeguro) return null;

  // Arquivo de vídeo hospedado direto (ex.: upload feito pelo admin para o Storage
  // do Supabase) — toca num <video> nativo, que aceita autoplay de verdade no
  // primeiro clique, sem as limitações do Drive/YouTube incorporados via iframe.
  if (/\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(linkSeguro)) {
    return { tipo: 'direto', src: linkSeguro };
  }

  // Não reconhecemos o formato. O valor vem da coluna `video_url` da tabela
  // `depoimentos` e vai direto para o src de um <iframe>, então não pode ser
  // devolvido cru: um valor como `javascript:...` ou `data:text/html,...`
  // gravado no banco viraria execução de script na página.
  // Só passa o que for http(s) de verdade.
  return { tipo: 'generico', src: linkSeguro };
}
