import { Fragment, useEffect, useState } from 'react';
import { AcademicCapIcon as AcademicCapIconSolido } from '@heroicons/react/24/solid';
import { STATUS_MATRICULA } from '../utils/statusMatricula';

// Duração/atraso de cada trecho da animação de "carregamento" — o capelo e o preenchimento
// amarelo percorrem um trecho por vez, em sequência, da esquerda pra direita (linha 1),
// descem pra linha 2 e continuam. Ajuste os dois valores juntos para deixar mais rápido/lento.
const DURACAO_TRECHO_MS = 1100;
const ATRASO_ENTRE_TRECHOS_MS = 1000;

function Node({ status, estado, aceso }) {
  const { Icon, label, descricao } = status;
  // O amarelo acompanha o capelo: só o nó onde ele está "agora" fica amarelo. Nos nós já
  // passados isso é passageiro (volta a preto assim que o capelo segue viagem); no nó do
  // status atual, quando o capelo finalmente chega lá, ele fica amarelo e ganha o brilho
  // pulsante — e permanece assim (ver `indiceAceso` em LinhaDoTempoMatricula).
  const corIcone = aceso ? (estado === 'atual' ? 'text-[#fed106] animate-glow-matricula-icon' : 'text-[#fed106]') : 'text-black';

  return (
    <div className="flex flex-col items-center gap-2.5 text-center w-28 md:w-40 shrink-0">
      <Icon className={`w-12 h-12 md:w-16 md:h-16 shrink-0 transition-colors duration-150 ${corIcone}`} />
      <div>
        <span className={`text-xs md:text-sm font-bold leading-tight ${estado === 'futuro' ? 'text-gray-500' : 'text-gray-900'}`}>
          {label}
        </span>
        {descricao && (
          <p className="text-[10px] md:text-[11px] font-normal text-gray-400 leading-snug mt-1">
            {descricao}
          </p>
        )}
      </div>
      {estado === 'atual' && (
        <span className="text-[10px] md:text-xs font-black text-[#fed106] uppercase tracking-wider">Você está aqui</span>
      )}
    </div>
  );
}

function Trecho({ ativo, ultimoAtivo, indice, iniciado, orientacao }) {
  const atraso = `${indice * ATRASO_ENTRE_TRECHOS_MS}ms`;
  const vertical = orientacao === 'vertical';
  // No último trecho já percorrido, o capelo fica parado no fim marcando o status atual —
  // nos trechos anteriores ele só passa de largo, entregando o "bastão" pro próximo trecho.
  const nomeAnimacao = vertical
    ? (ultimoAtivo ? 'capelodescendoFinal' : 'capelodescendo')
    : (ultimoAtivo ? 'caleloatravessandoFinal' : 'caleloatravessando');

  return (
    <div className={`relative shrink-0 rounded-full bg-[#ffeea0] overflow-visible ${vertical ? 'w-1.5 h-8 md:h-10' : 'h-1.5 flex-1 min-w-[16px]'}`}>
      <div
        className="absolute inset-0 rounded-full bg-[#fed106] overflow-hidden"
        style={{
          transformOrigin: vertical ? 'top' : 'left',
          transform: ativo && iniciado ? 'scale(1)' : vertical ? 'scaleY(0)' : 'scaleX(0)',
          transitionProperty: 'transform',
          transitionDuration: `${DURACAO_TRECHO_MS}ms`,
          transitionTimingFunction: 'ease-out',
          transitionDelay: atraso,
        }}
      />
      {ativo && (
        <AcademicCapIconSolido
          className="absolute w-9 h-9 md:w-12 md:h-12 text-black z-10 drop-shadow-sm"
          style={{
            top: vertical ? undefined : 'calc(50% - 3px)',
            left: vertical ? '50%' : undefined,
            transform: 'translate(-50%, -50%) rotate(-16deg)',
            animation: `${nomeAnimacao} ${DURACAO_TRECHO_MS}ms ease-in-out ${atraso} both`,
          }}
        />
      )}
    </div>
  );
}

