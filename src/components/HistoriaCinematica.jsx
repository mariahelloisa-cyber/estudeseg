import { useRef, useState } from 'react';
import {
  motion,
  animate,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionTemplate,
  useMotionValueEvent,
} from 'framer-motion';

// Mola usada em toda posição do capelo: em vez de seguir o scroll pixel a
// pixel (o que faz o capelo "teleportar" direto pro bloco 3 se o usuário der
// um scroll forte), o valor sempre anima suavemente até o alvo — então
// mesmo um scroll brusco faz o capelo "voar" visivelmente pelo caminho até
// o próximo bloco, nunca pulando direto.
const MOLA = { stiffness: 110, damping: 20, mass: 0.6 };

// Ícone do capelo de formatura — o "personagem" que viaja pela seção. É um SVG
// próprio (não emoji) pra manter a mesma aparência em qualquer navegador/SO e
// poder usar a paleta preto/amarelo da marca.
function CapeloIcon({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 52 L32 68 Q50 80 68 68 L68 52 Z" fill="#111111" />
      <path d="M50 18 L94 42 L50 66 L6 42 Z" fill="#000000" />
      <path d="M50 18 L94 42 L50 47 L6 42 Z" fill="#262626" />
      <circle cx="50" cy="42" r="4.5" fill="#fed106" />
      <line x1="50" y1="42" x2="76" y2="60" stroke="#fed106" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M76 60 L71 76 L81 76 Z" fill="#fed106" />
      <circle cx="76" cy="60" r="3" fill="#fed106" />
    </svg>
  );
}

