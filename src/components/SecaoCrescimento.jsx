import { useRef, useState } from 'react';
import { useScroll, useMotionValueEvent, useInView } from 'framer-motion';
import GrowthCard from './GrowthCard';

// Limiares de progresso do scroll dentro da seção (0 a 1) em que cada bloco é
// revelado. A ordem de revelação é sempre MÊS → SEMESTRE → HOJE, mesmo o
// bloco "Hoje" ficando visualmente no centro do layout — ele é o clímax da
// narrativa, por isso só aparece por último, mesmo estando no meio.
const LIMIAR_MES = 0.15;
const LIMIAR_SEMESTRE = 0.5;
const LIMIAR_HOJE = 0.88;

export default function SecaoCrescimento() {
  const sectionRef = useRef(null);
  const emVista = useInView(sectionRef, { amount: 0.1 });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Cada bloco, uma vez revelado, TRAVA nesse estado — nunca volta a ficar
  // invisível nem reconta o número, mesmo se o usuário subir e descer a
  // página de novo.
  const [mesRevelado, setMesRevelado] = useState(false);
  const [semestreRevelado, setSemestreRevelado] = useState(false);
  const [hojeRevelado, setHojeRevelado] = useState(false);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (!emVista) return;
    if (v >= LIMIAR_MES) setMesRevelado(true);
    if (v >= LIMIAR_SEMESTRE) setSemestreRevelado(true);
    if (v >= LIMIAR_HOJE) setHojeRevelado(true);
  });

  return (
    <section ref={sectionRef} className="relative w-full bg-[#fcfbfb] min-h-[150vh]">
      <div className="sticky top-0 z-10 h-screen flex flex-col items-center justify-center overflow-hidden px-6">
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">
            <span className="w-2 h-2 bg-[#fed106]" />
            Nossos números
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-[#000000] tracking-tight">
            Crescimento da <span className="text-[#fed106]">Estude Seguro</span>
          </h2>
        </div>

        {/* Ordem no JSX = ordem de leitura no mobile (mês, semestre, hoje).
            No desktop, "md:order-*" reposiciona só visualmente, colocando o
            bloco "Hoje" na coluna central sem mudar a ordem de revelação. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-14 md:gap-8 w-full max-w-5xl items-center">
          <GrowthCard
            className="md:order-1"
            revelado={mesRevelado}
            rotulo="PRIMEIRO MÊS"
            numeroAlvo={1000}
            categoria="Primeiro grande marco"
            texto="Nos primeiros 30 dias, já tínhamos alunos confiando na Estude Seguro para começar sua jornada com segurança."
          />

          <GrowthCard
            className="md:order-3"
            revelado={semestreRevelado}
            rotulo="PRIMEIRO SEMESTRE"
            numeroAlvo={6000}
            categoria="Consolidação da marca"
            texto="Em seis meses, a base de alunos multiplicou por seis, consolidando a marca como referência em matrículas seguras."
          />

          <GrowthCard
            className="md:order-2"
            revelado={hojeRevelado}
            destaque
            rotulo="HOJE"
            numeroAlvo={72000}
            prefixoNumero="+"
            categoria="Crescimento"
            texto="Mais de 72 mil estudantes já confiaram na Estude Seguro para transformar suas carreiras com segurança e credibilidade."
          />
        </div>
      </div>
    </section>
  );
}