// Linha do tempo de acompanhamento de matrícula: 8 etapas (STATUS_MATRICULA), 4 por linha no
// desktop/tablet e empilhadas verticalmente no mobile. `statusAtual` (0-7) define quais nós já
// foram concluídos, qual é o atual e quais ainda são futuros. Monte este componente com uma
// `key` nova a cada consulta bem-sucedida (ex.: key={Date.now()}) para a animação tocar do zero.
export default function LinhaDoTempoMatricula({ statusAtual }) {
  const [iniciado, setIniciado] = useState(false);
  // Índice do nó que está "aceso" (amarelo) neste instante — segue o capelo enquanto ele
  // percorre a linha e, ao chegar no nó do status atual, para ali e não muda mais.
  const [indiceAceso, setIndiceAceso] = useState(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIniciado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const temporizadores = [];
    for (let k = 0; k <= statusAtual; k++) {
      // Mesmo instante em que o trecho anterior termina (o capelo chega no nó k); para o
      // nó 0 dá um pequeno atraso sintético, então nunca acende já no primeiro frame.
      // O `* 0.8` adianta um pouco o acender: por causa do easing (ease-in-out) da
      // animação do capelo, ele "parece" chegar bem antes do fim exato dos 100% do trecho.
      const tempoChegada = Math.max(100, (k - 1) * ATRASO_ENTRE_TRECHOS_MS + DURACAO_TRECHO_MS * 0.4);
      temporizadores.push(setTimeout(() => setIndiceAceso(k), tempoChegada));
    }
    return () => temporizadores.forEach(clearTimeout);
  }, [statusAtual]);

  function estadoNode(indiceNode) {
    if (indiceNode < statusAtual) return 'concluido';
    if (indiceNode === statusAtual) return 'atual';
    return 'futuro';
  }

  // Trecho i liga o nó i ao nó i+1; já foi percorrido se o nó de chegada (i+1) já foi alcançado.
  const trechoAtivo = (indiceTrecho) => indiceTrecho < statusAtual;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <style>{`
        @keyframes glowPulseIconeMatricula {
          0%, 100% { filter: drop-shadow(0 0 0px rgba(254, 209, 6, 0)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 7px rgba(254, 209, 6, 0.9)); transform: scale(1.08); }
        }
        .animate-glow-matricula-icon { animation: glowPulseIconeMatricula 2s ease-in-out infinite; }

        @keyframes caleloatravessando {
          0% { left: 0%; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes capelodescendo {
          0% { top: 0%; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes caleloatravessandoFinal {
          0% { left: 0%; opacity: 0; }
          8% { opacity: 1; }
          100% { left: 100%; opacity: 1; }
        }
        @keyframes capelodescendoFinal {
          0% { top: 0%; opacity: 0; }
          8% { opacity: 1; }
          100% { top: 100%; opacity: 1; }
        }
      `}</style>

      {/* --- DESKTOP / TABLET: 4 status por linha, 2 linhas --- */}
      <div className="hidden md:flex md:flex-col md:gap-10">
        <div className="flex items-start justify-center">
          {[0, 1, 2, 3].map((j) => (
            <Fragment key={j}>
              <Node status={STATUS_MATRICULA[j]} estado={estadoNode(j)} aceso={indiceAceso === j} />
              {j < 3 && (
                <div className="flex-1 max-w-[170px] mt-8 px-1">
                  <Trecho ativo={trechoAtivo(j)} ultimoAtivo={j === statusAtual - 1} indice={j} iniciado={iniciado} orientacao="horizontal" />
                </div>
              )}
            </Fragment>
          ))}
        </div>

        <div className="flex items-start justify-center">
          {[4, 5, 6, 7].map((j, localIdx) => (
            <Fragment key={j}>
              <Node status={STATUS_MATRICULA[j]} estado={estadoNode(j)} aceso={indiceAceso === j} />
              {localIdx < 3 && (
                <div className="flex-1 max-w-[170px] mt-8 px-1">
                  <Trecho ativo={trechoAtivo(4 + localIdx)} ultimoAtivo={4 + localIdx === statusAtual - 1} indice={4 + localIdx} iniciado={iniciado} orientacao="horizontal" />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {/* --- MOBILE: empilhado verticalmente, uma etapa por vez --- */}
      <div className="flex md:hidden flex-col items-center">
        {STATUS_MATRICULA.map((status, j) => (
          <Fragment key={status.chave}>
            <Node status={status} estado={estadoNode(j)} aceso={indiceAceso === j} />
            {j < 7 && (
              <div className="py-1">
                <Trecho ativo={trechoAtivo(j)} ultimoAtivo={j === statusAtual - 1} indice={j} iniciado={iniciado} orientacao="vertical" />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
