import { useState, useEffect, useRef } from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { obterUrlEmbedVideo } from '../utils/video';
import videoHeroDepoimentos from '../assets/animado.mp4';
import linhaDivisoria from '../assets/linha-transparente.png';

function montarLinkWhatsapp(numero) {
  const apenasDigitos = (numero || '').replace(/\D/g, '');
  if (!apenasDigitos) return null;
  const comCodigoPais = apenasDigitos.startsWith('55') ? apenasDigitos : `55${apenasDigitos}`;
  return `https://wa.me/${comCodigoPais}`;
}

// --- Hook: só "revela" quando o elemento está visível E o usuário já rolou de verdade ---
// (em telas mais altas, uma seção pode nascer parcialmente visível sem nenhum scroll do usuário)
function useRevelarAoRolar(ref) {
  const [revelado, setRevelado] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    const scrollInicial = window.scrollY;
    let houveScrollReal = false;
    let estaVisivelAgora = false;

    function tentarRevelar() {
      if (houveScrollReal && estaVisivelAgora) {
        setRevelado(true);
        observer.disconnect();
        window.removeEventListener('scroll', aoRolarPagina);
      }
    }

    function aoRolarPagina() {
      if (!houveScrollReal && Math.abs(window.scrollY - scrollInicial) > 15) {
        houveScrollReal = true;
        tentarRevelar();
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        estaVisivelAgora = entry.isIntersecting;
        if (estaVisivelAgora) tentarRevelar();
      },
      { threshold: 0.15 }
    );

    window.addEventListener('scroll', aoRolarPagina, { passive: true });
    observer.observe(elemento);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', aoRolarPagina);
    };
  }, [ref]);

  return revelado;
}

