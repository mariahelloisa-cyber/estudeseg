import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SENHA_ADMIN_DEFINIDA = "123456"; // <-- MUDA AQUI A TUA SENHA DO PAINEL!

export default function Admin() {
  // --- Estados do Painel Administrativo ---
  const [modoAdmin, setModoAdmin] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [mensagemStatus, setMensagemStatus] = useState("");
  
  // --- Estados para os Banners Dinâmicos do Supabase ---
  const [banners, setBanners] = useState([]);
  
  // --- Estados para o Formulário de Depoimentos ---
  const [novoNomeAluno, setNovoNomeAluno] = useState("");
  const [novoInstagram, setNovoInstagram] = useState("");
  const [novoVideoUrl, setNovoVideoUrl] = useState("");
  const [novoNomeSelo, setNovoNomeSelo] = useState("");
  const [novoTituloDiferencial, setNovoTituloDiferencial] = useState("");
  const [novaNoticiaDestaque, setNovaNoticiaDestaque] = useState(false);
  const [novoTempoLeitura, setNovoTempoLeitura] = useState("");
  
  // --- Estados para Edição de Notícias ---
  const [noticiaEditando, setNoticiaEditando] = useState(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editResumo, setEditResumo] = useState("");
  const [editTempoLeitura, setEditTempoLeitura] = useState("");
  const [editDestaque, setEditDestaque] = useState(false);
  
  // --- Estados para o Gerenciador de FAQ ---
  const [faqsAdmin, setFaqsAdmin] = useState([]);
  const [novaPerguntafaq, setNovaPerguntaFaq] = useState("");
  const [novaRespostafaq, setNovaRespostaFaq] = useState("");
  const [novoTopicofaq, setNovoTopicofaq] = useState("Geral");
  
  // --- Estados para o Gerenciador de Vagas ---
  const [vagasAdmin, setVagasAdmin] = useState([]);
  const [novaVagaTitulo, setNovaVagaTitulo] = useState("");
  const [novaVagaDepartamento, setNovaVagaDepartamento] = useState("");
  const [novaVagaLocalizacao, setNovaVagaLocalizacao] = useState("");
  const [novaVagaTipoContrato, setNovaVagaTipoContrato] = useState("CLT");
  const [novaVagaDescricao, setNovaVagaDescricao] = useState("");
  const [novaVagaLink, setNovaVagaLink] = useState("");
  
  // --- Estados para as restantes seções ---
  const [listaSelos, setListaSelos] = useState([]);
  const [listaDiferenciais, setListaDiferenciais] = useState([]);
  const [depoimentos, setDepoimentos] = useState([]);
  const [noticiasDestaque, setNoticiasDestaque] = useState([]);
  const [novoTituloNoticia, setNovoTituloNoticia] = useState("");
  const [novoResumoNoticia, setNovoResumoNoticia] = useState("");

  useEffect(() => {
    // Lê a chave mágica que veio da tela de login
    const isPainelLiberado = localStorage.getItem('painel_liberado');
    if (isPainelLiberado === 'true') {
      setModoAdmin(true);
      localStorage.removeItem('painel_liberado');
    }
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

  // Função para Adicionar um Novo Banner
  async function handleAdicionarBanner(e) {
    e.preventDefault();
    const arquivoInput = document.getElementById('arquivo-banner');
    const arquivo = arquivoInput?.files[0];

    if (!arquivo) {
      setMensagemStatus("⚠️ Por favor, selecione um arquivo de imagem!");
      return;
    }

    try {
      setMensagemStatus("⏳ Fazendo upload da imagem...");
      const nomeArquivo = `${Date.now()}-${arquivo.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('banners')
        .upload(nomeArquivo, arquivo);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('banners')
        .getPublicUrl(nomeArquivo);

      const { error: insertError } = await supabase.from('banners').insert([
        { titulo: novoTitulo, imagem_url: urlData.publicUrl }
      ]);

      if (insertError) throw insertError;

      setMensagemStatus("✅ Banner publicado com sucesso!");
      setNovoTitulo("");
      if (arquivoInput) arquivoInput.value = ""; 
      buscarBannersDoSupabase(); 
    } catch (err) {
      setMensagemStatus("❌ Erro no processo: " + err.message);
    }
  }

  // Função para Eliminar um Banner
  async function handleEliminarBanner(id) {
    if (!window.confirm("Tens a certeza que queres eliminar este banner?")) return;

    try {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
      buscarBannersDoSupabase();
    } catch (err) {
      alert("Erro ao eliminar: " + err.message);
    }
  }

  // Função para Adicionar um Novo Selo
  async function handleAdicionarSelo(e) {
    e.preventDefault();
    const arquivoInput = document.getElementById('imagem-selo');
    const arquivo = arquivoInput?.files[0];

    if (!novoNomeSelo.trim()) {
      setMensagemStatus("⚠️ O nome do selo é obrigatório!");
      return;
    }
    if (!arquivo) {
      setMensagemStatus("⚠️ Por favor, selecione uma imagem para o selo!");
      return;
    }

    try {
      setMensagemStatus("⏳ Guardando selo e fazendo upload da imagem...");
      const nomeArquivo = `selo-${Date.now()}-${arquivo.name}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(nomeArquivo, arquivo);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('banners')
        .getPublicUrl(nomeArquivo);

      const { error: insertError } = await supabase.from('selos').insert([
        { 
          nome: novoNomeSelo, 
          imagem_url: urlData.publicUrl 
        }
      ]);

      if (insertError) throw insertError;

      setMensagemStatus("✅ Selo publicado com sucesso!");
      setNovoNomeSelo("");
      if (arquivoInput) arquivoInput.value = "";
      buscarSelosDoSupabase();
    } catch (err) {
      setMensagemStatus("❌ Erro ao salvar selo: " + err.message);
    }
  }

  // Função para Eliminar um Selo
  async function handleEliminarSelo(id) {
    if (!window.confirm("Tem a certeza que quer eliminar este selo?")) return;
    try {
      const { error } = await supabase.from('selos').delete().eq('id', id);
      if (error) throw error;
      buscarSelosDoSupabase();
    } catch (err) {
      alert("Erro ao eliminar selo: " + err.message);
    }
  }

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

  // Função para Adicionar um Novo Diferencial
  async function handleAdicionarDiferencial(e) {
    e.preventDefault();
    const arquivoInput = document.getElementById('imagem-diferencial');
    const arquivo = arquivoInput?.files[0];

    if (!novoTituloDiferencial.trim()) {
      setMensagemStatus("⚠️ O título do diferencial é obrigatório!");
      return;
    }
    if (!arquivo) {
      setMensagemStatus("⚠️ Por favor, selecione uma imagem para o diferencial!");
      return;
    }

    try {
      setMensagemStatus("⏳ Guardando diferencial e fazendo upload da imagem...");
      const nomeArquivo = `diferencial-${Date.now()}-${arquivo.name}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(nomeArquivo, arquivo);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('banners')
        .getPublicUrl(nomeArquivo);

      const { error: insertError } = await supabase.from('diferenciais').insert([
        { 
          titulo: novoTituloDiferencial, 
          imagem_url: urlData.publicUrl 
        }
      ]);

      if (insertError) throw insertError;

      setMensagemStatus("✅ Diferencial publicado com sucesso!");
      setNovoTituloDiferencial("");
      if (arquivoInput) arquivoInput.value = "";
      buscarDiferenciaisDoSupabase();
    } catch (err) {
      setMensagemStatus("❌ Erro ao salvar diferencial: " + err.message);
    }
  }

  // Função para Eliminar um Diferencial
  async function handleEliminarDiferencial(id) {
    if (!window.confirm("Tem a certeza que quer eliminar este diferencial?")) return;
    try {
      const { data, error } = await supabase
        .from('diferenciais')
        .delete()
        .eq('id', id)
        .select();
        
      if (error) throw error;

      if (!data || data.length === 0) {
        alert("⚠️ O diferencial não foi eliminado! Verifique as diretrizes de RLS no SQL Editor.");
        return;
      }

      alert("✅ Diferencial eliminado com sucesso!");
      buscarDiferenciaisDoSupabase();
    } catch (err) {
      alert("❌ Erro ao eliminar diferencial: " + err.message);
    }
  }

  // Função para Adicionar Notícia
  async function handleAdicionarNoticia(e) {
    e.preventDefault();
    const arquivoInput = document.getElementById('imagem-noticia');
    const arquivo = arquivoInput?.files[0];

    if (!novoTituloNoticia.trim() || !novoResumoNoticia.trim() || !arquivo) {
      setMensagemStatus("⚠️ Preencha todos os campos e selecione uma imagem!");
      return;
    }

    try {
      setMensagemStatus("⏳ Publicando notícia...");
      const nomeArquivo = `noticia-${Date.now()}-${arquivo.name}`;
      
      await supabase.storage.from('banners').upload(nomeArquivo, arquivo);
      const { data: urlData } = supabase.storage.from('banners').getPublicUrl(nomeArquivo);

      const { error } = await supabase.from('noticias').insert([
        { 
          titulo: novoTituloNoticia, 
          resumo: novoResumoNoticia, 
          imagem_url: urlData.publicUrl,
          destaque: novaNoticiaDestaque, 
          tempo_leitura: parseInt(novoTempoLeitura) || 3
        }
      ]);

      if (error) throw error;

      setMensagemStatus("✅ Notícia publicada com sucesso!");
      setNovoTituloNoticia("");
      setNovoResumoNoticia("");
      setNovoTempoLeitura("");
      setNovaNoticiaDestaque(false);
      if (arquivoInput) arquivoInput.value = "";
      
      const { data: newData } = await supabase.from('noticias').select('*').order('created_at', { ascending: false });
      setNoticiasDestaque((newData || []).map(item => ({
        id: item.id, 
        titulo: item.titulo, 
        resumo: item.resumo, 
        fotoUrl: item.imagem_url, 
        destaque: item.destaque,
        tempoLeitura: item.tempo_leitura || 3,
        dataCriacao: new Date(item.created_at).toLocaleDateString('pt-PT')
      })));
    } catch (err) {
      setMensagemStatus("❌ Erro: " + err.message);
    }
  }

  // Função para Deletar Notícia
  async function handleEliminarNoticia(id) {
    if (!window.confirm("Tem a certeza que quer eliminar esta notícia?")) return;
    try {
      const { error } = await supabase.from('noticias').delete().eq('id', id);
      if (error) throw error;
      setNoticiasDestaque(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      alert("Erro ao eliminar notícia: " + err.message);
    }
  }

  // Função para Editar Notícia
  function iniciarEdicaoNoticia(noticia) {
    setNoticiaEditando(noticia.id);
    setEditTitulo(noticia.titulo);
    setEditResumo(noticia.resumo);
    setEditTempoLeitura(noticia.tempoLeitura || 3);
    setEditDestaque(noticia.destaque || false);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

  // Função para Salvar Edição de Notícia
  async function handleSalvarEdicaoNoticia(e) {
    e.preventDefault();

    if (!editTitulo.trim() || !editResumo.trim()) {
      setMensagemStatus("⚠️ Por favor, preencha o título e o resumo!");
      return;
    }

    try {
      setMensagemStatus("⏳ Atualizando notícia...");
      const arquivoInput = document.getElementById('imagem-noticia-edit');
      const arquivo = arquivoInput?.files[0];
      let urlImagemFinal = null;

      if (arquivo) {
        const nomeArquivo = `noticia-${Date.now()}-${arquivo.name}`;
        const { error: uploadError } = await supabase.storage
          .from('banners')
          .upload(nomeArquivo, arquivo);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('banners')
          .getPublicUrl(nomeArquivo);
          
        urlImagemFinal = urlData.publicUrl;
      }

      const dadosAtualizados = {
        titulo: editTitulo,
        resumo: editResumo,
        destaque: editDestaque,
        tempo_leitura: parseInt(editTempoLeitura) || 3
      };

      if (urlImagemFinal) {
        dadosAtualizados.imagem_url = urlImagemFinal;
      }

      const { error: updateError } = await supabase
        .from('noticias')
        .update(dadosAtualizados)
        .eq('id', noticiaEditando);

      if (updateError) throw updateError;

      setMensagemStatus("✅ Notícia atualizada com sucesso!");
      
      setNoticiaEditando(null);
      setEditTitulo("");
      setEditResumo("");
      setEditTempoLeitura("");
      setEditDestaque(false);
      if (arquivoInput) arquivoInput.value = "";

      const { data: dataAtualizada } = await supabase
        .from('noticias')
        .select('*')
        .order('created_at', { ascending: false });

      if (dataAtualizada && dataAtualizada.length > 0) {
          setNoticiasDestaque(dataAtualizada.map(item => ({
            id: item.id,
            titulo: item.titulo,
            resumo: item.resumo,
            fotoUrl: item.imagem_url,
            destaque: item.destaque,
            tempoLeitura: item.tempo_leitura || 3, 
            dataCriacao: new Date(item.created_at).toLocaleDateString('pt-BR')
          })));
        }

    } catch (err) {
      setMensagemStatus("❌ Erro ao atualizar notícia: " + err.message);
    }
  }

  // Carrega as FAQs
  async function buscarFaqsAdmin() {
    const { data } = await supabase.from('faqs').select('*').order('created_at', { ascending: false });
    if (data) setFaqsAdmin(data);
  }

  // Função para Adicionar FAQ
  async function handleAdicionarFaq(e) {
    e.preventDefault();
    
    if (!novaPerguntafaq.trim() || !novaRespostafaq.trim()) {
      alert("⚠️ Por favor, preenche a Pergunta e a Resposta!");
      return;
    }

    try {
      const { error } = await supabase
        .from('faqs')
        .insert([{ 
          pergunta: novaPerguntafaq, 
          resposta: novaRespostafaq, 
          topico: novoTopicofaq 
        }]);

      if (error) {
        console.error("Erro do Supabase:", error);
        alert("❌ Erro ao guardar na base de dados: " + error.message);
        return;
      }

      setNovaPerguntaFaq("");
      setNovaRespostaFaq("");
      
      alert("✅ FAQ adicionada com sucesso!");
      
      buscarFaqsAdmin();
    } catch (err) {
      console.error(err);
      alert("❌ Ocorreu um erro inesperado: " + err.message);
    }
  }

  // Função para Deletar FAQ
  async function handleDeletarFaq(id) {
    if (!confirm("Tem certeza que deseja excluir esta pergunta?")) return;
    try {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
      setMensagemStatus("FAQ removida!");
      buscarFaqsAdmin();
    } catch (err) {
      console.error(err);
    }
  }

  // Executa a busca assim que o modo admin for aberto
  useEffect(() => {
    if (modoAdmin) {
      buscarFaqsAdmin();
      buscarVagasAdmin();
    }
  }, [modoAdmin]);

  // --- FUNÇÕES DE VAGAS ---
  async function buscarVagasAdmin() {
    const { data } = await supabase.from('vagas').select('*').order('created_at', { ascending: false });
    if (data) setVagasAdmin(data);
  }

  async function handleAdicionarVaga(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    if (!novaVagaTitulo.trim() || !novaVagaDescricao.trim()) {
      alert("⚠️ Por favor, preenche o Título e a Descrição da vaga!");
      return;
    }

    try {
      const { error } = await supabase.from('vagas').insert([{ 
        titulo: novaVagaTitulo, 
        departamento: novaVagaDepartamento,
        localizacao: novaVagaLocalizacao,
        tipo_contrato: novaVagaTipoContrato,
        descricao: novaVagaDescricao,
        link_formulario: novaVagaLink
      }]);

      if (error) throw error;

      setNovaVagaTitulo(""); setNovaVagaDepartamento(""); setNovaVagaLocalizacao("");
      setNovaVagaTipoContrato("CLT"); setNovaVagaDescricao(""); setNovaVagaLink("");
      
      alert("✅ Vaga adicionada com sucesso!");
      buscarVagasAdmin();
    } catch (err) {
      console.error(err);
      alert("❌ Erro ao adicionar vaga: " + err.message);
    }
  }

  async function handleDeletarVaga(id) {
    if (!window.confirm("Tem a certeza que deseja excluir esta vaga?")) return;
    try {
      const { error } = await supabase.from('vagas').delete().eq('id', id);
      if (error) throw error;
      alert("✅ Vaga removida!");
      buscarVagasAdmin();
    } catch (err) {
      console.error(err);
    }
  }

  // Função para Adicionar um Novo Depoimento
  async function handleAdicionarDepoimento(e) {
    e.preventDefault();
    const arquivoInput = document.getElementById('capa-depoimento');
    const arquivo = arquivoInput?.files[0];

    if (!novoNomeAluno.trim() || !novoVideoUrl.trim()) {
      setMensagemStatus("⚠️ Nome do aluno e URL do vídeo são obrigatórios!");
      return;
    }
    if (!arquivo) {
      setMensagemStatus("⚠️ Por favor, selecione uma foto de capa para o depoimento!");
      return;
    }

    try {
      setMensagemStatus("⏳ Guardando depoimento e fazendo upload da capa...");
      const nomeArquivo = `depoimento-${Date.now()}-${arquivo.name}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(nomeArquivo, arquivo);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('banners')
        .getPublicUrl(nomeArquivo);

      const { error: insertError } = await supabase.from('depoimentos').insert([
        { 
          nome: novoNomeAluno, 
          instagram: novoInstagram, 
          video_url: novoVideoUrl, 
          foto_url: urlData.publicUrl 
        }
      ]);

      if (insertError) throw insertError;

      setMensagemStatus("✅ Depoimento publicado com sucesso!");
      setNovoNomeAluno("");
      setNovoInstagram("");
      setNovoVideoUrl("");
      if (arquivoInput) arquivoInput.value = "";
      buscarDepoimentosDoSupabase();
    } catch (err) {
      setMensagemStatus("❌ Erro ao salvar depoimento: " + err.message);
    }
  }

  // Função para Eliminar um Depoimento
  async function handleEliminarDepoimento(id) {
    if (!window.confirm("Tem a certeza que quer eliminar este depoimento?")) return;
    try {
      const { error } = await supabase.from('depoimentos').delete().eq('id', id);
      if (error) throw error;
      buscarDepoimentosDoSupabase();
    } catch (err) {
      alert("Erro ao eliminar depoimento: " + err.message);
    }
  }

  // 4. Buscar Depoimentos do SUPABASE
  async function buscarDepoimentosDoSupabase() {
    try {
      const { data, error } = await supabase
        .from('depoimentos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDepoimentos(data || []);
    } catch (err) {
      console.error("Erro na conexão com os depoimentos do Supabase:", err);
    }
  }

  useEffect(() => {
    buscarDepoimentosDoSupabase();
  }, []);

  // Função para alternar o modo administrativo
  function gerenciarAcessoAdmin() {
    if (modoAdmin) {
      setModoAdmin(false);
    } else {
      const senhaDigitada = prompt("Insira a senha de administrador para aceder ao painel:");
      if (senhaDigitada === SENHA_ADMIN_DEFINIDA) {
        setModoAdmin(true);
      } else if (senhaDigitada !== null) {
        alert("❌ Senha incorreta!");
      }
    }
  }

  // --- SE MODO ADMIN ESTIVER ATIVO, EXIBE O PAINEL ---
  if (modoAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
        <div className="bg-gray-800 border-b border-gray-700 py-5 px-6 flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-xl font-black uppercase text-[#fed106] tracking-wider">LATec Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">Gerenciador de Conteúdo (Supabase)</p>
          </div>
           <button 
        onClick={async () => {
          await supabase.auth.signOut();
          setModoAdmin(false);
          alert('Sessão encerrada com segurança.');
        }} 
        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-md" 
      > 
        Sair do Painel ➔ 
      </button>
        </div>

        <div className="max-w-7xl w-full mx-auto p-6 flex-col gap-12 flex">
          {/* --- BLOCO 1: GERENCIAR BANNERS --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-gray-800 pb-12">
            <div className="md:col-span-1 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl h-fit">
              <h3 className="text-base font-black uppercase text-white mb-4 tracking-wide">Novo Banner</h3>
              <form onSubmit={handleAdicionarBanner} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Título (Opcional)</label>
                  <input type="text" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} placeholder="Ex: Novas Matrículas" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fed106]" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Arquivo de Imagem</label>
                  <input type="file" id="arquivo-banner" accept="image/*" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white file:bg-[#fed106] file:text-white file:border-0 file:rounded-full file:px-3 file:py-1 file:text-xs file:font-bold cursor-pointer" />
                </div>
                <button type="submit" className="w-full bg-[#fed106] hover:bg-[#a61058] text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer">➕ Publicar Banner</button>
              </form>
            </div>
            <div className="md:col-span-2 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
              <h3 className="text-base font-black uppercase text-white mb-4 tracking-wide">Banners Ativos ({banners.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {banners.map((b) => (
                  <div key={b.id} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden relative shadow-lg">
                    <img src={b.imagem_url} alt="" className="w-full h-32 object-cover" />
                    <button onClick={() => handleEliminarBanner(b.id)} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer">✕</button>
                    <div className="p-3 text-left truncate text-xs font-bold text-white">{b.titulo || "Sem Título"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- BLOCO 2: GERENCIAR SELOS --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-800 pt-12">
            <div className="md:col-span-1 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl h-fit">
              <h3 className="text-base font-black uppercase text-white mb-4 tracking-wide">Novo Selo / Parceiro</h3>
              <form onSubmit={handleAdicionarSelo} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Nome da Empresa/Selo</label>
                  <input type="text" value={novoNomeSelo} onChange={(e) => setNovoNomeSelo(e.target.value)} placeholder="Ex: MEC ou Empresa Parceira" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fed106]" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Logo (Do PC)</label>
                  <input type="file" id="imagem-selo" accept="image/*" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white file:bg-[#fed106] file:text-white file:border-0 file:rounded-full file:px-3 file:py-1 file:text-xs file:font-bold cursor-pointer" />
                </div>
                <button type="submit" className="w-full bg-[#fed106] hover:bg-[#a61058] text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer">➕ Publicar Selo</button>
              </form>
            </div>
            <div className="md:col-span-2 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
              <h3 className="text-base font-black uppercase text-white mb-4 tracking-wide">Selos Ativos ({listaSelos.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {listaSelos.map((s) => (
                  <div key={s.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col items-center justify-between relative shadow-lg h-36">
                    <button onClick={() => handleEliminarSelo(s.id)} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer">✕</button>
                    <div className="flex-1 flex items-center justify-center w-full">
                      <img src={s.imagem_url} alt="" className="h-12 w-auto object-contain" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-300 text-center truncate w-full mt-2">{s.nome}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- BLOCO 3: GERENCIAR DIFERENCIAIS --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-800 pt-12">
            <div className="md:col-span-1 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl h-fit">
              <h3 className="text-base font-black uppercase text-white mb-4 tracking-wide">Novo Diferencial</h3>
              <form onSubmit={handleAdicionarDiferencial} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Título do Diferencial</label>
                  <input 
                    type="text" 
                    value={novoTituloDiferencial} 
                    onChange={(e) => setNovoTituloDiferencial(e.target.value)} 
                    placeholder="Ex: Suporte 24/7 ou Metodologia Ativa" 
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fed106]" 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Imagem Ilustrativa (Do PC)</label>
                  <input 
                    type="file" 
                    id="imagem-diferencial" 
                    accept="image/*" 
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white file:bg-[#fed106] file:text-white file:border-0 file:rounded-full file:px-3 file:py-1 file:text-xs file:font-bold cursor-pointer" 
                  />
                </div>
                <button type="submit" className="w-full bg-[#fed106] hover:bg-[#a61058] text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer">➕ Publicar Diferencial</button>
              </form>
            </div>
            
            <div className="md:col-span-2 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
              <h3 className="text-base font-black uppercase text-white mb-4 tracking-wide">Diferenciais Ativos ({listaDiferenciais.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {listaDiferenciais.map((d) => (
                  <div key={d.id} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden relative shadow-lg flex items-center p-3 gap-4">
                    <img src={d.fotoUrl} alt="" className="w-16 h-16 object-cover rounded-lg bg-gray-800 shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-black text-white truncate">{d.titulo}</p>
                    </div>
                    <button 
                      onClick={() => handleEliminarDiferencial(d.id)} 
                      className="bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- BLOCO 5: GERENCIAR NOTÍCIAS --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-800 pt-12 pb-8">
            <div className="md:col-span-1 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl h-fit">
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-black uppercase text-white tracking-wide">
                  {noticiaEditando ? "✏️ Editar Notícia" : "📝 Nova Notícia"}
                </h3>
                {noticiaEditando && (
                  <button 
                    type="button" 
                    onClick={() => { setNoticiaEditando(null); setEditTitulo(""); setEditResumo(""); setEditTempoLeitura(""); setEditDestaque(false); }}
                    className="text-[10px] uppercase bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-md font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              <form onSubmit={noticiaEditando ? handleSalvarEdicaoNoticia : handleAdicionarNoticia} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Título da Notícia</label>
                  <input 
                    type="text" 
                    value={noticiaEditando ? editTitulo : novoTituloNoticia} 
                    onChange={(e) => noticiaEditando ? setEditTitulo(e.target.value) : setNovoTituloNoticia(e.target.value)} 
                    placeholder="Ex: Novo curso aberto!" 
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fed106]" 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Breve Resumo</label>
                  <textarea 
                    rows="3"
                    value={noticiaEditando ? editResumo : novoResumoNoticia} 
                    onChange={(e) => noticiaEditando ? setEditResumo(e.target.value) : setNovoResumoNoticia(e.target.value)} 
                    placeholder="Ex: Inscrições abertas..." 
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fed106] resize-none" 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">
                    {noticiaEditando ? "Nova Imagem (Opcional)" : "Imagem de Capa"}
                  </label>
                  <input 
                    type="file" 
                    id={noticiaEditando ? "imagem-noticia-edit" : "imagem-noticia"}
                    accept="image/*" 
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white file:bg-[#fed106] file:text-white file:border-0 file:rounded-full file:px-3 file:py-1 file:text-xs file:font-bold cursor-pointer" 
                    required={!noticiaEditando}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Tempo de Leitura (minutos)</label>
                  <input 
                    type="number" 
                    value={noticiaEditando ? editTempoLeitura : novoTempoLeitura} 
                    onChange={(e) => noticiaEditando ? setEditTempoLeitura(e.target.value) : setNovoTempoLeitura(e.target.value)} 
                    placeholder="Ex: 5" 
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fed106]" 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="destaque-noticia"
                    checked={noticiaEditando ? editDestaque : novaNoticiaDestaque} 
                    onChange={(e) => noticiaEditando ? setEditDestaque(e.target.checked) : setNovaNoticiaDestaque(e.target.checked)} 
                    className="w-4 h-4 rounded border-gray-700 bg-gray-900 cursor-pointer"
                  />
                  <label htmlFor="destaque-noticia" className="text-xs text-gray-400 font-bold uppercase">Marcar como Destaque</label>
                </div>
                <button type="submit" className="w-full bg-[#fed106] hover:bg-[#a61058] text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer">
                  {noticiaEditando ? "💾 Salvar Alterações" : "➕ Publicar Notícia"}
                </button>
              </form>
            </div>

            <div className="md:col-span-2 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
              <h3 className="text-base font-black uppercase text-white mb-4 tracking-wide">Notícias Publicadas ({noticiasDestaque.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {noticiasDestaque.map((n) => (
                  <div key={n.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-start gap-4 relative shadow-lg">
                    <img src={n.fotoUrl} alt="" className="w-20 h-20 object-cover rounded-lg bg-gray-800 shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-bold text-white truncate">{n.titulo}</p>
                      <p className="text-xs text-gray-400 line-clamp-2">{n.resumo}</p>
                      <div className="flex gap-2 mt-2 text-[11px] text-gray-500">
                        <span>{n.tempoLeitura} min</span>
                        <span>•</span>
                        <span>{n.dataCriacao}</span>
                        {n.destaque && <span className="text-[#fed106] font-bold">⭐ Destaque</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => iniciarEdicaoNoticia(n)} 
                        className="bg-blue-600 hover:bg-blue-700 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleEliminarNoticia(n.id)} 
                        className="bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- BLOCO 6: GERENCIAR VAGAS --- */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mt-8 text-left shadow-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 border-b border-slate-700 pb-3 inline-flex items-center gap-2">
              📌 Gerenciar Vagas
            </h3>
            
            <form onSubmit={handleAdicionarVaga} className="space-y-4 mb-6">
              <input 
                type="text" 
                placeholder="Título da Vaga" 
                value={novaVagaTitulo}
                onChange={(e) => setNovaVagaTitulo(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-600 bg-slate-900 text-white placeholder-slate-500 focus:outline-hidden focus:border-[#fed106]"
                required
              />
              <select 
                value={novaVagaDepartamento}
                onChange={(e) => setNovaVagaDepartamento(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-600 bg-slate-900 text-white focus:outline-hidden focus:border-[#fed106]"
              >
                <option value="">Departamento (Opcional)</option>
                <option value="TI">TI</option>
                <option value="RH">RH</option>
                <option value="Marketing">Marketing</option>
              </select>
              <input 
                type="text" 
                placeholder="Localização (Opcional)" 
                value={novaVagaLocalizacao}
                onChange={(e) => setNovaVagaLocalizacao(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-600 bg-slate-900 text-white placeholder-slate-500 focus:outline-hidden focus:border-[#fed106]"
              />
              <select 
                value={novaVagaTipoContrato}
                onChange={(e) => setNovaVagaTipoContrato(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-600 bg-slate-900 text-white focus:outline-hidden focus:border-[#fed106]"
              >
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
                <option value="Estágio">Estágio</option>
              </select>
              <textarea 
                rows="3" 
                placeholder="Descrição da Vaga" 
                value={novaVagaDescricao}
                onChange={(e) => setNovaVagaDescricao(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-600 bg-slate-900 text-white placeholder-slate-500 focus:outline-hidden focus:border-[#fed106]"
                required
              />
              <input 
                type="url" 
                placeholder="Link do Formulário (Opcional)" 
                value={novaVagaLink}
                onChange={(e) => setNovaVagaLink(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-600 bg-slate-900 text-white placeholder-slate-500 focus:outline-hidden focus:border-[#fed106]"
              />
              <button 
                type="submit" 
                className="bg-[#fed106] hover:bg-[#a61058] text-white text-[11px] font-black uppercase tracking-wider px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Adicionar Vaga
              </button>
            </form>

            <div className="border-t border-slate-700 pt-5 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Vagas Cadastradas:</p>
              {vagasAdmin.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Nenhuma vaga cadastrada.</p>
              ) : (
                vagasAdmin.map(vaga => (
                  <div key={vaga.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-700/60 shadow-xs">
                    <div className="flex-1">
                      <strong className="text-xs text-slate-200 font-medium">{vaga.titulo}</strong>
                      <p className="text-[10px] text-slate-400">{vaga.departamento} • {vaga.tipo_contrato}</p>
                    </div>
                    <button 
                      onClick={() => handleDeletarVaga(vaga.id)}
                      className="text-red-400 hover:text-red-500 text-xs font-bold uppercase px-2 py-1 transition-colors cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mt-8 text-left shadow-xl">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 border-b border-slate-700 pb-3 inline-flex items-center gap-2">
                📌 Gerenciar Perguntas Frequentes (FAQ)
              </h3>
              
              <form onSubmit={handleAdicionarFaq} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tópico / Categoria</label>
                  <select 
                    value={novoTopicofaq} 
                    onChange={(e) => setNovoTopicofaq(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-600 bg-slate-900 text-white focus:outline-hidden focus:border-[#fed106]"
                  >
                    <option value="Geral">Geral</option>
                    <option value="Cursos">Cursos</option>
                    <option value="Inscrições">Inscrições</option>
                    <option value="Certificados">Certificados</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Pergunta</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Como funciona a emissão do certificado?" 
                    value={novaPerguntafaq}
                    onChange={(e) => setNovaPerguntaFaq(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-600 bg-slate-900 text-white placeholder-slate-500 focus:outline-hidden focus:border-[#fed106]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Resposta</label>
                  <textarea 
                    rows="3" 
                    placeholder="Digite a resposta detalhada aqui..." 
                    value={novaRespostafaq}
                    onChange={(e) => setNovaRespostaFaq(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-600 bg-slate-900 text-white placeholder-slate-500 focus:outline-hidden focus:border-[#fed106]"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="bg-[#fed106] hover:bg-[#a61058] text-white text-[11px] font-black uppercase tracking-wider px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Adicionar ao FAQ
                </button>
              </form>

              <div className="mt-6 border-t border-slate-700 pt-5 space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Perguntas Cadastradas:</p>
                {faqsAdmin.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Nenhuma pergunta cadastrada.</p>
                ) : (
                  faqsAdmin.map(faq => (
                    <div key={faq.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-700/60 shadow-xs">
                      <div className="pr-4 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <span className="text-[9px] font-extrabold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                          {faq.topico}
                        </span>
                        <strong className="text-xs text-slate-200 font-medium">{faq.pergunta}</strong>
                      </div>
                      <button 
                        onClick={() => handleDeletarFaq(faq.id)}
                        className="text-red-400 hover:text-red-500 text-xs font-bold uppercase px-2 py-1 transition-colors cursor-pointer shrink-0"
                      >
                        Excluir
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          
          {/* --- BLOCO 7: GERENCIAR DEPOIMENTOS --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl h-fit">
              <h3 className="text-base font-black uppercase text-white mb-4 tracking-wide">Novo Depoimento</h3>
              <form onSubmit={handleAdicionarDepoimento} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Nome do Aluno</label>
                  <input type="text" value={novoNomeAluno} onChange={(e) => setNovoNomeAluno(e.target.value)} placeholder="Ex: Maria Silva" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fed106]" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Instagram (Opcional)</label>
                  <input type="text" value={novoInstagram} onChange={(e) => setNovoInstagram(e.target.value)} placeholder="Ex: @maria_silva" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fed106]" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Link do Vídeo (YouTube/Drive)</label>
                  <input type="text" value={novoVideoUrl} onChange={(e) => setNovoVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#fed106]" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Foto de Capa (Do PC)</label>
                  <input type="file" id="capa-depoimento" accept="image/*" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white file:bg-[#fed106] file:text-white file:border-0 file:rounded-full file:px-3 file:py-1 file:text-xs file:font-bold cursor-pointer" />
                </div>
                <button type="submit" className="w-full bg-[#fed106] hover:bg-[#a61058] text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer">➕ Publicar Depoimento</button>
              </form>
            </div>
            <div className="md:col-span-2 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
              <h3 className="text-base font-black uppercase text-white mb-4 tracking-wide">Depoimentos Ativos ({depoimentos.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {depoimentos.map((d) => (
                  <div key={d.id} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden relative shadow-lg">
                    <img src={d.foto_url} alt="" className="w-full h-40 object-cover" />
                    <button onClick={() => handleEliminarDepoimento(d.id)} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer">✕</button>
                    <div className="p-2.5 text-left bg-gray-900">
                      <p className="text-xs font-black text-white truncate">{d.nome}</p>
                      <p className="text-[10px] text-gray-400 truncate">{d.instagram || 'Sem Instagram'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {mensagemStatus && (
            <p className="text-sm font-bold text-center p-3 bg-gray-800 border border-gray-700 rounded-xl animate-pulse text-gray-200">{mensagemStatus}</p>
          )}
        </div>
      </div>
    );
  }

  // Retorna vazio quando não estiver em modo admin (este componente é chamado apenas no painel)
  return null;
}
