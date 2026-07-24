import { useState } from 'react';
import { supabase } from '../../../supabaseClient';

// Modelo "Captura com Imagem": imagem de um lado, formulário de e-mail do outro (ex.: pop-up
// de "baixe nosso guia grátis"). Ao enviar, grava o e-mail em `popup_capturas_email`. Em modo
// de prévia (admin), o envio é simulado sem gravar nada.
export default function PopupCaptura({ dados, popupId, somenteVisualizacao }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // '' | 'enviando' | 'sucesso' | 'erro'

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    if (somenteVisualizacao) {
      setStatus('sucesso');
      return;
    }

    setStatus('enviando');
    try {
      const { error } = await supabase
        .from('popup_capturas_email')
        .insert([{ popup_id: popupId ?? null, email: email.trim() }]);
      if (error) throw error;
      setStatus('sucesso');
      setEmail('');
    } catch (err) {
      console.error('Erro ao salvar captura de e-mail:', err);
      setStatus('erro');
    }
  }

  return (
    <div className="w-full h-full bg-white rounded-md shadow-sm overflow-hidden flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 h-[200px] md:h-auto shrink-0 bg-gray-100">
        {dados?.imagem_url ? (
          <img src={dados.imagem_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium px-4 text-center">
            Adicione uma imagem
          </div>
        )}
      </div>

      <div className="flex-1 p-5 sm:p-8 md:p-10 flex flex-col justify-center gap-4 overflow-y-auto">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
          {dados?.titulo || 'Receba nosso guia gratuito'}
        </h2>

        {status === 'sucesso' ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-bold rounded-md px-4 py-3 text-center">
            Obrigado! Confira seu e-mail em instantes. ✅
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              required
              aria-label={dados?.campo_email_label?.trim() || 'Email Address'}
              placeholder={dados?.campo_email_label?.trim() || 'Email Address'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'enviando'}
              className="w-full py-3 border-0 border-b border-gray-200 focus:outline-none focus:border-[#fed106] bg-transparent text-sm text-gray-800 placeholder-gray-400 disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={status === 'enviando'}
              className="w-full text-center bg-[#fed106] hover:bg-black text-black hover:text-white font-black text-sm uppercase tracking-wider py-3.5 rounded-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-70"
            >
              {status === 'enviando' ? 'Enviando...' : dados?.botao_texto?.trim() || 'Enviar'}
            </button>

            {status === 'erro' && (
              <p className="text-red-500 text-xs font-bold text-center">Não foi possível enviar. Tente novamente.</p>
            )}

            {dados?.texto_privacidade && (
              <p className="text-[11px] text-gray-400 leading-relaxed">{dados.texto_privacidade}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
