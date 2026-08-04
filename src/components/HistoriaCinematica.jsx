import { useEffect, useRef, useState } from 'react';
import { motion, animate, useInView, useMotionValue, useTransform, useMotionValueEvent } from 'framer-motion';
import { BookOpenIcon, MagnifyingGlassIcon, ShieldCheckIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

// Duração total da viagem do capelo — não depende mais de quanto o usuário
// rola: assim que a seção aparece na tela, o progresso anima sozinho de 0 a
// 1 nesse tempo, e a linha/os cards seguem esse mesmo valor.
const DURACAO_VIAGEM_S = 4.5;

// Pequeno helper pra destacar palavras-chave dentro dos parágrafos.
function Destaque({ children }) {
  return <strong className="font-extrabold text-[#c99a00]">{children}</strong>;
}

// Posição (0 a 1) de cada marco ao longo da linha — é o MESMO valor usado
// tanto pra decidir quando o nó/card acende quanto pra onde o capelo pousa.
const MARCOS = [
  {
    posicao: 0.15,
    Icon: MagnifyingGlassIcon,
    numero: 1,
    categoria: 'O problema',
    titulo: 'Golpes na educação',
    texto: (
      <>
        Nossa equipe de gestão identificou uma realidade preocupante: milhares de brasileiros estavam sendo vítimas de <Destaque>golpes</Destaque> no mercado educacional. Muitos pagavam por cursos e nunca recebiam seus <Destaque>certificados</Destaque>, outros descobriam que o documento não tinha validade ou simplesmente eram abandonados pelas instituições.
      </>
    ),
  },
  {
    posicao: 0.5,
    Icon: ShieldCheckIcon,
    numero: 2,
    categoria: 'A fundação',
    titulo: 'Nasce a Estude Seguro',
    texto: (
      <>
        Diante desse cenário, surgiu a Estude Seguro: um projeto criado para devolver a confiança aos estudantes e <Destaque>combater fraudes na educação</Destaque>. Desde o primeiro dia, nosso compromisso foi oferecer uma jornada com <Destaque>transparência</Destaque> e <Destaque>segurança</Destaque>, com uma garantia única no mercado: ou o aluno recebe um certificado válido conforme as condições contratuais, ou <Destaque>devolvemos o seu dinheiro</Destaque>.
      </>
    ),
  },
  {
    posicao: 0.85,
    Icon: AcademicCapIcon,
    numero: 3,
    categoria: 'O crescimento',
    titulo: 'Um projeto que ganhou força',
    texto: (
      <>
        A proposta chamou a atenção de pessoas que acreditam na educação como ferramenta de transformação. Foi nesse momento que <Destaque>Geraldo Luís</Destaque> tornou-se <Destaque>embaixador da Estude Seguro</Destaque>, fortalecendo a missão de levar segurança e credibilidade para milhares de estudantes em todo o Brasil.
      </>
    ),
  },
];

// Ícone do capelo de formatura — o "viajante" que percorre a linha. SVG
// próprio (não emoji) pra manter a mesma aparência em qualquer navegador/SO.
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

// Card de cada marco — "apagado" até o capelo chegar nele (opacidade baixa,
// texto acinzentado, sem borda/sombra de destaque); "acende" (opacidade
// total, texto preto, borda e sombra fortes, sobe 8px, escala 0.97→1) assim
// que `ativo` vira true, que é decidido pelo MESMO progresso de scroll que
// move o capelo — nunca um cálculo separado que poderia dessincronizar.
function CardMarco({ marco, ativo, ehUltimo }) {
  const { Icon, numero, categoria, titulo, texto } = marco;

  return (
    <motion.div
      animate={{
        opacity: ativo ? 1 : 0.4,
        y: ativo ? -8 : 0,
        scale: ativo ? 1 : 0.97,
        boxShadow: ativo
          ? '0 30px 60px -15px rgba(0,0,0,0.16), 0 8px 20px -8px rgba(0,0,0,0.08)'
          : '0 10px 24px -12px rgba(0,0,0,0.05)',
      }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`relative bg-white p-7 md:p-8 rounded-[22px] border w-full transition-colors duration-300 ${
        ativo ? 'border-[#fed106]' : 'border-gray-100'
      }`}
    >
      <motion.span
        animate={{ opacity: ativo ? 1 : 0.3, scaleY: ativo ? 1 : 0.6 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-0 top-7 bottom-7 w-[4px] rounded-full bg-[#fed106] origin-center"
      />

      {ehUltimo && ativo && (
        <span className="pointer-events-none absolute -inset-x-4 -inset-y-3 -z-10 rounded-[30px] bg-[#fed106]/10 blur-2xl" />
      )}

      <div className="pl-3">
        <div className="flex items-center gap-2 mb-2.5">
          <span className={`text-[11px] font-bold tracking-wider transition-colors duration-300 ${ativo ? 'text-gray-400' : 'text-gray-300'}`}>
            0{numero}
          </span>
          <span className={`text-[11px] font-black tracking-[0.16em] uppercase transition-colors duration-300 ${ativo ? 'text-[#c99a00]' : 'text-gray-300'}`}>
            {categoria}
          </span>
        </div>

        <h3 className={`text-xl md:text-2xl font-black mb-2.5 tracking-tight leading-[1.2] transition-colors duration-300 ${ativo ? 'text-black' : 'text-gray-400'}`}>
          {titulo}
        </h3>

        <p className={`font-medium leading-relaxed text-sm transition-colors duration-300 ${ativo ? 'text-black' : 'text-gray-300'}`}>
          {texto}
        </p>

        <div
          className={`mt-5 w-9 h-9 rounded-full border flex items-center justify-center transition-colors duration-300 ${
            ativo ? 'border-[#fed106] bg-[#fed106]/10 text-[#c99a00]' : 'border-gray-100 text-gray-300'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}

export default function HistoriaCinematica() {
  const sectionRef = useRef(null);
  // Dispara UMA vez, quando a seção entra na tela — não precisa mais rolar
  // pra animação avançar, ela só precisa ter aparecido.
  const emVista = useInView(sectionRef, { once: true, amount: 0.3 });

  const progresso = useMotionValue(0);
  const progressoPercent = useTransform(progresso, (v) => `${Math.min(100, Math.max(0, v * 100))}%`);
  const rotacaoCapelo = useTransform(progresso, [0, 0.5, 1], [-10, 0, 10]);

  useEffect(() => {
    if (!emVista) return;
    const controls = animate(progresso, 1, { duration: DURACAO_VIAGEM_S, ease: [0.4, 0, 0.2, 1] });
    return () => controls.stop();
  }, [emVista, progresso]);

  // Cada marco acende assim que o progresso (que agora anda sozinho, não com
  // o scroll) alcança sua posição na linha.
  const [ativos, setAtivos] = useState([false, false, false]);
  useMotionValueEvent(progresso, 'change', (v) => {
    setAtivos((atual) => {
      const novo = MARCOS.map((m) => v >= m.posicao);
      return novo.some((val, i) => val !== atual[i]) ? novo : atual;
    });
  });

  return (
    <section ref={sectionRef} className="relative w-full bg-[#fcfbfb] overflow-hidden pt-10 pb-10 md:pt-14 md:pb-14">
      {/* Fundo — círculos desfocados extremamente discretos, só pra tirar o
          vazio do bege sem competir com o conteúdo. */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-20 -left-24 w-72 h-72 rounded-full bg-[#fed106]/[0.08] blur-3xl" />
        <div className="absolute top-1/3 -right-28 w-96 h-96 rounded-full bg-[#fed106]/[0.06] blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-[#fed106]/[0.05] blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[88rem] mx-auto px-6">
        {/* Cabeçalho */}
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
          <span className="inline-flex items-center gap-2 bg-[#fed106] text-black text-xs font-black uppercase tracking-wider px-4 py-2 rounded-full shadow-sm mb-5">
            <BookOpenIcon className="w-4 h-4" />
            Nossa história
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-black tracking-tight mb-4 leading-tight">
            Crescemos para tornar a <span className="text-[#fed106]">educação mais segura</span>
          </h2>
          <p className="text-gray-500 text-sm md:text-base font-medium leading-relaxed">
            Cada etapa representa um momento importante da missão da Estude Seguro de <strong className="text-black font-bold">combater fraudes</strong> e <strong className="text-black font-bold">devolver confiança</strong> aos estudantes.
          </p>
        </div>

        {/* Linha do tempo com o capelo viajante — só no desktop, onde os 3
            marcos ficam lado a lado (no mobile os cards empilham e acendem
            na mesma ordem, sem o desenho da linha). */}
        <div className="hidden md:block relative h-16 mb-10">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-gray-200" />
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-[#fed106]"
            style={{ width: progressoPercent }}
          />

          {MARCOS.map((marco, i) => (
            <div
              key={marco.numero}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${marco.posicao * 100}%` }}
            >
              <div
                className={`w-11 h-11 rounded-full bg-white border flex items-center justify-center shadow-sm transition-colors duration-300 ${
                  ativos[i] ? 'border-[#fed106] text-[#c99a00]' : 'border-gray-200 text-gray-300'
                }`}
              >
                <marco.Icon className="w-5 h-5" />
              </div>
            </div>
          ))}

          {/* O capelo puxa a linha: sua posição horizontal É o progresso do
              scroll (suavizado), então o preenchimento amarelo atrás dele
              nunca "aparece sozinho" — ele sempre acompanha exatamente até
              onde o capelo já passou. */}
          <motion.div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            style={{ left: progressoPercent }}
          >
            <motion.div style={{ rotate: rotacaoCapelo }}>
              <div className="relative animate-flutuar">
                <div className="absolute inset-0 rounded-full bg-[#fed106]/30 blur-xl" />
                <CapeloIcon className="relative w-10 h-10 drop-shadow-[0_10px_14px_rgba(0,0,0,0.3)]" />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Cards — cada um acende exatamente quando o capelo alcança sua
            posição na linha acima (mesmo array `ativos`). */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6">
          {MARCOS.map((marco, i) => (
            <CardMarco key={marco.numero} marco={marco} ativo={ativos[i]} ehUltimo={i === MARCOS.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
