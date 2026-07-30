import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import mascoteSegurinho from '../assets/segurinho.png';

const HISTORICO_MAXIMO_ENVIADO = 6;
const LIMITE_CARACTERES_MENSAGEM = 500;
const URL_FUNCAO_CHAT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-agent`;
const ATRASO_BALAO_SAUDACAO_MS = 3000;

const MENSAGEM_INICIAL_PADRAO = [
  'Olá! 👋 Sou o Segurinho, assistente virtual da Estude Seguro.',
  'Aqui seu diploma é garantido pelo MEC — ou seu dinheiro de volta. 🔐',
  'Como posso te ajudar?',
].join('\n\n');

function gerarSessaoId() {
  return crypto.randomUUID();
}

// Converte "**palavra**" em negrito de verdade, sem exibir os asteriscos na tela.
function renderizarTextoComNegrito(texto) {
  return texto.split(/\*\*(.+?)\*\*/g).map((parte, indice) =>
    indice % 2 === 1 ? (
      <strong key={indice} className="font-black text-gray-900">
        {parte}
      </strong>
    ) : (
      parte
    ),
  );
}

// Bolinha de "digitando..." exibida enquanto a IA gera a resposta.
function IndicadorDigitando() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 self-start shadow-sm flex gap-1.5 items-center">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" />
    </div>
  );
}

export default function ChatWidget() {
  // --- Configuração da agente, editável pelo painel admin ---
  const [configCarregada, setConfigCarregada] = useState(false);
  const [ativo, setAtivo] = useState(false);
  const [mensagemInicial, setMensagemInicial] = useState('');
  const [textoApresentacao, setTextoApresentacao] = useState('Assistente virtual da Estude Seguro');
  const [sugestoes, setSugestoes] = useState([]);

  // --- Estado da conversa ---
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [entrada, setEntrada] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [sessaoId, setSessaoId] = useState('');
  const fimDasMensagensRef = useRef(null);

  // --- Balão de saudação automático (aparece sozinho antes do primeiro clique) ---
  const [balaoVisivel, setBalaoVisivel] = useState(false);
  const [balaoDispensado, setBalaoDispensado] = useState(false);

  useEffect(() => {
    async function buscarConfiguracaoDaAgente() {
      try {
        const { data, error } = await supabase
          .from('configuracoes')
          .select('chave, valor')
          .in('chave', ['ia_agente_ativo', 'ia_mensagem_inicial', 'ia_texto_apresentacao', 'ia_sugestoes']);
        if (error) throw error;

        const mapa = Object.fromEntries((data || []).map((item) => [item.chave, item.valor]));
        setAtivo(mapa.ia_agente_ativo !== 'false');
        setMensagemInicial(mapa.ia_mensagem_inicial || MENSAGEM_INICIAL_PADRAO);
        setTextoApresentacao(mapa.ia_texto_apresentacao || 'Assistente virtual da Estude Seguro');
        try {
          setSugestoes(JSON.parse(mapa.ia_sugestoes || '[]'));
        } catch {
          setSugestoes([]);
        }
      } catch (erro) {
        console.error('Erro ao carregar configuração do assistente virtual:', erro);
        setAtivo(false);
      } finally {
        setConfigCarregada(true);
      }
    }
    buscarConfiguracaoDaAgente();
    setSessaoId(gerarSessaoId());
  }, []);

  // Mostra o balão de saudação sozinho, alguns segundos depois de carregar a página.
  useEffect(() => {
    if (!configCarregada || !ativo) return;
    const temporizador = setTimeout(() => setBalaoVisivel(true), ATRASO_BALAO_SAUDACAO_MS);
    return () => clearTimeout(temporizador);
  }, [configCarregada, ativo]);

  useEffect(() => {
    if (aberto) fimDasMensagensRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, aberto, carregando]);

  function abrirChat() {
    setAberto(true);
    setBalaoDispensado(true);
  }

  function fecharBalaoSaudacao(evento) {
    evento.stopPropagation();
    setBalaoDispensado(true);
  }

  function iniciarNovaConversa() {
    setMensagens([]);
    setSessaoId(gerarSessaoId());
    setEntrada('');
  }

  async function enviarMensagem(textoDigitado) {
    const conteudo = textoDigitado.trim().slice(0, LIMITE_CARACTERES_MENSAGEM);
    if (!conteudo || carregando) return;

    const historicoAntesDoEnvio = mensagens;
    setMensagens((atual) => [...atual, { role: 'user', content: conteudo }]);
    setEntrada('');
    setCarregando(true);

    try {
      const resposta = await fetch(URL_FUNCAO_CHAT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: conteudo,
          history: historicoAntesDoEnvio.slice(-HISTORICO_MAXIMO_ENVIADO),
          sessionId: sessaoId,
        }),
      });

      if (!resposta.ok) throw new Error(`Falha na requisição (${resposta.status})`);
      const dados = await resposta.json();
      setMensagens((atual) => [
        ...atual,
        { role: 'assistant', content: dados.reply || 'Não consegui responder agora. Tente novamente em instantes.' },
      ]);
    } catch (erro) {
      console.error('Erro ao falar com o assistente virtual:', erro);
      setMensagens((atual) => [
        ...atual,
        {
          role: 'assistant',
          content: 'Não consegui me conectar agora. Tente novamente em instantes ou fale pelo WhatsApp: +55 11 99598-7197.',
        },
      ]);
    } finally {
      setCarregando(false);
    }
  }

  function aoEnviarFormulario(evento) {
    evento.preventDefault();
    enviarMensagem(entrada);
  }

  // Enquanto a configuração não carrega, ou se a agente foi desativada no painel admin, não renderiza nada.
  if (!configCarregada || !ativo) return null;

  const mostrarBalaoSaudacao = balaoVisivel && !balaoDispensado && !aberto;

  return (
    <>
      {/* --- Balão de saudação automático --- */}
      {mostrarBalaoSaudacao && (
        <button
          onClick={abrirChat}
          className="fixed bottom-24 right-5 z-[70] w-[85vw] max-w-[280px] bg-white rounded-2xl rounded-br-sm shadow-2xl border border-gray-100 p-4 text-left cursor-pointer hover:-translate-y-0.5 transition-transform"
        >
          <span
            onClick={fecharBalaoSaudacao}
            role="button"
            tabIndex={0}
            aria-label="Fechar mensagem"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shadow-md hover:bg-[#fed106] hover:text-black transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
          <p className="text-sm text-gray-900 font-normal leading-relaxed whitespace-pre-line">
            {renderizarTextoComNegrito(mensagemInicial)}
          </p>
          <p className="text-[11px] text-gray-400 text-right mt-2">agora</p>
        </button>
      )}

      {/* --- Botão flutuante --- */}
      <button
        onClick={() => (aberto ? setAberto(false) : abrirChat())}
        aria-label={aberto ? 'Fechar assistente virtual' : 'Abrir assistente virtual'}
        className={`fixed bottom-9 right-5 z-[70] w-12 h-12 rounded-full bg-[#fed106] shadow-lg shadow-black/25 flex items-center justify-center overflow-hidden hover:scale-105 active:scale-95 transition-transform cursor-pointer ${
          aberto ? '' : 'animate-segurinho-pulse'
        }`}
      >
        {aberto ? (
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <img src={mascoteSegurinho} alt="Segurinho, assistente virtual" className="w-full h-full object-cover" />
        )}
      </button>

      {/* --- Janela do chat --- */}
      {aberto && (
        <div className="fixed bottom-24 right-5 z-[70] w-[92vw] max-w-sm h-[70vh] max-h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          {/* Cabeçalho */}
          <div className="bg-black px-4 py-3 flex items-center gap-3 shrink-0">
            <img
              src={mascoteSegurinho}
              alt="Segurinho"
              className="w-10 h-10 rounded-full bg-[#fed106] object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-white font-black text-sm truncate">Segurinho</p>
              <p className="text-white/60 text-[11px] font-medium truncate">{textoApresentacao}</p>
            </div>
            <button
              onClick={iniciarNovaConversa}
              title="Iniciar nova conversa"
              aria-label="Iniciar nova conversa"
              className="text-white/70 hover:text-[#fed106] transition-colors shrink-0 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992m0 0V4.356m0 4.992l-3.181-3.183a8.25 8.25 0 00-13.803 3.7M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7"
                />
              </svg>
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-[#F8F9FA]">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-900 shadow-sm max-w-[85%] font-normal leading-relaxed whitespace-pre-line">
              {renderizarTextoComNegrito(mensagemInicial)}
            </div>

            {mensagens.length === 0 && sugestoes.length > 0 && (
              <div className="flex flex-col gap-2 mt-1">
                {sugestoes.map((sugestao, indice) => (
                  <button
                    key={indice}
                    onClick={() => enviarMensagem(sugestao)}
                    className="text-left text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:border-[#fed106] hover:bg-[#fffbe6] rounded-xl px-3 py-2 transition-colors cursor-pointer"
                  >
                    {sugestao}
                  </button>
                ))}
              </div>
            )}

            {mensagens.map((mensagem, indice) => (
              <div
                key={indice}
                className={`px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed max-w-[85%] whitespace-pre-line ${
                  mensagem.role === 'user'
                    ? 'bg-[#fed106] text-black rounded-br-sm self-end'
                    : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm self-start'
                }`}
              >
                {renderizarTextoComNegrito(mensagem.content)}
              </div>
            ))}

            {carregando && <IndicadorDigitando />}

            <div ref={fimDasMensagensRef} />
          </div>

          {/* Campo de digitação */}
          <form onSubmit={aoEnviarFormulario} className="border-t border-gray-100 p-3 flex items-center gap-2 shrink-0 bg-white">
            <input
              type="text"
              value={entrada}
              onChange={(evento) => setEntrada(evento.target.value)}
              maxLength={LIMITE_CARACTERES_MENSAGEM}
              placeholder="Digite sua dúvida..."
              disabled={carregando}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#fed106] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={carregando || !entrada.trim()}
              aria-label="Enviar mensagem"
              className="w-10 h-10 rounded-full bg-[#fed106] flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-black hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
