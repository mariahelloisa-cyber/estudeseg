import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Squares2X2Icon,
  PhotoIcon,
  ShieldCheckIcon,
  SparklesIcon,
  NewspaperIcon,
  BriefcaseIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
  TagIcon,
  StarIcon,
  EnvelopeIcon,
  MegaphoneIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolido } from '@heroicons/react/24/solid';
import { supabase } from '../supabaseClient';
import { listaCursosGiga } from './cursosData';
import logo from '../assets/logo-estud.png';
import { parseGradeCurricular, serializarGradeCurricular } from '../utils/gradeCurricular';
import { parseBlocosConteudo, serializarBlocosConteudo } from '../utils/blocosConteudo';
import { MODELOS_POPUP, obterModeloPopup } from '../components/popups/registry';
import CampoFormulario from '../components/popups/CampoFormulario';
import PopupModalShell from '../components/popups/PopupModalShell';

// --- Itens do menu lateral: só seções com dados reais no Supabase ---
const ITENS_MENU = [
  { id: 'dashboard', label: 'Dashboard', Icon: Squares2X2Icon },
  { id: 'cursos', label: 'Cursos e Categorias', Icon: AcademicCapIcon },
  { id: 'banners', label: 'Banners (Home)', Icon: PhotoIcon },
  { id: 'selos', label: 'Selos', Icon: ShieldCheckIcon },
  { id: 'frases', label: 'Frases (Esteira)', Icon: ChatBubbleBottomCenterTextIcon },
  { id: 'diferenciais', label: 'Diferenciais', Icon: SparklesIcon },
  { id: 'blog', label: 'Blog', Icon: NewspaperIcon },
  { id: 'vagas', label: 'Vagas', Icon: BriefcaseIcon },
  { id: 'faq', label: 'FAQ', Icon: QuestionMarkCircleIcon },
  { id: 'depoimentos', label: 'Depoimentos', Icon: ChatBubbleLeftRightIcon },
  { id: 'popups', label: 'Pop-ups', Icon: MegaphoneIcon },
  { id: 'contatos', label: 'Contatos', Icon: EnvelopeIcon },
  { id: 'matriculas', label: 'Matrículas', Icon: DocumentTextIcon },
];

const CURSO_FORM_INICIAL = {
  titulo: "",
  descricao: "",
  duracao: "",
  cargaHoraria: "",
  modalidade: "EAD",
  categoriaId: "",
  precoOriginal: "",
  preco: "",
  seloMec: true,
  destaque: false,
  maisVendido: false,
  gradeCurricular: [],
  blocosConteudo: [],
};

const MAX_CURSOS_DESTAQUE = 5;
const MAX_CURSOS_MAIS_VENDIDOS = 8;
const MAX_DEPOIMENTOS_DESTAQUE = 10;

const POPUP_FORM_INICIAL = { titulo: "", modelo: null, dados: {}, ativo: false };

// --- Validação de arquivos de imagem antes do upload para o Storage ---
const TIPOS_IMAGEM_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp'];
const TAMANHO_MAXIMO_MB = 5;

function validarImagem(arquivo) {
  if (!TIPOS_IMAGEM_PERMITIDOS.includes(arquivo.type)) {
    throw new Error('Formato não suportado. Envie uma imagem PNG, JPEG ou WebP.');
  }
  if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    throw new Error(`Arquivo muito grande (máx. ${TAMANHO_MAXIMO_MB}MB).`);
  }
}

// Remove caracteres perigosos do nome original (barras, "..", espaços, acentos)
// antes de usá-lo como chave de objeto no Supabase Storage.
function sanitizarNomeArquivo(nomeOriginal) {
  const extensaoMatch = nomeOriginal.match(/\.[a-zA-Z0-9]+$/);
  const extensao = extensaoMatch ? extensaoMatch[0].toLowerCase() : '';
  return `${crypto.randomUUID()}${extensao}`;
}

// --- Componentes visuais reutilizados nas páginas do painel ---
function CabecalhoPagina({ titulo, subtitulo, Icon }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-11 h-11 rounded-xl bg-[#fed106]/15 text-[#8a6d00] flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{titulo}</h1>
        {subtitulo && <p className="text-xs text-gray-500 font-medium">{subtitulo}</p>}
      </div>
    </div>
  );
}

function CardEstatistica({ label, valor, subtitulo, Icon, cor }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">{label}</span>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${cor}`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-black text-gray-900">{valor}</p>
        {subtitulo && <p className="text-[11px] text-gray-400 font-semibold mt-1">{subtitulo}</p>}
      </div>
    </div>
  );
}

function CartaoAcaoRapida({ titulo, descricao, Icon, cor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cor}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm text-gray-900">{titulo}</p>
        <p className="text-xs text-gray-500 font-medium truncate">{descricao}</p>
      </div>
      <span className="text-gray-300 text-xl">→</span>
    </button>
  );
}