// --- Envolve cada card com uma animação de entrada disparada ao rolar a tela ---
// direcao "up": sobe de baixo pra cima (usado nos destaques e na lista completa) | "down": desce de cima pra baixo
function AoRolar({ children, className = '', delayMs = 0, direcao = 'up' }) {
  const ref = useRef(null);
  const revelado = useRevelarAoRolar(ref);

  const estadoOculto = direcao === 'down' ? 'opacity-0 -translate-y-14' : 'opacity-0 translate-y-14';

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms`, transitionDuration: '1300ms', transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
      className={`transition-all ${revelado ? 'opacity-100 translate-x-0 translate-y-0' : estadoOculto} ${className}`}
    >
      {children}
    </div>
  );
}

// --- Card de depoimento: foto com play (ou vídeo embutido quando tocando).
// `compacto` deixa o card menor (usado nos destaques); `alturaClasse` sobrescreve a altura padrão. ---
function CardDepoimento({ item, compacto, tocando, onClicar, alturaClasse }) {
  const urlEmbed = obterUrlEmbedVideo(item.video_url);
  const altura = alturaClasse || (compacto ? 'h-[300px] md:h-[330px]' : 'h-[440px]');

  if (tocando && urlEmbed) {
    return (
      <div
        style={{ backgroundImage: `url(${item.foto_url})` }}
        className={`w-full ${altura} rounded-3xl shadow-md relative overflow-hidden bg-black bg-cover bg-center border border-white/10`}
      >
        {/* Mantém a foto do aluno visível (com um véu escuro + spinner) enquanto o iframe carrega —
            assim o card nunca parece ter sumido, só "carregando" */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#fed106]"></div>
        </div>
        <iframe
          src={urlEmbed}
          className="relative z-10 w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          title={`Depoimento de ${item.nome}`}
        />
      </div>
    );
  }

  const linkWhatsapp = montarLinkWhatsapp(item.whatsapp);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClicar}
      onKeyDown={(e) => e.key === 'Enter' && onClicar()}
      style={{ backgroundImage: `url(${item.foto_url})` }}
      className={`w-full ${altura} rounded-3xl bg-cover bg-center shadow-md relative overflow-hidden flex flex-col justify-between p-5 group cursor-pointer transform hover:-translate-y-1.5 transition-all duration-300 text-left`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent z-10"></div>
      <div></div>
      <div className="relative z-20 flex justify-center items-center">
        <div className={`${compacto ? 'w-11 h-11' : 'w-14 h-14'} rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex justify-center items-center group-hover:scale-110 group-hover:bg-[#fed106] transition-all duration-300 shadow-lg`}>
          <svg className={`${compacto ? 'w-4 h-4' : 'w-5 h-5'} text-[#fed106] group-hover:text-white fill-current transform translate-x-0.5 transition-colors`} viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="relative z-20 text-left">
        <h4 className={`${compacto ? 'text-sm' : 'text-base'} text-white font-extrabold tracking-wide leading-tight`}>
          {item.nome}
        </h4>
        {item.instagram && (
          <p className={`${compacto ? 'text-[11px]' : 'text-xs'} text-white/70 font-medium mt-0.5`}>
            {item.instagram}
          </p>
        )}
        {linkWhatsapp && (
          <a
            href={linkWhatsapp}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`mt-2 inline-flex items-center gap-1.5 text-white hover:text-[#fed106] font-extrabold tracking-wide transition-colors ${compacto ? 'text-[11px]' : 'text-xs'}`}
          >
            Tire suas dúvidas já
            <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

// Duração da entrada de cada card (deve bater com a transição usada nos cards abaixo)
const DURACAO_ENTRADA_DESTAQUE = 600;
const ATRASO_ENTRE_CARDS_DESTAQUE = 90;

// --- Esteira dos depoimentos em destaque: os cards sobem com fade um por um, da esquerda pra
// direita, ao rolar a página até ela (igual à seção "Todos os Depoimentos"). A esteira giratória só
// começa a rolar DEPOIS que o último card termina de subir — se ela começasse junto, arrastaria os
// cards ainda subindo pro lado, embaralhando a ordem visual e cortando alguns na máscara. ---
function EsteiraDepoimentosDestaque({ itens, depoimentoReproduzindoId, setDepoimentoReproduzindoId }) {
  const ref = useRef(null);
  const revelado = useRevelarAoRolar(ref);
  const [esteiraAtiva, setEsteiraAtiva] = useState(false);

  useEffect(() => {
    if (!revelado) return;
    const atrasoTotal = (itens.length - 1) * ATRASO_ENTRE_CARDS_DESTAQUE + DURACAO_ENTRADA_DESTAQUE;
    const temporizador = setTimeout(() => setEsteiraAtiva(true), atrasoTotal);
    return () => clearTimeout(temporizador);
  }, [revelado, itens.length]);

  // Com poucas cópias, perto do fim de cada ciclo o deslocamento + a largura da tela visível
  // ultrapassa a largura total do conteúdo — o conteúdo literalmente acaba antes da tela, e
  // sobra um vazio real (não é só o gap de 20px entre cards). Por isso calculamos quantas cópias
  // são necessárias para o conteúdo nunca acabar, dado o maior container possível (max-w-7xl ≈ 1216px)
  // e a largura de card mais larga (240px + 20px de gap no desktop).
  const larguraItemDesktop = 260;
  const larguraMaximaContainer = 1216;
  const periodo = itens.length * larguraItemDesktop;
  const copias = Math.max(2, Math.ceil(larguraMaximaContainer / periodo) + 1);
  const percentualDeslocamento = 100 / copias;
  const nomeKeyframe = `esteiraDestaque${copias}`;

  return (
    <div className="mb-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
          Depoimentos em Destaque
        </h2>
        <p className="text-sm md:text-base text-gray-500 font-medium mt-2">
          Alguns dos alunos que já transformaram a carreira com a gente.
        </p>
      </div>

      <style>{`
        @keyframes ${nomeKeyframe} {
          from { transform: translateX(0%); }
          to { transform: translateX(-${percentualDeslocamento}%); }
        }
      `}</style>

      <div
        ref={ref}
        className="relative w-full overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
        }}
      >
        <div
          className="flex gap-5 w-max hover:[animation-play-state:paused]"
          style={esteiraAtiva ? { animation: `${nomeKeyframe} 16s linear infinite` } : undefined}
        >
          {Array.from({ length: copias }).map((_, copiaIdx) =>
            itens.map((item, idx) =>
              copiaIdx === 0 ? (
                // Conjunto original: sobe de baixo pra cima com fade, um por um — mais rápido que a
                // seção "Todos os Depoimentos" (mesma curva de easing/distância, duração menor).
                <div
                  key={`destaque-${item.id}`}
                  style={{
                    transitionDelay: `${idx * ATRASO_ENTRE_CARDS_DESTAQUE}ms`,
                    transitionDuration: `${DURACAO_ENTRADA_DESTAQUE}ms`,
                    transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                  className={`transition-all w-[210px] md:w-[240px] shrink-0 ${
                    revelado ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-14'
                  }`}
                >
                  <CardDepoimento
                    item={item}
                    compacto
                    tocando={depoimentoReproduzindoId === item.id}
                    onClicar={() => setDepoimentoReproduzindoId(item.id)}
                  />
                </div>
              ) : (
                // Cópias extras: só existem pra fechar o loop da esteira sem espaço vazio, sempre visíveis
                <div key={`destaque-copia${copiaIdx}-${item.id}-${idx}`} className="w-[210px] md:w-[240px] shrink-0">
                  <CardDepoimento
                    item={item}
                    compacto
                    tocando={depoimentoReproduzindoId === item.id}
                    onClicar={() => setDepoimentoReproduzindoId(item.id)}
                  />
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function Depoimentos() {
  const [depoimentos, setDepoimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [depoimentoReproduzindoId, setDepoimentoReproduzindoId] = useState(null);

  useEffect(() => {
    async function buscarDepoimentos() {
      try {
        setCarregando(true);
        const { data, error } = await supabase
          .from('depoimentos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDepoimentos(data || []);
      } catch (err) {
        console.error('Erro ao buscar depoimentos:', err);
      } finally {
        setCarregando(false);
      }
    }
    buscarDepoimentos();
  }, []);

  const depoimentosDestaque = depoimentos.filter((item) => item.destaque);

  return (
    <div className="w-full min-h-screen bg-white font-sans antialiased">
      <Navbar />

      {/* --- CABEÇALHO: texto à esquerda, vídeo contido num quadro à direita --- */}
      <div className="w-full relative overflow-hidden bg-white min-h-[360px] md:min-h-[420px] flex items-center">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-6 md:pt-8 pb-4 md:pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="max-w-xl text-left">
              <div className="inline-flex items-center gap-2 bg-white shadow-sm border border-gray-100 rounded-full px-4 py-1.5 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fed106]"></span>
                <span className="text-xs font-black text-[#fed106] uppercase tracking-widest">Depoimentos</span>
              </div>

              <h1 className="text-3xl md:text-[44px] font-black text-gray-900 tracking-tight leading-[1.15] mb-4">
                Histórias reais, transformações verdadeiras
              </h1>

              <span className="block w-16 h-1 rounded-full bg-[#fed106] mb-5"></span>

              <p className="text-sm md:text-base text-gray-600 font-medium max-w-md leading-relaxed mb-8">
                Nossos alunos são a prova de que a educação muda vidas. Conheça algumas histórias inspiradoras de quem escolheu aprender, se dedicou e hoje colhe grandes conquistas.
              </p>

              <div className="flex items-center gap-8 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#fed106]/15 border border-[#fed106]/30 flex items-center justify-center text-[#fed106] shrink-0">
                    <UsersIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-gray-900 leading-none">+5.000</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">alunos formados</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#fed106]/15 border border-[#fed106]/30 flex items-center justify-center text-[#fed106] shrink-0">
                    <StarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-gray-900 leading-none">98%</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">de satisfação</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-md mx-auto lg:mx-0 lg:ml-auto aspect-square">
              <video
                src={videoHeroDepoimentos}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- LINHA DIVISÓRIA: separa a hero da listagem --- */}
      <img src={linhaDivisoria} alt="" className="w-full h-auto select-none pointer-events-none" />

      {/* --- LISTAGEM --- */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-14 md:pb-16">
        {carregando ? (
          <div className="w-full flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#fed106]"></div>
          </div>
        ) : depoimentos.length === 0 ? (
          <div className="w-full max-w-xl mx-auto bg-white rounded-[2.5rem] p-10 md:p-12 shadow-sm border border-gray-100 text-center">
            <p className="font-black text-gray-800 text-base mb-1">Nenhum depoimento publicado ainda.</p>
            <p className="text-sm text-gray-500">Em breve traremos histórias de quem já estudou com a gente.</p>
          </div>
        ) : (
          <>
            {/* SEÇÃO 1: DEPOIMENTOS EM DESTAQUE (escolhidos no admin) — cards sobem um por um, depois a esteira rola em loop */}
            {depoimentosDestaque.length > 0 && (
              <EsteiraDepoimentosDestaque
                itens={depoimentosDestaque}
                depoimentoReproduzindoId={depoimentoReproduzindoId}
                setDepoimentoReproduzindoId={setDepoimentoReproduzindoId}
              />
            )}

            {/* SEÇÃO 2: TODOS OS DEPOIMENTOS — cards um pouco menores que o tamanho antigo (mas maiores
                que os de destaque), sobem de baixo pra cima suavemente */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-[4px] h-6 bg-[#fed106] rounded-full"></div>
                <h2 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-wide">
                  Todos os Depoimentos
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {depoimentos.map((item, idx) => (
                  <AoRolar key={`todos-${item.id}`} direcao="up" delayMs={(idx % 4) * 120}>
                    <CardDepoimento
                      item={item}
                      compacto={false}
                      alturaClasse="h-[360px] md:h-[380px]"
                      tocando={depoimentoReproduzindoId === item.id}
                      onClicar={() => setDepoimentoReproduzindoId(item.id)}
                    />
                  </AoRolar>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
