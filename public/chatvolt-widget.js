(async () => {
  try {
    const { default: Chatbox } = await import(
      'https://cdn.jsdelivr.net/npm/@chatvolt/embeds@latest/dist/chatbox/index.js'
    );

    const widget = await Chatbox.initBubble({
      agentId: 'cms6aoung02lq12ceucub9jpr',
      interface: {
        isBgTransparent: true,
        bubbleButtonStyle: {
          width: '48px',
          height: '48px',
          boxShadow: '0 6px 18px -4px rgba(0,0,0,0.35)',
        },
      },
    });

    // Encolhe a janela do chat no desktop e anima a bolinha quando fechada
    // (sem opções nativas para isso no widget)
    if (widget?.shadowRoot) {
      const style = document.createElement('style');
      style.textContent = `
        @media (min-width: 600px) {
          .MuiCard-root.MuiCard-variantOutlined {
            width: min(90vw, 400px) !important;
            max-height: 560px !important;
          }
        }

        @keyframes segurinho-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 6px 18px -4px rgba(0,0,0,0.35), 0 0 0 0 rgba(254,209,6,0.55);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 6px 18px -4px rgba(0,0,0,0.35), 0 0 24px 12px rgba(254,209,6,0.45);
          }
        }
        /* fechado: mostra o avatar (<img>) e pulsa com brilho. aberto: mostra o ícone X (<svg>) e para */
        .chatvolt-launcher {
          animation: segurinho-pulse 2.4s ease-in-out infinite;
        }
        .chatvolt-launcher:has(svg) {
          animation: none;
        }
      `;
      widget.shadowRoot.appendChild(style);
    }
  } catch (err) {
    console.error('Chat widget (Chatvolt) failed to load:', err);
  }
})();
