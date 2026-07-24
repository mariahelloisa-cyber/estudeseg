import { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import { tecToGrad } from './aproveitamentoData';

const WHATSAPP_NUMERO = '5527998392172';

const HERO_COUNT_DURATION = 1600;

function useCountUp(target, duration = HERO_COUNT_DURATION) {
  const [valor, setValor] = useState(0);

  useEffect(() => {
    let frame;
    const inicio = performance.now();

    function tick(agora) {
      const progresso = Math.min((agora - inicio) / duration, 1);
      setValor(Math.floor(progresso * target));
      if (progresso < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setValor(target);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return valor;
}

function IconScale(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
    </svg>
  );
}

function IconCheckCircle(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconAcademicCap(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347M4.26 10.147a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814M4.26 10.147A50.717 50.717 0 0112 13.489a50.72 50.72 0 017.482-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443" />
    </svg>
  );
}

function IconChevronDown(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export default function Aproveitamento() {
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState(null);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const buscaRef = useRef(null);
  const tabelaRef = useRef(null);

  const cursos = useMemo(() => Object.keys(tecToGrad).sort(), []);

  const { totalTecnicos, totalGraduacoes, totalEquivalencias } = useMemo(() => {
    const graduacoesUnicas = new Set();
    let equivalencias = 0;
    for (const lista of Object.values(tecToGrad)) {
      equivalencias += lista.length;
      for (const item of lista) graduacoesUnicas.add(item.curso);
    }
    return {
      totalTecnicos: cursos.length,
      totalGraduacoes: graduacoesUnicas.size,
      totalEquivalencias: equivalencias,
    };
  }, [cursos]);

  const numTecnicos = useCountUp(totalTecnicos);
  const numGraduacoes = useCountUp(totalGraduacoes);
  const numEquivalencias = useCountUp(totalEquivalencias);
  const termo = busca.toLowerCase().trim();
  const sugestoes = termo ? cursos.filter((nome) => nome.toLowerCase().includes(termo)) : cursos;

  useEffect(() => {
    function aoClicarFora(evento) {
      if (buscaRef.current && !buscaRef.current.contains(evento.target)) {
        setMostrarSugestoes(false);
      }
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, []);

  useEffect(() => {
    if (selecionado && window.innerWidth < 1024 && tabelaRef.current) {
      tabelaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selecionado]);

  function handleBusca(valor) {
    setBusca(valor);
    setSelecionado(null);
    setMostrarSugestoes(true);
  }

  function selecionarCurso(nome) {
    setSelecionado(nome);
    setBusca(nome);
    setMostrarSugestoes(false);
  }

  const resultados = selecionado
    ? (tecToGrad[selecionado] || []).slice().sort((a, b) => a.curso.localeCompare(b.curso))
    : [];

  return (
    <>
      <Navbar />
      <div className="w-full min-h-screen bg-[#f8f9fa] text-gray-900 font-sans antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* --- HERO --- */}
      <section className="relative overflow-hidden bg-black text-white pt-8 pb-16 md:pt-10 md:pb-20">
        {/* dot grid decoration (right side) */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-60"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            maskImage: 'radial-gradient(circle at 75% 45%, black 0%, transparent 60%)',
            WebkitMaskImage: 'radial-gradient(circle at 75% 45%, black 0%, transparent 60%)',
          }}
        />
        {/* concentric rings behind photo */}
        <div className="pointer-events-none absolute top-1/2 right-[8%] -translate-y-1/2 w-[440px] h-[440px] rounded-full border border-white/10 hidden lg:block" />
        <div className="pointer-events-none absolute top-1/2 right-[8%] -translate-y-1/2 w-[330px] h-[330px] rounded-full border border-white/10 hidden lg:block" />
        {/* soft yellow glow behind photo */}
        <div className="pointer-events-none absolute top-1/2 right-[10%] -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-[#fed106]/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 grid lg:grid-cols-2 gap-8 items-center">
          {/* Left column */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#fed106]/40 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#fed106]">
              <IconScale className="w-3.5 h-3.5" />
              Equivalência de Cursos
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.05] tracking-tight">
              Técnico para
              <br />
              <span className="text-[#fed106]">Tecnólogo</span>
            </h1>

            <p className="mt-3 max-w-md mx-auto lg:mx-0 text-white/70 text-sm md:text-base">
              Descubra equivalências entre Cursos Técnicos e Graduações (Tecnólogo). Acelere sua formação eliminando matérias!
            </p>

            {/* Static label (não é mais um botão de alternância) */}
            <div className="mt-6 flex justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold bg-[#fed106] text-[#1f1f21] shadow-[0_4px_14px_rgba(254,209,6,0.35)]">
                <IconCheckCircle className="w-4.5 h-4.5" />
                Já tenho um Técnico
              </div>
            </div>
          </div>

          {/* Right column: stats */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:self-center lg:mt-16">
            <div className="relative w-full rounded-2xl border border-white/10 bg-white/[0.04] grid grid-cols-3 divide-x divide-white/10 py-6 md:py-8">
              <div className="text-center px-2">
                <div className="text-3xl md:text-4xl font-extrabold text-[#fed106] leading-none">{numTecnicos}</div>
                <div className="text-xs md:text-sm text-white/70 mt-2">Cursos Técnicos</div>
              </div>
              <div className="text-center px-2">
                <div className="text-3xl md:text-4xl font-extrabold text-[#fed106] leading-none">{numGraduacoes}</div>
                <div className="text-xs md:text-sm text-white/70 mt-2">Graduações (Tecnólogo)</div>
              </div>
              <div className="text-center px-2">
                <div className="text-3xl md:text-4xl font-extrabold text-[#fed106] leading-none">{numEquivalencias}+</div>
                <div className="text-xs md:text-sm text-white/70 mt-2">Equivalências</div>
              </div>

              <div className="absolute -top-23 left-2 md:left-3 rounded-2xl border border-[#fed106]/40 bg-[#151516] p-2 md:p-3 shadow-xl z-20">
                <IconAcademicCap className="w-7 h-7 md:w-8 md:h-8 text-[#fed106]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- COMO FUNCIONA + BUSCA + TABELA --- */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold">Como funciona?</h2>
            <p className="mt-3 text-gray-600 text-sm md:text-base">
              Estudantes com certificados de Ensino Técnico podem aproveitar disciplinas equivalentes na Graduação Tecnólogo.
              Selecione o curso técnico que você fez e elimine as disciplinas correspondentes, acelerando seu caminho para o
              diploma de Ensino Superior.
            </p>
          </div>

          <div ref={buscaRef} className="relative max-w-xl mx-auto mt-8">
            <label className="block text-center font-bold text-sm mb-2">
              Digite o <span className="text-[#b8930a]">CURSO TÉCNICO</span> que você fez
            </label>
            <div className="relative">
              <input
                type="text"
                value={busca}
                onChange={(e) => handleBusca(e.target.value)}
                onFocus={() => setMostrarSugestoes(true)}
                placeholder="Digite seu curso técnico"
                className="w-full h-12 rounded-xl border-2 border-gray-200 bg-white pl-5 pr-11 text-sm text-black shadow-sm focus:outline-none focus:border-[#fed106] focus:shadow-[0_0_0_4px_rgba(254,209,6,0.15)] transition-colors"
              />
              <IconChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            {mostrarSugestoes && sugestoes.length > 0 && (
              <div className="absolute z-30 mt-2 w-full rounded-xl border border-gray-100 bg-white shadow-xl max-h-64 overflow-y-auto">
                {sugestoes.map((nome) => (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => selecionarCurso(nome)}
                    className="w-full text-left px-5 py-3 text-sm hover:bg-[#FFFDEF] transition-colors cursor-pointer"
                  >
                    {nome}
                  </button>
                ))}
              </div>
            )}

            {mostrarSugestoes && termo && sugestoes.length === 0 && (
              <div className="absolute z-30 mt-2 w-full rounded-xl border border-gray-100 bg-white shadow-xl px-5 py-4 text-sm text-gray-500 text-center">
                Nenhum curso técnico encontrado.
              </div>
            )}
          </div>

          {selecionado && (
            <div ref={tabelaRef} className="mt-12">
              <h3 className="text-center font-bold text-lg mb-6">
                Escolha uma das opções para fazer seu <span className="text-[#b8930a]">CURSO TECNÓLOGO</span>
              </h3>

              {resultados.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                  <table className="w-full min-w-[560px] bg-white text-sm">
                    <thead>
                      <tr className="bg-black text-white text-xs uppercase tracking-wide">
                        <th className="px-5 py-3 text-left font-bold">Curso Tecnólogo</th>
                        <th className="px-5 py-3 text-left font-bold">Tempo de Formação</th>
                        <th className="px-5 py-3 text-left font-bold">Carga Horária a Cursar</th>
                        <th className="px-5 py-3 text-left font-bold">Informações Sobre o Curso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {resultados.map(({ curso, tempo, cargaHoraria }, idx) => {
                        const whatsMsg = `Olá! Tenho interesse no curso de Tecnologia em ${curso}. Já possuo o ${selecionado}.`;
                        const whatsUrl = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(whatsMsg)}`;

                        return (
                          <tr key={`${curso}-${idx}`} className="hover:bg-[#FFFDEF] transition-colors">
                            <td className="px-5 py-4 font-semibold">{curso}</td>
                            <td className="px-5 py-4 text-gray-500">{tempo || '-'}</td>
                            <td className="px-5 py-4 text-gray-500">{cargaHoraria || '-'}</td>
                            <td className="px-5 py-4">
                              <a
                                href={whatsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#fed106] hover:bg-black text-[#1f1f21] hover:text-white text-xs font-bold px-4 py-2 whitespace-nowrap transition-all"
                              >
                                Matricule-se
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma equivalência encontrada para este curso.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      </div>
    </>
  );
}
