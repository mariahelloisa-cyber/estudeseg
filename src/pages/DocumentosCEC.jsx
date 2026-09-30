import { useEffect, useState } from 'react';
import logo from '../assets/logo-estud.webp';
import resolucaoP1 from '../assets/documentos/resolucao-268-p1.webp';
import resolucaoP2 from '../assets/documentos/resolucao-268-p2.webp';
import certificadoFrente from '../assets/documentos/certificado-eja-frente.webp';
import certificadoVerso from '../assets/documentos/certificado-eja-verso.webp';

// Página "escondida": não aparece em menu nenhum, só é acessada por quem recebe o link.
// Não tem Navbar/Footer/widgets (ver App.jsx) e pede aos buscadores para não indexar.

const DOCUMENTOS = [
  {
    numero: '01',
    titulo: 'Resolução nº 268/2022 — CEE/PA',
    descricao:
      'Credencia a mantenedora ITECC e autoriza o funcionamento da EJA e dos cursos técnicos a distância do Centro Educacional Carajás.',
    colunas: 'md:grid-cols-2',
    paginas: [
      { src: resolucaoP1, largura: 1492, altura: 2116, rotulo: 'Página 1' },
      { src: resolucaoP2, largura: 1500, altura: 2123, rotulo: 'Página 2' },
    ],
  },
  {
    numero: '02',
    titulo: 'Certificado EJA — Modelo',
    descricao: 'Frente e verso do certificado de conclusão emitido pelo Centro Educacional Carajás.',
    colunas: 'grid-cols-1',
    paginas: [
      { src: certificadoFrente, largura: 1096, altura: 736, rotulo: 'Frente' },
      { src: certificadoVerso, largura: 1107, altura: 771, rotulo: 'Verso' },
    ],
  },
];

// Lista "achatada" para o visualizador ampliado navegar entre todas as imagens
const TODAS_AS_PAGINAS = DOCUMENTOS.flatMap((doc) =>
  doc.paginas.map((pagina) => ({ ...pagina, titulo: doc.titulo }))
);

// Posição da primeira página de cada documento dentro de TODAS_AS_PAGINAS
const INICIO_DE_CADA_DOC = DOCUMENTOS.map((_, i) =>
  DOCUMENTOS.slice(0, i).reduce((soma, doc) => soma + doc.paginas.length, 0)
);

function useNoIndex() {
  useEffect(() => {
    const tituloAnterior = document.title;
    document.title = 'Documentos oficiais | Estude Seguro';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.title = tituloAnterior;
      meta.remove();
    };
  }, []);
}

