import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import logo from '../assets/logo-estud.png';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');

  useEffect(() => {
    async function buscarPosts() {
      try {
        // Busca direta da tabela 'noticias' no Supabase
        const { data, error } = await supabase
          .from('noticias')
          .select('*')
          .order('created_at', { ascending: false }); 
        
        if (error) throw error;

        if (data && data.length > 0) {
          const postsFormatados = data.map(item => ({
            id: item.id,
            titulo: item.titulo || "Título do Post",
            resumo: item.resumo || "Breve resumo do artigo...",
            // Como agora as notícias são geridas no Supabase, mapeamos diretamente as colunas:
            conteudo: item.resumo || "", 
            data: new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            categoria: "NOTÍCIAS",
            fotoUrl: item.imagem_url
          }));
          
          setPosts(postsFormatados);
        }
      } catch (erro) {
        console.error("Erro ao buscar posts no Supabase:", erro);
      } finally {
        setCarregando(false);
      }
    }

    buscarPosts();
  }, []);

  const postsFiltrados = posts.filter(post => 
    post.titulo.toLowerCase().includes(pesquisa.toLowerCase()) || 
    post.resumo.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const postDestaque = postsFiltrados.length > 0 ? postsFiltrados[0] : null;
  const postsRestantes = postsFiltrados.length > 1 ? postsFiltrados.slice(1) : [];

  return (
    <div className="w-full min-h-screen bg-[#FDFDFD] text-gray-900 font-sans antialiased overflow-x-hidden">
      <Navbar />

      {/* BANNER PRINCIPAL (Idêntico à foto ChatGPT Image 23 de jun. de 2026, 10_58_04.png) */}
      <header className="relative w-full bg-gradient-to-r from-yellow-50/40 via-white to-transparent pt-8 pb-16 lg:pb-4 border-b border-gray-100">
        
        {/* Detalhes abstratos de fundo (Pontos rosas à esquerda) */}
        <div className="absolute top-20 left-4 pointer-events-none opacity-40 hidden lg:block">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#fed106]"></div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* LADO ESQUERDO: Textos e Input */}
          <div className="lg:col-span-6 z-10 flex flex-col justify-center">
            {/* Breadcrumb */}
            <div className="text-gray-500 text-xs font-semibold mb-6 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <Link to="/" className="hover:text-gray-800 transition-colors">Inicial</Link> 
              <span className="text-gray-300">•</span> 
              <span className="text-gray-700 font-bold">Blog Estude Seguro</span>
            </div>

            <span className="text-[#000000] font-extrabold text-sm mb-2 block tracking-tight">
              Blog Estude Seguro
            </span>

            <h1 className="text-3xl md:text-[44px] font-black text-[#fed106] tracking-tight leading-[1.15] mb-4">
              Conteúdos para <br />
              <span className="text-[#000000]">impulsionar</span> sua carreira.
            </h1>

            <p className="text-gray-500 font-medium text-sm md:text-[15px] max-w-md leading-relaxed mb-8">
              Aqui você encontra informações, dicas e tendências sobre educação técnica, mercado de trabalho e muito mais.
            </p>

            {/* Barra de Pesquisa Estilizada */}
            <div className="relative w-full max-w-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full">
              <input
                type="text"
                placeholder="Buscar artigos, temas ou palavras-chave..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="w-full bg-white text-gray-700 text-sm pl-12 pr-14 py-4 rounded-full border border-gray-100 outline-none focus:border-gray-200 focus:ring-2 focus:ring-[#fed106]/10 transition-all font-medium placeholder-gray-400"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-[18px] pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <button className="absolute right-2 top-2 bg-[#fed106] hover:bg-[#000000] text-white w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-md shadow-[#fed106]/20">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* LADO DIREITO: Grafismo e Foto da Estudante */}
          <div className="lg:col-span-6 relative flex justify-end items-center h-full min-h-[320px] lg:min-h-[420px]">
  
  {/* Onda de Trás  */}
  <div className="absolute right-[-5%] top-[-10%] w-[105%] h-[120%] bg-gradient-to-br from-[#fed106] via-[##ffeea0] to-transparent rounded-[40%_60%_30%_70%/50%_40%_60%_50%] opacity-85 pointer-events-none z-0 transform rotate-12 scale-105"></div>
  
  {/* Onda da Frente -  */}
  <div className="absolute left-[10%] bottom-[-5%] w-[85%] h-[90%] bg-gradient-to-tr from-[#ffeea0] to-[#fed106] rounded-[60%_40%_70%_30%/40%_50%_30%_70%] opacity-90 pointer-events-none z-10"></div>

            {/* Imagem Recortada da Aluna */}
            <div className="relative z-20 w-[100%] md:w-[92%] aspect-[1.25/1] overflow-hidden bottom-0 items-end flex">
              {/* ========================================================== */}
              {/* ESPAÇO PARA ADICIONAR A FOTO NA HEADER:                    */}
              {/* Cole o caminho da sua imagem da estudante no 'src' abaixo  */}
              {/* ========================================================== */}
              <img 
                src={logo} 
                alt="logo" 
                className="w-full h-full object-contain object-center filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.15)]"
              />
            </div>
          </div>

        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL (Lista de Artigos) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {carregando ? (
          <div className="w-full flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#fed106]"></div>
          </div>
        ) : postsFiltrados.length === 0 ? (
          <div className="w-full text-center py-16 text-gray-400 font-medium bg-white rounded-2xl border border-gray-100">
            Nenhuma notícia encontrada para a sua busca.
          </div>
        ) : (
          <>
            {/* SEÇÃO: Últimas Postagens (Idêntico à foto) */}
            {postDestaque && (
              <div className="mb-20">
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    {/* Ícone de Jornal Rosa */}
                    <div className="text-[#fed106]">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.75m-3.75 3h3.75m-3.75 3h3.75m1.514-6c.123.08.253.165.39.253.376.243.81.42 1.258.42H19.5a3 3 0 013 3v9.75a3 3 0 01-3 3h-15a3 3 0 01-3-3V6.75a3 3 0 013-3h13.841c.442 0 .877.177 1.25.423.14.092.27.179.395.262m-13.5 13.5h13.5" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Últimas postagens
                    </h2>
                  </div>
                </div>
                
                {/* Card de Destaque Horizontal Limpo */}
                <Link to={`/blog/${postDestaque.id}`} className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[24px] overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-300 border border-gray-100 group">
                  <div className="lg:col-span-5 h-64 lg:h-[320px] overflow-hidden relative">
                    <img src={postDestaque.fotoUrl} alt={postDestaque.titulo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102" />
                    
                    {/* Tag de categoria sobre a imagem */}
                    <span className="absolute top-4 left-4 bg-[#fed106] text-white font-extrabold text-[10px] tracking-wider uppercase py-1 px-3.5 rounded-full shadow-md">
                      {postDestaque.categoria}
                    </span>
                  </div>
                  
                  <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-center bg-white">
                    <div className="flex items-center gap-4 text-xs text-gray-400 font-semibold mb-4">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        {postDestaque.data}
                      </span>
                      <span className="bg-purple-50 text-[#fed106] text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase">
                        {postDestaque.categoria}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-[#fed106] transition-colors duration-300 leading-tight">
                      {postDestaque.titulo}
                    </h3>
                    
                    <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-8 leading-relaxed max-w-2xl">{postDestaque.resumo}</p>
                    
                    <span className="text-[#fed106] font-extrabold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Ler Matéria Completa <span className="text-sm">→</span>
                    </span>
                  </div>
                </Link>
              </div>
            )}

            {/* SEÇÃO: Todas as Notícias (Grid debaixo) */}
            {postsRestantes.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 border-t border-gray-100 pt-8">
                  Todas as notícias
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {postsRestantes.map(post => (
                    <Link key={post.id} to={`/blog/${post.id}`} className="flex flex-col bg-white rounded-[20px] overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_45px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-gray-100 group">
                      
                      <div className="w-full h-52 overflow-hidden relative">
                        <img src={post.fotoUrl} alt={post.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" />
                        <span className="absolute top-4 left-4 bg-[#fed106] text-white font-bold text-[9px] tracking-wider uppercase py-1 px-3 rounded-full shadow-md">
                          {post.categoria}
                        </span>
                      </div>

                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-semibold mb-3">
                          <span>{post.data}</span>
                          <span className="text-gray-200">•</span>
                          <span className="text-[#fed106] uppercase">{post.categoria}</span>
                        </div>
                        
                        <h4 className="text-[17px] font-bold text-slate-800 mb-3 leading-snug line-clamp-2 group-hover:text-[#fed106] transition-colors duration-300">
                          {post.titulo}
                        </h4>
                        
                        <p className="text-[13px] text-gray-400 font-medium line-clamp-3 mb-6 leading-relaxed">{post.resumo}</p>
                        
                        <span className="text-[#fed106] font-extrabold text-[11px] uppercase tracking-wider mt-auto inline-flex items-center gap-1">
                          Ler Matéria Completa <span className="text-sm">→</span>
                        </span>
                      </div>

                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}