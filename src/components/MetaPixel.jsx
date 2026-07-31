import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Injeta o código-base do Meta Pixel (Facebook/Instagram Ads) só se houver um
// ID configurado no painel admin (tabela "configuracoes", chave "meta_pixel_id").
// Se não houver Pixel configurado, nada é carregado.
export default function MetaPixel() {
  const location = useLocation();
  const pixelAtivoRef = useRef(false);

  useEffect(() => {
    let cancelado = false;

    async function iniciarPixel() {
      try {
        const { data, error } = await supabase
          .from('configuracoes')
          .select('valor')
          .eq('chave', 'meta_pixel_id')
          .maybeSingle();
        if (error) throw error;

        const pixelId = (data?.valor || '').trim();
        if (cancelado || !pixelId) return;

        injetarScriptBase();
        window.fbq('init', pixelId);
        window.fbq('track', 'PageView');
        pixelAtivoRef.current = true;

        // Fallback sem JavaScript, recomendado pela própria Meta.
        const noscript = document.createElement('noscript');
        const img = document.createElement('img');
        img.height = 1;
        img.width = 1;
        img.style.display = 'none';
        img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
        noscript.appendChild(img);
        document.body.appendChild(noscript);
      } catch (erro) {
        console.error('Erro ao carregar o Meta Pixel:', erro);
      }
    }

    function injetarScriptBase() {
      if (window.fbq) return; // já carregado — evita duplicar o script
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    }

    iniciarPixel();
    return () => {
      cancelado = true;
    };
  }, []);

  // Dispara um PageView a cada troca de rota — numa SPA, o navegador não
  // recarrega a página sozinho quando o React Router muda de tela.
  useEffect(() => {
    if (pixelAtivoRef.current && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname]);

  return null;
}
