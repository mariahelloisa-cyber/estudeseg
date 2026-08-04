import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import GrowthCard from './GrowthCard';

// Atraso entre a revelação de um bloco e o próximo, depois que a seção
// aparece na tela — a sequência (mês → semestre → hoje) toca sozinha, sem
// precisar de mais scroll pra continuar.
const ATRASO_ENTRE_BLOCOS_MS = 1400;

export default function SecaoCrescimento() {
  const sectionRef = useRef(null);
  // Dispara UMA vez, quando a seção entra na tela.
  const emVista = useInView(sectionRef, { once: true, amount: 0.3 });

  const [mesRevelado, setMesRevelado] = useState(false);
  const [semestreRevelado, setSemestreRevelado] = useState(false);
  const [hojeRevelado, setHojeRevelado] = useState(false);

  useEffect(() => {
    if (!emVista) return;
    const t1 = setTimeout(() => setMesRevelado(true), 150);
    const t2 = setTimeout(() => setSemestreRevelado(true), 150 + ATRASO_ENTRE_BLOCOS_MS);
    const t3 = setTimeout(() => setHojeRevelado(true), 150 + ATRASO_ENTRE_BLOCOS_MS * 2);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [emVista]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 md:py-32 px-6"
      style={{
        backgroundImage:
          'linear-gradient(to bottom, #fed106 0%, #fffdf3 18%, #fffdf3 82%, #fed106/50 50%)',
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-14 md:gap-8 w-full items-center">
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
