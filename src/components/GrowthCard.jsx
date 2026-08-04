import { useEffect, useRef, useState } from 'react';
import { motion, animate, useMotionValue, useMotionValueEvent } from 'framer-motion';

// Sob 1000 mostra o número cru; a partir daí mostra em "k" com uma casa
// decimal (2.4k, 28k...), soltando o ".0" quando o valor é redondo (1k, 6k,
// 72k) — assim o contador não fica "pulando" em saltos grandes de k em k.
function formatarNumero(valor) {
  if (valor < 1000) return String(Math.round(valor));
  const emMil = valor / 1000;
  const comCasa = emMil.toFixed(1);
  return `${comCasa.endsWith('.0') ? comCasa.slice(0, -2) : comCasa}k`;
}

const EASE_ENTRADA = [0.16, 1, 0.3, 1];

export default function GrowthCard({
  revelado,
  destaque = false,
  rotulo,
  numeroAlvo,
  prefixoNumero = '',
  categoria,
  texto,
  className = '',
}) {
  const cardRef = useRef(null);
  const numeroRef = useRef(null);
  const contadorMV = useMotionValue(0);
  const [numeroExibido, setNumeroExibido] = useState(formatarNumero(0));
  const [destacado, setDestacado] = useState(false);

  useMotionValueEvent(contadorMV, 'change', (v) => setNumeroExibido(formatarNumero(v)));

  // O contador só roda UMA vez, no momento em que o bloco é revelado — nunca
  // antes, nunca de novo se o usuário continuar descendo (revelado só liga,
  // nunca desliga, então esse efeito não refaz a contagem depois).
  useEffect(() => {
    if (!revelado) return;
    const controls = animate(contadorMV, numeroAlvo, { duration: 1.6, ease: EASE_ENTRADA, delay: 0.3 });
    return () => controls.stop();
  }, [revelado, numeroAlvo, contadorMV]);

  // Disparado pelo motion.div quando a animação de ENTRADA termina. O pulso
  // de destaque mexe só no NÚMERO (não no card inteiro), porque um scale no
  // card todo arrasta título e parágrafo junto — o título, o texto e o resto
  // do card ficam parados assim que a entrada termina, sem mais nenhum
  // movimento depois disso.
  async function aoTerminarEntrada() {
    if (!revelado || !destaque || !numeroRef.current) return;
    setDestacado(true);
    await animate(numeroRef.current, { scale: [1, 1.08, 1.04] }, { duration: 0.7, ease: 'easeOut' });
  }

  return (
    <motion.div
      ref={cardRef}
      initial={false}
      animate={revelado ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 80, filter: 'blur(8px)' }}
      transition={{ duration: 0.9, ease: EASE_ENTRADA }}
      onAnimationComplete={aoTerminarEntrada}
      className={`relative flex flex-col items-center text-center ${className}`}
    >
      {destacado && (
        <span className="pointer-events-none absolute -inset-x-6 -inset-y-4 -z-10 rounded-[32px] bg-[#fed106]/15 blur-2xl" />
      )}

      <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
        {rotulo}
      </span>

      <div
        ref={numeroRef}
        className={`font-black tracking-tight text-[#000000] ${
          destaque
            ? 'text-5xl md:text-7xl mb-3 drop-shadow-[0_2px_10px_rgba(254,209,6,0.35)]'
            : 'text-4xl md:text-5xl mb-2'
        }`}
      >
        {prefixoNumero}{numeroExibido}
      </div>

      <h3 className={`font-extrabold text-gray-900 mb-2 ${destaque ? 'text-lg md:text-xl' : 'text-base md:text-lg'}`}>
        {categoria}
      </h3>

      <p className={`text-gray-500 font-medium leading-relaxed ${destaque ? 'text-sm md:text-[15px] max-w-xs' : 'text-sm max-w-[240px]'}`}>
        {texto}
      </p>

    </motion.div>
  );
}
