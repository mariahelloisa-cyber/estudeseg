import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import HeroCarrossel from '../components/HeroCarrossel';
import RoletaPremiada from '../components/RoletaPremiada';
import PopupModalShell from '../components/popups/PopupModalShell';
import { supabase } from '../supabaseClient';
import { XMarkIcon, TicketIcon, GiftIcon, BoltIcon, LockClosedIcon, TrophyIcon } from '@heroicons/react/24/outline';
import caixaPresente from '../assets/presente.png';

const FORM_INICIAL = { nomeCompleto: '', codigo: '', funcionarioId: '' };

const CLASSE_INPUT =
  'w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#fed106] focus:ring-2 focus:ring-[#fed106]/15 bg-gray-50/40 text-sm text-gray-800 transition-all';

const PASSOS_COMO_FUNCIONA = [
  'Peça seu voucher a quem indicou a Estude Seguro.',
  'Clique no botão abaixo e informe o código recebido.',
  'Gire a roleta e descubra seu prêmio na hora!',
];

// Vouchers novos têm 10 caracteres; os antigos, de 5, continuam válidos.
const TAMANHO_MINIMO_VOUCHER = 5;
const TAMANHO_MAXIMO_VOUCHER = 10;

// Mensagem mostrada no formulário para cada resposta da função do banco.
// `voucher_invalido` cobre de propósito tanto "não existe" quanto "já foi
// usado": responder coisas diferentes deixava a função servir de oráculo para
// descobrir quais códigos existem.
const MENSAGENS_ERRO = {
  voucher_invalido: 'Voucher inválido ou já utilizado. Confira o código digitado.',
  funcionario_invalido: 'Selecione quem indicou você na lista.',
  sem_premios: 'Nenhum prêmio disponível no momento. Tente novamente mais tarde.',
  limite_excedido: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.',
};

const NUMERO_WHATSAPP_PADRAO = '5511995987197';

// Texto que abre no WhatsApp ao resgatar. Fica no código de propósito: no painel
// só se troca o número, para ninguém quebrar os marcadores sem querer.
const MENSAGEM_WHATSAPP =
  'Olá! Acabei de girar a roleta do Resgate seu Prêmio da Estude Seguro.\n\n' +
  'Nome: {{nome}}\nVoucher: {{voucher}}\nIndicado por: {{indicadoPor}}\n\n' +
  'Prêmio ganho: {{premio}}\n\nGostaria de resgatar meu prêmio.';

function IconeWhatsapp({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.28-1.38a9.9 9.9 0 004.71 1.2h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.83 14.02c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.81-.11-.42-.14-.95-.3-1.64-.6-2.88-1.24-4.76-4.13-4.9-4.32-.14-.19-1.17-1.55-1.17-2.96 0-1.4.74-2.09 1-2.38.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.58.81 2 .88 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.19-.28.37-.23.62-.14.26.09 1.63.77 1.91.91.28.14.47.21.53.33.07.12.07.68-.17 1.36z" />
    </svg>
  );
}

// Só letras e números, em maiúsculas, no máximo 5 — o mesmo formato gerado no admin
function mascaraVoucher(valor) {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, TAMANHO_MAXIMO_VOUCHER);
}

// Rótulos escritos dentro da fatia da roleta. O admin decide o texto; sem
// rótulo definido, cai no próprio nome do prêmio.
function conteudoSegmentoResgate(premio) {
  const valor = premio.rotulo?.trim() || premio.nome;
  const sub = premio.rotulo_secundario?.trim() || '';
  return { valor, sub, deslocamentoY: sub ? 0 : 6 };
}

