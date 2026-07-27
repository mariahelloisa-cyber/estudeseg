import { useState } from 'react';

// Modelo "Vídeo": só o vídeo, no seu formato original (sem cortar nem esticar pra caber
// numa caixa fixa), com autoplay mudo (exigência dos navegadores) e sem controles nativos
// — só o vídeo tocando, o usuário fecha pelo X do pop-up.
export default function PopupVideo({ dados }) {
  const [falhouCarregar, setFalhouCarregar] = useState(false);

  if (!dados?.video_url) {
    return (
      <div className="w-[92vw] sm:w-[85vw] md:w-2xl aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-medium px-4 text-center">
        Adicione um vídeo para este pop-up
      </div>
    );
  }

  if (falhouCarregar) {
    return (
      <div className="w-[92vw] sm:w-[85vw] md:w-2xl aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-medium px-4 text-center">
        Não foi possível carregar este vídeo. Reenvie em MP4 (H.264) — outros formatos (ex.: .mov de iPhone) podem não tocar no navegador.
      </div>
    );
  }

  return (
    // aspect-[auto_16/9] serve só de placeholder enquanto o vídeo carrega: o "auto" faz a
    // proporção real do arquivo (retrato, paisagem, o que for) substituir essa proporção "de
    // reserva" assim que os metadados chegam — sem o "auto", o Tailwind `aspect-video` força
    // sempre 16:9 e deixa tarjas pretas nas laterais de vídeos verticais.
    <video
      key={dados.video_url}
      src={dados.video_url}
      className="block max-w-[92vw] sm:max-w-[85vw] md:max-w-2xl max-h-[92vh] w-auto h-auto aspect-[auto_16/9] bg-black"
      autoPlay
      muted
      loop
      playsInline
      onError={() => setFalhouCarregar(true)}
    />
  );
}
