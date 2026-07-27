import { useState } from 'react';


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
