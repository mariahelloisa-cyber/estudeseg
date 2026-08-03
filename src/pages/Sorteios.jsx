import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroCarrossel from '../components/HeroCarrossel';
import RoletaPremiada from '../components/RoletaPremiada';
import PopupModalShell from '../components/popups/PopupModalShell';
import { supabase } from '../supabaseClient';
import { mascaraCPF, validarCPF } from '../utils/mascaras';
import { XMarkIcon, UserGroupIcon, GiftIcon, BoltIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import caixaPresente from '../assets/presente.png';

const FORM_INICIAL = { nomeCompleto: '', cpf: '', numeroMatricula: '' };

const CLASSE_INPUT =
  'w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#fed106] focus:ring-2 focus:ring-[#fed106]/15 bg-gray-50/40 text-sm text-gray-800 transition-all';

// Modal escuro (fundo quase preto, com confete/badge/emoji) usado nas telas de
// resultado — parabéns, já participou, não elegível e confirmação do WhatsApp.
function ModalEscuro({ onFechar, confete, children }) {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div
        className="relative bg-[#141414] border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl overflow-hidden text-center"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {confete && (
          <>
            <span className="absolute top-5 left-7 w-2 h-2 bg-[#fed106] rotate-12" />
            <span className="absolute top-11 left-16 w-1.5 h-4 bg-red-500 rotate-45" />
            <span className="absolute top-7 right-16 w-2 h-2 bg-white rounded-full" />
            <span className="absolute top-16 right-9 w-1.5 h-3 bg-[#fed106] -rotate-12" />
            <span className="absolute top-4 left-1/2 w-1.5 h-1.5 bg-white/70 rounded-full" />
          </>
        )}
        <button
          onClick={onFechar}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

// Destaca "Estude Seguro" dentro do título com o mesmo gradiente amarelo-preto
// usado na Home (seção "Quero fazer meu curso..."), mantendo o resto do texto
// na cor escura — se a frase não estiver no título (admin mudou o texto),
// simplesmente mostra tudo normal, sem quebrar.
function renderizarTituloComDestaque(texto) {
  const alvo = 'estude seguro';
  const indice = texto.toLowerCase().indexOf(alvo);
  if (indice === -1) return texto;

  const antes = texto.slice(0, indice).trim();
  const destaque = texto.slice(indice, indice + alvo.length);
  const depois = texto.slice(indice + alvo.length);

  return (
    <>
      <span className="block">{antes}</span>
      <span className="block">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#fed106] to-[#000000]">{destaque}</span>
        {depois}
      </span>
    </>
  );
}

const PASSOS_COMO_FUNCIONA = [
  'Conclua sua formação na Estude Seguro.',
  'Clique no botão abaixo para girar a roleta.',
  'Descubra seu prêmio e aproveite seu benefício!',
];

function rotuloPremio(premio) {
  if (!premio) return '';
  if (premio.tipo === 'cashback') return `Cashback de ${premio.percentual}%`;
  if (premio.tipo === 'desconto') return `${premio.percentual}% de desconto em uma nova formação`;
  return premio.nome;
}

export default function Sorteios() {
  const [carregandoPagina, setCarregandoPagina] = useState(true);
  const [ativo, setAtivo] = useState(true);
  const [titulo, setTitulo] = useState(' Gire a Roleta Premiada da Estude Seguro!');
  const [subtitulo, setSubtitulo] = useState('');
  const [whatsappNumero, setWhatsappNumero] = useState('5511995987197');
  const [whatsappMensagem, setWhatsappMensagem] = useState('');

  const [banners, setBanners] = useState([]);
  const [premios, setPremios] = useState([]);

  const [modalAberto, setModalAberto] = useState(null); // 'formulario' | 'nao_encontrado' | null
  const [form, setForm] = useState(FORM_INICIAL);
  const [erroFormulario, setErroFormulario] = useState('');
  const [carregandoValidacao, setCarregandoValidacao] = useState(false);

  const [premioGanho, setPremioGanho] = useState(null); // { nome, tipo, percentual }
  const [jaHaviaParticipado, setJaHaviaParticipado] = useState(false);
  const [girandoRoleta, setGirandoRoleta] = useState(false);
  const [resultadoVisivel, setResultadoVisivel] = useState(false);
  const [modalWhatsappVisivel, setModalWhatsappVisivel] = useState(false);

  useEffect(() => {
    async function carregarPagina() {
      try {
        const [configRes, bannersRes, premiosRes] = await Promise.all([
          supabase
            .from('configuracoes')
            .select('chave, valor')
            .in('chave', ['sorteio_ativo', 'sorteio_titulo', 'sorteio_subtitulo', 'sorteio_whatsapp_numero', 'sorteio_whatsapp_mensagem']),
          supabase.from('sorteio_banners').select('*').order('ordem', { ascending: true }),
          supabase.from('sorteio_premios').select('*').eq('ativo', true).order('ordem', { ascending: true }),
        ]);

        const mapaConfig = Object.fromEntries((configRes.data || []).map((item) => [item.chave, item.valor]));
        setAtivo(mapaConfig.sorteio_ativo !== 'false');
        if (mapaConfig.sorteio_titulo) setTitulo(mapaConfig.sorteio_titulo);
        setSubtitulo(
          mapaConfig.sorteio_subtitulo ||
            'Todos os alunos que concluíram sua formação na Estude Seguro podem participar da nossa Roleta Premiada e concorrer a diversos benefícios exclusivos.',
        );
        setWhatsappNumero(mapaConfig.sorteio_whatsapp_numero || '5511995987197');
        setWhatsappMensagem(mapaConfig.sorteio_whatsapp_mensagem || '');

        setBanners(bannersRes.data || []);
        setPremios(premiosRes.data || []);
      } catch (erro) {
        console.error('Erro ao carregar a página de Sorteios:', erro);
      } finally {
        setCarregandoPagina(false);
      }
    }
    carregarPagina();
  }, []);

  function handleChangeForm(e) {
    let { name, value } = e.target;
    if (name === 'cpf') value = mascaraCPF(value);
    setForm((prev) => ({ ...prev, [name]: value }));
    setErroFormulario('');
  }

  function abrirFormulario() {
    if (!ativo || premioGanho) return;
    setForm(FORM_INICIAL);
    setErroFormulario('');
    setModalAberto('formulario');
  }

  async function handleValidarDados(e) {
    e.preventDefault();
    setErroFormulario('');

    if (!form.nomeCompleto.trim() || !form.cpf.trim() || !form.numeroMatricula.trim()) {
      setErroFormulario('Preencha todos os campos para continuar.');
      return;
    }
    if (!validarCPF(form.cpf)) {
      setErroFormulario('CPF inválido. Confira os números digitados.');
      return;
    }

    setCarregandoValidacao(true);
    try {
      const { data, error } = await supabase.rpc('girar_roleta_premiada', {
        p_nome_completo: form.nomeCompleto.trim(),
        p_cpf: form.cpf,
        p_numero_matricula: form.numeroMatricula.trim(),
      });
      if (error) throw error;

      const linha = Array.isArray(data) ? data[0] : data;
      if (!linha) throw new Error('Resposta vazia da função de sorteio.');

      if (linha.resultado === 'sucesso') {
        setPremioGanho({ nome: linha.premio_nome, tipo: linha.premio_tipo, percentual: linha.percentual_cashback });
        setJaHaviaParticipado(false);
        setModalAberto(null);
        setGirandoRoleta(true);
      } else if (linha.resultado === 'ja_participou') {
        setPremioGanho({ nome: linha.premio_nome, tipo: linha.premio_tipo, percentual: linha.percentual_cashback });
        setJaHaviaParticipado(true);
        setModalAberto(null);
        setResultadoVisivel(true);
      } else if (linha.resultado === 'campanha_inativa') {
        setErroFormulario('A Roleta Premiada não está disponível no momento. Tente novamente mais tarde.');
      } else if (linha.resultado === 'sem_premios') {
        setErroFormulario('Não há prêmios disponíveis no momento. Tente novamente mais tarde.');
      } else {
        setModalAberto('nao_encontrado');
      }
    } catch (erro) {
      console.error('Erro ao validar participação na Roleta Premiada:', erro);
      setErroFormulario('Não foi possível validar seus dados agora. Tente novamente em instantes.');
    } finally {
      setCarregandoValidacao(false);
    }
  }

  function abrirConfirmacaoWhatsapp() {
    setResultadoVisivel(false);
    setModalWhatsappVisivel(true);
  }

  function aoTerminarGiro() {
    setGirandoRoleta(false);
    setResultadoVisivel(true);
  }

  function montarLinkWhatsapp(mensagem) {
    const numero = (whatsappNumero || '5511995987197').replace(/\D/g, '');
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  }

  function linkResgatarPremio() {
    const template =
      whatsappMensagem ||
      'Olá! Acabei de ganhar um prêmio na Roleta da Estude Seguro.\n\nNome: {{nome}}\nCPF: {{cpf}}\nNúmero do certificado: {{numeroMatricula}}\n\nPrêmio ganho: {{premio}}\n\nGostaria de resgatar meu prêmio.';
    const texto = template
      .replaceAll('{{nome}}', form.nomeCompleto || '')
      .replaceAll('{{cpf}}', form.cpf || '')
      .replaceAll('{{numeroMatricula}}', form.numeroMatricula || '')
      .replaceAll('{{premio}}', rotuloPremio(premioGanho));
    return montarLinkWhatsapp(texto);
  }

  function linkContato() {
    return montarLinkWhatsapp(
      'Olá! Tentei participar da Roleta Premiada da Estude Seguro, mas meus dados não foram encontrados. Podem verificar minha situação?',
    );
  }

  return (
    <div className="w-full min-h-screen bg-white text-gray-900 font-sans antialiased pb-10">
      <Navbar />

      <HeroCarrossel banners={banners} />

      {/* --- SEÇÃO PRINCIPAL: fundo claro, roleta em destaque --- */}
      <div className="relative w-full overflow-hidden bg-white pt-4 pb-8">
        {/* Brilho suave e claro, só para dar um respiro atrás do conjunto */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(254,209,6,0.10)_0%,transparent_60%)] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          {/* Título centralizado */}
          <div className="flex flex-col items-center text-center mb-12">
            <div className="relative z-10 inline-flex items-center gap-1.5 bg-[#fffbe6] border border-[#fed106]/50 rounded-full px-4 py-1.5 mb-4">
              <span className="text-[11px] font-black uppercase tracking-wide text-[#8a6d00]">Exclusivo para alunos</span>
            </div>

            <h1
              className="relative z-10 text-3xl md:text-5xl font-extrabold text-[#000000] tracking-tight leading-[1.2] mb-4 px-2"
              style={{ fontFamily: "'Baloo 2', sans-serif" }}
            >
              {renderizarTituloComDestaque(titulo)}
            </h1>

            <p className="relative z-10 text-xs md:text-sm text-gray-500 font-medium leading-relaxed max-w-xl">{subtitulo}</p>
          </div>

          {!carregandoPagina && !ativo && (
            <div className="max-w-xl mx-auto w-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold rounded-2xl px-6 py-4 mb-8 text-center">
              A Roleta Premiada está temporariamente indisponível. Volte em breve!
            </div>
          )}

          {carregandoPagina ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#fed106] mx-auto" />
            </div>
          ) : premios.length === 0 ? (
            <div className="max-w-xl mx-auto w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-10 text-sm text-gray-400 font-medium text-center">
              Nenhum prêmio configurado no momento.
            </div>
          ) : (
            <>
              {/* Roda exatamente no centro da seção + card grudado do lado direito dela */}
              <div className="relative flex flex-col items-center gap-10 lg:block lg:min-h-[560px] mb-2">
                <div className="flex flex-col items-center gap-6 w-full lg:absolute lg:left-1/2 lg:top-0 lg:-translate-x-1/2">
                  <RoletaPremiada
                    premios={premios}
                    girando={girandoRoleta}
                    nomePremioVencedor={premioGanho?.nome}
                    aoTerminarGiro={aoTerminarGiro}
                  />

                  {premioGanho ? (
                    <button
                      onClick={() => setResultadoVisivel(true)}
                      className="w-full max-w-xs inline-flex items-center justify-center gap-2 bg-black hover:bg-[#fed106] text-white hover:text-black font-black text-sm px-10 py-4 rounded-full shadow-lg shadow-black/20 transition-all active:scale-[0.98] uppercase tracking-wide cursor-pointer"
                    >
                      🏆 Ver meu prêmio
                    </button>
                  ) : (
                    <button
                      onClick={abrirFormulario}
                      disabled={!ativo}
                      className="w-full max-w-xs inline-flex items-center justify-center gap-2 bg-[#fed106] hover:bg-black hover:text-white text-black font-black text-sm px-12 py-4 rounded-full shadow-lg shadow-black/20 transition-all active:scale-[0.98] uppercase tracking-wide cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed animate-segurinho-pulse"
                    >
                       Girar Roleta
                    </button>
                  )}
                </div>

                <div className="relative bg-white rounded-3xl shadow-xl border border-gray-100 p-6 overflow-hidden w-full lg:w-[420px] lg:absolute lg:left-1/2 lg:top-[38%] lg:-translate-y-1/2 lg:translate-x-[270px]">
                  <h3 className="text-xl font-black text-gray-900 mb-1">Como funciona?</h3>
                  <span className="block w-10 h-1 bg-[#fed106] rounded-full mb-1" />

                  <div className="flex items-center gap-1 mb-2">
                    <div className="w-56 shrink-0 flex flex-col gap-3">
                      {PASSOS_COMO_FUNCIONA.map((passo, indice) => (
                        <div key={indice} className="flex items-start gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-[#fed106] text-black font-black text-sm flex items-center justify-center shrink-0">
                            {indice + 1}
                          </span>
                          <p className="text-sm text-gray-700 font-semibold leading-snug pt-0.5">{passo}</p>
                        </div>
                      ))}
                    </div>
                    <div className="w-52 h-52 -ml-8 -mr-6 shrink-0 flex items-center justify-center">
                      <img
                        src={caixaPresente}
                        alt=""
                        className="w-full h-full object-contain select-none"
                      />
                    </div>
                  </div>

                  <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-medium mt-2">
                    <LockClosedIcon className="w-3.5 h-3.5" /> Processo 100% seguro e gratuito
                  </p>
                </div>
              </div>

              {/* Barra de recursos */}
              <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                <div className="flex flex-col items-center text-center gap-1 px-6 py-4">
                  <span className="w-8 h-8 rounded-full bg-[#fed106] flex items-center justify-center shrink-0 mb-0.5">
                    <UserGroupIcon className="w-4 h-4 text-black" />
                  </span>
                  <span className="text-sm font-black text-black">Apenas uma participação por aluno</span>
                  <p className="text-xs text-gray-400 leading-relaxed">Participe após concluir sua formação na Estude Seguro.</p>
                </div>
                <div className="flex flex-col items-center text-center gap-1 px-6 py-4">
                  <span className="w-8 h-8 rounded-full bg-[#fed106] flex items-center justify-center shrink-0 mb-0.5">
                    <GiftIcon className="w-4 h-4 text-black" />
                  </span>
                  <span className="text-sm font-black text-black">100% gratuito</span>
                  <p className="text-xs text-gray-400 leading-relaxed">Sem pegadinhas, sem taxas. Seu prêmio é garantido!</p>
                </div>
                <div className="flex flex-col items-center text-center gap-1 px-6 py-4">
                  <span className="w-8 h-8 rounded-full bg-[#fed106] flex items-center justify-center shrink-0 mb-0.5">
                    <BoltIcon className="w-4 h-4 text-black" />
                  </span>
                  <span className="text-sm font-black text-black">Resultado instantâneo</span>
                  <p className="text-xs text-gray-400 leading-relaxed">Descubra seu prêmio na hora e aproveite.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

     

      {/* --- MODAL: FORMULÁRIO DE VALIDAÇÃO --- */}
      {modalAberto === 'formulario' && (
        <PopupModalShell variante="cartao" onFechar={() => setModalAberto(null)}>
          <div className="bg-white rounded-2xl p-6 md:p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
            <h2 className="text-lg font-black text-gray-900 mb-1 tracking-tight">Valide seus dados</h2>
            <p className="text-xs text-gray-500 mb-6">Preencha exatamente como enviado na sua matrícula.</p>

            <form onSubmit={handleValidarDados} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Nome completo</label>
                <input
                  required
                  type="text"
                  name="nomeCompleto"
                  value={form.nomeCompleto}
                  onChange={handleChangeForm}
                  className={CLASSE_INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">CPF</label>
                <input
                  required
                  type="text"
                  name="cpf"
                  inputMode="numeric"
                  maxLength={14}
                  value={form.cpf}
                  onChange={handleChangeForm}
                  placeholder="000.000.000-00"
                  className={CLASSE_INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Número do certificado</label>
                <input
                  required
                  type="text"
                  name="numeroMatricula"
                  value={form.numeroMatricula}
                  onChange={handleChangeForm}
                  placeholder="Ex: EST-2026-123456"
                  className={CLASSE_INPUT}
                />
              </div>

              {erroFormulario && (
                <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl text-center border border-red-100">
                  ⚠️ {erroFormulario}
                </div>
              )}

              <button
                type="submit"
                disabled={carregandoValidacao}
                className="w-full bg-[#fed106] hover:bg-black hover:text-white text-black font-black text-sm py-4 rounded-full uppercase tracking-wide transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 mt-2"
              >
                {carregandoValidacao ? 'Validando...' : 'Validar dados'}
              </button>
            </form>
          </div>
        </PopupModalShell>
      )}

      {/* --- MODAL: DADOS NÃO ENCONTRADOS / NÃO ELEGÍVEL --- */}
      {modalAberto === 'nao_encontrado' && (
        <ModalEscuro onFechar={() => setModalAberto(null)}>
          <div className="text-3xl mb-3">😞</div>
          <h2 className="text-white font-black text-base tracking-tight mb-4 max-w-[230px] mx-auto leading-snug">
            Ainda não encontramos um certificado apto.
          </h2>
          <p className="text-white/50 text-xs leading-relaxed mb-3 max-w-[260px] mx-auto">
            A Roleta Premiada é exclusiva para alunos que concluíram sua formação.
          </p>
          <p className="text-white/50 text-xs leading-relaxed mb-6 max-w-[260px] mx-auto">
            Caso acredite que exista algum erro em seu cadastro, fale conosco.
          </p>
          <a
            href={linkContato()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setModalAberto(null)}
            className="inline-flex bg-[#fed106] hover:bg-white text-black font-black text-xs px-8 py-3.5 rounded-full uppercase tracking-wide transition-all active:scale-[0.98]"
          >
            Entrar em contato
          </a>
        </ModalEscuro>
      )}

      {/* --- MODAL: RESULTADO (ganhou agora ou já tinha participado) --- */}
      {resultadoVisivel && premioGanho && (
        <ModalEscuro onFechar={() => setResultadoVisivel(false)} confete={!jaHaviaParticipado}>
          {jaHaviaParticipado ? (
            <>
              <div className="text-3xl mb-3">🏅</div>
              <h2 className="text-white font-black text-lg tracking-tight mb-1">Você já participou!</h2>
              <p className="text-white/50 text-xs font-medium mb-4">Seu prêmio foi:</p>
              <div className="inline-block border border-[#fed106]/50 bg-[#fed106]/10 rounded-xl px-6 py-2.5 mb-5">
                <p className="text-[#fed106] font-black text-lg uppercase">{rotuloPremio(premioGanho)}</p>
              </div>
              <p className="text-white/40 text-[11px] mb-6">Caso ainda não tenha resgatado, fale conosco.</p>
            </>
          ) : (
            <>
              <div className="text-3xl mb-2"></div>
              <h2 className="text-white font-black text-lg tracking-tight mb-1">PARABÉNS!</h2>
              <p className="text-white/50 text-xs font-medium mb-5">Você ganhou:</p>
              <p className="text-[#fed106] font-black text-2xl mb-1 tracking-tight uppercase">{rotuloPremio(premioGanho)}</p>
              <p className="text-white/40 text-[11px] mb-6">Seu prêmio foi registrado com sucesso.</p>
            </>
          )}

          <button
            onClick={abrirConfirmacaoWhatsapp}
            className="w-full bg-[#fed106] hover:bg-white text-black font-black text-sm py-3.5 rounded-full uppercase tracking-wide transition-all active:scale-[0.98] mb-3 cursor-pointer"
          >
            Resgatar meu prêmio
          </button>
          <button
            onClick={() => setResultadoVisivel(false)}
            className="text-white/40 hover:text-white text-xs underline underline-offset-2 transition-colors cursor-pointer"
          >
            Voltar para o início
          </button>
        </ModalEscuro>
      )}

      {/* --- MODAL: CONFIRMAÇÃO ANTES DE ABRIR O WHATSAPP --- */}
      {modalWhatsappVisivel && (
        <ModalEscuro onFechar={() => setModalWhatsappVisivel(false)}>
          <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.28-1.38a9.9 9.9 0 004.71 1.2h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.83 14.02c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.81-.11-.42-.14-.95-.3-1.64-.6-2.88-1.24-4.76-4.13-4.9-4.32-.14-.19-1.17-1.55-1.17-2.96 0-1.4.74-2.09 1-2.38.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.58.81 2 .88 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.19-.28.37-.23.62-.14.26.09 1.63.77 1.91.91.28.14.47.21.53.33.07.12.07.68-.17 1.36z" />
            </svg>
          </div>
          <h2 className="text-white font-black text-base mb-2">Vamos te direcionar para o WhatsApp!</h2>
          <p className="text-white/50 text-xs leading-relaxed mb-6 max-w-[250px] mx-auto">
            Você será redirecionado para conversar com nossa equipe e resgatar seu prêmio.
          </p>
          <a
            href={linkResgatarPremio()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setModalWhatsappVisivel(false)}
            className="w-full inline-flex items-center justify-center bg-[#25D366] hover:bg-[#1ebe57] text-white font-black text-sm py-3.5 rounded-full uppercase tracking-wide transition-all active:scale-[0.98]"
          >
            Abrir WhatsApp
          </a>
        </ModalEscuro>
      )}
    </div>
  );
}
