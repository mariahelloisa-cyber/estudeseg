import { useId } from 'react';

// --- Linha divisória em esteira infinita, feita 100% em SVG (sem imagem rasterizada).
//
// Faixa densa de blocos grandes e arredondados (quase quadrados), encostados um no outro sem
// nenhum espaço vazio entre eles. O encaixe visual vem de um "tab" grande e arredondado em cada
// junção — não uma borda reta — que invade a peça vizinha, alternando entre a parte de cima e a
// de baixo a cada junção. Os tabs só existem ENTRE blocos de uma mesma cópia (nunca na borda
// esquerda/direita da cópia inteira), então a borda de cada cópia é sempre um bloco "liso" — por
// isso colar a borda de uma cópia na da outra não deixa nenhuma emenda visível (ver o duplo
// <FaixaEsteiraSvg/> lá embaixo, deslizando 0% -> -50%).
//
// Os blocos brancos não têm contorno preto (fundiriam com o fundo branco das seções sem nenhuma
// marca) — em vez de borda, uma sombra suave delimita só a parte de cima e a de baixo de cada
// bloco branco. Essa sombra é desenhada como duas faixinhas retas (não uma cópia borrada do bloco
// inteiro), cada uma recuada para dentro além do raio do canto arredondado, então o blur nunca
// alcança os cantos/laterais — só aparece como uma linha reta em cima e embaixo.
//
// Tudo vetorial (poucos <rect>), então fica nítido em qualquer resolução/densidade de tela — não
// depende mais de pixels de uma imagem PNG.

const AMARELO = '#fed106';
const PRETO = '#000000';
const BRANCO = '#ffffff';

// Ciclo de cores da identidade visual: amarelo predominante, preto e branco como acentos
const PALETA = [AMARELO, PRETO, BRANCO, PRETO, AMARELO, BRANCO];

const ALTURA_TOTAL = 100;
const MARGEM_VERTICAL = 0; // sem respiro — blocos encostam nas seções acima/abaixo
const ALTURA_BLOCO = ALTURA_TOTAL - MARGEM_VERTICAL * 2; // bloco ocupa ~86% da altura total
const LARGURA_BLOCO = 66; // bloco quase quadrado
const RAIO_CANTO = 14;
const LARGURA_TAB = LARGURA_BLOCO * 0.42; // tab grande e grosso — encaixe, não um conector fino
const ALTURA_TAB = ALTURA_BLOCO * 0.56;
const RAIO_TAB = RAIO_CANTO * 0.8;

const BLOCOS_POR_MODULO = PALETA.length; // um ciclo completo de cores
const QTD_MODULOS = 9; // múltiplo do ciclo — mantém a proporção/altura da versão anterior
const QTD_BLOCOS = BLOCOS_POR_MODULO * QTD_MODULOS;
const LARGURA_TOTAL = LARGURA_BLOCO * QTD_BLOCOS;

function Bloco({ indice, idFiltroSombra }) {
  const cor = PALETA[indice % PALETA.length];
  const x = indice * LARGURA_BLOCO;
  return (
    <SombraOuBloco
      x={x}
      y={MARGEM_VERTICAL}
      largura={LARGURA_BLOCO}
      altura={ALTURA_BLOCO}
      raio={RAIO_CANTO}
      cor={cor}
      idFiltroSombra={idFiltroSombra}
    />
  );
}

function TabEncaixe({ indice, idFiltroSombra }) {
  // um tab por junção entre blocos (nunca na borda esquerda/direita da cópia inteira)
  const emCima = indice % 2 === 0;
  const donoDoTab = emCima ? indice : indice + 1; // quem "invade" o vizinho
  const cor = PALETA[donoDoTab % PALETA.length];
  const x = (indice + 1) * LARGURA_BLOCO - LARGURA_TAB / 2;
  const y = emCima ? MARGEM_VERTICAL : MARGEM_VERTICAL + ALTURA_BLOCO - ALTURA_TAB;
  return (
    <SombraOuBloco
      x={x}
      y={y}
      largura={LARGURA_TAB}
      altura={ALTURA_TAB}
      raio={RAIO_TAB}
      cor={cor}
      idFiltroSombra={idFiltroSombra}
    />
  );
}