export default function Admin() {
  const navigate = useNavigate();

  // --- Estados do Painel Administrativo ---
  const [modoAdmin, setModoAdmin] = useState(false);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [mensagemStatus, setMensagemStatus] = useState("");

  // --- Estados para os Banners Dinâmicos do Supabase ---
  const [banners, setBanners] = useState([]);

  // --- Estados para o Formulário de Depoimentos ---
  const [novoNomeAluno, setNovoNomeAluno] = useState("");
  const [novoInstagram, setNovoInstagram] = useState("");
  const [novoVideoUrl, setNovoVideoUrl] = useState("");
  const [novoWhatsapp, setNovoWhatsapp] = useState("");
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

  // --- Estados para Edição de Depoimentos ---
  const [depoimentoEditando, setDepoimentoEditando] = useState(null);
  const [editNomeAluno, setEditNomeAluno] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");

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
  const [listaFrases, setListaFrases] = useState([]);
  const [novoTextoFrase, setNovoTextoFrase] = useState("");
  const [listaDiferenciais, setListaDiferenciais] = useState([]);
  const [depoimentos, setDepoimentos] = useState([]);
  const [noticiasDestaque, setNoticiasDestaque] = useState([]);
  const [novoTituloNoticia, setNovoTituloNoticia] = useState("");
  const [novoResumoNoticia, setNovoResumoNoticia] = useState("");

  // --- Estados para o Gerenciador de Categorias de Cursos ---
  const [categoriasCursos, setCategoriasCursos] = useState([]);
  const [novaCategoriaCursoNome, setNovaCategoriaCursoNome] = useState("");

  // --- Estados para o Gerenciador de Contatos (formulário da Home) ---
  const [contatosAdmin, setContatosAdmin] = useState([]);

  // --- Estados para o Gerenciador de Matrículas (formulário público /matricula) ---
  const [matriculasAdmin, setMatriculasAdmin] = useState([]);
  const [matriculaExpandidaId, setMatriculaExpandidaId] = useState(null);

  // --- Estados para o Gerenciador de Pop-ups ---
  const [popupsAdmin, setPopupsAdmin] = useState([]);
  const [formPopup, setFormPopup] = useState(POPUP_FORM_INICIAL);
  const [popupEditando, setPopupEditando] = useState(null);
  const [mostrarSeletorModeloPopup, setMostrarSeletorModeloPopup] = useState(false);
  const [mostrarPreviewPopup, setMostrarPreviewPopup] = useState(false);

  // --- Estados para o Gerenciador de Cursos Cadastrados ---
  const [cursosAdmin, setCursosAdmin] = useState([]);
  const [cursoEditando, setCursoEditando] = useState(null);
  const [formCurso, setFormCurso] = useState(CURSO_FORM_INICIAL);

  // Marca quando o logout foi pedido pelo próprio botão "Sair do Painel",
  // para diferenciar de uma sessão que expirou sozinha
  const saindoManualmente = useRef(false);

  // Protege o painel: só libera o acesso se houver uma sessão Supabase válida
  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ativo) return;
      if (session) {
        setModoAdmin(true);
      } else {
        navigate('/login');
      }
      setVerificandoSessao(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setModoAdmin(false);
        if (saindoManualmente.current) {
          // Já tratado pelo próprio botão de logout, que leva ao site público
          saindoManualmente.current = false;
        } else {
          // Sessão expirou/foi invalidada sem ação do usuário: pede login de novo
          navigate('/login');
        }
      }
    });

    return () => {
      ativo = false;
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

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
      validarImagem(arquivo);
      setMensagemStatus("⏳ Fazendo upload da imagem...");
      const nomeArquivo = sanitizarNomeArquivo(arquivo.name);

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
      console.error(err);
      setMensagemStatus("❌ Não foi possível concluir. Tente novamente.");
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
      console.error(err);
      alert("❌ Não foi possível eliminar. Tente novamente.");
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
      validarImagem(arquivo);
      setMensagemStatus("⏳ Guardando selo e fazendo upload da imagem...");
      const nomeArquivo = `selo-${sanitizarNomeArquivo(arquivo.name)}`;

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
      console.error(err);
      setMensagemStatus("❌ Não foi possível salvar o selo. Tente novamente.");
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
      console.error(err);
      alert("❌ Não foi possível eliminar o selo. Tente novamente.");
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

  // Função para Adicionar uma Nova Frase da Esteira
  async function handleAdicionarFrase(e) {
    e.preventDefault();
    if (!novoTextoFrase.trim()) {
      setMensagemStatus("⚠️ Escreva o texto da frase!");
      return;
    }

    try {
      const { error } = await supabase.from('frases').insert([{ texto: novoTextoFrase.trim() }]);
      if (error) throw error;

      setMensagemStatus("✅ Frase publicada com sucesso!");
      setNovoTextoFrase("");
      buscarFrasesDoSupabase();
    } catch (err) {
      console.error(err);
      setMensagemStatus("❌ Não foi possível salvar a frase. Tente novamente.");
    }
  }

  // Função para Eliminar uma Frase
  async function handleEliminarFrase(id) {
    if (!window.confirm("Tem a certeza que quer eliminar esta frase?")) return;
    try {
      const { error } = await supabase.from('frases').delete().eq('id', id);
      if (error) throw error;
      buscarFrasesDoSupabase();
    } catch (err) {
      console.error(err);
      alert("❌ Não foi possível eliminar a frase. Tente novamente.");
    }
  }

  // Buscar Frases da Esteira do SUPABASE
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
    buscarSelosDoSupabase();
    buscarFrasesDoSupabase();
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
      validarImagem(arquivo);
      setMensagemStatus("⏳ Guardando diferencial e fazendo upload da imagem...");
      const nomeArquivo = `diferencial-${sanitizarNomeArquivo(arquivo.name)}`;

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
      console.error(err);
      setMensagemStatus("❌ Não foi possível salvar o diferencial. Tente novamente.");
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
      console.error(err);
      alert("❌ Não foi possível eliminar o diferencial. Tente novamente.");
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
      validarImagem(arquivo);
      setMensagemStatus("⏳ Publicando notícia...");
      const nomeArquivo = `noticia-${sanitizarNomeArquivo(arquivo.name)}`;

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
      console.error(err);
      setMensagemStatus("❌ Não foi possível publicar a notícia. Tente novamente.");
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
      console.error(err);
      alert("❌ Não foi possível eliminar a notícia. Tente novamente.");
    }
  }

  // Função para Editar Notícia
  function iniciarEdicaoNoticia(noticia) {
    setNoticiaEditando(noticia.id);
    setEditTitulo(noticia.titulo);
    setEditResumo(noticia.resumo);
    setEditTempoLeitura(noticia.tempoLeitura || 3);
    setEditDestaque(noticia.destaque || false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        validarImagem(arquivo);
        const nomeArquivo = `noticia-${sanitizarNomeArquivo(arquivo.name)}`;
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
      console.error(err);
      setMensagemStatus("❌ Não foi possível atualizar a notícia. Tente novamente.");
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
        alert("❌ Não foi possível guardar. Tente novamente.");
        return;
      }

      setNovaPerguntaFaq("");
      setNovaRespostaFaq("");

      alert("✅ FAQ adicionada com sucesso!");

      buscarFaqsAdmin();
    } catch (err) {
      console.error(err);
      alert("❌ Ocorreu um erro inesperado. Tente novamente.");
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

  // --- FUNÇÕES DE CONTATOS (formulário da Home) ---
  async function buscarContatosAdmin() {
    try {
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContatosAdmin(data || []);
    } catch (err) {
      console.error("Erro ao buscar contatos:", err);
    }
  }

  async function handleDeletarContato(id) {
    if (!window.confirm("Tem certeza que deseja excluir este contato?")) return;
    try {
      const { error } = await supabase.from('contatos').delete().eq('id', id);
      if (error) throw error;
      setContatosAdmin((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("❌ Não foi possível eliminar o contato. Tente novamente.");
    }
  }

  // --- FUNÇÕES DE MATRÍCULAS (formulário público /matricula) ---
  async function buscarMatriculasAdmin() {
    try {
      const { data, error } = await supabase
        .from('matriculas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMatriculasAdmin(data || []);
    } catch (err) {
      console.error("Erro ao buscar matrículas:", err);
    }
  }

  async function handleDeletarMatricula(id) {
    if (!window.confirm("Tem certeza que deseja excluir esta matrícula?")) return;
    try {
      const { error } = await supabase.from('matriculas').delete().eq('id', id);
      if (error) throw error;
      setMatriculasAdmin((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      alert("❌ Não foi possível eliminar a matrícula. Tente novamente.");
    }
  }

  // Os anexos ficam num bucket privado: gera um link temporário válido por 60s para abrir/baixar
  async function handleAbrirAnexoMatricula(caminhoArquivo) {
    try {
      const { data, error } = await supabase.storage
        .from('matriculas-anexos')
        .createSignedUrl(caminhoArquivo, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noreferrer');
    } catch (err) {
      console.error(err);
      alert("❌ Não foi possível abrir o anexo. Tente novamente.");
    }
  }

  // --- FUNÇÕES DE POP-UPS ---
  async function buscarPopupsAdmin() {
    try {
      const { data, error } = await supabase
        .from('popups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPopupsAdmin(data || []);
    } catch (err) {
      console.error("Erro ao buscar pop-ups:", err);
    }
  }

  useEffect(() => {
    buscarPopupsAdmin();
  }, []);

  // Abre o formulário em branco já com o modelo escolhido no seletor visual
  function iniciarNovoPopup(modeloChave) {
    const modelo = obterModeloPopup(modeloChave);
    const dadosIniciais = {};
    modelo.campos.forEach((campo) => { dadosIniciais[campo.nome] = ''; });
    setFormPopup({ titulo: '', modelo: modelo.chave, dados: dadosIniciais, ativo: false });
    setPopupEditando(null);
    setMostrarSeletorModeloPopup(false);
  }

  // Carrega um pop-up já cadastrado no formulário (o modelo fica fixo; pra trocar de
  // modelo é preciso excluir e criar de novo, já que os campos não são compatíveis entre si)
  function iniciarEdicaoPopup(popup) {
    setFormPopup({
      titulo: popup.titulo || '',
      modelo: popup.modelo,
      dados: { ...(popup.dados || {}) },
      ativo: popup.ativo,
    });
    setPopupEditando(popup.id);
    setMostrarSeletorModeloPopup(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarFormularioPopup() {
    setFormPopup(POPUP_FORM_INICIAL);
    setPopupEditando(null);
    setMostrarSeletorModeloPopup(false);
  }

  function atualizarCampoDadosPopup(nomeCampo, valor) {
    setFormPopup((prev) => ({ ...prev, dados: { ...prev.dados, [nomeCampo]: valor } }));
  }

  // Cria ou atualiza um pop-up: valida os campos obrigatórios do modelo escolhido, faz
  // upload de qualquer campo do tipo "imagem" que tenha um arquivo novo selecionado, e
  // salva tudo em `dados` (JSON) — igual ao padrão já usado em handleSubmitCurso.
  async function handleSubmitPopup(e) {
    e.preventDefault();
    const modelo = obterModeloPopup(formPopup.modelo);

    if (!formPopup.titulo.trim()) {
      setMensagemStatus("⚠️ O nome interno do pop-up é obrigatório!");
      return;
    }

    const campoFaltando = modelo.campos.find((campo) => {
      if (!campo.obrigatorio) return false;
      if (campo.tipo === 'imagem') {
        const jaTemImagem = !!formPopup.dados[campo.nome];
        const arquivoSelecionado = document.getElementById(`popup-campo-${campo.nome}`)?.files?.[0];
        return !jaTemImagem && !arquivoSelecionado;
      }
      return !String(formPopup.dados[campo.nome] || '').trim();
    });

    if (campoFaltando) {
      setMensagemStatus(`⚠️ Preencha o campo obrigatório: ${campoFaltando.rotulo}`);
      return;
    }

    try {
      setMensagemStatus(popupEditando ? "⏳ Atualizando pop-up..." : "⏳ Publicando pop-up...");

      const dadosFinais = { ...formPopup.dados };

      for (const campo of modelo.campos) {
        if (campo.tipo !== 'imagem') continue;
        const arquivoInput = document.getElementById(`popup-campo-${campo.nome}`);
        const arquivo = arquivoInput?.files?.[0];
        if (!arquivo) continue;

        validarImagem(arquivo);
        const nomeArquivo = `popup-${sanitizarNomeArquivo(arquivo.name)}`;
        const { error: uploadError } = await supabase.storage.from('banners').upload(nomeArquivo, arquivo);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('banners').getPublicUrl(nomeArquivo);
        dadosFinais[campo.nome] = urlData.publicUrl;
      }

      const registroPopup = {
        titulo: formPopup.titulo,
        modelo: modelo.chave,
        dados: dadosFinais,
        ativo: formPopup.ativo,
      };

      if (popupEditando) {
        const { error } = await supabase.from('popups').update(registroPopup).eq('id', popupEditando);
        if (error) throw error;
        setMensagemStatus("✅ Pop-up atualizado com sucesso!");
      } else {
        const { error } = await supabase.from('popups').insert([registroPopup]);
        if (error) throw error;
        setMensagemStatus("✅ Pop-up criado com sucesso! Ative-o na lista para exibir no site.");
      }

      cancelarFormularioPopup();
      buscarPopupsAdmin();
    } catch (err) {
      console.error(err);
      setMensagemStatus("❌ Não foi possível salvar o pop-up. Tente novamente.");
    }
  }

  async function handleAlternarAtivoPopup(popup) {
    try {
      const { error } = await supabase
        .from('popups')
        .update({ ativo: !popup.ativo })
        .eq('id', popup.id);
      if (error) throw error;
      buscarPopupsAdmin();
    } catch (err) {
      console.error(err);
      alert("❌ Não foi possível atualizar o pop-up. Tente novamente.");
    }
  }

  async function handleEliminarPopup(id) {
    if (!window.confirm("Tem a certeza que quer eliminar este pop-up?")) return;
    try {
      const { error } = await supabase.from('popups').delete().eq('id', id);
      if (error) throw error;
      if (popupEditando === id) cancelarFormularioPopup();
      buscarPopupsAdmin();
    } catch (err) {
      console.error(err);
      alert("❌ Não foi possível eliminar o pop-up. Tente novamente.");
    }
  }

  // Executa a busca assim que o modo admin for aberto
  useEffect(() => {
    if (modoAdmin) {
      buscarFaqsAdmin();
      buscarVagasAdmin();
      buscarContatosAdmin();
      buscarMatriculasAdmin();
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
      alert("❌ Não foi possível adicionar a vaga. Tente novamente.");
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
      validarImagem(arquivo);
      setMensagemStatus("⏳ Guardando depoimento e fazendo upload da capa...");
      const nomeArquivo = `depoimento-${sanitizarNomeArquivo(arquivo.name)}`;

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
          whatsapp: novoWhatsapp,
          foto_url: urlData.publicUrl
        }
      ]);

      if (insertError) throw insertError;

      setMensagemStatus("✅ Depoimento publicado com sucesso!");
      setNovoNomeAluno("");
      setNovoInstagram("");
      setNovoVideoUrl("");
      setNovoWhatsapp("");
      if (arquivoInput) arquivoInput.value = "";
      buscarDepoimentosDoSupabase();
    } catch (err) {
      console.error(err);
      setMensagemStatus("❌ Não foi possível salvar o depoimento. Tente novamente.");
    }
  }

  // Função para Editar Depoimento
  function iniciarEdicaoDepoimento(depoimento) {
    setDepoimentoEditando(depoimento.id);
    setEditNomeAluno(depoimento.nome || "");
    setEditInstagram(depoimento.instagram || "");
    setEditVideoUrl(depoimento.video_url || "");
    setEditWhatsapp(depoimento.whatsapp || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicaoDepoimento() {
    setDepoimentoEditando(null);
    setEditNomeAluno("");
    setEditInstagram("");
    setEditVideoUrl("");
    setEditWhatsapp("");
  }

  // Função para Salvar Edição de Depoimento
  async function handleSalvarEdicaoDepoimento(e) {
    e.preventDefault();

    if (!editNomeAluno.trim() || !editVideoUrl.trim()) {
      setMensagemStatus("⚠️ Nome do aluno e URL do vídeo são obrigatórios!");
      return;
    }

    try {
      setMensagemStatus("⏳ Atualizando depoimento...");
      const arquivoInput = document.getElementById('capa-depoimento-edit');
      const arquivo = arquivoInput?.files[0];

      const dadosAtualizados = {
        nome: editNomeAluno,
        instagram: editInstagram,
        video_url: editVideoUrl,
        whatsapp: editWhatsapp,
      };

      if (arquivo) {
        validarImagem(arquivo);
        const nomeArquivo = `depoimento-${sanitizarNomeArquivo(arquivo.name)}`;
        const { error: uploadError } = await supabase.storage.from('banners').upload(nomeArquivo, arquivo);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('banners').getPublicUrl(nomeArquivo);
        dadosAtualizados.foto_url = urlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('depoimentos')
        .update(dadosAtualizados)
        .eq('id', depoimentoEditando);

      if (updateError) throw updateError;

      setMensagemStatus("✅ Depoimento atualizado com sucesso!");
      cancelarEdicaoDepoimento();
      if (arquivoInput) arquivoInput.value = "";
      buscarDepoimentosDoSupabase();
    } catch (err) {
      console.error(err);
      setMensagemStatus("❌ Não foi possível atualizar o depoimento. Tente novamente.");
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
      console.error(err);
      alert("❌ Não foi possível eliminar o depoimento. Tente novamente.");
    }
  }

  // Função para Destacar/Remover Destaque de um Depoimento (máx. MAX_DEPOIMENTOS_DESTAQUE)
  async function handleAlternarDestaqueDepoimento(depoimento) {
    const totalDestacados = depoimentos.filter((d) => d.destaque).length;
    if (!depoimento.destaque && totalDestacados >= MAX_DEPOIMENTOS_DESTAQUE) {
      alert(`Você já tem ${MAX_DEPOIMENTOS_DESTAQUE} depoimentos em destaque. Remova um antes de adicionar outro.`);
      return;
    }
    try {
      const { error } = await supabase
        .from('depoimentos')
        .update({ destaque: !depoimento.destaque })
        .eq('id', depoimento.id);
      if (error) throw error;
      buscarDepoimentosDoSupabase();
    } catch (err) {
      console.error(err);
      alert("❌ Não foi possível atualizar o destaque. Tente novamente.");
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

  // --- CATEGORIAS DE CURSOS ---
  async function buscarCategoriasCursos() {
    try {
      const { data, error } = await supabase
        .from('categorias_cursos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setCategoriasCursos(data || []);
    } catch (err) {
      console.error("Erro ao buscar categorias de cursos:", err);
    }
  }

  useEffect(() => {
    buscarCategoriasCursos();
  }, []);

  async function handleAdicionarCategoriaCurso(e) {
    e.preventDefault();
    if (!novaCategoriaCursoNome.trim()) {
      setMensagemStatus("⚠️ O nome da categoria é obrigatório!");
      return;
    }
    try {
      const { error } = await supabase.from('categorias_cursos').insert([{ nome: novaCategoriaCursoNome.trim() }]);
      if (error) throw error;

      setMensagemStatus("✅ Categoria criada com sucesso!");
      setNovaCategoriaCursoNome("");
      buscarCategoriasCursos();
    } catch (err) {
      console.error(err);
      setMensagemStatus("❌ Não foi possível criar a categoria. Tente novamente.");
    }
  }

  async function handleEliminarCategoriaCurso(id) {
    if (!window.confirm("Tem a certeza que quer eliminar esta categoria? Os cursos associados ficarão sem categoria.")) return;
    try {
      const { error } = await supabase.from('categorias_cursos').delete().eq('id', id);
      if (error) throw error;
      buscarCategoriasCursos();
      buscarCursosAdmin();
    } catch (err) {
      console.error(err);
      alert("❌ Não foi possível eliminar a categoria. Tente novamente.");
    }
  }

  // --- CURSOS CADASTRADOS ---
  async function buscarCursosAdmin() {
    try {
      const { data, error } = await supabase
        .from('cursos_cadastrados')
        .select('*, categorias_cursos(nome)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCursosAdmin(data || []);
    } catch (err) {
      console.error("Erro ao buscar cursos cadastrados:", err);
    }
  }

  useEffect(() => {
    buscarCursosAdmin();
  }, []);

  function atualizarCampoFormCurso(campo, valor) {
    setFormCurso((prev) => ({ ...prev, [campo]: valor }));
  }

  function adicionarSemestre() {
    setFormCurso((prev) => ({
      ...prev,
      gradeCurricular: [
        ...prev.gradeCurricular,
        { titulo: `${prev.gradeCurricular.length + 1}º Semestre`, disciplinas: [{ nome: "", horas: "" }] },
      ],
    }));
  }

  function removerSemestre(indiceSemestre) {
    setFormCurso((prev) => ({
      ...prev,
      gradeCurricular: prev.gradeCurricular.filter((_, i) => i !== indiceSemestre),
    }));
  }

  function atualizarTituloSemestre(indiceSemestre, titulo) {
    setFormCurso((prev) => ({
      ...prev,
      gradeCurricular: prev.gradeCurricular.map((semestre, i) =>
        i === indiceSemestre ? { ...semestre, titulo } : semestre
      ),
    }));
  }

  function adicionarDisciplina(indiceSemestre) {
    setFormCurso((prev) => ({
      ...prev,
      gradeCurricular: prev.gradeCurricular.map((semestre, i) =>
        i === indiceSemestre
          ? { ...semestre, disciplinas: [...semestre.disciplinas, { nome: "", horas: "" }] }
          : semestre
      ),
    }));
  }

  function removerDisciplina(indiceSemestre, indiceDisciplina) {
    setFormCurso((prev) => ({
      ...prev,
      gradeCurricular: prev.gradeCurricular.map((semestre, i) =>
        i === indiceSemestre
          ? { ...semestre, disciplinas: semestre.disciplinas.filter((_, j) => j !== indiceDisciplina) }
          : semestre
      ),
    }));
  }

  function atualizarDisciplina(indiceSemestre, indiceDisciplina, campo, valor) {
    setFormCurso((prev) => ({
      ...prev,
      gradeCurricular: prev.gradeCurricular.map((semestre, i) =>
        i === indiceSemestre
          ? {
              ...semestre,
              disciplinas: semestre.disciplinas.map((disciplina, j) =>
                j === indiceDisciplina ? { ...disciplina, [campo]: valor } : disciplina
              ),
            }
          : semestre
      ),
    }));
  }

  function adicionarBlocoConteudo() {
    setFormCurso((prev) => ({
      ...prev,
      blocosConteudo: [...prev.blocosConteudo, { titulo: "", texto: "" }],
    }));
  }

  function removerBlocoConteudo(indiceBloco) {
    setFormCurso((prev) => ({
      ...prev,
      blocosConteudo: prev.blocosConteudo.filter((_, i) => i !== indiceBloco),
    }));
  }

  function atualizarBlocoConteudo(indiceBloco, campo, valor) {
    setFormCurso((prev) => ({
      ...prev,
      blocosConteudo: prev.blocosConteudo.map((bloco, i) =>
        i === indiceBloco ? { ...bloco, [campo]: valor } : bloco
      ),
    }));
  }

  function iniciarEdicaoCurso(curso) {
    setCursoEditando(curso.id);
    setFormCurso({
      titulo: curso.titulo || "",
      descricao: curso.descricao || "",
      duracao: curso.duracao || "",
      cargaHoraria: curso.carga_horaria || "",
      modalidade: curso.modalidade || "EAD",
      categoriaId: curso.categoria_id ? String(curso.categoria_id) : "",
      precoOriginal: curso.preco_original != null ? String(curso.preco_original) : "",
      preco: curso.preco != null ? String(curso.preco) : "",
      seloMec: curso.selo_mec ?? true,
      destaque: curso.destaque ?? false,
      maisVendido: curso.mais_vendido ?? false,
      gradeCurricular: parseGradeCurricular(curso.grade_curricular),
      blocosConteudo: parseBlocosConteudo(curso.blocos_conteudo),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicaoCurso() {
    setCursoEditando(null);
    setFormCurso(CURSO_FORM_INICIAL);
  }

  async function handleSubmitCurso(e) {
    e.preventDefault();

    if (!formCurso.titulo.trim() || !formCurso.descricao.trim()) {
      setMensagemStatus("⚠️ Preencha ao menos o título e a descrição do curso!");
      return;
    }

    if (formCurso.destaque) {
      const totalDestacados = cursosAdmin.filter((c) => c.destaque && c.id !== cursoEditando).length;
      if (totalDestacados >= MAX_CURSOS_DESTAQUE) {
        setMensagemStatus(`⚠️ Você já tem ${MAX_CURSOS_DESTAQUE} cursos em destaque. Remova um antes de adicionar outro.`);
        return;
      }
    }

    if (formCurso.maisVendido) {
      const totalMaisVendidos = cursosAdmin.filter((c) => c.mais_vendido && c.id !== cursoEditando).length;
      if (totalMaisVendidos >= MAX_CURSOS_MAIS_VENDIDOS) {
        setMensagemStatus(`⚠️ Você já tem ${MAX_CURSOS_MAIS_VENDIDOS} cursos marcados como mais vendidos. Remova um antes de adicionar outro.`);
        return;
      }
    }

    const arquivoInput = document.getElementById(cursoEditando ? 'imagem-curso-edit' : 'imagem-curso');
    const arquivo = arquivoInput?.files[0];

    if (!cursoEditando && !arquivo) {
      setMensagemStatus("⚠️ Selecione uma imagem para o curso!");
      return;
    }

    try {
      setMensagemStatus(cursoEditando ? "⏳ Atualizando curso..." : "⏳ Publicando curso...");

      let urlImagem = null;
      if (arquivo) {
        validarImagem(arquivo);
        const nomeArquivo = `curso-${sanitizarNomeArquivo(arquivo.name)}`;
        const { error: uploadError } = await supabase.storage.from('banners').upload(nomeArquivo, arquivo);
        if (uploadError) {
          console.error("Erro no upload da imagem do curso:", uploadError);
          throw new Error(`[upload da imagem] ${uploadError.message}`);
        }
        const { data: urlData } = supabase.storage.from('banners').getPublicUrl(nomeArquivo);
        urlImagem = urlData.publicUrl;
      }

      const dadosCurso = {
        titulo: formCurso.titulo,
        descricao: formCurso.descricao,
        duracao: formCurso.duracao,
        carga_horaria: formCurso.cargaHoraria,
        modalidade: formCurso.modalidade,
        categoria_id: formCurso.categoriaId ? Number(formCurso.categoriaId) : null,
        preco_original: formCurso.precoOriginal ? parseFloat(formCurso.precoOriginal) : null,
        preco: parseFloat(formCurso.preco) || 0,
        selo_mec: formCurso.seloMec,
        destaque: formCurso.destaque,
        mais_vendido: formCurso.maisVendido,
        grade_curricular: serializarGradeCurricular(formCurso.gradeCurricular),
        blocos_conteudo: serializarBlocosConteudo(formCurso.blocosConteudo),
      };
      if (urlImagem) dadosCurso.imagem_url = urlImagem;

      if (cursoEditando) {
        const { error } = await supabase.from('cursos_cadastrados').update(dadosCurso).eq('id', cursoEditando);
        if (error) {
          console.error("Erro ao atualizar cursos_cadastrados:", error);
          throw new Error('Não foi possível atualizar o curso.');
        }
        setMensagemStatus("✅ Curso atualizado com sucesso!");
      } else {
        const { error } = await supabase.from('cursos_cadastrados').insert([dadosCurso]);
        if (error) {
          console.error("Erro ao inserir em cursos_cadastrados:", error);
          throw new Error('Não foi possível publicar o curso.');
        }
        setMensagemStatus("✅ Curso publicado com sucesso!");
      }

      cancelarEdicaoCurso();
      if (arquivoInput) arquivoInput.value = "";
      buscarCursosAdmin();
    } catch (err) {
      console.error(err);
      setMensagemStatus("❌ Não foi possível salvar o curso. Tente novamente.");
    }
  }

  async function handleEliminarCurso(id) {
    if (!window.confirm("Tem a certeza que quer eliminar este curso?")) return;
    try {
      const { error } = await supabase.from('cursos_cadastrados').delete().eq('id', id);
      if (error) throw error;
      if (cursoEditando === id) cancelarEdicaoCurso();
      buscarCursosAdmin();
    } catch (err) {
      console.error(err);
      alert("❌ Não foi possível eliminar o curso. Tente novamente.");
    }
  }

  // Enquanto verifica se existe sessão Supabase válida, mostra um loading
  if (verificandoSessao) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#fed106]"></div>
      </div>
    );
  }

  // Sem sessão: o useEffect já redirecionou para /login
  if (!modoAdmin) return null;

  const irParaAba = (id) => {
    setAbaAtiva(id);
    setSidebarAberta(false);
  };

  const noticiasDestacadas = noticiasDestaque.filter((n) => n.destaque).length;
  const depoimentosComVideo = depoimentos.filter((d) => d.video_url).length;
  const depoimentosDestacados = depoimentos.filter((d) => d.destaque).length;
  const modeloPopupAtual = formPopup.modelo ? obterModeloPopup(formPopup.modelo) : null;

  // --- SE MODO ADMIN ESTIVER ATIVO, EXIBE O PAINEL ---
  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Fundo escuro ao abrir a sidebar no mobile */}
      {sidebarAberta && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-black text-white flex flex-col transform transition-transform duration-300 md:translate-x-0 ${
          sidebarAberta ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <img src={logo} alt="Estude Seguro" className="w-10 h-10 object-contain rounded-full bg-white p-1 shrink-0" />
          <div className="min-w-0">
            <p className="font-black text-sm leading-tight truncate">Estude Seguro</p>
            <p className="text-[10px] text-white/50 font-bold tracking-widest uppercase">Painel Administrativo</p>
          </div>
          <button
            onClick={() => setSidebarAberta(false)}
            className="ml-auto text-white/60 hover:text-white md:hidden cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {ITENS_MENU.map(({ id, label, Icon }) => {
            const ativo = abaAtiva === id;
            return (
              <button
                key={id}
                onClick={() => irParaAba(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                  ativo ? 'bg-[#fed106] text-black' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </button>
            );
          })}

          <p className="px-4 pt-4 pb-1 text-[10px] font-black uppercase tracking-widest text-white/30">Analytics</p>
          <a
            href="https://clarity.microsoft.com/projects/view/xir8032xu3/dashboard"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <ChartBarIcon className="w-5 h-5 shrink-0" />
            Microsoft Clarity
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 ml-auto text-white/40 shrink-0" />
          </a>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={async () => {
              saindoManualmente.current = true;
              await supabase.auth.signOut();
              navigate('/');
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* --- CONTEÚDO --- */}
      <div className="flex-1 md:ml-64 min-w-0 flex flex-col">
        {/* Barra superior no mobile */}
        <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30">
          <button onClick={() => setSidebarAberta(true)} className="p-1 text-gray-700 cursor-pointer">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <span className="font-black text-sm text-gray-900">Painel Administrativo</span>
          <div className="w-6" />
        </div>

        <main className="flex-1 p-5 md:p-8 max-w-6xl w-full mx-auto">

          {/* ================= DASHBOARD ================= */}
          {abaAtiva === 'dashboard' && (
            <>
              <div className="flex items-center justify-between mb-8 flex-wrap gap-2">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    Dashboard <SparklesIcon className="w-6 h-6 text-[#fed106]" />
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">Bem-vindo ao painel administrativo da Estude Seguro</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Última atualização</p>
                  <p className="text-xs text-gray-600 font-semibold">{new Date().toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
                <CardEstatistica label="Cursos (Catálogo)" valor={listaCursosGiga.length} subtitulo="Lista antiga" Icon={AcademicCapIcon} cor="bg-blue-500" />
                <CardEstatistica label="Cursos Cadastrados" valor={cursosAdmin.length} subtitulo={`${categoriasCursos.length} categorias`} Icon={TagIcon} cor="bg-indigo-500" />
                <CardEstatistica label="Posts no Blog" valor={noticiasDestaque.length} subtitulo={`${noticiasDestacadas} em destaque`} Icon={DocumentTextIcon} cor="bg-emerald-500" />
                <CardEstatistica label="Banners Ativos" valor={banners.length} subtitulo="Na Home" Icon={PhotoIcon} cor="bg-[#fed106]" />
                <CardEstatistica label="Depoimentos" valor={depoimentos.length} subtitulo="Publicados" Icon={ChatBubbleLeftRightIcon} cor="bg-orange-500" />
                <CardEstatistica label="Contatos" valor={contatosAdmin.length} subtitulo="Recebidos pela Home" Icon={EnvelopeIcon} cor="bg-teal-500" />
                <CardEstatistica label="Pop-ups" valor={popupsAdmin.length} subtitulo={`${popupsAdmin.filter((p) => p.ativo).length} ativo(s)`} Icon={MegaphoneIcon} cor="bg-rose-500" />
                <CardEstatistica label="Matrículas" valor={matriculasAdmin.length} subtitulo="Recebidas pelo formulário" Icon={DocumentTextIcon} cor="bg-violet-500" />
              </div>

              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                Ações Rápidas <span className="flex-1 h-px bg-gray-200" />
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CartaoAcaoRapida titulo="Gerenciar Cursos e Categorias" descricao="Adicionar, editar e organizar cursos por categoria" Icon={AcademicCapIcon} cor="bg-indigo-500" onClick={() => irParaAba('cursos')} />
                <CartaoAcaoRapida titulo="Gerenciar Banners" descricao="Atualizar banners e imagens da Home" Icon={PhotoIcon} cor="bg-[#fed106]" onClick={() => irParaAba('banners')} />
                <CartaoAcaoRapida titulo="Gerenciar Blog" descricao="Criar e editar notícias e artigos" Icon={NewspaperIcon} cor="bg-emerald-500" onClick={() => irParaAba('blog')} />
                <CartaoAcaoRapida titulo="Gerenciar Selos" descricao="Selos de confiança e reconhecimento" Icon={ShieldCheckIcon} cor="bg-blue-500" onClick={() => irParaAba('selos')} />
                <CartaoAcaoRapida titulo="Gerenciar Frases" descricao="Frases da esteira animada da Home" Icon={ChatBubbleBottomCenterTextIcon} cor="bg-cyan-500" onClick={() => irParaAba('frases')} />
                <CartaoAcaoRapida titulo="Gerenciar Diferenciais" descricao="Cards de diferenciais da Home" Icon={SparklesIcon} cor="bg-purple-500" onClick={() => irParaAba('diferenciais')} />
                <CartaoAcaoRapida titulo="Gerenciar Vagas" descricao="Publicar e remover vagas abertas" Icon={BriefcaseIcon} cor="bg-slate-600" onClick={() => irParaAba('vagas')} />
                <CartaoAcaoRapida titulo="Gerenciar FAQ" descricao="Perguntas frequentes do site" Icon={QuestionMarkCircleIcon} cor="bg-orange-500" onClick={() => irParaAba('faq')} />
                <CartaoAcaoRapida titulo="Gerenciar Depoimentos" descricao="Depoimentos em vídeo de alunos" Icon={ChatBubbleLeftRightIcon} cor="bg-pink-500" onClick={() => irParaAba('depoimentos')} />
                <CartaoAcaoRapida titulo="Gerenciar Contatos" descricao="Mensagens recebidas pelo formulário da Home" Icon={EnvelopeIcon} cor="bg-teal-500" onClick={() => irParaAba('contatos')} />
                <CartaoAcaoRapida titulo="Gerenciar Pop-ups" descricao="Avisos e promoções exibidos no site" Icon={MegaphoneIcon} cor="bg-rose-500" onClick={() => irParaAba('popups')} />
                <CartaoAcaoRapida titulo="Gerenciar Matrículas" descricao="Matrículas enviadas pelo formulário público" Icon={DocumentTextIcon} cor="bg-violet-500" onClick={() => irParaAba('matriculas')} />
              </div>
            </>
          )}

          {/* ================= CURSOS E CATEGORIAS ================= */}
          {abaAtiva === 'cursos' && (
            <>
              <CabecalhoPagina titulo="Cursos e Categorias" subtitulo="Cursos cadastrados aqui aparecem em cards na página /cursos, junto do catálogo antigo" Icon={AcademicCapIcon} />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <CardEstatistica label="Cursos Cadastrados" valor={cursosAdmin.length} Icon={AcademicCapIcon} cor="bg-indigo-500" />
                <CardEstatistica label="Categorias" valor={categoriasCursos.length} Icon={TagIcon} cor="bg-[#fed106]" />
                <CardEstatistica label="Em Destaque (Home)" valor={`${cursosAdmin.filter((c) => c.destaque).length}/${MAX_CURSOS_DESTAQUE}`} Icon={StarIcon} cor="bg-[#fed106]" />
                <CardEstatistica label="Mais Vendidos (Home)" valor={`${cursosAdmin.filter((c) => c.mais_vendido).length}/${MAX_CURSOS_MAIS_VENDIDOS}`} Icon={StarIcon} cor="bg-emerald-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* --- COLUNA ESQUERDA: CATEGORIAS + FORMULÁRIO DE CURSO --- */}
                <div className="md:col-span-1 flex flex-col gap-6">

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide flex items-center gap-2">
                      <TagIcon className="w-4 h-4 text-[#8a6d00]" /> Categorias
                    </h3>
                    <form onSubmit={handleAdicionarCategoriaCurso} className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={novaCategoriaCursoNome}
                        onChange={(e) => setNovaCategoriaCursoNome(e.target.value)}
                        placeholder="Ex: EJA, Técnico, Livre"
                        className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106]"
                      />
                      <button type="submit" className="bg-[#fed106] hover:bg-black hover:text-white text-black font-black text-xs px-4 rounded-xl uppercase tracking-wider transition-colors cursor-pointer shrink-0">
                        ➕
                      </button>
                    </form>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {categoriasCursos.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Nenhuma categoria criada ainda.</p>
                      ) : (
                        categoriasCursos.map((cat) => (
                          <div key={cat.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                            <span className="text-xs font-bold text-gray-700">{cat.nome}</span>
                            <button
                              onClick={() => handleEliminarCategoriaCurso(cat.id)}
                              className="text-red-500 hover:text-red-600 text-xs font-bold cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-black uppercase text-gray-800 tracking-wide">
                        {cursoEditando ? "✏️ Editar Curso" : "🎓 Novo Curso"}
                      </h3>
                      {cursoEditando && (
                        <button
                          type="button"
                          onClick={cancelarEdicaoCurso}
                          className="text-[10px] uppercase bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSubmitCurso} className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Título do Curso</label>
                        <input
                          type="text"
                          value={formCurso.titulo}
                          onChange={(e) => atualizarCampoFormCurso('titulo', e.target.value)}
                          placeholder="Ex: EJA - Ensino Fundamental"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Descrição</label>
                        <textarea
                          rows="3"
                          value={formCurso.descricao}
                          onChange={(e) => atualizarCampoFormCurso('descricao', e.target.value)}
                          placeholder="Sobre o curso..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106] resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Duração</label>
                          <input
                            type="text"
                            value={formCurso.duracao}
                            onChange={(e) => atualizarCampoFormCurso('duracao', e.target.value)}
                            placeholder="Ex: 3 a 6 meses"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#fed106]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Carga Horária</label>
                          <input
                            type="text"
                            value={formCurso.cargaHoraria}
                            onChange={(e) => atualizarCampoFormCurso('cargaHoraria', e.target.value)}
                            placeholder="Ex: 800h"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#fed106]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Modalidade</label>
                          <select
                            value={formCurso.modalidade}
                            onChange={(e) => atualizarCampoFormCurso('modalidade', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#fed106]"
                          >
                            <option value="EAD">EAD</option>
                            <option value="Presencial">Presencial</option>
                            <option value="Semipresencial">Semipresencial</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Categoria</label>
                          <select
                            value={formCurso.categoriaId}
                            onChange={(e) => atualizarCampoFormCurso('categoriaId', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#fed106]"
                          >
                            <option value="">Sem categoria</option>
                            {categoriasCursos.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.nome}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Preço Original (opcional)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formCurso.precoOriginal}
                            onChange={(e) => atualizarCampoFormCurso('precoOriginal', e.target.value)}
                            placeholder="Ex: 999"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#fed106]"
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Aparece riscado. Deixe em branco para não exibir.</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Preço Atual (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formCurso.preco}
                            onChange={(e) => atualizarCampoFormCurso('preco', e.target.value)}
                            placeholder="Ex: 699"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#fed106]"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="curso-selo-mec"
                          checked={formCurso.seloMec}
                          onChange={(e) => atualizarCampoFormCurso('seloMec', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                        />
                        <label htmlFor="curso-selo-mec" className="text-xs text-gray-500 font-bold uppercase">Exibir selo MEC</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="curso-destaque"
                          checked={formCurso.destaque}
                          onChange={(e) => atualizarCampoFormCurso('destaque', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                        />
                        <label htmlFor="curso-destaque" className="text-xs text-gray-500 font-bold uppercase">Destacar na Home (máx. {MAX_CURSOS_DESTAQUE})</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="curso-mais-vendido"
                          checked={formCurso.maisVendido}
                          onChange={(e) => atualizarCampoFormCurso('maisVendido', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                        />
                        <label htmlFor="curso-mais-vendido" className="text-xs text-gray-500 font-bold uppercase">Mais Vendido (máx. {MAX_CURSOS_MAIS_VENDIDOS})</label>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-gray-500 font-bold uppercase">Grade Curricular</label>
                          <button
                            type="button"
                            onClick={adicionarSemestre}
                            className="text-[10px] uppercase bg-[#fed106]/15 hover:bg-[#fed106]/30 text-[#8a6d00] px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer"
                          >
                            + Semestre
                          </button>
                        </div>

                        {formCurso.gradeCurricular.length === 0 ? (
                          <p className="text-xs text-gray-400 italic bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-3">
                            Nenhum semestre adicionado ainda.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {formCurso.gradeCurricular.map((semestre, sIdx) => (
                              <div key={sIdx} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={semestre.titulo}
                                    onChange={(e) => atualizarTituloSemestre(sIdx, e.target.value)}
                                    placeholder="Ex: 1º Semestre"
                                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#fed106]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removerSemestre(sIdx)}
                                    className="text-red-500 hover:text-red-600 text-xs font-bold px-2 cursor-pointer shrink-0"
                                  >
                                    ✕
                                  </button>
                                </div>

                                <div className="flex flex-col gap-2 mb-2">
                                  {semestre.disciplinas.map((disciplina, dIdx) => (
                                    <div key={dIdx} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={disciplina.nome}
                                        onChange={(e) => atualizarDisciplina(sIdx, dIdx, 'nome', e.target.value)}
                                        placeholder="Nome da disciplina"
                                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#fed106]"
                                      />
                                      <input
                                        type="text"
                                        value={disciplina.horas}
                                        onChange={(e) => atualizarDisciplina(sIdx, dIdx, 'horas', e.target.value)}
                                        placeholder="Horas"
                                        className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#fed106] shrink-0"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removerDisciplina(sIdx, dIdx)}
                                        className="text-red-500 hover:text-red-600 text-xs font-bold px-1 cursor-pointer shrink-0"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => adicionarDisciplina(sIdx)}
                                  className="text-[10px] uppercase text-[#8a6d00] hover:text-black font-bold cursor-pointer"
                                >
                                  + Disciplina
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-gray-500 font-bold uppercase">Entenda Como Vai Funcionar o Curso</label>
                          <button
                            type="button"
                            onClick={adicionarBlocoConteudo}
                            className="text-[10px] uppercase bg-[#fed106]/15 hover:bg-[#fed106]/30 text-[#8a6d00] px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer"
                          >
                            + Texto
                          </button>
                        </div>

                        {formCurso.blocosConteudo.length === 0 ? (
                          <p className="text-xs text-gray-400 italic bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-3">
                            Nenhum texto adicionado ainda.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {formCurso.blocosConteudo.map((bloco, bIdx) => (
                              <div key={bIdx} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={bloco.titulo}
                                    onChange={(e) => atualizarBlocoConteudo(bIdx, 'titulo', e.target.value)}
                                    placeholder="Ex: Curso Técnico em Eletrotécnica EAD: O que é"
                                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#fed106]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removerBlocoConteudo(bIdx)}
                                    className="text-red-500 hover:text-red-600 text-xs font-bold px-2 cursor-pointer shrink-0"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <textarea
                                  rows="4"
                                  value={bloco.texto}
                                  onChange={(e) => atualizarBlocoConteudo(bIdx, 'texto', e.target.value)}
                                  placeholder="Texto explicativo sobre o curso..."
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#fed106] resize-none"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">
                          {cursoEditando ? "Nova Imagem (Opcional)" : "Imagem de Capa"}
                        </label>
                        <input
                          type="file"
                          id={cursoEditando ? "imagem-curso-edit" : "imagem-curso"}
                          accept="image/*"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 file:bg-[#fed106] file:text-black file:border-0 file:rounded-full file:px-3 file:py-1 file:text-xs file:font-bold cursor-pointer"
                        />
                      </div>
                      <button type="submit" className="w-full bg-[#fed106] hover:bg-black hover:text-white text-black font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer">
                        {cursoEditando ? "💾 Salvar Alterações" : "➕ Publicar Curso"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* --- COLUNA DIREITA: CURSOS CADASTRADOS --- */}
                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Cursos Cadastrados ({cursosAdmin.length})</h3>
                  {cursosAdmin.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <AcademicCapIcon className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="font-black text-gray-700 text-sm">Nenhum curso cadastrado</p>
                      <p className="text-xs text-gray-400 mt-1">Use o formulário ao lado para publicar o primeiro curso</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[42rem] overflow-y-auto">
                      {cursosAdmin.map((curso) => (
                        <div key={curso.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-start gap-4 relative shadow-sm">
                          <img src={curso.imagem_url} alt="" className="w-20 h-20 object-cover rounded-lg bg-gray-200 shrink-0" />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="text-sm font-bold text-gray-800 truncate">{curso.titulo}</p>
                              {curso.categorias_cursos?.nome && (
                                <span className="text-[9px] font-extrabold bg-white text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                                  {curso.categorias_cursos.nome}
                                </span>
                              )}
                              {curso.destaque && (
                                <span className="text-[9px] font-extrabold bg-[#fed106]/15 text-[#8a6d00] px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                                  ⭐ Destaque
                                </span>
                              )}
                              {curso.mais_vendido && (
                                <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                                  🔥 Mais Vendido
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{curso.descricao}</p>
                            <div className="flex gap-2 mt-2 text-[11px] text-gray-500 flex-wrap">
                              <span>{curso.duracao || '-'}</span>
                              <span>•</span>
                              <span>{curso.carga_horaria || '-'}</span>
                              <span>•</span>
                              <span>{curso.modalidade}</span>
                              <span>•</span>
                              <span className="font-bold text-gray-700">R$ {(curso.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => iniciarEdicaoCurso(curso)}
                              className="bg-blue-600 hover:bg-blue-700 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleEliminarCurso(curso.id)}
                              className="bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ================= BANNERS ================= */}
          {abaAtiva === 'banners' && (
            <>
              <CabecalhoPagina titulo="Gerenciar Banners" subtitulo="Banners rotativos exibidos no topo da Home" Icon={PhotoIcon} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Novo Banner</h3>
                  <form onSubmit={handleAdicionarBanner} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Título (Opcional)</label>
                      <input type="text" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} placeholder="Ex: Novas Matrículas" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106]" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Arquivo de Imagem</label>
                      <input type="file" id="arquivo-banner" accept="image/*" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 file:bg-[#fed106] file:text-black file:border-0 file:rounded-full file:px-3 file:py-1 file:text-xs file:font-bold cursor-pointer" />
                    </div>
                    <button type="submit" className="w-full bg-[#fed106] hover:bg-black hover:text-white text-black font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer">➕ Publicar Banner</button>
                  </form>
                </div>
                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Banners Ativos ({banners.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {banners.map((b) => (
                      <div key={b.id} className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden relative shadow-sm">
                        <img src={b.imagem_url} alt="" className="w-full h-32 object-cover" />
                        <button onClick={() => handleEliminarBanner(b.id)} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer">✕</button>
                        <div className="p-3 text-left truncate text-xs font-bold text-gray-700">{b.titulo || "Sem Título"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= SELOS ================= */}
          {abaAtiva === 'selos' && (
            <>
              <CabecalhoPagina titulo="Gerenciar Selos" subtitulo="Selos de confiança e reconhecimento exibidos na Home" Icon={ShieldCheckIcon} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Novo Selo / Parceiro</h3>
                  <form onSubmit={handleAdicionarSelo} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Nome da Empresa/Selo</label>
                      <input type="text" value={novoNomeSelo} onChange={(e) => setNovoNomeSelo(e.target.value)} placeholder="Ex: MEC ou Empresa Parceira" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106]" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Logo (Do PC)</label>
                      <input type="file" id="imagem-selo" accept="image/*" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 file:bg-[#fed106] file:text-black file:border-0 file:rounded-full file:px-3 file:py-1 file:text-xs file:font-bold cursor-pointer" />
                    </div>
                    <button type="submit" className="w-full bg-[#fed106] hover:bg-black hover:text-white text-black font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer">➕ Publicar Selo</button>
                  </form>
                </div>
                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Selos Ativos ({listaSelos.length})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {listaSelos.map((s) => (
                      <div key={s.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-between relative shadow-sm h-36">
                        <button onClick={() => handleEliminarSelo(s.id)} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer">✕</button>
                        <div className="flex-1 flex items-center justify-center w-full">
                          <img src={s.imagem_url} alt="" className="h-12 w-auto object-contain" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-600 text-center truncate w-full mt-2">{s.nome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= FRASES (ESTEIRA) ================= */}
          {abaAtiva === 'frases' && (
            <>
              <CabecalhoPagina titulo="Gerenciar Frases" subtitulo="Frases exibidas na esteira animada da Home" Icon={ChatBubbleBottomCenterTextIcon} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Nova Frase</h3>
                  <form onSubmit={handleAdicionarFrase} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Texto da Frase</label>
                      <input type="text" value={novoTextoFrase} onChange={(e) => setNovoTextoFrase(e.target.value)} placeholder="Ex: Certificado reconhecido pelo MEC" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106]" />
                    </div>
                    <button type="submit" className="w-full bg-[#fed106] hover:bg-black hover:text-white text-black font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer">➕ Publicar Frase</button>
                  </form>
                </div>
                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Frases Ativas ({listaFrases.length})</h3>
                  <div className="space-y-2">
                    {listaFrases.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Nenhuma frase cadastrada ainda.</p>
                    ) : (
                      listaFrases.map((f) => (
                        <div key={f.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-xs">
                          <p className="text-sm font-bold text-gray-700 truncate pr-4">{f.texto}</p>
                          <button onClick={() => handleEliminarFrase(f.id)} className="shrink-0 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer">✕</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= DIFERENCIAIS ================= */}
          {abaAtiva === 'diferenciais' && (
            <>
              <CabecalhoPagina titulo="Gerenciar Diferenciais" subtitulo="Cards de diferenciais exibidos na Home" Icon={SparklesIcon} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Novo Diferencial</h3>
                  <form onSubmit={handleAdicionarDiferencial} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Título do Diferencial</label>
                      <input
                        type="text"
                        value={novoTituloDiferencial}
                        onChange={(e) => setNovoTituloDiferencial(e.target.value)}
                        placeholder="Ex: Suporte 24/7 ou Metodologia Ativa"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Imagem Ilustrativa (Do PC)</label>
                      <input
                        type="file"
                        id="imagem-diferencial"
                        accept="image/*"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 file:bg-[#fed106] file:text-black file:border-0 file:rounded-full file:px-3 file:py-1 file:text-xs file:font-bold cursor-pointer"
                      />
                    </div>
                    <button type="submit" className="w-full bg-[#fed106] hover:bg-black hover:text-white text-black font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer">➕ Publicar Diferencial</button>
                  </form>
                </div>

                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Diferenciais Ativos ({listaDiferenciais.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {listaDiferenciais.map((d) => (
                      <div key={d.id} className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden relative shadow-sm flex items-center p-3 gap-4">
                        <img src={d.fotoUrl} alt="" className="w-16 h-16 object-cover rounded-lg bg-gray-200 shrink-0" />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-black text-gray-800 truncate">{d.titulo}</p>
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
            </>
          )}

          {/* ================= BLOG (NOTÍCIAS) ================= */}
          {abaAtiva === 'blog' && (
            <>
              <CabecalhoPagina titulo="Gerenciar Blog" subtitulo="Gerencie seus posts, notícias e matérias" Icon={NewspaperIcon} />

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <CardEstatistica label="Total" valor={noticiasDestaque.length} Icon={DocumentTextIcon} cor="bg-blue-500" />
                <CardEstatistica label="Destaques" valor={noticiasDestacadas} Icon={SparklesIcon} cor="bg-[#fed106]" />
                <CardEstatistica label="Sem Destaque" valor={noticiasDestaque.length - noticiasDestacadas} Icon={NewspaperIcon} cor="bg-slate-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase text-gray-800 tracking-wide">
                      {noticiaEditando ? "✏️ Editar Notícia" : "📝 Nova Notícia"}
                    </h3>
                    {noticiaEditando && (
                      <button
                        type="button"
                        onClick={() => { setNoticiaEditando(null); setEditTitulo(""); setEditResumo(""); setEditTempoLeitura(""); setEditDestaque(false); }}
                        className="text-[10px] uppercase bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>

                  <form onSubmit={noticiaEditando ? handleSalvarEdicaoNoticia : handleAdicionarNoticia} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Título da Notícia</label>
                      <input
                        type="text"
                        value={noticiaEditando ? editTitulo : novoTituloNoticia}
                        onChange={(e) => noticiaEditando ? setEditTitulo(e.target.value) : setNovoTituloNoticia(e.target.value)}
                        placeholder="Ex: Novo curso aberto!"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Breve Resumo</label>
                      <textarea
                        rows="3"
                        value={noticiaEditando ? editResumo : novoResumoNoticia}
                        onChange={(e) => noticiaEditando ? setEditResumo(e.target.value) : setNovoResumoNoticia(e.target.value)}
                        placeholder="Ex: Inscrições abertas..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106] resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">
                        {noticiaEditando ? "Nova Imagem (Opcional)" : "Imagem de Capa"}
                      </label>
                      <input
                        type="file"
                        id={noticiaEditando ? "imagem-noticia-edit" : "imagem-noticia"}
                        accept="image/*"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 file:bg-[#fed106] file:text-black file:border-0 file:rounded-full file:px-3 file:py-1 file:text-xs file:font-bold cursor-pointer"
                        required={!noticiaEditando}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Tempo de Leitura (minutos)</label>
                      <input
                        type="number"
                        value={noticiaEditando ? editTempoLeitura : novoTempoLeitura}
                        onChange={(e) => noticiaEditando ? setEditTempoLeitura(e.target.value) : setNovoTempoLeitura(e.target.value)}
                        placeholder="Ex: 5"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="destaque-noticia"
                        checked={noticiaEditando ? editDestaque : novaNoticiaDestaque}
                        onChange={(e) => noticiaEditando ? setEditDestaque(e.target.checked) : setNovaNoticiaDestaque(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                      <label htmlFor="destaque-noticia" className="text-xs text-gray-500 font-bold uppercase">Marcar como Destaque</label>
                    </div>
                    <button type="submit" className="w-full bg-[#fed106] hover:bg-black hover:text-white text-black font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer">
                      {noticiaEditando ? "💾 Salvar Alterações" : "➕ Publicar Notícia"}
                    </button>
                  </form>
                </div>

                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Notícias Publicadas ({noticiasDestaque.length})</h3>
                  <div className="space-y-3 max-h-[32rem] overflow-y-auto">
                    {noticiasDestaque.map((n) => (
                      <div key={n.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-start gap-4 relative shadow-sm">
                        <img src={n.fotoUrl} alt="" className="w-20 h-20 object-cover rounded-lg bg-gray-200 shrink-0" />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-bold text-gray-800 truncate">{n.titulo}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{n.resumo}</p>
                          <div className="flex gap-2 mt-2 text-[11px] text-gray-400">
                            <span>{n.tempoLeitura} min</span>
                            <span>•</span>
                            <span>{n.dataCriacao}</span>
                            {n.destaque && <span className="text-[#8a6d00] font-bold">⭐ Destaque</span>}
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
            </>
          )}

          {/* ================= VAGAS ================= */}
          {abaAtiva === 'vagas' && (
            <>
              <CabecalhoPagina titulo="Gerenciar Vagas" subtitulo="Vagas de emprego exibidas na página Vagas" Icon={BriefcaseIcon} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Nova Vaga</h3>
                  <form onSubmit={handleAdicionarVaga} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Título da Vaga"
                      value={novaVagaTitulo}
                      onChange={(e) => setNovaVagaTitulo(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#fed106]"
                      required
                    />
                    <select
                      value={novaVagaDepartamento}
                      onChange={(e) => setNovaVagaDepartamento(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-hidden focus:border-[#fed106]"
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
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#fed106]"
                    />
                    <select
                      value={novaVagaTipoContrato}
                      onChange={(e) => setNovaVagaTipoContrato(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-hidden focus:border-[#fed106]"
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
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#fed106]"
                      required
                    />
                    <input
                      type="url"
                      placeholder="Link do Formulário (Opcional)"
                      value={novaVagaLink}
                      onChange={(e) => setNovaVagaLink(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#fed106]"
                    />
                    <button
                      type="submit"
                      className="w-full bg-[#fed106] hover:bg-black hover:text-white text-black text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      Adicionar Vaga
                    </button>
                  </form>
                </div>

                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Vagas Cadastradas ({vagasAdmin.length})</h3>
                  <div className="space-y-2">
                    {vagasAdmin.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Nenhuma vaga cadastrada.</p>
                    ) : (
                      vagasAdmin.map(vaga => (
                        <div key={vaga.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-xs">
                          <div className="flex-1">
                            <strong className="text-xs text-gray-800 font-medium">{vaga.titulo}</strong>
                            <p className="text-[10px] text-gray-400">{vaga.departamento} • {vaga.tipo_contrato}</p>
                          </div>
                          <button
                            onClick={() => handleDeletarVaga(vaga.id)}
                            className="text-red-500 hover:text-red-600 text-xs font-bold uppercase px-2 py-1 transition-colors cursor-pointer"
                          >
                            Excluir
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= FAQ ================= */}
          {abaAtiva === 'faq' && (
            <>
              <CabecalhoPagina titulo="Gerenciar FAQ" subtitulo="Perguntas frequentes exibidas no site" Icon={QuestionMarkCircleIcon} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Nova Pergunta</h3>
                  <form onSubmit={handleAdicionarFaq} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tópico / Categoria</label>
                      <select
                        value={novoTopicofaq}
                        onChange={(e) => setNovoTopicofaq(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-hidden focus:border-[#fed106]"
                      >
                        <option value="Geral">Geral</option>
                        <option value="Cursos">Cursos</option>
                        <option value="Inscrições">Inscrições</option>
                        <option value="Certificados">Certificados</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Pergunta</label>
                      <input
                        type="text"
                        placeholder="Ex: Como funciona a emissão do certificado?"
                        value={novaPerguntafaq}
                        onChange={(e) => setNovaPerguntaFaq(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#fed106]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Resposta</label>
                      <textarea
                        rows="3"
                        placeholder="Digite a resposta detalhada aqui..."
                        value={novaRespostafaq}
                        onChange={(e) => setNovaRespostaFaq(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#fed106]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-[#fed106] hover:bg-black hover:text-white text-black text-[11px] font-black uppercase tracking-wider px-5 py-3 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      Adicionar ao FAQ
                    </button>
                  </form>
                </div>

                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Perguntas Cadastradas ({faqsAdmin.length})</h3>
                  <div className="space-y-2">
                    {faqsAdmin.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Nenhuma pergunta cadastrada.</p>
                    ) : (
                      faqsAdmin.map(faq => (
                        <div key={faq.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-xs">
                          <div className="pr-4 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <span className="text-[9px] font-extrabold bg-white text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                              {faq.topico}
                            </span>
                            <strong className="text-xs text-gray-800 font-medium">{faq.pergunta}</strong>
                          </div>
                          <button
                            onClick={() => handleDeletarFaq(faq.id)}
                            className="text-red-500 hover:text-red-600 text-xs font-bold uppercase px-2 py-1 transition-colors cursor-pointer shrink-0"
                          >
                            Excluir
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= DEPOIMENTOS ================= */}
          {abaAtiva === 'depoimentos' && (
            <>
              <CabecalhoPagina titulo="Depoimentos dos Alunos" subtitulo='Gerencie os depoimentos exibidos na seção "Depoimentos"' Icon={ChatBubbleLeftRightIcon} />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <CardEstatistica label="Total de Depoimentos" valor={depoimentos.length} Icon={ChatBubbleLeftRightIcon} cor="bg-pink-500" />
                <CardEstatistica label="Com Vídeo" valor={depoimentosComVideo} Icon={SparklesIcon} cor="bg-emerald-500" />
                <CardEstatistica label="Sem Vídeo" valor={depoimentos.length - depoimentosComVideo} Icon={NewspaperIcon} cor="bg-slate-500" />
                <CardEstatistica label="Em Destaque (Home)" valor={`${depoimentosDestacados}/${MAX_DEPOIMENTOS_DESTAQUE}`} Icon={StarIcon} cor="bg-[#fed106]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase text-gray-800 tracking-wide">
                      {depoimentoEditando ? "✏️ Editar Depoimento" : "Novo Depoimento"}
                    </h3>
                    {depoimentoEditando && (
                      <button
                        type="button"
                        onClick={cancelarEdicaoDepoimento}
                        className="text-[10px] uppercase bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                  <form onSubmit={depoimentoEditando ? handleSalvarEdicaoDepoimento : handleAdicionarDepoimento} className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Nome do Aluno</label>
                      <input
                        type="text"
                        value={depoimentoEditando ? editNomeAluno : novoNomeAluno}
                        onChange={(e) => depoimentoEditando ? setEditNomeAluno(e.target.value) : setNovoNomeAluno(e.target.value)}
                        placeholder="Ex: Maria Silva"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Instagram (Opcional)</label>
                      <input
                        type="text"
                        value={depoimentoEditando ? editInstagram : novoInstagram}
                        onChange={(e) => depoimentoEditando ? setEditInstagram(e.target.value) : setNovoInstagram(e.target.value)}
                        placeholder="Ex: @maria_silva"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Link do Vídeo (YouTube/Drive)</label>
                      <input
                        type="text"
                        value={depoimentoEditando ? editVideoUrl : novoVideoUrl}
                        onChange={(e) => depoimentoEditando ? setEditVideoUrl(e.target.value) : setNovoVideoUrl(e.target.value)}
                        placeholder="https://youtube.com/..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">WhatsApp (Opcional)</label>
                      <input
                        type="text"
                        value={depoimentoEditando ? editWhatsapp : novoWhatsapp}
                        onChange={(e) => depoimentoEditando ? setEditWhatsapp(e.target.value) : setNovoWhatsapp(e.target.value)}
                        placeholder="Ex: 27998392172"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">
                        {depoimentoEditando ? "Nova Foto de Capa (Opcional)" : "Foto de Capa (Do PC)"}
                      </label>
                      <input
                        type="file"
                        id={depoimentoEditando ? "capa-depoimento-edit" : "capa-depoimento"}
                        accept="image/*"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 file:bg-[#fed106] file:text-black file:border-0 file:rounded-full file:px-3 file:py-1 file:text-xs file:font-bold cursor-pointer"
                      />
                    </div>
                    <button type="submit" className="w-full bg-[#fed106] hover:bg-black hover:text-white text-black font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer">
                      {depoimentoEditando ? "💾 Salvar Alterações" : "➕ Publicar Depoimento"}
                    </button>
                  </form>
                </div>
                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Depoimentos Publicados ({depoimentos.length})</h3>
                  {depoimentos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <ChatBubbleLeftRightIcon className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="font-black text-gray-700 text-sm">Nenhum depoimento cadastrado</p>
                      <p className="text-xs text-gray-400 mt-1">Adicione depoimentos de alunos para exibir na Home</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {depoimentos.map((d) => (
                        <div key={d.id} className={`bg-gray-50 border rounded-xl overflow-hidden relative shadow-sm ${d.destaque ? 'border-[#fed106] ring-2 ring-[#fed106]/40' : 'border-gray-100'}`}>
                          <img src={d.foto_url} alt="" className="w-full h-40 object-cover" />
                          <button onClick={() => iniciarEdicaoDepoimento(d)} title="Editar depoimento" className="absolute top-2 right-11 bg-blue-600 hover:bg-blue-700 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer">✎</button>
                          <button onClick={() => handleEliminarDepoimento(d.id)} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer">✕</button>
                          <button
                            onClick={() => handleAlternarDestaqueDepoimento(d)}
                            title={d.destaque ? 'Remover destaque' : `Destacar na Home (máx. ${MAX_DEPOIMENTOS_DESTAQUE})`}
                            className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer shadow-sm transition-colors ${
                              d.destaque ? 'bg-[#fed106] text-black' : 'bg-white/90 text-gray-400 hover:text-[#fed106]'
                            }`}
                          >
                            {d.destaque ? <StarIconSolido className="w-4 h-4" /> : <StarIcon className="w-4 h-4" />}
                          </button>
                          <div className="p-2.5 text-left bg-white">
                            <p className="text-xs font-black text-gray-800 truncate">{d.nome}</p>
                            <p className="text-[10px] text-gray-400 truncate">{d.instagram || 'Sem Instagram'}</p>
                            {d.destaque && (
                              <p className="text-[9px] font-black text-[#8a6d00] uppercase tracking-wide mt-1">★ Em destaque na Home</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ================= POP-UPS ================= */}
          {abaAtiva === 'popups' && (
            <>
              <CabecalhoPagina titulo="Gerenciar Pop-ups" subtitulo="Escolha um modelo, preencha os dados e ative para exibir no site." Icon={MegaphoneIcon} />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <CardEstatistica label="Pop-ups Cadastrados" valor={popupsAdmin.length} Icon={MegaphoneIcon} cor="bg-rose-500" />
                <CardEstatistica label="Ativos" valor={popupsAdmin.filter((p) => p.ativo).length} Icon={MegaphoneIcon} cor="bg-[#fed106]" />
                <CardEstatistica label="Modelos Disponíveis" valor={MODELOS_POPUP.length} Icon={SparklesIcon} cor="bg-indigo-500" />
              </div>

              {!formPopup.modelo && !mostrarSeletorModeloPopup && (
                <button
                  type="button"
                  onClick={() => setMostrarSeletorModeloPopup(true)}
                  className="mb-6 inline-flex items-center gap-2 bg-[#fed106] hover:bg-black hover:text-white text-black font-black text-xs px-5 py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                >
                  ➕ Novo Pop-up
                </button>
              )}

              {/* SELETOR DE MODELOS: cada card usa o componente real do modelo (em miniatura),
                  então a prévia aqui é sempre fiel ao que vai aparecer no site */}
              {mostrarSeletorModeloPopup && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase text-gray-800 tracking-wide">Escolha um modelo</h3>
                    <button type="button" onClick={() => setMostrarSeletorModeloPopup(false)} className="text-[10px] uppercase bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer">
                      Cancelar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {MODELOS_POPUP.map((modelo) => (
                      // A miniatura renderiza o Componente real do modelo (que pode ter seu próprio
                      // <button> interno, ex. o CTA) — por isso o card clicável usa role="button" em
                      // vez de <button>, evitando aninhar elementos interativos (HTML inválido).
                      <div
                        key={modelo.chave}
                        role="button"
                        tabIndex={0}
                        onClick={() => iniciarNovoPopup(modelo.chave)}
                        onKeyDown={(e) => e.key === 'Enter' && iniciarNovoPopup(modelo.chave)}
                        className="flex flex-col text-left bg-gray-50 hover:bg-white border border-gray-200 hover:border-[#fed106] rounded-2xl overflow-hidden transition-all cursor-pointer group"
                      >
                        <div className="relative h-40 bg-gray-100 overflow-hidden flex items-center justify-center">
                          <div className="origin-top scale-[0.4] w-[340px] pointer-events-none mt-2">
                            <modelo.Componente dados={modelo.dadosExemplo} />
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <modelo.Icon className="w-4 h-4 text-[#8a6d00] shrink-0" />
                            <p className="text-sm font-black text-gray-900">{modelo.rotulo}</p>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{modelo.descricao}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FORMULÁRIO DO MODELO ESCOLHIDO: os campos são gerados a partir do registry,
                  então nenhum modelo novo precisa de JSX específico aqui */}
              {modeloPopupAtual && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase text-gray-800 tracking-wide flex items-center gap-2">
                      <modeloPopupAtual.Icon className="w-4 h-4 text-[#8a6d00]" />
                      {popupEditando ? `Editar Pop-up — ${modeloPopupAtual.rotulo}` : `Novo Pop-up — ${modeloPopupAtual.rotulo}`}
                    </h3>
                    <button type="button" onClick={cancelarFormularioPopup} className="text-[10px] uppercase bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer">
                      Cancelar
                    </button>
                  </div>

                  <form onSubmit={handleSubmitPopup} className="flex flex-col gap-4 max-w-lg">
                    <div>
                      <label className="text-xs text-gray-500 font-bold block mb-1 uppercase">Nome Interno (não aparece no site)</label>
                      <input
                        type="text"
                        value={formPopup.titulo}
                        onChange={(e) => setFormPopup((prev) => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Ex: Matrículas Abertas!"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#fed106]"
                      />
                    </div>

                    {modeloPopupAtual.campos.map((campo) => (
                      <CampoFormulario
                        key={campo.nome}
                        campo={campo}
                        valor={formPopup.dados[campo.nome]}
                        onChange={(valor) => atualizarCampoDadosPopup(campo.nome, valor)}
                        idPrefix="popup-campo"
                      />
                    ))}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="popup-ativo"
                        checked={formPopup.ativo}
                        onChange={(e) => setFormPopup((prev) => ({ ...prev, ativo: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                      <label htmlFor="popup-ativo" className="text-xs text-gray-500 font-bold uppercase">Exibir no site (ativo)</label>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setMostrarPreviewPopup(true)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        👁️ Pré-visualizar
                      </button>
                      <button type="submit" className="flex-1 bg-[#fed106] hover:bg-black hover:text-white text-black font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer">
                        {popupEditando ? '💾 Salvar Alterações' : '➕ Criar Pop-up'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* PRÉVIA: usa o mesmo PopupModalShell + Componente do site público, com os
                  dados atuais do formulário (ainda não salvos) — é sempre fiel ao resultado final */}
              {mostrarPreviewPopup && modeloPopupAtual && (
                <PopupModalShell variante={modeloPopupAtual.variante} onFechar={() => setMostrarPreviewPopup(false)}>
                  <modeloPopupAtual.Componente
                    dados={formPopup.dados}
                    onFechar={() => setMostrarPreviewPopup(false)}
                    somenteVisualizacao
                  />
                </PopupModalShell>
              )}

              {/* LISTA DE POP-UPS CADASTRADOS */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Pop-ups Cadastrados ({popupsAdmin.length})</h3>
                {popupsAdmin.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <MegaphoneIcon className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="font-black text-gray-700 text-sm">Nenhum pop-up cadastrado</p>
                    <p className="text-xs text-gray-400 mt-1">Crie um pop-up e ative-o para exibir no site</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {popupsAdmin.map((p) => {
                      const modeloDoItem = obterModeloPopup(p.modelo);
                      const imagemDoItem = p.dados?.imagem_url;
                      return (
                        <div key={p.id} className={`bg-gray-50 border rounded-xl overflow-hidden relative shadow-sm flex items-center p-3 gap-4 ${p.ativo ? 'border-[#fed106] ring-2 ring-[#fed106]/40' : 'border-gray-100'}`}>
                          {imagemDoItem ? (
                            <img src={imagemDoItem} alt="" className="w-16 h-16 object-cover rounded-lg bg-gray-200 shrink-0" />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                              <modeloDoItem.Icon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-black text-gray-800 truncate">{p.titulo}</p>
                            <p className="text-[11px] text-[#8a6d00] font-bold uppercase tracking-wide">{modeloDoItem.rotulo}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAlternarAtivoPopup(p)}
                            title={p.ativo ? 'Desativar pop-up' : 'Ativar pop-up'}
                            className={`shrink-0 text-[10px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                              p.ativo ? 'bg-[#fed106] text-black' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                            }`}
                          >
                            {p.ativo ? 'Ativo' : 'Inativo'}
                          </button>
                          <button
                            type="button"
                            onClick={() => iniciarEdicaoPopup(p)}
                            title="Editar pop-up"
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer shrink-0"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleEliminarPopup(p.id)}
                            className="bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ================= CONTATOS (formulário da Home) ================= */}
          {abaAtiva === 'contatos' && (
            <>
              <CabecalhoPagina titulo="Contatos" subtitulo='Mensagens enviadas pelo formulário "Fale com a Estude Seguro" na Home' Icon={EnvelopeIcon} />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <CardEstatistica label="Total de Contatos" valor={contatosAdmin.length} Icon={EnvelopeIcon} cor="bg-teal-500" />
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Mensagens Recebidas ({contatosAdmin.length})</h3>
                {contatosAdmin.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <EnvelopeIcon className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="font-black text-gray-700 text-sm">Nenhum contato recebido ainda</p>
                    <p className="text-xs text-gray-400 mt-1">Envios do formulário da Home aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[42rem] overflow-y-auto">
                    {contatosAdmin.map((c) => (
                      <div key={c.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 relative shadow-sm">
                        <button
                          onClick={() => handleDeletarContato(c.id)}
                          className="absolute top-3 right-3 text-red-500 hover:text-red-600 text-xs font-bold uppercase cursor-pointer"
                        >
                          Excluir
                        </button>
                        <div className="pr-16">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <strong className="text-sm text-gray-900 font-black">{c.nome}</strong>
                            {c.curso_desejado && (
                              <span className="text-[9px] font-extrabold bg-[#fed106]/15 text-[#8a6d00] px-2 py-0.5 rounded-full uppercase tracking-wide">
                                {c.curso_desejado}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-medium">
                            {c.email} {c.telefone ? `• ${c.telefone}` : ''}
                          </p>
                          <p className="text-xs text-gray-700 mt-2 leading-relaxed">{c.mensagem}</p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-2">
                            {c.created_at ? new Date(c.created_at).toLocaleString('pt-BR') : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ================= MATRÍCULAS (formulário público /matricula) ================= */}
          {abaAtiva === 'matriculas' && (
            <>
              <CabecalhoPagina titulo="Matrículas" subtitulo="Matrículas enviadas pelo formulário público de matrícula" Icon={DocumentTextIcon} />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <CardEstatistica label="Total de Matrículas" valor={matriculasAdmin.length} Icon={DocumentTextIcon} cor="bg-violet-500" />
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-black uppercase text-gray-800 mb-4 tracking-wide">Matrículas Recebidas ({matriculasAdmin.length})</h3>
                {matriculasAdmin.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <DocumentTextIcon className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="font-black text-gray-700 text-sm">Nenhuma matrícula recebida ainda</p>
                    <p className="text-xs text-gray-400 mt-1">Envios do formulário /matricula aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[48rem] overflow-y-auto">
                    {matriculasAdmin.map((m) => {
                      const expandida = matriculaExpandidaId === m.id;
                      return (
                        <div key={m.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 relative shadow-sm">
                          <div className="flex gap-2 absolute top-3 right-3">
                            <button
                              onClick={() => setMatriculaExpandidaId(expandida ? null : m.id)}
                              className="text-blue-600 hover:text-blue-700 text-xs font-bold uppercase cursor-pointer"
                            >
                              {expandida ? 'Fechar' : 'Ver detalhes'}
                            </button>
                            <button
                              onClick={() => handleDeletarMatricula(m.id)}
                              className="text-red-500 hover:text-red-600 text-xs font-bold uppercase cursor-pointer"
                            >
                              Excluir
                            </button>
                          </div>
                          <div className="pr-28">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <strong className="text-sm text-gray-900 font-black">{m.nome_completo}</strong>
                              {m.curso && (
                                <span className="text-[9px] font-extrabold bg-[#fed106]/15 text-[#8a6d00] px-2 py-0.5 rounded-full uppercase tracking-wide">
                                  {m.curso}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 font-medium">
                              {m.email} {m.telefone ? `• ${m.telefone}` : ''} {m.cpf ? `• CPF ${m.cpf}` : ''}
                            </p>
                            <p className="text-[10px] text-gray-400 font-semibold mt-2">
                              {m.created_at ? new Date(m.created_at).toLocaleString('pt-BR') : ''}
                            </p>
                          </div>

                          {expandida && (
                            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-gray-700">
                              <p><span className="font-bold text-gray-500 uppercase block text-[10px]">Data de Nascimento</span>{m.data_nascimento || '-'}</p>
                              <p><span className="font-bold text-gray-500 uppercase block text-[10px]">RG</span>{m.rg || '-'}</p>
                              <p><span className="font-bold text-gray-500 uppercase block text-[10px]">Órgão Emissor</span>{m.orgao_emissor || '-'}</p>
                              <p><span className="font-bold text-gray-500 uppercase block text-[10px]">Data de Emissão</span>{m.data_emissao || '-'}</p>
                              <p><span className="font-bold text-gray-500 uppercase block text-[10px]">Naturalidade</span>{m.naturalidade || '-'}</p>
                              <p><span className="font-bold text-gray-500 uppercase block text-[10px]">Raça/Cor</span>{m.raca_cor || '-'}</p>
                              <p><span className="font-bold text-gray-500 uppercase block text-[10px]">Estado Civil</span>{m.estado_civil || '-'}</p>
                              <p><span className="font-bold text-gray-500 uppercase block text-[10px]">Pai</span>{m.pai || '-'}</p>
                              <p><span className="font-bold text-gray-500 uppercase block text-[10px]">Mãe</span>{m.mae || '-'}</p>
                              <p className="sm:col-span-2 lg:col-span-3"><span className="font-bold text-gray-500 uppercase block text-[10px]">Endereço</span>{[m.rua, m.numero, m.complemento, m.bairro, m.cidade, m.estado, m.cep].filter(Boolean).join(', ') || '-'}</p>
                              {m.observacoes && (
                                <p className="sm:col-span-2 lg:col-span-3"><span className="font-bold text-gray-500 uppercase block text-[10px]">Observações</span>{m.observacoes}</p>
                              )}
                              <div className="sm:col-span-2 lg:col-span-3">
                                <span className="font-bold text-gray-500 uppercase block text-[10px] mb-1.5">Anexos</span>
                                {(!m.anexos || m.anexos.length === 0) ? (
                                  <span className="text-gray-400 italic">Nenhum anexo enviado.</span>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {m.anexos.map((caminho, idx) => (
                                      <button
                                        key={caminho}
                                        onClick={() => handleAbrirAnexoMatricula(caminho)}
                                        className="bg-white border border-gray-200 hover:border-[#fed106] text-gray-700 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                      >
                                        📎 Anexo {idx + 1}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {mensagemStatus && (
            <p className="text-sm font-bold text-center p-3 mt-6 bg-white border border-gray-200 rounded-xl shadow-sm animate-pulse text-gray-700">{mensagemStatus}</p>
          )}
        </main>
      </div>
    </div>
  );
}
