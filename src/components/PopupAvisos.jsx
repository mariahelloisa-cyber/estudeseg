import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function PopupAvisos() {
  const [popups, setPopups] = useState([]);
  const [indiceAtual, setIndiceAtual] = useState(0);

  useEffect(() => {
    async function buscarPopupsAtivos() {
      try {
        const { data, error } = await supabase
          .from('popups')
          .select('*')
          .eq('ativo', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        // O pop-up é exclusivamente a imagem: descarta os que não têm imagem cadastrada
        setPopups((data || []).filter((p) => p.imagem_url));
      } catch (err) {
        console.error('Erro ao buscar pop-ups:', err);
      }
    }
    buscarPopupsAtivos();
  }, []);

  const popupAtual = popups[indiceAtual];

  if (!popupAtual) return null;

  const fecharPopup = () => setIndiceAtual((prev) => prev + 1);

  const imagem = (
    <img
      src={popupAtual.imagem_url}
      alt={popupAtual.titulo || 'Aviso'}
      className="block w-full h-full object-contain rounded-xl"
    />
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="relative w-[92vw] sm:w-[85vw] md:w-[75vw] max-w-4xl h-[85vh]">
        <button
          type="button"
          onClick={fecharPopup}
          aria-label="Fechar"
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {popupAtual.link_redirecionamento ? (
          <a href={popupAtual.link_redirecionamento} target="_blank" rel="noreferrer" className="block w-full h-full">
            {imagem}
          </a>
        ) : (
          imagem
        )}
      </div>
    </div>
  );
}
