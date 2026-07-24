import { useState } from 'react';
import { supabase } from '../../../supabaseClient';

// Modelo "Cadastro com Desconto": imagem no topo com um selo de destaque sobreposto, e um
// formulário de nome + e-mail sobre um painel escuro. Ao enviar, grava em `popup_cadastros`.
// Em modo de prévia (admin), o envio é simulado sem gravar nada.
export default function PopupCadastro({ dados, popupId, somenteVisualizacao }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // '' | 'enviando' | 'sucesso' | 'erro'

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;

    if (somenteVisualizacao) {
      setStatus('sucesso');
      return;
    }

    setStatus('enviando');
    try {
      const { error } = await supabase
        .from('popup_cadastros')
        .insert([{ popup_id: popupId ?? null, nome: nome.trim(), email: email.trim() }]);
      if (error) throw error;
      setStatus('sucesso');
      setNome('');
      setEmail('');
    } catch (err) {
      console.error('Erro ao salvar cadastro:', err);
      setStatus('erro');
    }
  }

  return (
    <div className="w-full bg-black rounded-md shadow-sm overflow-hidden">
      <div className="relative w-full h-48 sm:h-56 bg-gray-800">
        {dados?.imagem_url ? (
          <img src={dados.imagem_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
            Adicione uma imagem
          </div>
        )}
        <div className="absolute left-1/2 -bottom-6 -translate-x-1/2 w-[85%] bg-[#fed106] rounded-2xl px-5 py-4 text-center shadow-lg">
          <span className="text-black font-black text-base sm:text-lg leading-snug whitespace-pre-line">
            {dados?.badge_texto || 'Cadastre-se e ganhe 10% OFF'}
          </span>
        </div>
      </div>

      <div className="pt-10 px-6 pb-6 flex flex-col gap-3">
        {status === 'sucesso' ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-bold rounded-md px-4 py-3 text-center">
            Cadastro realizado com sucesso! ✅
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={dados?.campo_nome_placeholder?.trim() || 'Nome'}
              disabled={status === 'enviando'}
              className="w-full px-4 py-3 rounded-md border-0 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fed106] disabled:opacity-50"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={dados?.campo_email_placeholder?.trim() || 'E-mail'}
              disabled={status === 'enviando'}
              className="w-full px-4 py-3 rounded-md border-0 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fed106] disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={status === 'enviando'}
              className="mx-auto mt-2 bg-[#fed106] hover:bg-white text-black font-black text-sm uppercase tracking-wider px-8 py-3 rounded-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-70"
            >
              {status === 'enviando' ? 'Enviando...' : dados?.botao_texto?.trim() || 'Cadastrar'}
            </button>

            {status === 'erro' && (
              <p className="text-red-400 text-xs font-bold text-center">Não foi possível enviar. Tente novamente.</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