// Peças amarelas/pretas são só um <rect>. Peças brancas ganham, além do <rect>, duas faixinhas
// de sombra (em cima e embaixo, recuadas para não tocar os cantos arredondados) que delimitam o
// bloco branco contra o fundo branco da página, sem usar contorno.
function SombraOuBloco({ x, y, largura, altura, raio, cor, idFiltroSombra }) {
  if (cor !== BRANCO) {
    return <rect x={x} y={y} width={largura} height={altura} rx={raio} fill={cor} />;
  }
  const recuo = raio * 1.15;
  const larguraFaixa = Math.max(largura - recuo * 2, 1);
  const alturaFaixa = 5;
  return (
    <>
      <rect
        x={x + recuo}
        y={y}
        width={larguraFaixa}
        height={alturaFaixa}
        fill="rgba(0,0,0,0.3)"
        filter={`url(#${idFiltroSombra})`}
      />
      <rect
        x={x + recuo}
        y={y + altura - alturaFaixa}
        width={larguraFaixa}
        height={alturaFaixa}
        fill="rgba(0,0,0,0.3)"
        filter={`url(#${idFiltroSombra})`}
      />
      <rect x={x} y={y} width={largura} height={altura} rx={raio} fill={BRANCO} />
    </>
  );
}

function FaixaEsteiraSvg({ idFiltroSombra }) {
  return (
    <svg
      viewBox={`0 0 ${LARGURA_TOTAL} ${ALTURA_TOTAL}`}
      className="block h-full w-auto shrink-0"
      aria-hidden="true"
    >
      <defs>
        {/* blur só no eixo vertical (stdDeviation "0 y") — garante que a sombra nunca
            vaze para os lados/cantos, só apareça como linha reta em cima/embaixo */}
        <filter
          id={idFiltroSombra}
          x="-10%"
          y="-60%"
          width="120%"
          height="220%"
        >
          <feGaussianBlur stdDeviation="0 1.8" />
        </filter>
      </defs>
      {/* blocos desenhados primeiro, encostados sem espaço entre si */}
      {Array.from({ length: QTD_BLOCOS }, (_, i) => (
        <Bloco key={`bloco-${i}`} indice={i} idFiltroSombra={idFiltroSombra} />
      ))}
      {/* tabs desenhados por cima, invadindo o bloco vizinho (efeito de encaixe) */}
      {Array.from({ length: QTD_BLOCOS - 1 }, (_, i) => (
        <TabEncaixe key={`tab-${i}`} indice={i} idFiltroSombra={idFiltroSombra} />
      ))}
    </svg>
  );
}

export default function LinhaDivisoriaEsteira() {
  // id único por instância do componente — evita <filter id="..."> duplicado no documento
  // quando a esteira aparece mais de uma vez na mesma página (Inicio.jsx usa 2x)
  const idFiltroSombra = `esteira-sombra-branco-${useId()}`;

  return (
    <div
      className="relative w-full overflow-hidden select-none pointer-events-none"
      style={{ aspectRatio: `${LARGURA_TOTAL} / ${ALTURA_TOTAL}` }}
    >
      <style>{`
        @keyframes esteiraLinhaDivisoria {
          from { transform: translateX(0%); }
          to { transform: translateX(-50%); }
        }
      `}</style>
      <div
        className="absolute left-0 top-0 bottom-0 flex w-max"
        style={{ animation: 'esteiraLinhaDivisoria 15s linear infinite' }}
      >
        <FaixaEsteiraSvg idFiltroSombra={idFiltroSombra} />
        <FaixaEsteiraSvg idFiltroSombra={idFiltroSombra} />
      </div>
    </div>
  );
}