export default function ResgatePremio() {
  const [carregandoPagina, setCarregandoPagina] = useState(true);
  const [premios, setPremios] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [banners, setBanners] = useState([]);
  const [whatsappNumero, setWhatsappNumero] = useState(NUMERO_WHATSAPP_PADRAO);

  const [modalAberto, setModalAberto] = useState(null); // 'formulario' | null
  const [form, setForm] = useState(FORM_INICIAL);
  const [erroFormulario, setErroFormulario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [premioGanho, setPremioGanho] = useState(null);
  const [girandoRoleta, setGirandoRoleta] = useState(false);
  const [resultadoVisivel, setResultadoVisivel] = useState(false);

  useEffect(() => {
    async function carregarPagina() {
      try {
        const [premiosRes, funcionariosRes, bannersRes, configRes] = await Promise.all([
          // Só o necessário para desenhar as fatias. Peso e estoque não descem
          // para o navegador: quem decide o prêmio é a RPC, no servidor.
          // O filtro é apenas `ativo` — prêmio esgotado continua na roleta.
          supabase
            .from('resgate_premios')
            .select('id, nome, rotulo, rotulo_secundario, ordem')
            .eq('ativo', true)
            .order('ordem', { ascending: true }),
          supabase.from('resgate_funcionarios').select('id, nome').eq('ativo', true).order('nome', { ascending: true }),
          supabase.from('resgate_banners').select('*').order('ordem', { ascending: true }),
          supabase
            .from('configuracoes')
            .select('chave, valor')
            .in('chave', ['resgate_whatsapp_numero']),
        ]);

        setPremios(premiosRes.data || []);
        setFuncionarios(funcionariosRes.data || []);
        setBanners(bannersRes.data || []);

        const mapaConfig = Object.fromEntries((configRes.data || []).map((item) => [item.chave, item.valor]));
        setWhatsappNumero(mapaConfig.resgate_whatsapp_numero || NUMERO_WHATSAPP_PADRAO);
      } catch (erro) {
        console.error('Erro ao carregar a página Resgate seu Prêmio:', erro);
      } finally {
        setCarregandoPagina(false);
      }
    }
    carregarPagina();
  }, []);

  function handleChangeForm(e) {
    let { name, value } = e.target;
    if (name === 'codigo') value = mascaraVoucher(value);
    setForm((prev) => ({ ...prev, [name]: value }));
    setErroFormulario('');
  }

  function abrirFormulario() {
    if (premioGanho) return;
    setForm(FORM_INICIAL);
    setErroFormulario('');
    setModalAberto('formulario');
  }

  async function handleGirar(e) {
    e.preventDefault();
    setErroFormulario('');

    if (!form.nomeCompleto.trim() || !form.codigo.trim() || !form.funcionarioId) {
      setErroFormulario('Preencha todos os campos para continuar.');
      return;
    }
    if (form.nomeCompleto.trim().length < 3) {
      setErroFormulario('Digite seu nome completo.');
      return;
    }
    if (form.codigo.length < TAMANHO_MINIMO_VOUCHER) {
      setErroFormulario('Código do voucher incompleto. Confira o que você recebeu.');
      return;
    }

    setEnviando(true);
    try {
      const { data, error } = await supabase.rpc('girar_roleta_resgate', {
        p_nome_completo: form.nomeCompleto.trim(),
        p_codigo: form.codigo,
        p_funcionario_id: Number(form.funcionarioId),
      });
      if (error) throw error;

      const linha = Array.isArray(data) ? data[0] : data;
      if (!linha) throw new Error('Resposta vazia da função de sorteio.');

      if (linha.resultado === 'sucesso') {
        setPremioGanho({ id: linha.premio_id, nome: linha.premio_nome });
        setModalAberto(null);
        setGirandoRoleta(true);
      } else {
        setErroFormulario(MENSAGENS_ERRO[linha.resultado] || 'Não foi possível validar seu voucher.');
      }
    } catch (erro) {
      console.error('Erro ao girar a roleta do resgate:', erro);
      setErroFormulario('Não foi possível girar a roleta agora. Tente novamente em instantes.');
    } finally {
      setEnviando(false);
    }
  }

  const aoTerminarGiro = useCallback(() => {
    setGirandoRoleta(false);
    setResultadoVisivel(true);
  }, []);

  const nomeIndicador =
    funcionarios.find((funcionario) => String(funcionario.id) === String(form.funcionarioId))?.nome || '';

  // Monta a conversa já preenchida com os dados do giro.
  function linkResgatarPremio() {
    const numero = (whatsappNumero || NUMERO_WHATSAPP_PADRAO).replace(/\D/g, '');
    const texto = MENSAGEM_WHATSAPP
      .replaceAll('{{nome}}', form.nomeCompleto.trim())
      .replaceAll('{{voucher}}', form.codigo)
      .replaceAll('{{indicadoPor}}', nomeIndicador)
      .replaceAll('{{premio}}', premioGanho?.nome || '');
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  }

  return (
    <div className="w-full min-h-screen bg-white text-gray-900 font-sans antialiased pb-10">
      <Navbar />

      <HeroCarrossel banners={banners} />

      {/* --- SEÇÃO PRINCIPAL: fundo claro, roleta em destaque --- */}
      {/* Sem banner cadastrado o hero não renderiza, então o topo respira sozinho */}
      <div className={`relative w-full overflow-hidden bg-white pb-8 ${banners.length > 0 ? 'pt-12 md:pt-16' : 'pt-14 md:pt-20'}`}>
        {/* Brilho suave e claro, só para dar um respiro atrás do conjunto */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(254,209,6,0.10)_0%,transparent_60%)] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          {/* Título centralizado */}
          <div className="flex flex-col items-center text-center mb-16 md:mb-24">
            <h1 className="fonte-titulo-sorteio relative z-10 text-3xl md:text-5xl font-black text-[#000000] leading-[1.2] mb-4 px-2">
              Roleta de Prêmios
            </h1>

            {/* max-w-lg segura a quebra em duas linhas, com "sua recompensa!"
                sozinho na segunda — como no layout de referência. */}
            <p className="relative z-10 text-base text-gray-600 font-medium leading-relaxed max-w-lg">
              Você votou na <span className="font-bold text-gray-800">Estude Seguro</span>. Agora é hora de girar e
              descobrir sua recompensa!
            </p>
          </div>

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
                    montarConteudoSegmento={conteudoSegmentoResgate}
                  />

                  {premioGanho ? (
                    <button
                      onClick={() => setResultadoVisivel(true)}
                      className="w-full max-w-xs inline-flex items-center justify-center gap-2 bg-black hover:bg-[#1a1a1a] text-white font-black text-sm px-10 py-4 rounded-full uppercase tracking-wide cursor-pointer animate-pulso-preto"
                    >
                      🏆 Ver meu prêmio
                    </button>
                  ) : (
                    <button
                      onClick={abrirFormulario}
                      disabled={girandoRoleta}
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
                      <img src={caixaPresente} alt="" className="w-full h-full object-contain select-none" />
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
                    <TicketIcon className="w-4 h-4 text-black" />
                  </span>
                  <span className="text-sm font-black text-black">Um giro por voucher</span>
                  <p className="text-xs text-gray-400 leading-relaxed">Cada código recebido vale uma única rodada.</p>
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

      {/* --- MODAL: FORMULÁRIO DO VOUCHER --- */}
      {modalAberto === 'formulario' && (
        <PopupModalShell variante="cartao" onFechar={() => setModalAberto(null)}>
          <div className="bg-white rounded-2xl p-6 md:p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
            <h2 className="text-lg font-black text-gray-900 mb-1 tracking-tight">Valide seu voucher</h2>
            <p className="text-xs text-gray-500 mb-6">Use o código que você recebeu de quem te indicou.</p>

            <form onSubmit={handleGirar} className="flex flex-col gap-4">
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
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Código do voucher</label>
                <input
                  required
                  type="text"
                  name="codigo"
                  value={form.codigo}
                  onChange={handleChangeForm}
                  placeholder="AB3XZK9PQR"
                  autoComplete="off"
                  maxLength={TAMANHO_MAXIMO_VOUCHER}
                  className={`${CLASSE_INPUT} tracking-[0.4em] font-black text-center text-lg uppercase`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Quem indicou você?</label>
                <select
                  required
                  name="funcionarioId"
                  value={form.funcionarioId}
                  onChange={handleChangeForm}
                  className={`${CLASSE_INPUT} cursor-pointer`}
                >
                  <option value="">Selecione o nome</option>
                  {funcionarios.map((funcionario) => (
                    <option key={funcionario.id} value={funcionario.id}>
                      {funcionario.nome}
                    </option>
                  ))}
                </select>
                {funcionarios.length === 0 && (
                  <p className="text-[11px] text-amber-600 font-semibold mt-1.5">
                    Nenhum participante cadastrado na campanha ainda.
                  </p>
                )}
              </div>

              {erroFormulario && (
                <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl text-center border border-red-100">
                  ⚠️ {erroFormulario}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-[#fed106] hover:bg-black hover:text-white text-black font-black text-sm py-4 rounded-full uppercase tracking-wide transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 mt-2"
              >
                {enviando ? 'Validando...' : 'Girar roleta'}
              </button>
            </form>
          </div>
        </PopupModalShell>
      )}

      {/* --- MODAL: RESULTADO --- */}
      {resultadoVisivel && premioGanho && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div
            className="relative w-full max-w-[400px] rounded-[28px] p-px bg-gradient-to-b from-[#fed106]/60 via-white/10 to-transparent shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <div className="relative rounded-[27px] bg-gradient-to-b from-[#181818] to-[#0c0c0c] px-8 pt-10 pb-8 overflow-hidden">
              {/* Halo dourado atrás do selo, no lugar do confete */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(254,209,6,0.22)_0%,transparent_70%)] pointer-events-none" />

              <button
                onClick={() => setResultadoVisivel(false)}
                aria-label="Fechar"
                className="absolute top-5 right-5 text-white/30 hover:text-white transition-colors cursor-pointer z-10"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              <div className="relative text-center">
                {/* Selo */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-b from-[#ffe157] to-[#f5c400] flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(254,209,6,0.7)]">
                  <TrophyIcon className="w-8 h-8 text-black" strokeWidth={1.8} />
                </div>

                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fed106] mb-3">Prêmio confirmado</p>

                <h2
                  className="fonte-titulo-sorteio text-[26px] leading-tight font-black text-white mb-3 px-2"
                >
                  {premioGanho.nome}
                </h2>

                <p className="text-xs text-white/45 font-medium leading-relaxed max-w-[280px] mx-auto mb-7">
                  Registramos seu prêmio. Finalize o resgate falando com a nossa equipe pelo WhatsApp.
                </p>

                {/* Resumo do giro */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/5 mb-7 text-left">
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-white/35 shrink-0">Nome</span>
                    <span className="text-xs font-semibold text-white/80 truncate">{form.nomeCompleto.trim()}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-white/35 shrink-0">Voucher</span>
                    <span className="text-xs font-black tracking-[0.2em] text-[#fed106]">{form.codigo}</span>
                  </div>
                  {nomeIndicador && (
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-white/35 shrink-0">
                        Indicado por
                      </span>
                      <span className="text-xs font-semibold text-white/80 truncate">{nomeIndicador}</span>
                    </div>
                  )}
                </div>

                <a
                  href={linkResgatarPremio()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe57] text-white font-black text-sm py-4 rounded-2xl uppercase tracking-wide transition-all active:scale-[0.98] shadow-[0_10px_30px_-10px_rgba(37,211,102,0.8)]"
                >
                  <IconeWhatsapp className="w-5 h-5" />
                  Resgatar meu prêmio
                </a>

                <button
                  onClick={() => setResultadoVisivel(false)}
                  className="mt-4 text-white/35 hover:text-white/70 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Ver depois
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
