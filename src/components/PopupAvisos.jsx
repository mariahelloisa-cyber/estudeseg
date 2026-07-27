import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import PopupModalShell from './popups/PopupModalShell';
import { obterModeloPopup, popupTemDadosMinimos } from './popups/registry';

export default function PopupAvisos() {
  const [popups, setPopups] = useState([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  // Guarda o id do pop-up que já cumpriu seu atraso e pode ser exibido (em vez de um
  // booleano "pronto" que precisaria ser resetado manualmente a cada troca de pop-up).
  const [idProntoParaExibir, setIdProntoParaExibir] = useState(null);

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

  // Cada pop-up só aparece depois do seu próprio atraso (configurado no admin) — a contagem
  // reinicia a cada pop-up da fila: começa quando ele passa a ser o atual, seja ao entrar no
  // site (primeiro pop-up) ou logo após o pop-up anterior ser fechado.
  useEffect(() => {
    if (!popupAtual) return;
    const atrasoMs = Math.max(0, (popupAtual.atraso_segundos || 0) * 1000);
    const temporizador = setTimeout(() => setIdProntoParaExibir(popupAtual.id), atrasoMs);
    return () => clearTimeout(temporizador);
  }, [popupAtual]);

  if (!popupAtual || idProntoParaExibir !== popupAtual.id) return null;

  const fecharPopup = () => setIndiceAtual((prev) => prev + 1);
  const modelo = obterModeloPopup(popupAtual.modelo);
  const ComponenteModelo = modelo.Componente;

  return (
    <PopupModalShell variante={modelo.variante} onFechar={fecharPopup}>
      <ComponenteModelo dados={popupAtual.dados || {}} onFechar={fecharPopup} popupId={popupAtual.id} />
    </PopupModalShell>
  );
}
