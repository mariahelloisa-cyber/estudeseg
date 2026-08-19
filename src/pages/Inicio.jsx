import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LinhaDivisoriaEsteira from '../components/LinhaDivisoriaEsteira';
import RoundCarousel from '../components/RoundCarousel';
import CursoCardNovo from '../components/CursoCardNovo';
import { obterUrlEmbedVideo } from '../utils/video';
import { GRUPOS_HOME_CURSO, MAX_CURSOS_POR_GRUPO_HOME } from '../utils/gruposHomeCurso';


const SECAO_CURSOS_MAIS_VENDIDOS_ATIVA = false;
const SECAO_CURSOS_DESTAQUE_ATIVA = false;
const SECAO_ESTEIRA_FRASES_ATIVA = false;

function montarLinkWhatsapp(numero) {
  const apenasDigitos = (numero || '').replace(/\D/g, '');
  if (!apenasDigitos) return null;
  const comCodigoPais = apenasDigitos.startsWith('55') ? apenasDigitos : `55${apenasDigitos}`;
  return `https://wa.me/${comCodigoPais}`;
}

export default function Inicio() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';
  const navigate = useNavigate();

  // --- Busca de cursos (barra do hero mobile + barra acima de Diferenciais) ---
  const [buscaCursoMobile, setBuscaCursoMobile] = useState('');

  const handleBuscarCursoMobile = (e) => {
    e.preventDefault();
    const termo = buscaCursoMobile.trim();
    navigate(termo ? `/cursos?busca=${encodeURIComponent(termo)}` : '/cursos');
  };

  // --- Animação "Estude fácil/rápido/agora/seguro": só dispara ao entrar na tela ---
  const estudeSecaoRef = useRef(null);

  // --- Esteiras horizontais das categorias em "Quero fazer meu curso..." ---
  const esteirasGrupoHomeRef = useRef({});
  const rolarEsteiraGrupoHome = (chave, direcao) => {
    const elemento = esteirasGrupoHomeRef.current[chave];
    if (!elemento) return;
    const primeiroCard = elemento.firstElementChild;
    const gap = parseFloat(getComputedStyle(elemento).columnGap || '0') || 0;
    const distancia = primeiroCard ? primeiroCard.getBoundingClientRect().width + gap : elemento.clientWidth;
    elemento.scrollBy({ left: direcao * distancia, behavior: 'smooth' });
  };
  const [estudeAnimacaoAtiva, setEstudeAnimacaoAtiva] = useState(false);

  useEffect(() => {
    const elemento = estudeSecaoRef.current;
    if (!elemento) return;

    // Enquanto os dados do Supabase ainda não chegaram, as seções acima (banners,
    // selos, diferenciais) ficam vazias e a página fica bem mais curta — o que pode
    // colocar essa seção dentro da tela já no primeiro carregamento. Por isso só
    // disparamos a animação depois de ver o elemento FORA da tela pelo menos uma vez
    // (prova de que ele só entrou em vista por causa de um scroll de verdade).
    let jaFicouForaDaTela = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          jaFicouForaDaTela = true;
          return;
        }
        if (jaFicouForaDaTela) {
          setEstudeAnimacaoAtiva(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(elemento);
    return () => observer.disconnect();
  }, []);

  // --- Estado para os Banners Dinâmicos do Supabase ---
  const [banners, setBanners] = useState([]);
  const [indexAtual, setIndexAtual] = useState(0);
  
  // --- Estados para as restantes seções do Strapi ---
  const [listaSelos, setListaSelos] = useState([]);
  const [listaFrases, setListaFrases] = useState([]);
  const [tituloEsteira, setTituloEsteira] = useState("-EDITÁVEL ADMIN-");
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
  const [cursosPorGrupoHome, setCursosPorGrupoHome] = useState({});
  const [esteirasComTransbordo, setEsteirasComTransbordo] = useState({});
  const [bannerLateral, setBannerLateral] = useState(null);
  const [depoimentos, setDepoimentos] = useState([]);
  const [depoimentoReproduzindoId, setDepoimentoReproduzindoId] = useState(null);
  const [fotosCarrossel3d, setFotosCarrossel3d] = useState([]);

  // --- Detecta mobile para reduzir o tamanho do carrossel 3D (RoundCarousel usa px fixo) ---
  const [carrossel3dMobile, setCarrossel3dMobile] = useState(false);
  useEffect(() => {
    const verificarMobile = () => setCarrossel3dMobile(window.innerWidth < 640);
    verificarMobile();
    window.addEventListener('resize', verificarMobile);
    return () => window.removeEventListener('resize', verificarMobile);
  }, []);

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
      /* Esteira das frases: mesma lógica do marquee, só que mais lenta pra dar
         tempo de ler o texto grande enquanto ele rola e sai pela esquerda. */
      .animate-marquee-frases {
        animation: marquee 22s linear infinite;
        will-change: transform;
      }
      .hide-scrollbar {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      /* Seta do botão "Faça já sua matrícula": repete sozinha, sem parar, o mesmo
         vai-e-vem que ela faria ao passar e tirar o cursor (só que contínuo). */
      @keyframes setaVaiVem {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(4px); }
      }
      .animate-seta-vaivem {
        animation: setaVaiVem 1.1s ease-in-out infinite;
      }
      /* Botão "Faça já sua matrícula": pulsa aumentando e diminuindo levemente, sem parar. */
      @keyframes botaoPulsar {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      .animate-botao-pulsar {
        animation: botaoPulsar 1.8s ease-in-out infinite;
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

  // 2B. Buscar Frases da Esteira do SUPABASE
  async function buscarFrasesDoSupabase() {
    try {
      const { data, error } = await supabase
        .from('frases')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setListaFrases(data || []);
    } catch (err) {
      console.error("Erro na conexão com as frases do Supabase:", err);
    }
  }

  useEffect(() => {
    buscarFrasesDoSupabase();
  }, []);

  // 2C. Buscar Título da Esteira do SUPABASE
  async function buscarTituloEsteiraDoSupabase() {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'titulo_esteira')
        .maybeSingle();

      if (error) throw error;
      if (data?.valor) setTituloEsteira(data.valor);
    } catch (err) {
      console.error("Erro na conexão com o título da esteira do Supabase:", err);
    }
  }

  useEffect(() => {
    buscarTituloEsteiraDoSupabase();
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


  // Buscar Fotos do Carrossel 3D do SUPABASE
  async function buscarCarrossel3dDoSupabase() {
    try {
      const { data, error } = await supabase
        .from('carrossel_3d_fotos')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFotosCarrossel3d(data || []);
    } catch (err) {
      console.error("Erro na conexão com o carrossel 3D do Supabase:", err);
    }
  }

  useEffect(() => {
    buscarCarrossel3dDoSupabase();
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
          fotoUrl: item.imagem_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
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

  // Busca os cursos marcados (no admin) para cada grupo da seção "Quero terminar meus estudos
  // em EAD... / técnico EAD... / técnico por competência EAD...". Um único SELECT traz todos
  // os cursos com grupo definido; a separação por coluna acontece no cliente.
  useEffect(() => {
    async function buscarCursosPorGrupoHome() {
      try {
        const { data, error } = await supabase
          .from('cursos_cadastrados')
          .select('*, categorias_cursos(nome)')
          .not('grupo_home', 'is', null)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const agrupados = {};
        for (const grupo of GRUPOS_HOME_CURSO) {
          const titulosJaVistos = new Set();
          agrupados[grupo.chave] = (data || [])
            .filter((item) => item.grupo_home === grupo.chave)
            // Alguns cursos foram cadastrados duas vezes com o mesmo título (ex.: EJA);
            // como já vem ordenado por created_at desc, mantém só o mais recente de cada.
            .filter((item) => {
              const chaveTitulo = (item.titulo || '').trim().toLowerCase();
              if (titulosJaVistos.has(chaveTitulo)) return false;
              titulosJaVistos.add(chaveTitulo);
              return true;
            })
            .slice(0, MAX_CURSOS_POR_GRUPO_HOME)
            .map((item) => ({
              id: item.id,
              titulo: item.titulo || "Curso sem Título",
              descricao: item.descricao || "",
              categoria: (item.categorias_cursos?.nome || "Curso").toUpperCase(),
              duracao: item.duracao || "Curta Duração",
              carga_horaria: item.carga_horaria || "",
              modalidade: item.modalidade || "EAD",
              selo_mec: item.selo_mec || false,
              preco: item.preco || 0,
              imagem_url: item.imagem_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
            }));
        }
        setCursosPorGrupoHome(agrupados);
      } catch (err) {
        console.error("Erro ao buscar cursos da seção 'Quero...' da Home:", err);
      }
    }

    buscarCursosPorGrupoHome();
  }, []);

  // Só mostra as setas de navegação das esteiras quando os cards realmente não cabem
  // todos na tela de uma vez (ex.: um grupo com só 3 cursos pode caber inteiro, sem rolar).
  useEffect(() => {
    function medirTransbordos() {
      const resultado = {};
      for (const [chave, elemento] of Object.entries(esteirasGrupoHomeRef.current)) {
        if (elemento) resultado[chave] = elemento.scrollWidth > elemento.clientWidth + 1;
      }
      setEsteirasComTransbordo(resultado);
    }

    medirTransbordos();
    window.addEventListener('resize', medirTransbordos);
    return () => window.removeEventListener('resize', medirTransbordos);
  }, [cursosPorGrupoHome]);

  // --- RENDERIZAÇÃO NORMAL DO SITE PÚBLICO (COM TODOS OS COMPONENTES INTACTOS) ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      <Navbar />
      
      {/* --- SEÇÃO 1: BANNER ROTATIVO (AGORA INTEGRADO AO SUPABASE) --- */}
      {banners.length > 0 && (
        <div className="w-full bg-white relative group">
          <div className="w-full pb-2">
            <div className="w-full relative overflow-hidden rounded-b-2xl md:rounded-b-3xl shadow-sm h-[230px] sm:h-[360px] md:h-[480px]">
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

          {/* --- FAIXA DE CONFIANÇA: flutua sobre a borda inferior do banner --- */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-10 pb-6 sm:pb-3">
            <div className="bg-white rounded-3xl sm:rounded-full shadow-xl px-6 sm:px-10 py-5 sm:py-6 flex flex-col sm:flex-row items-stretch sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              <div className="flex items-center gap-3 sm:flex-1 py-3 sm:py-0 first:pt-0 sm:px-4 sm:first:pl-0">
                <span className="w-10 h-10 rounded-full bg-[#fff4cc] text-[#c99a00] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="text-sm text-gray-700 font-semibold leading-snug">Certificado reconhecido pelo MEC</span>
              </div>
              <div className="flex items-center gap-3 sm:flex-1 py-3 sm:py-0 sm:px-4">
                <span className="w-10 h-10 rounded-full bg-[#fff4cc] text-[#c99a00] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-8 2.239-8 5v1h11" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 19l2 2 4-4" />
                  </svg>
                </span>
                <span className="text-sm text-gray-700 font-semibold leading-snug">Consultores educacionais especializados</span>
              </div>
              <div className="flex items-center gap-3 sm:flex-1 py-3 sm:py-0 sm:px-4 sm:last:pr-0">
                <span className="w-10 h-10 rounded-full bg-[#fff4cc] text-[#c99a00] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8M21 7v6M21 7h-6" />
                  </svg>
                </span>
                <span className="text-sm text-gray-700 font-semibold leading-snug">Mais oportunidades no mercado de trabalho</span>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* --- SEÇÃO 3: ESTEIRA DE FRASES --- */}
      {SECAO_ESTEIRA_FRASES_ATIVA && listaFrases.length > 0 && (
        <div className="w-full bg-white mt-2 pb-4 border-b border-gray-100 shadow-inner">
          <div className="w-full bg-[#000000] py-4 mb-2 flex justify-center items-center shadow-md">
            <h2 className="text-white text-base md:text-xl font-black uppercase tracking-[0.2em] text-center px-4">
              {tituloEsteira}
            </h2>
          </div>
          <div className="relative w-full overflow-hidden bg-white py-2">
            <div className={`flex items-center w-max ${listaFrases.length > 1 ? 'animate-marquee-frases' : 'mx-auto'}`}>
              {listaFrases.map((frase, i) => (
                <div key={`frase-${i}`} className="flex-shrink-0 px-125 flex items-center justify-center h-[60px] md:h-[86px] min-w-[420px] md:min-w-[620px]">
                  <span className="text-red-600 font-black text-2xl md:text-4xl uppercase tracking-wide text-center leading-[1.05] w-[380px] md:w-[560px] line-clamp-2">{frase.texto}</span>
                </div>
              ))}
              {listaFrases.length > 1 && listaFrases.map((frase, i) => (
                <div key={`frase-dup-${i}`} className="flex-shrink-0 px-125 flex items-center justify-center h-[53px] md:h-[79px] min-w-[420px] md:min-w-[620px]">
                  <span className="text-red-600 font-black text-2xl md:text-4xl uppercase tracking-wide text-center leading-[1.05] w-[380px] md:w-[560px] line-clamp-2">{frase.texto}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SEÇÃO 3B: ESTEIRA DE SELOS (DUPLICATA) — desativada, descomente para reativar ---
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
                <div key={`selo-b-${i}`} className="flex-shrink-0 px-8 flex items-center justify-center" style={{ minWidth: '270px' }}>
                  <img src={selo.imagem_url} alt={selo.nome} className="h-14 md:h-20 w-auto object-contain transition-transform hover:scale-105 duration-400" />
                </div>
              ))}
              {listaSelos.map((selo, i) => (
                <div key={`selo-b-dup-${i}`} className="flex-shrink-0 px-8 flex items-center justify-center" style={{ minWidth: '270px' }}>
                  <img src={selo.imagem_url} alt={selo.nome} className="h-14 md:h-20 w-auto object-contain transition-transform hover:scale-105 duration-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      --- */}

      {/* --- CTA: BOTÃO DE MATRÍCULA (acima da seção de Diferenciais) --- */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex justify-center">
        <a
          href={`https://wa.me/5511995987197?text=${encodeURIComponent('Olá! Vim pelo site e gostaria de fazer minha matrícula.')}`}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-2.5 bg-[#000000] hover:bg-[#fed106] text-white font-black text-sm uppercase tracking-wider px-8 py-4 rounded-full shadow-md shadow-[#fed106]/20 transition-all active:scale-[0.98] animate-botao-pulsar"
        >
          Faça já sua matrícula
          <svg className="w-4 h-4 animate-seta-vaivem" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>

      {/* --- SEÇÃO 3.5: "ESTUDE FÁCIL / RÁPIDO / AGORA / SEGURO" --- */}
      <div ref={estudeSecaoRef} className="w-full bg-gray-50 pt-8 pb-4 md:pt-6 md:pb-2 flex items-center justify-center overflow-hidden">
        <div className="flex items-center gap-4 md:gap-7 text-5xl sm:text-7xl md:text-8xl font-medium tracking-tight">
          <span className="text-black font-black">Estude</span>
          <div className="relative h-20 sm:h-32 md:h-36 overflow-hidden pr-2">
            <div className={`flex flex-col ${estudeAnimacaoAtiva ? 'animate-word-cycle' : ''}`}>
              <span className="h-20 sm:h-32 md:h-36 overflow-hidden flex items-center justify-center pr-3 pb-3 leading-none text-[#ffeea0] sombra-3d-texto">Fácil</span>
              <span className="h-20 sm:h-32 md:h-36 overflow-hidden flex items-center justify-center pr-3 pb-3 leading-none text-[#ffeea0] sombra-3d-texto">Rápido</span>
              <span className="h-20 sm:h-32 md:h-36 overflow-hidden flex items-center justify-center pr-3 pb-3 leading-none text-[#ffeea0] sombra-3d-texto">Agora</span>
              <span className="h-20 sm:h-32 md:h-36 overflow-hidden flex items-center justify-center pr-3 pb-3 leading-none text-[#fed106] sombra-3d-texto">Seguro</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- SEÇÃO: BUSCA DE CURSOS (acima de Diferenciais) --- */}
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-6">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Encontre o curso ideal para você</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Pesquise por nome, área ou palavra-chave</p>
        </div>
        <form
          onSubmit={handleBuscarCursoMobile}
          className="relative w-full bg-white rounded-full shadow-lg border border-gray-100 p-1.5 flex items-center"
        >
          <span className="pl-4 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={buscaCursoMobile}
            onChange={(e) => setBuscaCursoMobile(e.target.value)}
            placeholder="Pesquisar curso por nome, área ou palavra-chave..."
            className="w-full pl-3 pr-2 py-3 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none font-medium"
          />
          <button
            type="submit"
            className="bg-[#000000] hover:bg-[#fed106] text-white font-bold text-sm px-6 py-3 rounded-full transition-all shrink-0"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* --- SEÇÃO 5: CURSOS EM DESTAQUE — desativada, troque SECAO_CURSOS_DESTAQUE_ATIVA
      pra `true` no topo do arquivo pra reativar --- */}
      {SECAO_CURSOS_DESTAQUE_ATIVA && cursosDestaque.length > 0 && (
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

      {/* --- SEÇÃO: CURSOS MAIS VENDIDOS (100% DINÂMICA, DESIGN ORIGINAL DO BLOG) —
      desativada, troque SECAO_CURSOS_MAIS_VENDIDOS_ATIVA pra `true` no topo do arquivo pra reativar --- */}
      {SECAO_CURSOS_MAIS_VENDIDOS_ATIVA && (
<section className="relative py-16 md:py-15 bg-[#fffff] w-full overflow-hidden">
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
      )}

<br></br>      
      {/* --- SEÇÃO: "QUERO..." (uma esteira horizontal por grupo, empilhadas) --- */}
      <section className="relative pt-6 pb-6 md:pt-10 md:pb-20 bg-white w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10 md:gap-12">
            {GRUPOS_HOME_CURSO.map((grupo) => {
              const cursosDoGrupo = cursosPorGrupoHome[grupo.chave] || [];

              return (
                <div key={grupo.chave} className="flex flex-col">
                  <div className="flex items-end justify-between gap-4 mb-5">
                    <h3 className="text-2xl md:text-4xl font-extrabold text-[#000000] tracking-tight">
                      {grupo.linhas.map((linha, idx) => {
                        const indiceDestaque = linha.indexOf(grupo.trechoDestaque);
                        const antes = indiceDestaque >= 0 ? linha.slice(0, indiceDestaque) : linha;
                        const depois = indiceDestaque >= 0 ? linha.slice(indiceDestaque + grupo.trechoDestaque.length) : '';

                        return (
                          <span key={idx} className="block">
                            {antes}
                            {indiceDestaque >= 0 && (
                              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#fed106] to-[#000000]">{grupo.trechoDestaque}</span>
                            )}
                            {depois}
                          </span>
                        );
                      })}
                    </h3>
                    <a href="/cursos" className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-black transition-colors shrink-0">
                      Ver todos
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>

                  {cursosDoGrupo.length === 0 ? (
                    <p className="text-gray-400 text-xs py-8 text-center font-medium bg-gray-50 rounded-2xl border border-dashed border-slate-200">
                      Nenhum curso marcado para este grupo ainda.
                    </p>
                  ) : (
                    <div className="relative">
                      <div
                        ref={(el) => { esteirasGrupoHomeRef.current[grupo.chave] = el; }}
                        className="flex gap-3 md:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 sem-scrollbar"
                      >
                        {cursosDoGrupo.map((curso) => (
                          <div key={curso.id} className="w-[80%] sm:w-[300px] shrink-0 snap-start">
                            <CursoCardNovo curso={curso} />
                          </div>
                        ))}
                      </div>

                      {esteirasComTransbordo[grupo.chave] && (
                        <>
                          <button
                            type="button"
                            onClick={() => rolarEsteiraGrupoHome(grupo.chave, -1)}
                            aria-label={`Ver ${grupo.rotulo} anterior`}
                            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white hover:bg-[#fed106] text-black items-center justify-center shadow-md border border-gray-100 transition-all cursor-pointer z-10"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => rolarEsteiraGrupoHome(grupo.chave, 1)}
                            aria-label={`Ver ${grupo.rotulo} seguinte`}
                            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white hover:bg-[#fed106] text-black items-center justify-center shadow-md border border-gray-100 transition-all cursor-pointer z-10"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 md:mt-12 flex justify-center">
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

 {/* --- SEÇÃO 4: DIFERENCIAIS --- */}
{listaDiferenciais.length > 0 && (
  <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-16 pb-16">
    <div className="text-center md:text-left mb-3 md:mb-8 pl-2">
      <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Nossos Diferenciais</h2>
      <p className="text-sm md:text-base text-gray-500 mt-2 font-medium">Por que escolher a Estude Seguro para impulsionar o seu futuro profissional?</p>
    </div>
    <div className="w-full flex flex-col items-center">
      <div className="w-full min-h-[460px] flex items-center justify-center relative overflow-x-hidden overflow-y-visible px-2 pt-3 pb-10 md:py-10 gap-3 md:gap-6">
        {[0, 1, 2, 3, 4].map((posicaoFisica) => {
          const itemData = obterDadoDoCard(posicaoFisica);
          if (!itemData) return null;
          let estiloDestaque = posicaoFisica === 2 ? "scale-110 md:scale-115 opacity-100 z-30 shadow-2xl ring-4 ring-[#fed106]/100" : (posicaoFisica === 1 || posicaoFisica === 3 ? "opacity-40 scale-95 z-20 shadow-md" : "opacity-10 scale-85 z-10 hidden sm:flex");

          const urlImagem = itemData.fotoUrl || itemData.imagem_url || itemData.foto_url;

          return (
            <div
              key={`card-fisico-${posicaoFisica}`}
              style={{ backgroundImage: `url('${urlImagem}')` }}
              className={`w-[22%] min-w-[220px] md:min-w-[300px] h-[360px] rounded-2xl relative bg-cover bg-center transition-all duration-500 ease-in-out transform flex flex-col justify-end p-6 overflow-hidden ${estiloDestaque}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
              <div className="relative z-20 text-left pl-1 pr-2 pb-1">
                <h4 className="text-white text-base md:text-lg font-extrabold tracking-wide leading-snug uppercase">{itemData.titulo}</h4>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={irParaEsquerda}
          aria-label="Ver diferencial anterior"
          className="w-10 h-10 rounded-full bg-[#fed106] hover:bg-black text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          {listaDiferenciais.map((_, idx) => (
            <span key={idx} className={`w-2 h-2 rounded-full transition-colors ${idx === indiceAtivo ? 'bg-[#fed106]' : 'bg-gray-200'}`} />
          ))}
        </div>

        <button
          type="button"
          onClick={irParaDireita}
          aria-label="Ver próximo diferencial"
          className="w-10 h-10 rounded-full bg-[#fed106] hover:bg-black text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
)}
      
      <LinhaDivisoriaEsteira />

            {/* --- SEÇÃO: CARROSSEL 3D DE FOTOS --- */}
      <section className="w-full bg-white pt-6 md:pt-8 pb-4 md:pb-6">
        <div className="max-w-3xl mx-auto px-4 text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">
            Faça igual a eles, e se junte a <span className="text-[#fed106]">ESTUDE SEGURO</span>
          </h2>
        </div>
        <div className="w-full h-[220px] sm:h-[320px] md:h-[420px]">
          <RoundCarousel
            background="#ffffff"
            imageWidth={carrossel3dMobile ? 190 : 300}
            imageHeight={carrossel3dMobile ? 190 : 300}
            images={fotosCarrossel3d.length > 0 ? fotosCarrossel3d.map((f) => ({ src: f.imagem_url })) : undefined}
          />
        </div>
      </section>


      <LinhaDivisoriaEsteira />

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