function MolduraDocumento({ pagina, onAbrir }) {
  return (
    <figure className="relative pt-4">
      {/* Sombra amarela deslocada: o "carimbo" da identidade Estude Seguro */}
      <div className="absolute inset-x-0 bottom-0 top-4 translate-x-2 translate-y-2 sm:translate-x-3 sm:translate-y-3 rounded-2xl bg-[#fed106]" />

      <span className="absolute top-0 left-5 z-10 bg-black text-[#fed106] text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
        {pagina.rotulo}
      </span>

      <button
        type="button"
        onClick={onAbrir}
        aria-label={`Ampliar ${pagina.titulo} — ${pagina.rotulo}`}
        className="group relative block w-full rounded-2xl border-[3px] border-black bg-white p-2 sm:p-3 cursor-zoom-in transition-transform duration-300 hover:-translate-x-0.5 hover:-translate-y-0.5"
      >
        <img
          src={pagina.src}
          width={pagina.largura}
          height={pagina.altura}
          loading="lazy"
          alt={`${pagina.titulo} — ${pagina.rotulo}`}
          className="w-full h-auto rounded-lg border border-gray-200"
        />
        {/* No celular vira só um ícone discreto, para não cobrir o texto do documento */}
        <span className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 flex items-center gap-1.5 bg-black/80 text-[#fed106] sm:text-white text-xs font-bold p-2 sm:px-3 sm:py-2 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 8v6M8 11h6M19 11a8 8 0 11-16 0 8 8 0 0116 0z" />
          </svg>
          <span className="hidden sm:inline">Ampliar</span>
        </span>
      </button>
    </figure>
  );
}

function VisualizadorAmpliado({ indice, onFechar, onNavegar }) {
  const pagina = TODAS_AS_PAGINAS[indice];
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    function aoTeclar(e) {
      if (e.key === 'Escape') onFechar();
      if (e.key === 'ArrowRight') onNavegar(1);
      if (e.key === 'ArrowLeft') onNavegar(-1);
    }
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [onFechar, onNavegar]);

  const CLASSE_BOTAO =
    'w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#fed106] text-white hover:text-black transition-colors cursor-pointer';

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" role="dialog" aria-modal="true" aria-label={pagina.titulo}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{pagina.titulo}</p>
          <p className="text-xs text-[#fed106] font-semibold">
            {pagina.rotulo} · {indice + 1} de {TODAS_AS_PAGINAS.length}
          </p>
        </div>
        <button type="button" onClick={onFechar} className={CLASSE_BOTAO} aria-label="Fechar">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Clique na imagem alterna entre "caber na tela" e tamanho real (com rolagem) */}
      <div
        className={`flex-1 overflow-auto px-3 pb-3 ${zoom ? '' : 'flex items-center justify-center'}`}
        onClick={(e) => e.target === e.currentTarget && onFechar()}
      >
        <img
          src={pagina.src}
          alt={`${pagina.titulo} — ${pagina.rotulo}`}
          onClick={() => setZoom((z) => !z)}
          className={`rounded-md bg-white ${
            zoom ? 'max-w-none w-[1500px] mx-auto cursor-zoom-out' : 'max-w-full max-h-full object-contain cursor-zoom-in'
          }`}
        />
      </div>

      <div className="flex items-center justify-center gap-4 pb-5 pt-1">
        <button type="button" onClick={() => onNavegar(-1)} className={CLASSE_BOTAO} aria-label="Anterior">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-white/60 text-xs font-medium">Toque na imagem para {zoom ? 'reduzir' : 'ampliar'}</span>
        <button type="button" onClick={() => onNavegar(1)} className={CLASSE_BOTAO} aria-label="Próxima">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function DocumentosCEC() {
  useNoIndex();
  const [aberto, setAberto] = useState(null);

  const total = TODAS_AS_PAGINAS.length;
  const fechar = () => setAberto(null);
  const navegar = (passo) => setAberto((i) => (i + passo + total) % total);

  return (
    <div
      className="min-h-screen bg-[#F8F9FA] text-gray-900 antialiased"
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundImage: 'radial-gradient(rgba(0,0,0,0.07) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <div className="h-2 w-full bg-[#fed106]" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Estude Seguro" className="h-24 w-auto" />
        </div>

        {DOCUMENTOS.map((doc, d) => (
          <section key={doc.numero} className="mt-10 first-of-type:mt-0 animate-fade-in-up">
            <div className="flex items-start gap-3 sm:gap-4 mb-6">
              <span className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-black text-[#fed106] font-black text-base sm:text-lg flex items-center justify-center">
                {doc.numero}
              </span>
              <div>
                <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight leading-tight">{doc.titulo}</h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-2xl">{doc.descricao}</p>
              </div>
            </div>

            <div className={`grid ${doc.colunas} gap-8 sm:gap-10 pr-2 sm:pr-3`}>
              {doc.paginas.map((pagina, p) => (
                <MolduraDocumento
                  key={pagina.src}
                  pagina={{ ...pagina, titulo: doc.titulo }}
                  onAbrir={() => setAberto(INICIO_DE_CADA_DOC[d] + p)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* key: ao trocar de imagem o visualizador recomeça sem zoom */}
      {aberto !== null && <VisualizadorAmpliado key={aberto} indice={aberto} onFechar={fechar} onNavegar={navegar} />}
    </div>
  );
}
