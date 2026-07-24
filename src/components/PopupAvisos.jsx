import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import PopupModalShell from './popups/PopupModalShell';
import { obterModeloPopup, popupTemDadosMinimos } from './popups/registry';

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

        // Só exibe pop-ups cujo modelo já tem os campos obrigatórios preenchidos
        // (evita mostrar, por exemplo, um modelo "Imagem" sem imagem cadastrada).
        const popupsValidos = (data || []).filter((popup) =>
          popupTemDadosMinimos(obterModeloPopup(popup.modelo), popup.dados)
        );
        setPopups(popupsValidos);
      } catch (err) {
        console.error('Erro ao buscar pop-ups:', err);
      }
    }
    buscarPopupsAtivos();
  }, []);

  const popupAtual = popups[indiceAtual];

  if (!popupAtual) return null;

  const fecharPopup = () => setIndiceAtual((prev) => prev + 1);
  const modelo = obterModeloPopup(popupAtual.modelo);
  const ComponenteModelo = modelo.Componente;

  return (
    <PopupModalShell variante={modelo.variante} onFechar={fecharPopup}>
      <ComponenteModelo dados={popupAtual.dados || {}} onFechar={fecharPopup} popupId={popupAtual.id} />
    </PopupModalShell>
  );
}
