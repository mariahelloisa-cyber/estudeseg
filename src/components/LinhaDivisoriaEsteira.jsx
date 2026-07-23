import linhaDivisoria from '../assets/linha-transparente-cortada.png';

// --- Linha divisória em esteira infinita: a faixa interna contém 2 cópias idênticas da mesma
// imagem lado a lado (sem gap) e desliza para a esquerda em translateX(0% -> -50%) linear e
// infinito. Como a 2ª cópia é pixel-a-pixel igual à 1ª, no instante em que a 1ª sai totalmente
// pela esquerda a 2ª já está ocupando exatamente o mesmo lugar na tela — o loop reinicia
// (volta a 0%) sem nenhum salto, corte ou espaço vazio perceptível. A altura da faixa usa a
// proporção da imagem já cortada (862x24 — a original tinha ~4px de margem transparente em
// cima e embaixo, o que deixava um respiro visível antes da próxima seção; aqui o desenho
// preenche a faixa até a borda), então cada cópia sempre fica com a largura exata da tela
// (igual ao <img w-full h-auto> anterior), em qualquer resolução.
export default function LinhaDivisoriaEsteira() {
  return (
    <div
      className="relative w-full overflow-hidden select-none pointer-events-none"
      style={{ aspectRatio: '862 / 24' }}
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
        {[0, 1].map((copia) => (
          <img
            key={copia}
            src={linhaDivisoria}
            alt=""
            draggable={false}
            className="block h-full w-auto shrink-0"
          />
        ))}
      </div>
    </div>
  );
}
