import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClockIcon, BoltIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { listaCursosGiga } from './cursosData';
import imagemFundo from '../assets/imghero.png';
import { useCartStore } from '../store/cartStore';
import { supabase } from '../supabaseClient';
import CarrinhoSidebar from '../components/CarrinhoSidebar';// <-- ADICIONE ESTA LINHA AQUI

// --- Card de curso cadastrado pelo admin (Supabase) ---
function CursoCardNovo({ curso }) {
  return (
    <Link
      to={`/cursos/${curso.id}`}
      className="flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 group"
    >
      <div className="relative w-full h-44 overflow-hidden bg-gray-100">
        <img src={curso.imagem_url} alt={curso.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {curso.selo_mec && (
          <span className="absolute top-3 left-3 bg-white text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
            <svg className="w-3 h-3 text-[#fed106]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 1l2.39 4.84L18 6.91l-4 3.9.94 5.49L10 13.77l-4.94 2.53L6 10.81l-4-3.9 5.61-1.07L10 1z" />
            </svg>
            MEC
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h4 className="text-base font-black text-gray-900 mb-2 leading-snug uppercase">{curso.titulo}</h4>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">{curso.descricao}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-gray-500 font-semibold mb-5 pt-4 border-t border-gray-100 mt-auto">
          <span className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#fff4cc] text-[#c99a00] shrink-0"><ClockIcon className="w-3 h-3" /></span>
            {curso.duracao || '-'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ede9fe] text-[#7c3aed] shrink-0"><BoltIcon className="w-3 h-3" /></span>
            {curso.carga_horaria || '-'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-600 shrink-0"><BookOpenIcon className="w-3 h-3" /></span>
            {curso.modalidade}
          </span>
        </div>
        <span className="w-full text-center bg-gradient-to-r from-[#fed106] to-[#ffeea0] hover:opacity-90 text-black font-black text-xs uppercase tracking-wider py-3.5 rounded-full transition-opacity shadow-sm">
          Ver Detalhes
        </span>
      </div>
    </Link>
  );
}

export default function ListaCursos() {
  const [pesquisa, setPesquisa] = useState(
    () => new URLSearchParams(window.location.search).get('busca') || ''
  );
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todas');
  const adicionarAoCarrinho = useCartStore((state) => state.adicionarAoCarrinho);
  const carrinho = useCartStore((state) => state.carrinho);
  const setCarrinhoAberto = useCartStore((state) => state.setCarrinhoAberto);

  // --- Cursos cadastrados pelo admin (Supabase), exibidos em cards, acima da lista antiga ---
  const [cursosCadastrados, setCursosCadastrados] = useState([]);
  const [categoriasCadastradas, setCategoriasCadastradas] = useState([]);

  useEffect(() => {
    async function buscarCursosCadastrados() {
      try {
        const [{ data: cursos, error: erroCursos }, { data: categorias, error: erroCategorias }] = await Promise.all([
          supabase.from('cursos_cadastrados').select('*, categorias_cursos(nome)').order('created_at', { ascending: false }),
          supabase.from('categorias_cursos').select('*').order('nome', { ascending: true }),
        ]);

        if (erroCursos) throw erroCursos;
        if (erroCategorias) throw erroCategorias;

        setCursosCadastrados(cursos || []);
        setCategoriasCadastradas(categorias || []);
      } catch (err) {
        console.error('Erro ao buscar cursos cadastrados pelo admin:', err);
      }
    }
    buscarCursosCadastrados();
  }, []);

  const cursosCadastradosFiltrados = cursosCadastrados.filter((curso) => {
    const combinaTexto = (curso.titulo || '').toLowerCase().includes(pesquisa.toLowerCase());
    const combinaCategoria = categoriaSelecionada === 'Todas' ||
      (curso.categorias_cursos?.nome || 'Geral') === categoriaSelecionada;
    return combinaTexto && combinaCategoria;
  });

  // Proteção contra dados vazios
  const dadosCursos = Array.isArray(listaCursosGiga) ? listaCursosGiga : [];

  // Categorias fixas ajustadas para bater com as chaves exatas do seu map
  const categoriasFiltro = [
    'Todas', 
    'Profissionalizantes premium', 
    'Profissionalizantes comuns', 
    'Profissionalizantes avançados'
  ];

  // Helper para renderizar os ícones idênticos aos da imagem nas abas de categorias
  const getCategoriaIcon = (cat) => {
    switch(cat.toLowerCase()) {
      case 'todas':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/>
          </svg>
        );
      case 'profissionalizantes premium':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.243.577 1.835l-3.97 2.88a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.88a1 1 0 00-1.176 0l-3.97 2.88c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.88c-.783-.57-.384-1.835.577-1.835h4.906a1 1 0 00.95-.69l1.519-4.674z" />
          </svg>
        );
      case 'profissionalizantes comuns':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'profissionalizantes avançados':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5.586a1 1 0 01.707.293l6.414 6.414a1 1 0 010 1.414l-6.586 6.586a1 1 0 01-1.414 0L4.293 11.293A1 1 0 014 10.586V5a2 2 0 012-2z" />
          </svg>
        );
    }
  };

  // Uma única lista de categorias: as fixas do catálogo antigo + as cadastradas pelo admin
  const categoriasFiltroUnificadas = [
    ...categoriasFiltro,
    ...categoriasCadastradas
      .map((cat) => cat.nome)
      .filter((nome) => !categoriasFiltro.includes(nome)),
  ];

  // Uma categoria "nova" é a que só existe entre os cursos cadastrados pelo admin (não no catálogo antigo)
  const categoriaEhNova = categoriaSelecionada !== 'Todas' && !categoriasFiltro.includes(categoriaSelecionada);

  // Filtro de Busca e Categoria
  const cursosFiltrados = dadosCursos.filter((curso) => {
    if (!curso) return false;
    const nomeCurso = curso.nome || curso.titulo || "";
    const categoriaCurso = curso.categoriaNome || "";

    const combinaTexto = nomeCurso.toLowerCase().includes(pesquisa.toLowerCase());
    const combinaCategoria = categoriaSelecionada === 'Todas' || 
                             categoriaCurso.toLowerCase() === categoriaSelecionada.toLowerCase();

    return combinaTexto && combinaCategoria;
  });

  return (
    <div className="w-full min-h-screen bg-[#fafafa] text-gray-900 antialiased pb-20 flex flex-col">
      <Navbar />

      {/* 1. HERO SECTION CORRIGIDA (Preenchimento total da tela sem cortes nem espaços brancos) */}
      <div 
        className="relative w-full bg-cover bg-center py-14 md:py-24 border-b border-gray-100 flex items-center min-h-[420px] md:min-h-[480px]" 
        style={{ backgroundImage: `url(${imagemFundo})` }}
      >
        <div className="max-w-6xl w-full mx-auto px-6 relative z-10">
          
          {/* Caixa de Conteúdo restrita à metade da tela (md:max-w-xl) para nunca sobrepor a imagem da direita */}
          <div className="w-full max-w-md md:max-w-xl flex flex-col items-start text-left">
            
            {/* Tag: Catálogo de Cursos */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white shadow-sm border border-gray-100 rounded-xl mb-4">
              <svg className="w-3.5 h-3.5 text-[#000000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-[10px] font-extrabold text-[#000000] tracking-wider uppercase">
                Catálogo de Cursos
              </span>
            </div>

            {/* Título Principal */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#fed106] mb-4 tracking-tight">
              Nossos <span className="text-[#fed106]">Cursos</span>
            </h1>

            {/* Descrição */}
            <p className="text-gray-500 text-sm md:text-base font-medium max-w-md mb-4 leading-relaxed">
              Explore nosso catálogo completo e encontre o curso ideal para <span className="text-[#000000] font-bold">transformar sua carreira.</span>
            </p>

            {/* Info Selo MEC */}
            <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm font-medium mb-8">
              <svg className="w-4 h-4 text-[#000000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Todos os cursos são <span className="text-[#000000] font-bold">reconhecidos pelo MEC.</span></span>
            </div>

            {/* Barra de Pesquisa */}
            <div className="relative w-full bg-white rounded-full shadow-lg border border-gray-100 p-1 flex items-center">
              <span className="pl-4 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Pesquisar curso por nome, área ou palavra-chave..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="w-full pl-2 pr-4 py-3 bg-transparent text-xs md:text-sm text-gray-700 placeholder-gray-400 focus:outline-none font-medium"
              />
              <button className="bg-[#000000] hover:bg-[#fed106] text-white p-2.5 md:p-3 rounded-full transition-all flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 2. FILTROS E CONTEÚDO */}
      <div className="max-w-6xl w-full mx-auto px-6 mt-10">
        
        {/* Abas de Categorias (catálogo antigo + categorias cadastradas pelo admin, juntas) */}
        <div className="flex flex-wrap gap-3 mb-8 justify-start">
          {categoriasFiltroUnificadas.map((cat) => {
            const isSelected = categoriaSelecionada.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={`btn-filtro-${cat}`}
                onClick={() => setCategoriaSelecionada(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 border flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#fed106] text-white border-[#fed106] shadow-sm'
                    : 'bg-white text-[#000000]/80 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {getCategoriaIcon(cat)}
                <span className="capitalize">{cat}</span>
              </button>
            );
          })}
        </div>

        {/* CURSOS CADASTRADOS PELO ADMIN (EM CARDS), sempre acima da lista quando aparecem */}
        {cursosCadastradosFiltrados.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {cursosCadastradosFiltrados.map((curso) => (
              <CursoCardNovo key={`curso-cadastrado-${curso.id}`} curso={curso} />
            ))}
          </div>
        )}

        {/* Quando a categoria escolhida é exclusiva dos cursos cadastrados, não mostra a lista antiga */}
        {!categoriaEhNova && (
          <>
        {/* Quantidade Encontrada */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold mb-4 uppercase tracking-wider">
          <svg className="w-3.5 h-3.5 text-[#000000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="text-[#000000] font-extrabold">{cursosFiltrados.length}</span> cursos encontrados
        </div>

        {/* 3. LISTAGEM DE CURSOS */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          
          {/* Header da tabela com o Degradê Triplo perfeito (Rosa -> Roxo -> Azul) */}
          <div className="bg-gradient-to-r from-[#fed106] via-[#ffe365] to-[#ffeea0] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <h2 className="font-extrabold text-xs tracking-wider uppercase">
                TODOS OS CURSOS
              </h2>
            </div>
            <div className="bg-white/70 px-4 py-1 rounded-full backdrop-blur-sm">
              <span className="text-black text-xs font-bold">{cursosFiltrados.length} cursos</span>
            </div>
          </div>

          {/* Listagem com Scroll Interno */}
          <div className="flex flex-col max-h-[750px] overflow-y-auto bg-white">
            {cursosFiltrados.length === 0 ? (
              <div className="p-12 text-center text-sm font-bold text-gray-400">
                Nenhum curso corresponde à sua busca.
              </div>
            ) : (
              cursosFiltrados.map((curso, index) => {
                const nomeItem = curso.nome || curso.titulo || "Curso sem nome";
                const precoItem = curso.preco || 0;
                const horasItem = curso.horas || curso.duracao || "N/A";
                
                // Exibe o ID do curso vindo do banco ou gera uma numeração sequencial
                const numeroFormatado = curso.id || String(index + 1).padStart(2, '0');

                return (
                  <div
                    key={`linha-curso-${curso.id ?? 'sem-id'}-${index}`}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 px-6 border-b border-gray-100 hover:bg-gray-50/50 transition-colors gap-4 md:gap-0"
                  >
                    {/* Numeração em Destaque Rosa + Título Escuro */}
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-[#fed106] font-extrabold text-sm w-10 text-center shrink-0">
                        {numeroFormatado}
                      </span>
                      <h3 className="text-xs md:text-sm font-extrabold text-[#000000] uppercase tracking-wide leading-tight">
                        {nomeItem}
                      </h3>
                    </div>

                    {/* Lado Direito: Horas, Preço e Ação */}
                    <div className="flex items-center justify-between w-full md:w-auto md:gap-8 ml-0 md:ml-6 shrink-0">
                      
                      {/* Badge das Horas (Roxo claro) */}
                      <span className="text-[#000000] font-bold text-[10px] bg-[#fed106] px-2.5 py-1 rounded whitespace-nowrap">
                        {typeof horasItem === 'number' ? `${horasItem}H` : String(horasItem).toUpperCase()}
                      </span>

                      {/* Preço em Azul Escuro */}
                      <span className="text-[#000000] font-extrabold text-sm md:text-base whitespace-nowrap min-w-[90px] text-right">
                        R$ {precoItem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>

                      {/* Botão de Compra Retangular Rosa */}
                       <button
  onClick={() => adicionarAoCarrinho({
                    id: curso.id,
                    titulo: nomeItem,
                    preco: precoItem,
                    horas: horasItem
                  })}
                  className="bg-[#fed106] hover:bg-[#000000] text-white px-4 py-2 rounded font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-sm active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">
                    COMPRAR
                  </span>
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
          </>
        )}

      </div>
    </div>
  );
}