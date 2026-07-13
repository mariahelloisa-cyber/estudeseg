import { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import { tecToGrad, gradToTec } from './aproveitamentoData';

const WHATSAPP_NUMERO = '5527998392172';

const HERO_STAT_TECNICOS = 55;
const HERO_STAT_GRADUACOES = 68;
const HERO_STAT_EQUIVALENCIAS = 150;
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

function IconSearch(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
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

function IconCog(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

function IconChevronRight(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function IconBolt(props) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function IconClock(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconCoin(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconWhatsapp(props) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.52 3.48A11.93 11.93 0 0012.04 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.86 11.86 0 005.64 1.44h.01c6.54 0 11.85-5.3 11.85-11.85 0-3.17-1.23-6.15-3.38-8.43zM12.04 21.3a9.4 9.4 0 01-4.8-1.32l-.34-.2-3.58.94.96-3.5-.22-.36a9.44 9.44 0 01-1.45-5.01c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.9.99 6.69 2.78a9.4 9.4 0 012.77 6.7c0 5.22-4.25 9.44-9.51 9.44zm5.2-7.09c-.28-.14-1.67-.82-1.93-.92-.26-.1-.45-.14-.64.14-.19.28-.74.92-.9 1.1-.17.19-.33.21-.61.07-.28-.14-1.19-.44-2.26-1.4-.84-.75-1.4-1.67-1.57-1.95-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.5-.07-.14-.64-1.53-.87-2.1-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.35-.26.28-1 1-1 2.42 0 1.42 1.02 2.8 1.17 3 .14.19 2 3.05 4.84 4.28.68.29 1.2.47 1.62.6.68.22 1.3.19 1.79.11.55-.08 1.67-.68 1.9-1.34.24-.66.24-1.22.17-1.34-.07-.12-.26-.19-.54-.33z" />
    </svg>
  );
}

export default function Aproveitamento() {
  const [modo, setModo] = useState('tec');
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState(null);
  const painelRef = useRef(null);

  const numTecnicos = useCountUp(HERO_STAT_TECNICOS);
  const numGraduacoes = useCountUp(HERO_STAT_GRADUACOES);
  const numEquivalencias = useCountUp(HERO_STAT_EQUIVALENCIAS);

  const dados = modo === 'tec' ? tecToGrad : gradToTec;
  const cursos = useMemo(() => Object.keys(dados).sort(), [dados]);
  const termo = busca.toLowerCase().trim();
  const filtrados = termo ? cursos.filter((nome) => nome.toLowerCase().includes(termo)) : cursos;

  useEffect(() => {
    if (selecionado && window.innerWidth < 1024 && painelRef.current) {
      painelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selecionado]);

  function alternarModo(novoModo) {
    setModo(novoModo);
    setBusca('');
    setSelecionado(null);
  }

  function handleBusca(valor) {
    setBusca(valor);
    setSelecionado(null);
  }

  const resultados = selecionado ? (dados[selecionado] || []).slice().sort() : [];

  return (
    <div className="w-full min-h-screen bg-[#f8f9fa] text-gray-900 font-sans antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      {/* --- HERO --- */}
      <section className="relative overflow-hidden bg-[#0d0d0f] text-white pt-8 pb-20 md:pt-10 md:pb-24">
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

            {/* Mode Toggle */}
            <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-3">
              <button
                type="button"
                onClick={() => alternarModo('tec')}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  modo === 'tec'
                    ? 'bg-[#fed106] text-[#1f1f21] shadow-[0_4px_14px_rgba(254,209,6,0.35)]'
                    : 'bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/30'
                }`}
              >
                <IconCheckCircle className="w-4.5 h-4.5" />
                Já tenho um Técnico
              </button>
              <button
                type="button"
                onClick={() => alternarModo('grad')}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  modo === 'grad'
                    ? 'bg-[#fed106] text-[#1f1f21] shadow-[0_4px_14px_rgba(254,209,6,0.35)]'
                    : 'bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/30'
                }`}
              >
                <IconAcademicCap className="w-4.5 h-4.5" />
                Quero uma Graduação
              </button>
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

        {/* Search bar */}
        <div className="absolute bottom-7 md:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
          <div className="relative">
            <IconSearch className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => handleBusca(e.target.value)}
              placeholder="Pesquisar curso..."
              className="w-full h-10 rounded-full border-2 border-transparent bg-white pl-14 pr-14 text-black shadow-[0_10px_30px_rgba(0,0,0,0.15)] focus:outline-none focus:border-[#fed106] focus:shadow-[0_0_0_4px_rgba(254,209,6,0.15)] transition-colors"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#fed106] flex items-center justify-center pointer-events-none">
              <IconSearch className="w-3.5 h-3.5 text-[#1f1f21]" />
            </div>
          </div>
        </div>
      </section>

      <div className="h-4 md:h-6" />

      {/* --- MAIN CONTENT --- */}
      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Course List */}
          <div className="lg:col-span-7">
            <h2 className="flex items-center gap-2 font-bold text-base mb-4">
              {modo === 'tec' ? (
                <>
                  <IconCog className="w-5 h-5 text-green-700" />
                  Selecione seu Curso Técnico:
                </>
              ) : (
                <>
                  <IconAcademicCap className="w-5 h-5 text-blue-700" />
                  Selecione a Graduação desejada:
                </>
              )}
            </h2>

            {filtrados.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtrados.map((nome) => {
                  const equivCount = dados[nome].length;
                  const ativo = selecionado === nome;
                  const rotulo =
                    modo === 'tec'
                      ? `${equivCount} graduaç${equivCount === 1 ? 'ão' : 'ões'} disponíve${equivCount === 1 ? 'l' : 'is'}`
                      : `${equivCount} técnico${equivCount === 1 ? '' : 's'} aceito${equivCount === 1 ? '' : 's'}`;

                  return (
                    <button
                      key={nome}
                      type="button"
                      onClick={() => setSelecionado(nome)}
                      className={`group relative text-left bg-white rounded-xl p-5 border-2 transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] ${
                        ativo ? 'border-[#fee600] bg-[#FFFDEF] shadow-[0_8px_25px_rgba(254,230,0,0.15)]' : 'border-transparent hover:border-[#fee600]'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${modo === 'tec' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {modo === 'tec' ? <IconCog className="w-5 h-5" /> : <IconAcademicCap className="w-5 h-5" />}
                      </div>
                      <h6 className="font-bold text-sm mb-1 pr-6">{nome}</h6>
                      <div className="text-xs text-gray-500">{rotulo}</div>
                      <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-[#fed106] transition-opacity ${ativo ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <IconChevronRight className="w-5 h-5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <IconSearch className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h5 className="font-bold">Nenhum curso encontrado</h5>
                <p className="text-sm">Tente buscar com outro termo.</p>
              </div>
            )}
          </div>

          {/* Result Panel / Info Cards */}
          <div className="lg:col-span-5" ref={painelRef}>
            {selecionado ? (
              <div className="sticky top-24 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 md:p-8 animate-fade-in-up">
                <h4 className="flex items-center gap-2 font-extrabold text-lg">
                  {modo === 'tec' ? (
                    <>
                      <IconAcademicCap className="w-5 h-5 text-blue-700" />
                      Graduações disponíveis
                    </>
                  ) : (
                    <>
                      <IconCog className="w-5 h-5 text-green-700" />
                      Técnicos aceitos
                    </>
                  )}
                </h4>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  {modo === 'tec'
                    ? `Com o "${selecionado}", você pode acelerar ${resultados.length} graduaç${resultados.length === 1 ? 'ão' : 'ões'}:`
                    : `Para "${selecionado}", são aceitos ${resultados.length} curso${resultados.length === 1 ? '' : 's'} técnico${resultados.length === 1 ? '' : 's'}:`}
                </p>

                {resultados.length > 0 ? (
                  <div className="space-y-2">
                    {resultados.map((item) => {
                      const whatsMsg =
                        modo === 'tec'
                          ? `Olá! Tenho interesse no curso de ${item}. Já possuo o ${selecionado}.`
                          : `Olá! Tenho interesse no curso de ${selecionado}. Já possuo o ${item}.`;
                      const whatsUrl = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(whatsMsg)}`;

                      return (
                        <div key={item} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-[#FFFDEF] hover:border-[#fee600] transition-colors">
                          <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${modo === 'tec' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {modo === 'tec' ? <IconAcademicCap className="w-4.5 h-4.5" /> : <IconCog className="w-4.5 h-4.5" />}
                          </div>
                          <span className="text-sm font-semibold">{item}</span>
                          <a
                            href={whatsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full bg-[#25D366] hover:bg-[#1da851] hover:scale-105 text-white text-xs font-bold px-3.5 py-1.5 whitespace-nowrap transition-all"
                          >
                            <IconWhatsapp className="w-3.5 h-3.5" />
                            Quero esse curso
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhuma equivalência encontrada para este curso.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 bg-white rounded-2xl p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center">
                    <IconBolt className="w-7 h-7" />
                  </div>
                  <h5 className="font-bold">Como funciona?</h5>
                  <p className="text-sm text-gray-500 mt-1">
                    Selecione um curso técnico ou uma graduação ao lado para descobrir as equivalências disponíveis. Você pode eliminar matérias e acelerar sua formação!
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center">
                    <IconClock className="w-7 h-7" />
                  </div>
                  <h5 className="font-bold text-sm">Economize Tempo</h5>
                  <p className="text-xs text-gray-500 mt-1">Reduza o tempo da sua graduação aproveitando disciplinas do técnico.</p>
                </div>
                <div className="bg-white rounded-2xl p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <IconCoin className="w-7 h-7" />
                  </div>
                  <h5 className="font-bold text-sm">Economize Dinheiro</h5>
                  <p className="text-xs text-gray-500 mt-1">Menos semestres significa menos mensalidades a pagar.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
