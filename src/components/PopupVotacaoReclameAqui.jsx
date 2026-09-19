import { useCallback, useEffect, useRef, useState } from 'react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import logoEstudeSeguro from '../assets/logo-estud.webp';

// Modal de campanha: convida o visitante a votar na Estude Seguro no Prêmio Reclame Aqui.
// É uma camada independente (não usa o sistema de pop-ups do admin, `PopupAvisos`) e só é
// montado nas páginas públicas — ver App.jsx.
//
// LOGO DO RECLAME AQUI: não existe no projeto (o `reclameaqui.webp` é um print do perfil).
// Coloque o arquivo oficial em `src/assets/` com um destes nomes e ela aparece sozinha ao lado
// da logo da Estude Seguro, sem editar código: logo-reclameaqui.png | .svg | .webp | .jpg.
// Sem o arquivo, o modal mostra só a logo da Estude Seguro.
const logosReclameAqui = import.meta.glob('../assets/logo-reclameaqui.{png,svg,webp,jpg,jpeg}', {
  eager: true,
  import: 'default',
});
const logoReclameAqui = Object.values(logosReclameAqui)[0] || null;

const LINK_VOTACAO = 'https://www.reclameaqui.com.br/premio/votacao/';

const ATRASO_PARA_ABRIR_MS = 1000;
const DURACAO_ANIMACAO_MS = 280;

// O modal aparece a CADA carregamento da página (entrar no site ou recarregar), mesmo que o
// visitante já o tenha dispensado antes — por isso não há localStorage aqui. Este flag só vive na
// memória da página: depois de fechado, navegar entre as páginas do site (sem recarregar) não o
// reabre, mas recarregar (F5) zera o flag e ele volta.
let dispensadoNestaCarga = false;

const SELETOR_FOCAVEIS = 'a[href], button:not([disabled])';

