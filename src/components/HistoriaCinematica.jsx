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

// Pequeno helper pra destacar palavras-chave dentro dos parágrafos — como o
// card agora tem fundo amarelo, usa preto sólido (contraste máximo) e se
// diferencia do texto normal (preto a 70%) pelo peso e pela opacidade cheia,
// em vez de mudar de cor.
function Destaque({ children }) {
  return <strong className="font-extrabold text-black">{children}</strong>;
}

// Cada bloco de texto acompanha o SEU PRÓPRIO progresso de scroll (não um
// IntersectionObserver binário) — por isso a entrada e a saída são contínuas:
// funde e desliza conforme o bloco se aproxima ou se afasta do centro da
// tela, em vez de simplesmente aparecer/sumir.
//
// "ativo" vem de fora (mesmo índice que posiciona o capelo) — o título só
// acende quando o capelo REALMENTE está nesse card, nunca por um cálculo
// separado que poderia dessincronizar dos dois. O destaque visual do card
// ativo (escala, sombra, elevação, barra lateral) segue o mesmo "ativo".
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
    <div ref={ref} className="relative min-h-[32vh] md:min-h-[42vh] flex items-center">
      <div className="max-w-7xl mx-auto px-6 w-full">
        <motion.div
          style={{ opacity: opacidade, y: deslocamentoY }}
          className={`w-full flex ${direita ? 'justify-end' : 'justify-start'}`}
        >
          <motion.div
            animate={{
              scale: ativo ? 1.03 : 1,
              y: ativo ? -6 : 0,
              opacity: ativo ? 1 : 0.9,
              boxShadow: ativo
                ? '0 30px 60px -15px rgba(0,0,0,0.18), 0 8px 20px -8px rgba(0,0,0,0.08)'
                : '0 14px 34px -12px rgba(0,0,0,0.07)',
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-[#fed106] p-8 md:p-10 rounded-[24px] border border-black/10 w-full max-w-[600px] overflow-hidden"
          >
            {/* Barra lateral — no fundo amarelo, precisa ser preta pra não
                sumir; acende e "estica" quando o card está ativo */}
            <motion.span
              animate={{ opacity: ativo ? 1 : 0.35, scaleY: ativo ? 1 : 0.7 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-8 bottom-8 w-[5px] rounded-full bg-black origin-center"
            />

            <div className="pl-4">
              <span className="block text-[11px] font-bold text-black/35 tracking-wider mb-2">
                0{numero}
              </span>

              {categoria && (
                <span className="block text-[11px] font-black tracking-[0.18em] uppercase text-black/65 mb-3">
                  {categoria}
                </span>
              )}

              <h3
                className="text-2xl md:text-[32px] font-black mb-3.5 tracking-tight leading-[1.15] transition-colors duration-300"
                style={{ color: ativo ? '#000000' : 'rgba(0,0,0,0.6)' }}
              >
                {titulo}
              </h3>

              <div className="text-black/70 font-medium leading-relaxed text-[15px] md:text-base max-w-[460px]">
                {children}
              </div>
            </div>
          </motion.div>
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
    <section ref={sectionRef} className="relative w-full bg-[#fcfbfb] overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
      {/* Fundo — círculos desfocados e linhas orgânicas extremamente discretos,
          só pra tirar o vazio do bege sem competir com o conteúdo. */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-20 -left-24 w-72 h-72 rounded-full bg-[#fed106]/[0.08] blur-3xl" />
        <div className="absolute top-1/3 -right-28 w-96 h-96 rounded-full bg-[#fed106]/[0.06] blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-[#fed106]/[0.05] blur-3xl" />

        <svg className="absolute top-20 right-12 w-24 h-24 text-[#fed106]/[0.12]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="50" cy="50" r="42" strokeDasharray="3 7" strokeLinecap="round" />
        </svg>
        <svg className="absolute bottom-28 left-10 w-14 h-14 text-black/[0.045]" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 8 L92 30 L50 52 L8 30 Z" />
          <path d="M50 52 L92 30 V52 L50 74 L8 52 V30 Z" opacity="0.6" />
        </svg>
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[70%] h-40 text-[#fed106]/[0.07]" viewBox="0 0 600 160" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M0 80 C150 20 300 140 450 60 C500 40 550 60 600 40" strokeLinecap="round" />
        </svg>
      </div>

      {/* Camada do capelo — acima de todo o conteúdo da seção, nunca preso a
          um bloco específico. Posição/rotação/escala seguem o scroll (via
          mola) e só se movem quando o usuário rola a página — parado, ele
          fica parado. Tamanho grande + glow amarelo discreto + sombra funda
          pra ser o protagonista visual da seção. */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <motion.div
          className="absolute w-36 h-36 sm:w-44 sm:h-44 md:w-[200px] md:h-[200px] lg:w-[220px] lg:h-[220px] -translate-x-1/2 -translate-y-1/2"
          style={{ left, top, rotate: rotateMV, scale: scaleMV }}
        >
          <div className="absolute inset-[6%] rounded-full bg-[#fed106]/25 blur-2xl" />
          <CapeloIcon className="relative w-full h-full drop-shadow-[0_28px_38px_rgba(0,0,0,0.28)]" />
        </motion.div>
      </div>

      <div className="relative z-10">
        <BlocoTexto numero={1} categoria="O problema" titulo="Golpes na educação" alinhamento="esquerda" ativo={ativo === 0}>
          <p>
            Nossa equipe de gestão identificou uma realidade preocupante: milhares de brasileiros estavam sendo vítimas de <Destaque>golpes</Destaque> no mercado educacional. Muitos pagavam por cursos e nunca recebiam seus <Destaque>certificados</Destaque>, outros descobriam que o documento não tinha validade ou simplesmente eram abandonados pelas instituições.
          </p>
        </BlocoTexto>

        <BlocoTexto numero={2} categoria="A fundação" titulo="Nasce a Estude Seguro" alinhamento="direita" ativo={ativo === 1}>
          <p>
            Diante desse cenário, surgiu a Estude Seguro: um projeto criado para devolver a confiança aos estudantes e <Destaque>combater fraudes na educação</Destaque>. Desde o primeiro dia, nosso compromisso foi oferecer uma jornada com <Destaque>transparência</Destaque> e <Destaque>segurança</Destaque>, com uma garantia única no mercado: ou o aluno recebe um certificado válido conforme as condições contratuais, ou <Destaque>devolvemos o seu dinheiro</Destaque>.
          </p>
        </BlocoTexto>

        <BlocoTexto numero={3} categoria="O crescimento" titulo="Um projeto que ganhou força" alinhamento="esquerda" ativo={ativo === 2}>
          <p>
            A proposta chamou a atenção de pessoas que acreditam na educação como ferramenta de transformação. Foi nesse momento que <Destaque>Geraldo Luís</Destaque> tornou-se <Destaque>embaixador da Estude Seguro</Destaque>, fortalecendo a missão de levar segurança e credibilidade para milhares de estudantes em todo o Brasil.
          </p>
        </BlocoTexto>
      </div>
    </section>
  );
}
