import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { obterUrlEmbedVideo } from '../utils/video';

function montarLinkWhatsapp(numero) {
  const apenasDigitos = (numero || '').replace(/\D/g, '');
  if (!apenasDigitos) return null;
  const comCodigoPais = apenasDigitos.startsWith('55') ? apenasDigitos : `55${apenasDigitos}`;
  return `https://wa.me/${comCodigoPais}`;
}

export default function Inicio() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';
  const navigate = useNavigate();

  // --- Busca de cursos (barra de pesquisa mobile) ---
  const [buscaCursoMobile, setBuscaCursoMobile] = useState('');

  const handleBuscarCursoMobile = (e) => {
    e.preventDefault();
    const termo = buscaCursoMobile.trim();
    navigate(termo ? `/cursos?busca=${encodeURIComponent(termo)}` : '/cursos');
  };

  // --- Estado para os Banners Dinâmicos do Supabase ---
  const [banners, setBanners] = useState([]);
  const [indexAtual, setIndexAtual] = useState(0);
  
  // --- Estados para as restantes seções do Strapi ---
  const [listaSelos, setListaSelos] = useState([]);
  const [listaDiferenciais, setListaDiferenciais] = useState([]);
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const [cursosDestaque, setCursosDestaque] = useState([]);
  const cursosCarrosselRef = useRef(null);

  const rolarCursosDestaque = (direcao) => {
    const container = cursosCarrosselRef.current;
    if (!container) return;
    const largura = container.clientWidth;
    const maxScroll = container.scrollWidth - container.clientWidth;
    let destino = container.scrollLeft + (direcao === 'direita' ? largura : -largura);
    destino = Math.max(0, Math.min(destino, maxScroll));
    container.scrollTo({ left: destino, behavior: 'smooth' });
  };
  const [cursosMaisVendidos, setCursosMaisVendidos] = useState([]);
  const [paginaMaisVendidos, setPaginaMaisVendidos] = useState(0);
  const [bannerLateral, setBannerLateral] = useState(null);
  const [depoimentos, setDepoimentos] = useState([]);
  const [depoimentoReproduzindoId, setDepoimentoReproduzindoId] = useState(null);

  // --- Estado do Formulário de Contato ---
  const [contatoForm, setContatoForm] = useState({ nome: '', email: '', telefone: '', curso_desejado: '', mensagem: '' });
  const [contatoStatus, setContatoStatus] = useState('');

  const handleContatoChange = (e) => {
    const { name, value } = e.target;
    setContatoForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContatoSubmit = async (e) => {
    e.preventDefault();
    setContatoStatus('enviando');
    try {
      const { error } = await supabase.from('contatos').insert([contatoForm]);
      if (error) throw error;

      setContatoStatus('sucesso');
      setContatoForm({ nome: '', email: '', telefone: '', curso_desejado: '', mensagem: '' });
      setTimeout(() => setContatoStatus(''), 5000);
    } catch (err) {
      console.error('Erro ao salvar contato no Supabase:', err);
      setContatoStatus('erro');
    }
  };

  // Adicionar CSS para animação marquee
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes marquee {
        0% {
          transform: translateX(0%);
        }
        100% {
          transform: translateX(-50%);
        }
      }
      .animate-marquee {
        animation: marquee 15s linear infinite;
        will-change: transform;
      }
      .hide-scrollbar {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // 1. Buscar Banners do SUPABASE
  async function buscarBannersDoSupabase() {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setBanners(data || []);
    } catch (err) {
      console.error("Erro na conexão com os banners do Supabase:", err);
    }
  }

  useEffect(() => {
    buscarBannersDoSupabase();
  }, []);

  // 2. Buscar Selos do SUPABASE
  async function buscarSelosDoSupabase() {
    try {
      const { data, error } = await supabase
        .from('selos')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setListaSelos(data || []);
    } catch (err) {
      console.error("Erro na conexão com os selos do Supabase:", err);
    }
  }

  useEffect(() => {
    buscarSelosDoSupabase();
  }, []);

  // 3. Buscar Diferenciais do SUPABASE
  async function buscarDiferenciaisDoSupabase() {
    try {
      const { data, error } = await supabase
        .from('diferenciais')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      const dadosFormatados = (data || []).map(item => ({
        id: item.id,
        titulo: item.titulo,
        fotoUrl: item.imagem_url
      }));

      setListaDiferenciais(dadosFormatados);
    } catch (err) {
      console.error("Erro na conexão com os diferenciais do Supabase:", err);
    }
  }

  useEffect(() => {
    buscarDiferenciaisDoSupabase();
  }, []);

  // Banner Rotativo Automático do Supabase
  useEffect(() => {
    if (banners.length <= 1) return;
    const temporizador = setInterval(() => {
      setIndexAtual((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000); 
    return () => clearInterval(temporizador);
  }, [banners.length]);

  const irParaEsquerda = () => {
    if (listaDiferenciais.length === 0) return;
    setIndiceAtivo((prev) => (prev === 0 ? listaDiferenciais.length - 1 : prev - 1));
  };

  const irParaDireita = () => {
    if (listaDiferenciais.length === 0) return;
    setIndiceAtivo((prev) => (prev === listaDiferenciais.length - 1 ? 0 : prev + 1));
  };

  const obterDadoDoCard = (posicaoFisica) => {
    if (listaDiferenciais.length === 0) return null;
    const deslocamento = posicaoFisica - 2;
    let indiceDado = (indiceAtivo + deslocamento) % listaDiferenciais.length;
    if (indiceDado < 0) indiceDado += listaDiferenciais.length;
    return listaDiferenciais[indiceDado];
  };

  // --- Fetch para Cursos em Destaque (marcados no painel admin) ---
  const MAX_CURSOS_DESTAQUE = 5;
  const MAX_CURSOS_MAIS_VENDIDOS = 8;
  const CARDS_POR_PAGINA_MAIS_VENDIDOS = 4;

  // Tamanho fixo dos cards do carrossel "Cursos em Destaque" (em px) — altere aqui
  const LARGURA_CARD_CURSO_DESTAQUE = 240;
  const ALTURA_CARD_CURSO_DESTAQUE = 220;
  const GAP_CARD_CURSO_DESTAQUE = 16; // precisa bater com o gap-4 usado no carrossel

  // Mede o espaço disponível e mostra só cartões inteiros (nunca corta o último)
  const cursosWrapperRef = useRef(null);
  const [larguraFaixaCursos, setLarguraFaixaCursos] = useState(null);

  useEffect(() => {
    const wrapper = cursosWrapperRef.current;
    if (!wrapper) return;

    function recalcularLarguraFaixa() {
      const disponivel = wrapper.clientWidth;
      const cardComGap = LARGURA_CARD_CURSO_DESTAQUE + GAP_CARD_CURSO_DESTAQUE;
      const numCartoesVisiveis = Math.max(1, Math.floor((disponivel + GAP_CARD_CURSO_DESTAQUE) / cardComGap));
      setLarguraFaixaCursos(Math.min(disponivel, numCartoesVisiveis * cardComGap - GAP_CARD_CURSO_DESTAQUE));
    }

    recalcularLarguraFaixa();
    const observer = new ResizeObserver(recalcularLarguraFaixa);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function buscarCursosDestaque() {
      try {
        const { data, error } = await supabase
          .from('cursos_cadastrados')
          .select('*, categorias_cursos(nome)')
          .eq('destaque', true)
          .order('created_at', { ascending: false })
          .limit(MAX_CURSOS_DESTAQUE);

        if (error) throw error;

        const cursosFormatados = (data || []).map((item) => ({
          id: item.id,
          titulo: item.titulo || "Curso sem Título",
          resumo: item.descricao ? item.descricao.substring(0, 70) + "..." : "",
          duracao: item.duracao || "Curta Duração",
          categoria: (item.categorias_cursos?.nome || "Geral").toUpperCase(),
          fotoUrl: item.imagem_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600"
        }));
        setCursosDestaque(cursosFormatados);
      } catch (erro) {
        console.error("Erro ao carregar cursos em destaque:", erro);
      }
    }
    buscarCursosDestaque();
  }, []);

  // 4. Buscar Depoimentos do SUPABASE
  async function buscarDepoimentosDoSupabase() {
    try {
      const { data, error } = await supabase
        .from('depoimentos')
        .select('*')
        .eq('destaque', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setDepoimentos(data || []);
    } catch (err) {
      console.error("Erro na conexão com os depoimentos do Supabase:", err);
    }
  }

  useEffect(() => {
    buscarDepoimentosDoSupabase();
  }, []);

  // Buscar Cursos Mais Vendidos e Banner Lateral do Blog do Supabase
  useEffect(() => {
    async function buscarCursosMaisVendidos() {
      try {
        const { data, error } = await supabase
          .from('cursos_cadastrados')
          .select('*, categorias_cursos(nome)')
          .eq('mais_vendido', true)
          .order('created_at', { ascending: false })
          .limit(MAX_CURSOS_MAIS_VENDIDOS);

        if (error) throw error;

        const dadosFormatados = (data || []).map(item => ({
          id: item.id,
          titulo: item.titulo || "Curso sem Título",
          resumo: item.descricao ? item.descricao.substring(0, 110) + "..." : "",
          categoria: (item.categorias_cursos?.nome || "Geral").toUpperCase(),
          duracao: item.duracao || "Curta Duração",
          preco: item.preco || 0,
          fotoUrl: item.imagem_url,
        }));

        setCursosMaisVendidos(dadosFormatados);
      } catch (err) {
        console.error("Erro ao buscar cursos mais vendidos do Supabase:", err);
      }
    }

    async function buscarBannerLateral() {
      try {
        const resposta = await fetch(`${API_URL}/api/banner-blog-lateral?populate=*`);
        const dados = await resposta.json();
        if (dados && dados.data) {
          const imgCaminho = dados.data.imagem?.url || "";
          setBannerLateral({
            fotoUrl: imgCaminho ? `${API_URL}${imgCaminho}` : "",
            link: dados.data.link || "#"
          });
        }
      } catch (erro) {
        console.error("Erro ao carregar banner lateral do blog:", erro);
      }
    }

    buscarCursosMaisVendidos();
    buscarBannerLateral();
  }, [API_URL]);

  // --- RENDERIZAÇÃO NORMAL DO SITE PÚBLICO (COM TODOS OS COMPONENTES INTACTOS) ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      <Navbar />
      
      {/* --- SEÇÃO 1: BANNER ROTATIVO (AGORA INTEGRADO AO SUPABASE) --- */}
      {banners.length > 0 && (
        <div className="w-full bg-white relative group">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
            <div className="w-full relative overflow-hidden rounded-2xl md:rounded-3xl shadow-sm h-[220px] sm:h-[340px] md:h-[460px]">
              {banners.map((banner, idx) => (
                <img
                  key={banner.id ?? idx}
                  src={banner.imagem_url}
                  alt="LATec Banner"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                    idx === indexAtual ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                />
              ))}
              {banners.length > 1 && (
                <>
                  <button 
                    onClick={() => setIndexAtual((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-[#fed106] text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-20 font-bold text-sm"
                  >
                    &#10094;
                  </button>
                  <button 
                    onClick={() => setIndexAtual((prev) => (prev === banners.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-[#fed106] text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-20 font-bold text-sm"
                  >
                    &#10095;
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/15 px-2.5 py-1 rounded-full backdrop-blur-xs">
                    {banners.map((_, idx) => (
                      <button
                        key={`dot-banner-${idx}`}
                        onClick={() => setIndexAtual(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === indexAtual ? 'w-4 bg-[#fed106]' : 'w-1.5 bg-white/50 hover:bg-white'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SEÇÃO 2: BENEFÍCIOS DO LATEC --- */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-2 md:mt-4 relative z-10 pb-6">
        <div className="bg-white rounded-2xl md:rounded-full shadow-xl border border-gray-100 p-6 md:py-6 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 items-center">
          <div className="flex items-center gap-4 md:px-6">
            <div className="w-12 h-12 rounded-full bg-[#fed106]/10 flex items-center justify-center text-[#fed106] shrink-0 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-gray-700 font-bold text-sm md:text-[15px] leading-snug">Certificado Técnico Autorizado pelo MEC</p>
          </div>
          <div className="flex items-center gap-4 md:px-8 md:border-l md:border-gray-200">
            <div className="w-12 h-12 rounded-full bg-[#fed106]/10 flex items-center justify-center text-[#fed106] shrink-0 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-bold text-sm md:text-[15px] leading-snug">Educação Acessível e Flexibilidade Total de Horários</p>
          </div>
          <div className="flex items-center gap-4 md:px-8 md:border-l md:border-gray-200">
            <div className="w-12 h-12 rounded-full bg-[#fed106]/10 flex items-center justify-center text-[#fed106] shrink-0 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-700 font-bold text-sm md:text-[15px] leading-snug">Cursos Alinhados ao Mercado de Trabalho</p>
          </div>
        </div>

        {/* Barra de pesquisa de cursos — só no mobile */}
        <p className="md:hidden mt-4 text-[#fed106] text-sm font-black uppercase tracking-wide">
          Pesquise nossos cursos
        </p>
        <form
          onSubmit={handleBuscarCursoMobile}
          className="md:hidden mt-2 relative w-full bg-white rounded-full shadow-xl border border-gray-100 p-1 flex items-center"
        >
          <span className="pl-4 text-gray-400">
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={buscaCursoMobile}
            onChange={(e) => setBuscaCursoMobile(e.target.value)}
            placeholder="Pesquisar curso..."
            className="w-full pl-2 pr-2 py-3 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none font-medium"
          />
          <button
            type="submit"
            aria-label="Pesquisar curso"
            className="bg-[#000000] hover:bg-[#fed106] text-white p-2.5 rounded-full transition-all flex items-center justify-center shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>

      {/* --- SEÇÃO 3: ESTEIRA DE SELOS --- */}
      {listaSelos.length > 0 && (
        <div className="w-full bg-white mt-4 pb-8 border-b border-gray-100 shadow-inner">
          <div className="w-full bg-[#000000] py-4 mb-8 flex justify-center items-center shadow-md">
            <h2 className="text-white text-base md:text-xl font-black uppercase tracking-[0.2em] text-center px-4">
              Selos de Confiança & Reconhecimento
            </h2>
          </div>
          <div className="relative w-full overflow-hidden bg-white py-4">
            <div className="flex animate-marquee">
              {listaSelos.map((selo, i) => (
                <div key={`selo-${i}`} className="flex-shrink-0 px-8 flex items-center justify-center" style={{ minWidth: '270px' }}>
                  <img src={selo.imagem_url} alt={selo.nome} className="h-14 md:h-20 w-auto object-contain transition-transform hover:scale-105 duration-400" />
                </div>
              ))}
              {listaSelos.map((selo, i) => (
                <div key={`selo-dup-${i}`} className="flex-shrink-0 px-8 flex items-center justify-center" style={{ minWidth: '270px' }}>
                  <img src={selo.imagem_url} alt={selo.nome} className="h-14 md:h-20 w-auto object-contain transition-transform hover:scale-105 duration-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SEÇÃO 4: DIFERENCIAIS --- */}
{listaDiferenciais.length > 0 && (
  <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-16 pb-16">
    <div className="text-center md:text-left mb-8 pl-2">
      <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Nossos Diferenciais</h2>
      <p className="text-sm md:text-base text-gray-500 mt-2 font-medium">Por que escolher a Estude Seguro para impulsionar o seu futuro profissional?</p>
    </div>
    <div className="w-full flex flex-col items-center">
      <div className="w-full min-h-[320px] flex items-center justify-center relative overflow-hidden px-2 py-6 gap-3 md:gap-6">
        {[0, 1, 2, 3, 4].map((posicaoFisica) => {
          const itemData = obterDadoDoCard(posicaoFisica);
          if (!itemData) return null;
          let estiloDestaque = posicaoFisica === 2 ? "scale-110 md:scale-115 opacity-100 z-30 shadow-2xl ring-4 ring-[#fed106]/100" : (posicaoFisica === 1 || posicaoFisica === 3 ? "opacity-40 scale-95 z-20 shadow-md" : "opacity-10 scale-85 z-10 hidden sm:flex");
          
          const urlImagem = itemData.fotoUrl || itemData.imagem_url || itemData.foto_url;

          return (
            <div 
              key={`card-fisico-${posicaoFisica}`} 
              style={{ backgroundImage: `url('${urlImagem}')` }}
              className={`w-[18%] min-w-[200px] md:min-w-[250px] h-[300px] rounded-2xl relative bg-cover bg-center transition-all duration-500 ease-in-out transform flex flex-col justify-end p-5 overflow-hidden ${estiloDestaque}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
              <div className="relative z-20 text-left pl-1 pr-2 pb-1">
                <h4 className="text-white text-sm md:text-base font-extrabold tracking-wide leading-snug uppercase">{itemData.titulo}</h4>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between items-center w-full max-w-xs mt-6 px-4">
        <div className="flex gap-1.5">
          {listaDiferenciais.map((_, idx) => (
            <span key={idx} className={`h-2 rounded-full transition-all duration-300 ${idx === indiceAtivo ? 'w-5 bg-[#fed106]' : 'w-2 bg-gray-300'}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={irParaEsquerda} className="w-10 h-10 rounded-full bg-[#fed106] hover:bg-[#000000] text-white flex items-center justify-center shadow transition-all cursor-pointer font-bold z-40">&#10094;</button>
          <button onClick={irParaDireita} className="w-10 h-10 rounded-full bg-[#fed106] hover:bg-[#000000] text-white flex items-center justify-center shadow transition-all cursor-pointer font-bold z-40">&#10095;</button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* --- SEÇÃO 5: CURSOS EM DESTAQUE --- */}
      {cursosDestaque.length > 0 && (
        <div className="w-full bg-[#fed106]/5 relative overflow-hidden mt-0">
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[30vw] z-10">
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600" 
              alt="Alunos LATec" 
              className="w-full h-full object-cover"
            />
            <div className="absolute right-0 top-[110px] translate-x-1/2 z-30 w-30 h-30 flex items-center justify-center">
              <img
                src="/meclogo.png"
                alt="Símbolo Oficial MEC"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[#ffeea0] rounded-l-[120px] pointer-events-none z-0 opacity-60 hidden lg:block" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 py-5 md:py-7">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              <div className="lg:col-span-4 w-full flex items-center">
                <div className="block lg:hidden w-full h-[360px] relative rounded-2xl overflow-hidden shadow-md">
                  <div className="absolute top-4 left-4 bg-[#ffe600] text-gray-900 rounded-full w-16 h-16 flex flex-col items-center justify-center text-center p-1 shadow-md z-20">
                    <span className="text-[7px] font-bold uppercase leading-none">Nota MEC</span>
                    <span className="text-xl font-black leading-none">5</span>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600" 
                    alt="Alunos LATec" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="lg:col-span-7 text-left flex flex-col justify-center lg:pl-6">
                <h2 className="text-3xl md:text-[46px] font-black text-gray-900 tracking-tight leading-tight mb-4">
                  Cursos em <span className="text-[#fed106]">Destaque</span>
                </h2>
                
                <p className="text-sm md:text-base text-gray-700 font-semibold max-w-xl leading-relaxed mb-6">
                  Formações atualizadas e focadas no que o mercado de trabalho está exigindo.
                </p>

                <a href="/cursos" className="group inline-flex items-center gap-1.5 text-black font-extrabold text-sm no-underline hover:text-[#fed106] transition-colors mb-8 w-fit">
                  Ver todos os cursos
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>

                <div ref={cursosWrapperRef} className="relative w-full">
                  <button
                    type="button"
                    onClick={() => rolarCursosDestaque('esquerda')}
                    aria-label="Ver cursos anteriores"
                    className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 shrink-0 w-9 h-9 rounded-full bg-[#fed106] hover:bg-black text-white items-center justify-center shadow-md transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div
                    ref={cursosCarrosselRef}
                    style={{ width: larguraFaixaCursos ?? '100%' }}
                    className="flex flex-nowrap gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar pb-2"
                  >
                  {cursosDestaque.slice(0, MAX_CURSOS_DESTAQUE).map((curso) => (
                    <a
                      key={`curso-home-${curso.id}`}
                      href={`/cursos/${curso.id}`}
                      style={{ width: LARGURA_CARD_CURSO_DESTAQUE, height: ALTURA_CARD_CURSO_DESTAQUE }}
                      className="flex flex-col shrink-0 snap-start bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer border border-gray-100"
                    >
                      <div className="w-full h-[55%] shrink-0 overflow-hidden relative bg-gray-50">
                        <img
                          src={curso.fotoUrl}
                          alt={curso.titulo}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute top-2 left-2 bg-[#fed106] text-white font-black text-[8px] tracking-wider uppercase py-0.5 px-2 rounded-full">
                          {curso.categoria}
                        </span>
                      </div>

                      <div className="p-3 flex flex-col flex-1 min-h-0 text-left">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">
                          {curso.duracao}
                        </span>
                        <div className="flex items-end justify-between gap-2 flex-1 min-h-0">
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-gray-800 mb-1 group-hover:text-[#fed106] transition-colors duration-300 line-clamp-1">
                              {curso.titulo}
                            </h4>
                            <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-2">
                              {curso.resumo}
                            </p>
                          </div>
                          <span className="shrink-0 w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 group-hover:bg-[#fed106] group-hover:border-[#fed106] group-hover:text-white transition-all duration-300">
                            <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => rolarCursosDestaque('direita')}
                    aria-label="Ver mais cursos"
                    className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 shrink-0 w-9 h-9 rounded-full bg-[#fed106] hover:bg-black text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SEÇÃO: CURSOS MAIS VENDIDOS (100% DINÂMICA, DESIGN ORIGINAL DO BLOG) --- */}
<section className="relative py-16 md:py-24 bg-[#fffff] w-full overflow-hidden">
  <div className="absolute top-20 left-10 hidden lg:block opacity-30">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <pattern id="dots1" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="2" fill="#fed106" />
      </pattern>
      <rect width="40" height="40" fill="url(#dots1)" />
    </svg>
  </div>
  <div className="absolute top-20 right-10 hidden lg:block opacity-30">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <pattern id="dots2" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="2" fill="#fed106" />
      </pattern>
      <rect width="40" height="40" fill="url(#dots2)" />
    </svg>
  </div>

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <div className="text-center max-w-3xl mx-auto mb-12">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-yellow-100 rounded-full shadow-sm mb-6">
        <svg className="w-3.5 h-3.5 text-[#fed106]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="text-[10px] font-extrabold text-[#fed106] tracking-widest uppercase">
          Confira
        </span>
      </div>

      <h2 className="text-3xl md:text-5xl font-extrabold text-[#000000] mb-4 tracking-tight">
        Os 8 cursos <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#fed106] to-[#000000]">mais vendidos <br className="hidden md:block" /> na estude seguro.</span>
      </h2>
      <p className="text-gray-500 text-sm md:text-base font-medium">
        Confira os cursos mais procurados pelos nossos alunos.
      </p>
    </div>

    {(() => {
      if (cursosMaisVendidos.length === 0) {
        return (
          <p className="text-gray-400 text-sm py-12 text-center font-medium bg-white rounded-3xl border border-dashed border-slate-200">
            Nenhum curso marcado como mais vendido para exibir aqui. Vá ao painel Admin e marque até {MAX_CURSOS_MAIS_VENDIDOS} cursos!
          </p>
        );
      }

      const totalPaginas = Math.ceil(cursosMaisVendidos.length / CARDS_POR_PAGINA_MAIS_VENDIDOS);
      const inicio = paginaMaisVendidos * CARDS_POR_PAGINA_MAIS_VENDIDOS;
      const [principal, segundo, terceiro, quarto] = cursosMaisVendidos.slice(inicio, inicio + CARDS_POR_PAGINA_MAIS_VENDIDOS);

      return (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* CARD PRINCIPAL (grande, esquerda) */}
            {principal && (
              <a
                href={`/cursos/${principal.id}`}
                className="relative bg-black rounded-3xl overflow-hidden group min-h-[400px] lg:min-h-[500px] flex flex-col cursor-pointer shadow-lg"
              >
                <img
                  src={principal.fotoUrl}
                  alt={principal.titulo}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/60 to-transparent"></div>

                <div className="relative z-10 mt-auto p-6 md:p-8 flex flex-col">
                  <span className="bg-[#fed106] text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider mb-3 w-max">
                    {principal.categoria || "Curso"}
                  </span>
                  <h3 className="text-white text-2xl md:text-3xl font-bold mb-3 leading-snug">
                    {principal.titulo}
                  </h3>
                  <p className="text-gray-300 text-sm mb-6 max-w-md line-clamp-2">
                    {principal.resumo}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-300 text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {principal.duracao}
                      </span>
                      <span className="w-px h-3 bg-gray-500"></span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .672-3 1.5S10.343 11 12 11s3 .672 3 1.5-1.343 1.5-3 1.5m0-6c1.11 0 2.08.402 2.599 1M12 8V6.5m0 7.5v1.5m0-9C8.686 6 6 8.686 6 12s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z" /></svg>
                        R$ {principal.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#000000] text-white flex items-center justify-center transform group-hover:bg-[#fed106] group-hover:translate-x-1 transition-all">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </a>
            )}

            {/* COLUNA DA DIREITA: 2 cards médios + 1 card largo */}
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 flex-1">
                {[segundo, terceiro].map((item, idx) =>
                  item ? (
                    <a
                      key={item.id}
                      href={`/cursos/${item.id}`}
                      className="relative bg-black rounded-3xl overflow-hidden group min-h-[240px] flex flex-col cursor-pointer shadow-lg"
                    >
                      <img
                        src={item.fotoUrl}
                        alt={item.titulo}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/70 to-transparent"></div>
                      <div className="relative z-10 mt-auto p-5 flex flex-col">
                        <span className="bg-[#fed106] text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2.5 w-max">
                          {item.categoria || "Curso"}
                        </span>
                        <h3 className="text-white text-base md:text-lg font-bold mb-4 leading-snug">
                          {item.titulo}
                        </h3>
                        <div className="flex items-center gap-2.5 text-gray-300 text-[11px] font-medium">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {item.duracao}
                          </span>
                          <span className="w-px h-3 bg-gray-500"></span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .672-3 1.5S10.343 11 12 11s3 .672 3 1.5-1.343 1.5-3 1.5m0-6c1.11 0 2.08.402 2.599 1M12 8V6.5m0 7.5v1.5m0-9C8.686 6 6 8.686 6 12s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z" /></svg>
                            R$ {item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </a>
                  ) : (
                    <div key={`empty-${idx}`} className="hidden sm:block" />
                  )
                )}
              </div>

              {quarto && (
                <a
                  href={`/cursos/${quarto.id}`}
                  className="relative bg-black rounded-3xl overflow-hidden group min-h-[220px] flex flex-col cursor-pointer shadow-lg flex-1"
                >
                  <img
                    src={quarto.fotoUrl}
                    alt={quarto.titulo}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/70 to-transparent"></div>
                  <div className="relative z-10 mt-auto p-6 flex flex-col">
                    <span className="bg-[#fed106] text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 w-max">
                      {quarto.categoria || "Curso"}
                    </span>
                    <h3 className="text-white text-lg md:text-xl font-bold mb-4 leading-snug max-w-lg">
                      {quarto.titulo}
                    </h3>
                    <div className="flex items-center gap-3 text-gray-300 text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {quarto.duracao}
                      </span>
                      <span className="w-px h-3 bg-gray-500"></span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .672-3 1.5S10.343 11 12 11s3 .672 3 1.5-1.343 1.5-3 1.5m0-6c1.11 0 2.08.402 2.599 1M12 8V6.5m0 7.5v1.5m0-9C8.686 6 6 8.686 6 12s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z" /></svg>
                        R$ {quarto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </a>
              )}
            </div>
          </div>

          {totalPaginas > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setPaginaMaisVendidos((p) => Math.max(0, p - 1))}
                disabled={paginaMaisVendidos === 0}
                aria-label="Ver cursos anteriores"
                className="w-10 h-10 rounded-full bg-[#fed106] hover:bg-black text-white flex items-center justify-center shadow-md transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#fed106]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPaginas }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${idx === paginaMaisVendidos ? 'bg-[#fed106]' : 'bg-gray-200'}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setPaginaMaisVendidos((p) => Math.min(totalPaginas - 1, p + 1))}
                disabled={paginaMaisVendidos >= totalPaginas - 1}
                aria-label="Ver mais cursos"
                className="w-10 h-10 rounded-full bg-[#fed106] hover:bg-black text-white flex items-center justify-center shadow-md transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#fed106]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      );
    })()}

    <div className="mt-12 flex justify-center">
      <a
        href="/cursos"
        className="bg-[#fed106] hover:bg-[#000000] text-white font-extrabold text-sm py-4 px-8 rounded-full transition-colors flex items-center gap-2 shadow-md cursor-pointer"
      >
        Ver todos os cursos
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </div>
  </div>
</section>

      {/* --- SEÇÃO DEPOIMENTOS --- */}
      {depoimentos.length > 0 && (
        <div className="w-full bg-[#fed106]/5 relative overflow-hidden py-16 md:py-20 mt-12">
          <svg 
            className="absolute -right-60 -top-55 w-[700px] md:w-[1200px] h-[1200px] md:h-[1200px] text-[#ffeea0]/55 pointer-events-none z-0" 
            viewBox="0 0 1000 1000" 
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path 
              fill="currentColor" 
              d="M851 588.5Q711 677 641.5 794t-190 57.5Q331 792 182.5 731T48 505.5Q62 341 211 299t255-125.5Q572 90 661.5 190T871 395q120 105-20 193.5Z"
            />
          </svg>

          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-left mb-10 w-full">
              <h2 className="text-4xl md:text-[50px] font-black text-gray-900 tracking-tight leading-none mb-4">
                Depoimentos
              </h2>
              <p className="text-xs md:text-sm text-gray-700 font-medium whitespace-normal md:whitespace-nowrap">
                Descubra como a combinação de projetos reais, professores atuantes e uma plataforma completa mudou o jeito de aprender de quem já passou por aqui.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-1">
              {depoimentos.map((item) => {
                const estaReproduzindo = depoimentoReproduzindoId === item.id;
                const urlEmbed = obterUrlEmbedVideo(item.video_url);

                if (estaReproduzindo && urlEmbed) {
                  return (
                    <div
                      key={`depoimento-${item.id}`}
                      className="w-full h-[440px] rounded-3xl shadow-md relative overflow-hidden bg-black"
                    >
                      <iframe
                        src={urlEmbed}
                        className="w-full h-full"
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
                    key={`depoimento-${item.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDepoimentoReproduzindoId(item.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setDepoimentoReproduzindoId(item.id)}
                    style={{ backgroundImage: `url(${item.foto_url})` }}
                    className="w-full h-[440px] rounded-3xl bg-cover bg-center shadow-md relative overflow-hidden flex flex-col justify-between p-5 group cursor-pointer transform hover:-translate-y-1.5 transition-all duration-300 text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent z-10"></div>
                    <div></div>
                    <div className="relative z-20 flex justify-center items-center">
                      <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex justify-center items-center group-hover:scale-110 group-hover:bg-[#fed106] transition-all duration-300 shadow-lg">
                        <svg className="w-5 h-5 text-[#fed106] group-hover:text-white fill-current transform translate-x-0.5 transition-colors" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="relative z-20 text-left">
                      <h4 className="text-white text-base font-extrabold tracking-wide leading-tight">
                        {item.nome}
                      </h4>
                      {item.instagram && (
                        <p className="text-white/70 text-xs font-medium mt-0.5">
                          {item.instagram}
                        </p>
                      )}
                      {linkWhatsapp && (
                        <a
                          href={linkWhatsapp}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 inline-flex items-center gap-1.5 text-white hover:text-[#fed106] text-xs font-extrabold tracking-wide transition-colors"
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
              })}
            </div>

            <div className="flex justify-center mt-10">
              <Link
                to="/depoimentos"
                className="inline-flex items-center gap-2 bg-[#fed106] hover:bg-black text-white hover:text-white px-8 py-3.5 rounded-full font-black text-sm uppercase tracking-wider transition-all shadow-sm"
              >
                Ver mais
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* --- SEÇÃO: FORMULÁRIO DE CONTATO --- */}
      <section className="relative py-16 md:py-20 bg-black w-full overflow-hidden border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              Fale com a <span className="text-[#fed106]">Estude Seguro</span>
            </h2>
            <p className="text-gray-500 text-sm md:text-base font-medium">
              Preencha o formulário abaixo e nossa equipe entrará em contato com você.
            </p>
          </div>

          {contatoStatus === 'sucesso' && (
            <div className="w-full bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Mensagem enviada com sucesso! Em breve entraremos em contato.
            </div>
          )}

          {contatoStatus === 'erro' && (
            <div className="w-full bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Ocorreu um erro ao enviar sua mensagem. Tente novamente mais tarde.
            </div>
          )}

          <div className="w-full bg-[#F8F9FA] rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100 p-8 md:p-10">
            <form onSubmit={handleContatoSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={contatoForm.nome}
                    onChange={handleContatoChange}
                    placeholder="Seu nome completo"
                    required
                    disabled={contatoStatus === 'enviando'}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fed106]/10 focus:border-[#fed106] transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={contatoForm.email}
                    onChange={handleContatoChange}
                    placeholder="seu@email.com"
                    required
                    disabled={contatoStatus === 'enviando'}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fed106]/10 focus:border-[#fed106] transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    name="telefone"
                    value={contatoForm.telefone}
                    onChange={handleContatoChange}
                    placeholder="(00) 00000-0000"
                    disabled={contatoStatus === 'enviando'}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fed106]/10 focus:border-[#fed106] transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Curso Desejado
                  </label>
                  <input
                    type="text"
                    name="curso_desejado"
                    value={contatoForm.curso_desejado}
                    onChange={handleContatoChange}
                    placeholder="Ex: Técnico em Enfermagem"
                    disabled={contatoStatus === 'enviando'}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fed106]/10 focus:border-[#fed106] transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Mensagem <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="mensagem"
                  value={contatoForm.mensagem}
                  onChange={handleContatoChange}
                  placeholder="Como podemos te ajudar?"
                  required
                  rows="4"
                  disabled={contatoStatus === 'enviando'}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fed106]/10 focus:border-[#fed106] transition-all resize-none leading-relaxed disabled:opacity-50"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={contatoStatus === 'enviando'}
                className="w-full text-center bg-gradient-to-r from-[#fed106] to-[#ffeea0] text-black font-bold text-xs md:text-sm uppercase tracking-widest py-4.5 rounded-2xl transition-all duration-300 hover:opacity-95 shadow-md hover:shadow-lg active:scale-[0.99] mt-2 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {contatoStatus === 'enviando' ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  'Enviar Mensagem'
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
