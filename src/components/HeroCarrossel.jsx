import { useState, useEffect } from 'react';

// Carrossel de banners genérico, no mesmo padrão visual/animação do banner
// rotativo da Home (Inicio.jsx): troca automática, setas manuais e indicadores.
// Recebe a lista de banners já carregada (cada item precisa de `imagem_url`).
export default function HeroCarrossel({ banners, altura = 'h-[220px] sm:h-[340px] md:h-[460px]', intervaloMs = 5000 }) {
  const [indexAtual, setIndexAtual] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const intervalo = setInterval(() => {
      setIndexAtual((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, intervaloMs);
    return () => clearInterval(intervalo);
  }, [banners, intervaloMs]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="w-full bg-white relative group">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className={`w-full relative overflow-hidden rounded-2xl md:rounded-3xl shadow-sm ${altura}`}>
          {banners.map((banner, idx) => (
            <img
              key={banner.id ?? idx}
              src={banner.imagem_url}
              alt="Estude Seguro"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                idx === indexAtual ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
          ))}
          {banners.length > 1 && (
            <>
              <button
                onClick={() => setIndexAtual((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
                aria-label="Banner anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-[#fed106] text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-20 font-bold text-sm"
              >
                &#10094;
              </button>
              <button
                onClick={() => setIndexAtual((prev) => (prev === banners.length - 1 ? 0 : prev + 1))}
                aria-label="Próximo banner"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-[#fed106] text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-20 font-bold text-sm"
              >
                &#10095;
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/15 px-2.5 py-1 rounded-full backdrop-blur-xs">
                {banners.map((_, idx) => (
                  <button
                    key={`dot-banner-${idx}`}
                    onClick={() => setIndexAtual(idx)}
                    aria-label={`Ir para o banner ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === indexAtual ? 'w-4 bg-[#fed106]' : 'w-1.5 bg-white/50 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