// Cada bloco de texto acompanha o SEU PRÓPRIO progresso de scroll (não um
// IntersectionObserver binário) — por isso a entrada e a saída são contínuas:
// funde e desliza conforme o bloco se aproxima ou se afasta do centro da
// tela, em vez de simplesmente aparecer/sumir. O card em si (badge + título +
// texto, borda amarela à esquerda) segue o mesmo desenho da antiga seção
// "trajetória de crescimento" — só a animação de entrada/saída e o capelo
// flutuante são novos.
//
// "ativo" vem de fora (mesmo índice que posiciona o capelo) — o título só
// acende quando o capelo REALMENTE está nesse card, nunca por um cálculo
// separado que poderia dessincronizar dos dois.
function BlocoTexto({ numero, categoria, titulo, children, alinhamento, ativo }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center', 'end start'],
  });

  const opacidade = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
  const deslocamentoY = useTransform(scrollYProgress, [0, 0.5, 1], [56, 0, -56]);

  const direita = alinhamento === 'direita';

  return (
    <div ref={ref} className="relative min-h-[28vh] md:min-h-[34vh] flex items-center">
      <div className="max-w-7xl mx-auto px-6 w-full">
        <motion.div
          style={{ opacity: opacidade, y: deslocamentoY }}
          className={`w-full flex ${direita ? 'justify-end' : 'justify-start'}`}
        >
          <div className="group bg-white p-6 md:p-7 rounded-2xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)] border border-gray-100 border-l-4 border-l-[#fed106] w-full max-w-[600px] transition-all hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-2.5 mb-3.5">
              <span className="bg-[#fed106] text-white font-extrabold py-1 px-3 rounded-full text-xs tracking-wide">
                0{numero}
              </span>
              {categoria && (
                <span className="text-[#fed106] font-black text-xs tracking-wider uppercase">
                  {categoria}
                </span>
              )}
            </div>
            <h3
              className="text-xl md:text-2xl font-extrabold mb-2.5 tracking-tight transition-colors duration-300"
              style={{ color: ativo ? '#fed106' : '#000000' }}
            >
              {titulo}
            </h3>
            <div className="text-gray-500 font-medium leading-relaxed text-sm md:text-[15px]">
              {children}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// 3 pontos fixos (um por card) — o capelo só descansa numa dessas posições,
// nunca fica "solto" numa posição intermediária arbitrária.
const NUM_CARDS = 3;
const LEFT_POR_INDICE = [66, 34, 66]; // % — bem afastado do card (esquerda/direita/esquerda)
const TOP_POR_INDICE = [16, 50, 84]; // % — centro vertical de cada card
const ROTATE_POR_INDICE = [-10, -6, -9];
const SCALE_POR_INDICE = [1, 0.97, 1.03];

export default function HistoriaCinematica() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // "ativo" é o card cujo título deve estar aceso — acompanha o card que o
  // capelo está viajando/pousando no momento (nunca um cálculo separado).
  const [ativo, setAtivo] = useState(0);

  // O capelo se move em MotionValues próprias (não em "ativo" direto), porque
  // "ativo" é estado do React e pode "pular" de 0 pra 2 num scroll forte sem
  // nunca renderizar o 1 no meio (o React só comita o valor final quando
  // várias atualizações caem no mesmo lote). As MotionValues não têm esse
  // problema, mas o que realmente garante a rota é a FILA abaixo.
  const leftMV = useMotionValue(LEFT_POR_INDICE[0]);
  const topMV = useMotionValue(TOP_POR_INDICE[0]);
  const rotateMV = useMotionValue(ROTATE_POR_INDICE[0]);
  const scaleMV = useMotionValue(SCALE_POR_INDICE[0]);
  const left = useMotionTemplate`${leftMV}%`;
  const top = useMotionTemplate`${topMV}%`;

  // Fila de paradas: o primeiro item é onde o capelo está agora, os
  // seguintes são as próximas paradas pedidas pelo scroll. "avancarFila" só
  // parte pra próxima parada quando a viagem atual TERMINOU (onComplete) —
  // por isso, mesmo se o scroll pedir para ir direto do card 1 pro 3, a fila
  // vira [1, 2, 3] e o capelo obrigatoriamente completa a perna 1→2 antes de
  // sequer começar a perna 2→3. Vale nos dois sentidos (subindo ou descendo),
  // porque quem monta a fila é sempre a diferença passo a passo até o alvo.
  const filaRef = useRef([0]);
  const animandoRef = useRef(false);

  function avancarFila() {
    if (animandoRef.current) return;
    const fila = filaRef.current;
    if (fila.length < 2) return;

    const proximo = fila[1];
    animandoRef.current = true;
    setAtivo(proximo);

    const opcoes = { type: 'spring', ...MOLA };
    animate(leftMV, LEFT_POR_INDICE[proximo], opcoes);
    animate(topMV, TOP_POR_INDICE[proximo], opcoes);
    animate(rotateMV, ROTATE_POR_INDICE[proximo], opcoes);
    animate(scaleMV, SCALE_POR_INDICE[proximo], {
      ...opcoes,
      onComplete: () => {
        fila.shift();
        animandoRef.current = false;
        avancarFila();
      },
    });
  }

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const desejado = Math.min(NUM_CARDS - 1, Math.max(0, Math.round(v * (NUM_CARDS - 1))));
    const fila = filaRef.current;
    const ultimoPedido = fila[fila.length - 1];
    if (ultimoPedido === desejado) return;

    const passo = desejado > ultimoPedido ? 1 : -1;
    for (let i = ultimoPedido + passo; ; i += passo) {
      fila.push(i);
      if (i === desejado) break;
    }
    avancarFila();
  });

  return (
    <section ref={sectionRef} className="relative w-full bg-[#fcfbfb] overflow-visible pt-20 pb-16 md:pt-28 md:pb-20">
      {/* Camada do capelo — acima de todo o conteúdo da seção, nunca preso a
          um bloco específico. Posição/rotação/escala seguem o scroll (via
          mola) e só se movem quando o usuário rola a página — parado, ele
          fica parado. */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <motion.div
          className="absolute w-40 h-40 md:w-64 md:h-64 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_18px_25px_rgba(0,0,0,0.25)]"
          style={{ left, top, rotate: rotateMV, scale: scaleMV }}
        >
          <CapeloIcon className="w-full h-full" />
        </motion.div>
      </div>

      <div className="relative z-10">
        <BlocoTexto numero={1} categoria="O problema" titulo="Golpes na educação" alinhamento="esquerda" ativo={ativo === 0}>
          <p>
            Nossa equipe de gestão identificou uma realidade preocupante: milhares de brasileiros estavam sendo vítimas de golpes no mercado educacional. Muitos pagavam por cursos e nunca recebiam seus certificados, outros descobriam que o documento não tinha validade ou simplesmente eram abandonados pelas instituições.
          </p>
        </BlocoTexto>

        <BlocoTexto numero={2} categoria="A fundação" titulo="Nasce a Estude Seguro" alinhamento="direita" ativo={ativo === 1}>
          <p>
            Diante desse cenário, surgiu a Estude Seguro: um projeto criado para devolver a confiança aos estudantes e <strong>combater fraudes na educação</strong>. Desde o primeiro dia, nosso compromisso foi oferecer uma jornada <strong>transparente, segura e com uma garantia única no mercado</strong>: ou o aluno recebe um certificado válido conforme as condições contratuais, ou <strong>devolvemos o seu dinheiro</strong>.
          </p>
        </BlocoTexto>

        <BlocoTexto numero={3} categoria="O crescimento" titulo="Um projeto que ganhou força" alinhamento="esquerda" ativo={ativo === 2}>
          <p>
            A proposta chamou a atenção de pessoas que acreditam na educação como ferramenta de transformação. Foi nesse momento que <strong>Geraldo Luís</strong> tornou-se <strong>embaixador da Estude Seguro</strong>, fortalecendo a missão de levar segurança e credibilidade para milhares de estudantes em todo o Brasil.
          </p>
        </BlocoTexto>
      </div>
    </section>
  );
}