export default function PopupVotacaoReclameAqui() {
  const [montado, setMontado] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const refDialogo = useRef(null);
  const refFocoAnterior = useRef(null);
  const refFechando = useRef(false);
  const refTemporizadorFechar = useRef(null);

  // Abre sozinho pouco depois de a página carregar, se ainda não foi fechado nesta carga.
  useEffect(() => {
    if (dispensadoNestaCarga) return;
    const temporizador = setTimeout(() => setMontado(true), ATRASO_PARA_ABRIR_MS);
    return () => clearTimeout(temporizador);
  }, []);

  // Dois quadros de espera: o modal precisa ser pintado uma vez no estado "escondido"
  // para a transição de entrada (opacidade/escala) ter de onde partir.
  useEffect(() => {
    if (!montado) return;
    let quadro2;
    const quadro1 = requestAnimationFrame(() => {
      quadro2 = requestAnimationFrame(() => setVisivel(true));
    });
    return () => {
      cancelAnimationFrame(quadro1);
      cancelAnimationFrame(quadro2);
    };
  }, [montado]);

  useEffect(() => () => clearTimeout(refTemporizadorFechar.current), []);

  // Fecha com a animação de saída e só então remove do DOM.
  const fechar = useCallback(() => {
    if (refFechando.current) return;
    refFechando.current = true;
    dispensadoNestaCarga = true;
    setVisivel(false);
    refTemporizadorFechar.current = setTimeout(() => {
      setMontado(false);
      refFocoAnterior.current?.focus?.({ preventScroll: true });
    }, DURACAO_ANIMACAO_MS);
  }, []);

  // Enquanto aberto: trava o scroll da página (sem "pular" o layout pela barra de rolagem que
  // some), leva o foco pro modal e trata ESC + Tab (foco preso dentro do modal).
  useEffect(() => {
    if (!montado) return;

    const bodyEstilo = document.body.style;
    const overflowAnterior = bodyEstilo.overflow;
    const paddingAnterior = bodyEstilo.paddingRight;
    const larguraBarra = window.innerWidth - document.documentElement.clientWidth;
    bodyEstilo.overflow = 'hidden';
    if (larguraBarra > 0) bodyEstilo.paddingRight = `${larguraBarra}px`;

    refFocoAnterior.current = document.activeElement;
    refDialogo.current?.focus({ preventScroll: true });

    function aoTeclar(evento) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        fechar();
        return;
      }
      if (evento.key !== 'Tab') return;

      const dialogo = refDialogo.current;
      if (!dialogo) return;
      const focaveis = [...dialogo.querySelectorAll(SELETOR_FOCAVEIS)];
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      const ativo = document.activeElement;

      if (!dialogo.contains(ativo) || (evento.shiftKey && (ativo === primeiro || ativo === dialogo))) {
        evento.preventDefault();
        (evento.shiftKey ? ultimo : primeiro).focus();
      } else if (!evento.shiftKey && ativo === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      bodyEstilo.overflow = overflowAnterior;
      bodyEstilo.paddingRight = paddingAnterior;
    };
  }, [montado, fechar]);

  if (!montado) return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] overflow-y-auto bg-[rgba(10,18,20,0.72)] backdrop-blur-[2px] transition-opacity duration-[280ms] ease-out motion-reduce:transition-none ${
        visivel ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Área de rolagem: se a tela for baixa, o modal rola por dentro em vez de ser cortado.
          Clicar aqui (fora do cartão) fecha; clicar dentro do cartão não. */}
      <div
        className="min-h-full flex items-center justify-center p-3 sm:p-4"
        onPointerDown={(evento) => {
          if (evento.target === evento.currentTarget) fechar();
        }}
      >
        <div
          ref={refDialogo}
          role="dialog"
          aria-modal="true"
          aria-labelledby="popup-votacao-titulo"
          aria-describedby="popup-votacao-texto"
          tabIndex={-1}
          className={`relative w-full max-w-[720px] rounded-[18px] bg-white px-5 pb-6 pt-14 text-center shadow-[0_24px_64px_-12px_rgba(0,0,0,0.45)] outline-none transition duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:px-14 sm:pb-8 sm:pt-16 ${
            visivel ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-[10px] scale-[0.96] opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={() => fechar()}
            aria-label="Fechar"
            className="absolute right-3 top-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fed106] sm:right-5 sm:top-5"
          >
            <XMarkIcon className="h-6 w-6" strokeWidth={1.75} />
          </button>

          {/* Logos lado a lado, separadas por uma linha fina (imagens originais, sem filtros) */}
          <div className="flex items-center justify-center gap-4 sm:gap-7">
            <img
              src={logoEstudeSeguro}
              alt="Estude Seguro"
              // O arquivo tem ~40% de margem transparente em volta do desenho. Ampliamos a
              // imagem e puxamos as margens de volta (negativas) para o desenho ficar da mesma
              // altura visual da logo do Reclame Aqui, sem editar o arquivo da logo.
              className="-mx-6 -my-5 h-[104px] w-auto max-w-none object-contain sm:-mx-8 sm:-my-[26px] sm:h-[140px]"
            />
            {logoReclameAqui && (
              <>
                <span aria-hidden="true" className="h-12 w-px shrink-0 bg-gray-200 sm:h-16" />
                <img
                  src={logoReclameAqui}
                  alt="Reclame Aqui"
                  className="h-16 w-auto min-w-0 max-w-[48%] object-contain sm:h-[88px]"
                />
              </>
            )}
          </div>

          <h2
            id="popup-votacao-titulo"
            className="mt-7 text-[25px] font-extrabold leading-[1.25] tracking-tight text-[#1b2540] sm:mt-9 sm:text-[34px] sm:leading-[1.22]"
          >
            Ajude a Estude Seguro a<br className="hidden sm:block" /> conquistar esse prêmio! 🏆
          </h2>

          <p
            id="popup-votacao-texto"
            className="mt-4 text-[15px] leading-relaxed text-[#5f6b85] sm:mt-5 sm:text-lg"
          >
            Estamos concorrendo ao Prêmio Reclame Aqui.
            <br className="hidden sm:block" /> Seu voto faz a diferença!
          </p>

          {/* É um link (navega para outro site), estilizado como botão: funciona com teclado,
              clique do meio e não é barrado por bloqueador de pop-up. Abre em nova aba para o
              visitante não perder o site. */}
          <a
            href={LINK_VOTACAO}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => fechar()}
            className="mx-auto mt-7 flex min-h-14 w-full max-w-full cursor-pointer items-center justify-center rounded-[10px] bg-[#fed106] px-6 text-base font-extrabold uppercase tracking-wide text-black shadow-[0_2px_0_rgba(0,0,0,0.06)] transition duration-200 hover:bg-[#ecbf00] hover:shadow-[0_8px_20px_-8px_rgba(180,140,0,0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:mt-9 sm:min-h-[68px] sm:w-[470px] sm:text-lg"
          >
            Votar agora
          </a>

          <button
            type="button"
            onClick={() => fechar()}
            className="mt-5 cursor-pointer text-[15px] text-gray-500 underline underline-offset-2 transition-colors hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fed106] sm:text-base"
          >
            Agora não
          </button>

          <div className="mt-6 border-t border-[#e5e7eb] pt-5 sm:mt-8">
            <p className="flex items-center justify-center gap-2 text-left text-[13px] leading-snug text-[#6b7690] sm:text-sm">
              <InformationCircleIcon aria-hidden="true" className="h-5 w-5 shrink-0" />
              <span>Você será direcionado para a página oficial de votação do Reclame Aqui.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
