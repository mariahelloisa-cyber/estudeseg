import { useEffect, useMemo, useRef, useState } from 'react';

// Paleta alternada dos segmentos — branco e amarelo, com texto sempre em preto.
const PALETA_SEGMENTOS = [
  { fundo: '#ffffff', texto: '#111111' },
  { fundo: '#fed106', texto: '#111111' },
];
const NUMERO_VOLTAS_GIRO = 6;
const DURACAO_GIRO_MS = 5200;

function conteudoSegmento(premio) {
  if (premio.tipo === 'cashback') return { icone: '🪙', valor: `${premio.percentual_cashback}%`, sub: 'DE CASHBACK' };
  if (premio.tipo === 'desconto') return { icone: '🏷️', valor: `${premio.percentual_cashback}%`, sub: 'DE DESCONTO' };
  return { icone: '🎓', valor: 'CURSO', sub: 'GRÁTIS' };
}

// Converte um ângulo "de relógio" (0° = topo, cresce no sentido horário) em ponto (x,y)
// num círculo de raio `r` centrado em (cx, cy) — mesma convenção usada na rotação CSS.
function pontoNoAngulo(anguloGraus, cx, cy, r) {
  const rad = (anguloGraus * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

/**
 * Roda visual da Roleta Premiada.
 *
 * O prêmio já vem DECIDIDO pelo backend (função girar_roleta_premiada) — este
 * componente só recebe o nome do prêmio vencedor e faz a animação de giro até
 * parar exatamente nele. Nunca decide o resultado no cliente.
 */
export default function RoletaPremiada({ premios, girando, nomePremioVencedor, aoTerminarGiro }) {
  const [rotacao, setRotacao] = useState(0);
  const timeoutRef = useRef(null);

  const anguloSegmento = 360 / Math.max(premios.length, 1);

  useEffect(() => {
    if (!girando || !nomePremioVencedor) return;

    const indiceVencedor = premios.findIndex((p) => p.nome === nomePremioVencedor);
    if (indiceVencedor === -1) return;

    const centroSegmento = indiceVencedor * anguloSegmento + anguloSegmento / 2;
    // Pequena variação dentro do próprio segmento, só para não parecer sempre "no risquinho".
    const jitter = (Math.random() - 0.5) * anguloSegmento * 0.5;

    setRotacao((rotAtual) => {
      const rotAtualMod = ((rotAtual % 360) + 360) % 360;
      const alvoMod = ((360 - (centroSegmento + jitter)) % 360 + 360) % 360;
      let delta = alvoMod - rotAtualMod;
      if (delta < 0) delta += 360;
      return rotAtual + NUMERO_VOLTAS_GIRO * 360 + delta;
    });

    timeoutRef.current = setTimeout(() => {
      aoTerminarGiro?.();
    }, DURACAO_GIRO_MS);

    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [girando, nomePremioVencedor]);

  const segmentos = useMemo(() => {
    return premios.map((premio, indice) => {
      const inicio = indice * anguloSegmento;
      const fim = inicio + anguloSegmento;
      const meio = inicio + anguloSegmento / 2;
      const p1 = pontoNoAngulo(inicio, 150, 150, 150);
      const p2 = pontoNoAngulo(fim, 150, 150, 150);
      const largeArc = anguloSegmento > 180 ? 1 : 0;
      const caminho = `M150,150 L${p1.x.toFixed(2)},${p1.y.toFixed(2)} A150,150 0 ${largeArc} 1 ${p2.x.toFixed(2)},${p2.y.toFixed(2)} Z`;
      const inverterParaLeitura = meio > 90 && meio < 270;
      const cor = PALETA_SEGMENTOS[indice % PALETA_SEGMENTOS.length];
      return {
        id: premio.id,
        caminho,
        cor: cor.fundo,
        corTexto: cor.texto,
        meio,
        inverterParaLeitura,
        ...conteudoSegmento(premio),
      };
    });
  }, [premios, anguloSegmento]);

  return (
    <div className="relative w-full max-w-[420px] mx-auto pb-10">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 w-[320%] h-[160%]"
          style={{
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(ellipse, rgba(255,205,40,0.9) 0%, rgba(255,193,7,0.5) 32%, rgba(255,205,40,0.15) 58%, transparent 74%)',
          }}
        />
      </div>

      <div className="relative w-full aspect-square select-none">
        {/* Ponteiro fixo no topo */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]">
          <svg width="52" height="60" viewBox="0 0 52 60">
            <path d="M26 60L4 14C4 6 11 0 20 0h12c9 0 16 6 16 14L26 60Z" fill="#111111" />
            <path d="M26 49L11 16c0-5 5-9 15-9s15 4 15 9L26 49Z" fill="#fed106" stroke="#111111" strokeWidth="1" />
          </svg>
        </div>

        {/* Brilho pulsante enquanto gira */}
        <div
          className={`absolute inset-0 rounded-full transition-shadow duration-500 ${
            girando ? 'shadow-[0_0_60px_18px_rgba(254,209,6,0.55)]' : 'shadow-[0_20px_45px_-10px_rgba(0,0,0,0.35)]'
          }`}
        />

        {/* Borda preta grossa por fora + anel preto interno com as "lâmpadas" */}
        <div className="absolute inset-0 rounded-full bg-black p-[18px] shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          {Array.from({ length: 28 }).map((_, i) => {
            const ang = (360 / 28) * i;
            const p = pontoNoAngulo(ang, 50, 50, 47.3);
            return (
              <span
                key={i}
                className="absolute w-[6px] h-[6px] rounded-full bg-[#fff3c4] shadow-[0_0_8px_3px_rgba(255,214,110,0.85)] z-10"
                style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
              />
            );
          })}

          <div className="relative w-full h-full rounded-full bg-black p-[10px]">
            {/* Roda que efetivamente gira — quase encostada no anel de lâmpadas */}
            <svg
              viewBox="0 0 300 300"
              className="absolute inset-0 w-full h-full rounded-full"
              style={{
                transform: `rotate(${rotacao}deg)`,
                transition: girando ? `transform ${DURACAO_GIRO_MS}ms cubic-bezier(0.11, 0.79, 0.15, 1)` : 'none',
              }}
            >
              <circle cx="150" cy="150" r="150" fill="#111111" />
              {segmentos.map((s) => (
                <g key={s.id}>
                  <path d={s.caminho} fill={s.cor} />
                  <g transform={`rotate(${s.meio}, 150, 150)`}>
                    <text
                      textAnchor="middle"
                      fill={s.corTexto}
                      transform={s.inverterParaLeitura ? 'rotate(180, 150, 50)' : undefined}
                      style={{ fontFamily: "'Baloo 2', sans-serif" }}
                    >
                      <tspan x="150" y="30" fontSize="22">{s.icone}</tspan>
                      <tspan x="150" y="56" fontSize="21" fontWeight="800">{s.valor}</tspan>
                      <tspan x="150" y="70" fontSize="9.5" fontWeight="700" letterSpacing="0.5">{s.sub}</tspan>
                    </text>
                  </g>
                </g>
              ))}
            </svg>

            {/* Sombra interna fixa (não gira com a roda), dando profundidade na borda */}
            <div className="absolute inset-0 rounded-full pointer-events-none shadow-[inset_0_0_12px_3px_rgba(0,0,0,0.35)]" />

            {/* Hub central com a logo da Estude Seguro (o próprio ícone já tem o círculo amarelo e o contorno preto) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img src="/iconn.png" alt="" className="w-20 h-20 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]" />
            </div>

          </div>
        </div>
      </div>

      {/* "Pedestal" decorativo, dando a impressão de uma roleta de verdade em pé */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="w-10 h-6 bg-gradient-to-b from-[#3a3a3a] to-black rounded-b-sm" />
        <div className="w-24 h-3 bg-black rounded-full opacity-30 blur-[1px]" />
      </div>
    </div>
  );
}
