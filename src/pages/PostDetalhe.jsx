import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient'; // <-- ADICIONE APENAS ESTA LINHA

export default function PostDetalhe() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [postsRelacionados, setPostsRelacionados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDadosArtigo() {
      try {
        setCarregando(true);

        // 1. Busca a notícia principal diretamente no Supabase filtrando pelo ID
        const { data: item, error: errorPost } = await supabase
          .from('noticias')
          .select('*')
          .eq('id', id)
          .single();

        if (errorPost || !item) throw new Error("Notícia não encontrada no Supabase");

        // Formata os dados no formato exato que o seu HTML atual espera
        setPost({
          id: item.id,
          titulo: item.titulo || "Título do Post",
          resumo: item.resumo || "",
          conteudo: item.resumo || "", 
          data: new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
          categoria: "NOTÍCIAS",
          fotoUrl: item.imagem_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200",
          tempoLeitura: item.tempo_leitura || 3
        });

        // 2. Busca até 3 notícias para os "Artigos Relacionados" no rodapé
        const { data: itensRelacionados, error: errorRel } = await supabase
          .from('noticias')
          .select('*')
          .neq('id', id) // Não mostra a notícia atual nos relacionados
          .limit(3);

        if (!errorRel && itensRelacionados) {
          setPostsRelacionados(itensRelacionados.map(rel => ({
            id: rel.id,
            titulo: rel.titulo || "Título do Post",
            resumo: rel.resumo || "",
            categoria: "NOTÍCIAS",
            fotoUrl: rel.imagem_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600"
          })));
        }

      } catch (err) {
        console.error("Erro ao carregar os detalhes do post:", err);
      } finally {
        setCarregando(false);
      }
    }

    if (id) {
      carregarDadosArtigo();
    }
  }, [id]);
  const renderizarConteudo = (conteudo) => {
    if (!conteudo) return <p className="text-gray-600">Conteúdo indisponível.</p>;

    if (Array.isArray(conteudo)) {
      return conteudo.map((bloco, idx) => {
        if (bloco.type === 'paragraph') {
          const texto = bloco.children?.map(child => child.text).join('') || '';
          return <p key={idx} className="mb-6 text-[#fed106] leading-relaxed text-base md:text-lg">{texto}</p>;
        }
        if (bloco.type === 'heading') {
          const texto = bloco.children?.map(child => child.text).join('') || '';
          return <h2 key={idx} className="text-2xl md:text-3xl font-bold mt-8 mb-4 text-[#ffeea0]">{texto}</h2>;
        }
        return null;
      });
    }

    if (typeof conteudo === 'string') {
      return conteudo.split('\n\n').map((paragrafo, index) => (
        <p key={index} className="mb-6 text-[#000000] leading-relaxed text-base md:text-lg whitespace-pre-line">
          {paragrafo}
        </p>
      ));
    }

    return <p>{JSON.stringify(conteudo)}</p>;
  };

  if (carregando) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="w-full flex flex-col items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#fed106]"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] font-sans">
        <Navbar />
        <div className="max-w-xl mx-auto text-center py-24 px-4">
          <h2 className="text-2xl font-bold text-gray-800">Publicação não encontrada</h2>
          <Link to="/blog" className="mt-6 inline-block bg-[#fed106] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-sm">
            Voltar para o Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white text-[#ffeea0] font-sans antialiased selection:bg-[#fed106]/10">
      <Navbar />

      {/* --- SEÇÃO SUPERIOR (BREADCRUMBS & TÍTULO) --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        {/* Breadcrumbs exatamente igual à image_81c35c.jpg */}
        <div className="text-xs text-gray-500 font-medium mb-6 flex items-center flex-wrap gap-1.5">
          <Link to="/" className="hover:text-gray-900 transition-colors">Início</Link>
          <span className="text-gray-400">/</span>
          <Link to="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-800 font-semibold truncate max-w-[280px] sm:max-w-md">{post.titulo}</span>
        </div>

        {/* Categoria / Badge Gradiente Oval */}
        <div className="mb-4">
          <span className="inline-block bg-gradient-to-r from-[#fed106] to-[#fed106] text-white font-extrabold text-[10px] tracking-widest uppercase px-4 py-1.5 rounded-full shadow-sm">
            {post.categoria}
          </span>
        </div>

        {/* Título Principal Imponente */}
        <h1 className="text-3xl sm:text-4xl md:text-[46px] font-black text-[#000000] tracking-tight leading-[1.15] max-w-5xl mb-6">
          {post.titulo}
        </h1>

        {/* Metadados e Ação de Compartilhar */}
        <div className="border-b border-gray-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-gray-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {post.data}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              3 min de leitura
            </span>
          </div>

          <button 
            onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copiado!'); }}
            className="inline-flex items-center gap-1.5 text-[#fed106] hover:opacity-80 transition-opacity active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v14"/>
            </svg>
            Compartilhar
          </button>
        </div>
      </div>

      {/* --- BANNER IMAGEM DESTAQUE --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="w-full h-[240px] sm:h-[380px] md:h-[460px] rounded-3xl overflow-hidden shadow-lg shadow-gray-200/50 bg-gray-50">
          <img src={post.fotoUrl} alt={post.titulo} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* --- CORPO DA MATÉRIA --- */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-20">
        <div className="prose prose-slate max-w-none">
          {renderizarConteudo(post.conteudo)}
        </div>
      </div>

      {/* --- SEÇÃO LEIA TAMBÉM (Estilo da image_81c39b.png) --- */}
      {postsRelacionados.length > 0 && (
        <div className="w-full bg-[#FAFAFA] border-t border-gray-100 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl font-black text-[#000000] mb-8">Leia Também</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-12">
              {postsRelacionados.map((itemRel) => (
                <Link 
                  key={itemRel.id} 
                  to={`/blog/${itemRel.id}`}
                  className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group"
                >
                  <div className="w-full h-44 overflow-hidden">
                    <img src={itemRel.fotoUrl} alt={itemRel.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <span className="text-[10px] font-extrabold text-[#fed106] uppercase tracking-wider mb-2 block">
                      {itemRel.categoria}
                    </span>
                    <h4 className="text-base font-bold text-gray-900 line-clamp-2 group-hover:text-[#fed106] transition-colors mb-2 leading-snug">
                      {itemRel.titulo}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                      {itemRel.resumo}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Botão de Rodapé Centralizado */}
            <div className="w-full flex justify-center">
              <Link 
                to="/blog" 
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold px-6 py-3 rounded-full border border-gray-200 shadow-sm hover:shadow transition-all active:scale-95"
              >
                ← Voltar para o Blog
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}