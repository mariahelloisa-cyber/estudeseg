import { useState } from 'react';
import Navbar from '../components/Navbar';

export default function Ouvidoria() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    assunto: '',
    mensagem: ''
  });

  // Estado para controlar o feedback visual (enviando, sucesso, erro)
  const [status, setStatus] = useState(''); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('enviando');

    try {
      // ====================================================================
      // AQUI ENTRA O LINK DO SEU SERVIÇO DE E-MAIL (Ex: Formspree)
      // Substitua 'SEU_ID_DO_FORMSPREE' pelo link que eles vão te fornecer
      // ====================================================================
      const resposta = await fetch('https://formspree.io/f/xpqgwjdr', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (resposta.ok) {
        setStatus('sucesso');
        // Limpa o formulário após o envio
        setFormData({ nome: '', email: '', telefone: '', assunto: '', mensagem: '' });
        
        // Remove a mensagem de sucesso após 5 segundos
        setTimeout(() => setStatus(''), 5000);
      } else {
        setStatus('erro');
      }
    } catch (erro) {
      console.error('Erro ao enviar manifestação:', erro);
      setStatus('erro');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] text-gray-900 font-sans antialiased pb-24">
      <Navbar />

      {/* Container Principal Centralizado */}
      <div className="max-w-4xl mx-auto px-4 pt-16 flex flex-col items-center">
        
        {/* Ícone Superior de Fone de Ouvido */}
        <div className="w-14 h-14 rounded-full bg-[#fffff] flex items-center justify-center text-[#fed106] shadow-sm mb-5 border border-[#fbe5f0]">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
        </div>

        {/* Títulos da Página */}
        <h1 className="text-gray-900 font-extrabold text-3xl md:text-4xl tracking-tight text-center mb-4">
          Ouvidoria Institucional
        </h1>
        
        <p className="text-gray-500 text-sm md:text-base leading-relaxed text-center max-w-2xl mb-14">
          Este é um canal exclusivo para sugestões, elogios, reclamações ou denúncias. Sua opinião é 
          fundamental para nossa melhoria contínua.
        </p>

        {/* Mensagens de Feedback */}
        {status === 'sucesso' && (
          <div className="w-full bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Sua manifestação foi enviada com sucesso! Entraremos em contato em breve.
          </div>
        )}
        
        {status === 'erro' && (
          <div className="w-full bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Ocorreu um erro ao enviar sua mensagem. Tente novamente mais tarde.
          </div>
        )}

        {/* CARD DO FORMULÁRIO */}
        <div className="w-full bg-white rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
          
          {/* Topo Escuro do Card */}
          <div className="bg-[#111625] py-5 px-8 flex items-center justify-center gap-2.5">
            <svg className="w-5 h-5 text-[#fed106]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <h2 className="text-white font-bold text-base md:text-lg tracking-wide">
              Registre sua manifestação
            </h2>
          </div>

          {/* Formulário de Envio */}
          <form onSubmit={handleSubmit} className="p-8 md:p-12 flex flex-col gap-6">
            
            {/* Linha 1: Nome e E-mail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  required
                  disabled={status === 'enviando'}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fed106]/10 focus:border-[#fed106] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  required
                  disabled={status === 'enviando'}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fed106]/10 focus:border-[#fed106] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Linha 2: Telefone e Assunto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  disabled={status === 'enviando'}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fed106]/10 focus:border-[#fed106] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Assunto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="assunto"
                  value={formData.assunto}
                  onChange={handleChange}
                  placeholder="Assunto da mensagem"
                  required
                  disabled={status === 'enviando'}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fed106]/10 focus:border-[#fed106] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Linha 3: Mensagem completa */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Mensagem <span className="text-red-500">*</span>
              </label>
              <textarea
                name="mensagem"
                value={formData.mensagem}
                onChange={handleChange}
                placeholder="Descreva detalhadamente sua manifestação..."
                required
                rows="5"
                disabled={status === 'enviando'}
                className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-5 py-4 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fed106]/10 focus:border-[#fed106] transition-all resize-none leading-relaxed disabled:opacity-50"
              ></textarea>
            </div>

            {/* Botão de Envio de Ponta a Ponta */}
            <button
              type="submit"
              disabled={status === 'enviando'}
              className="w-full text-center bg-gradient-to-r from-[#fed106] to-[#ffeea0] text-black font-bold text-xs md:text-sm uppercase tracking-widest py-4.5 rounded-2xl transition-all duration-300 hover:opacity-95 shadow-md hover:shadow-lg active:scale-[0.99] mt-2 disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {status === 'enviando' ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </>
              ) : (
                'Enviar Manifestação'
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}