import { useState } from 'react';
import Navbar from '../components/Navbar';

export default function ValidacaoRastreio() {
  // Estados para navegação entre as telas
  // 'menu' | 'rastreio' | 'validacao'
  const [telaAtual, setTelaAtual] = useState('menu');
  
  // 'token' | 'qrcode'
  const [abaValidacao, setAbaValidacao] = useState('token');
  
  // Estados dos inputs
  const [chaveAcesso, setChaveAcesso] = useState('');
  const [tokenValidacao, setTokenValidacao] = useState('');

  // Ícones reutilizáveis (SVG inline)
  const IconeEscudo = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const IconeChave = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );

  const IconeVoltar = () => (
    <button onClick={() => setTelaAtual('menu')} className="text-white hover:text-gray-300 transition-colors mr-4">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </button>
  );

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] text-gray-900 font-sans antialiased pb-24">
      <Navbar />

      {/* --- BANNER SUPERIOR COM DEGRADÊ --- */}
      <div className="w-full bg-gradient-to-r from-[#fed106] via-[#fed106] to-[#fffff] pt-24 pb-24 px-4 text-center flex flex-col items-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        
        {/* Ícone de Escudo no topo do Banner */}
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-black mb-5 backdrop-blur-sm border border-white/20">
          <IconeEscudo />
        </div>
        
        <h1 className="text-black font-extrabold text-3xl md:text-[40px] tracking-tight mb-3">
          Validação e Rastreio
        </h1>
        <p className="text-black text-sm md:text-base max-w-2xl font-medium tracking-wide">
          Consulte a autenticidade e o status de emissão do seu certificado ou diploma LA. Educação.
        </p>
      </div>

      {/* --- ÁREA DE CONTEÚDO DINÂMICO --- */}
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10" style={{ fontFamily: "'Inter', sans-serif" }}>
        
        {/* ========================================================= */}
        {/* TELA 1: MENU DE SELEÇÃO (CARDS) */}
        {/* ========================================================= */}
        {telaAtual === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            
            {/* CARD 1: RASTREIO */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col pt-0 pb-0">
              {/* Borda superior azul */}
              <div className="h-1.5 w-full bg-[#000000]"></div>
              
              <div className="p-8 md:p-10 flex flex-col h-full">
                <div className="w-12 h-12 bg-blue-50 text-[#000000] rounded-xl flex items-center justify-center mb-6">
                  <IconeChave />
                </div>
                <h2 className="text-[#0f1a30] text-xl font-bold mb-3 tracking-tight">Rastreio de Solicitação</h2>
                <p className="text-gray-500 text-sm mb-10 flex-grow font-medium leading-relaxed">
                  Acompanhe o andamento da sua solicitação de certificado usando sua chave de acesso.
                </p>
                <button 
                  onClick={() => setTelaAtual('rastreio')}
                  className="w-full bg-[#fed106] hover:bg-[#000000] text-white font-bold py-3.5 rounded-xl transition-colors tracking-wide text-sm"
                >
                  RASTREAR AGORA
                </button>  
              </div>
            </div>

            {/* CARD 2: VALIDAÇÃO */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col pt-0 pb-0">
              {/* Borda superior rosa */}
              <div className="h-1.5 w-full bg-[#fed106]"></div>
              
              <div className="p-8 md:p-10 flex flex-col h-full">
                <div className="w-12 h-12 bg-blue-50 text-[#fed106] rounded-xl flex items-center justify-center mb-6">
                  <IconeEscudo />
                </div>
                <h2 className="text-[#0f1a30] text-xl font-bold mb-3 tracking-tight">Validar Certificado</h2>
                <p className="text-gray-500 text-sm mb-10 flex-grow font-medium leading-relaxed">
                  Verifique se um certificado é autêntico usando o token de validação ou QR Code.
                </p>
                <button 
                  onClick={() => setTelaAtual('validacao')}
                  className="w-full bg-[#fed106] hover:bg-[#000000] text-white font-bold py-3.5 rounded-xl transition-colors tracking-wide text-sm"
                >
                  VALIDAR AGORA
                </button>
              </div>
            </div>
            
          </div>
        )}

        {/* ========================================================= */}
        {/* TELA 2: RASTREIO DE SOLICITAÇÃO */}
        {/* ========================================================= */}
        {telaAtual === 'rastreio' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header Escuro */}
            <div className="bg-[#000000] px-8 py-7 flex items-center">
              <IconeVoltar />
              <div>
                <h2 className="text-white text-xl font-bold tracking-tight">Rastreio de Solicitação</h2>
                <p className="text-slate-400 text-xs mt-1 font-medium">Insira sua chave de acesso de 12 dígitos</p>
              </div>
            </div>

            {/* Corpo do Formulário */}
            <div className="px-8 py-12 md:px-16 md:py-16 flex flex-col items-center">
              <div className="w-full max-w-lg">
                <label className="block text-slate-600 text-xs font-bold mb-2 uppercase tracking-wide">
                  Chave de Acesso
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                    <IconeChave />
                  </span>
                  <input
                    type="text"
                    placeholder="XXXX - XXXX - XXXX"
                    value={chaveAcesso}
                    onChange={(e) => setChaveAcesso(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-700 placeholder-gray-400 pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b5ba5] focus:border-transparent font-medium transition-all"
                  />
                </div>
                <p className="text-gray-400 text-xs mt-3 font-medium">
                  A chave de acesso foi enviada para o seu e-mail no momento da solicitação.
                </p>

                <button className="w-full mt-8 bg-[#ffeea0] hover:bg-[#fed106] text-white font-bold py-4 rounded-xl transition-colors tracking-wide text-sm">
                  BUSCAR SOLICITAÇÃO
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TELA 3: VALIDAÇÃO DE CERTIFICADO (TOKEN OU QR CODE) */}
        {/* ========================================================= */}
        {telaAtual === 'validacao' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header Escuro com Tabs */}
            <div className="bg-[#000000] px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center">
                <IconeVoltar />
                <div>
                  <h2 className="text-white text-xl font-bold tracking-tight">Validação de Certificado</h2>
                  <p className="text-slate-400 text-xs mt-1 font-medium">Valide pela chave ou QR Code</p>
                </div>
              </div>
              
              {/* Toggle de Abas (Token / QR Code) */}
              <div className="flex bg-[#1e293b] p-1 rounded-full w-max">
                <button
                  onClick={() => setAbaValidacao('token')}
                  className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${
                    abaValidacao === 'token' ? 'bg-white text-[#000000]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  TOKEN
                </button>
                <button
                  onClick={() => setAbaValidacao('qrcode')}
                  className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${
                    abaValidacao === 'qrcode' ? 'bg-white text-[#000000]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  QR CODE
                </button>
              </div>
            </div>

            {/* Corpo do Formulário - Condicional por Aba */}
            <div className="px-8 py-12 md:px-16 md:py-16 flex flex-col items-center">
              
              {abaValidacao === 'token' ? (
                /* ABA: TOKEN */
                <div className="w-full max-w-lg animate-in fade-in duration-300">
                  <label className="block text-slate-600 text-xs font-bold mb-2 uppercase tracking-wide">
                    Token de Validação
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                      <IconeEscudo />
                    </span>
                    <input
                      type="text"
                      placeholder="CRT - XXXXXXXX"
                      value={tokenValidacao}
                      onChange={(e) => setTokenValidacao(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-gray-700 placeholder-gray-400 pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fed106] focus:border-transparent font-medium transition-all"
                    />
                  </div>
                  <p className="text-gray-400 text-xs mt-3 font-medium">
                    O token está localizado no rodapé do seu certificado.
                  </p>

                  <button className="w-full mt-8 bg-[#ffeea0] hover:bg-[#fed106] text-white font-bold py-4 rounded-xl transition-colors tracking-wide text-sm">
                    VALIDAR CERTIFICADO
                  </button>
                </div>
              ) : (
                /* ABA: QR CODE */
                <div className="w-full max-w-lg flex flex-col items-center text-center animate-in fade-in duration-300">
                  <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-[#0f1a30] font-bold text-lg mb-2">Escanear QR Code</h3>
                  <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed px-4">
                    Aponte a câmera do seu dispositivo para o QR Code presente no certificado para validar sua autenticidade.
                  </p>

                  <button className="bg-[#3b5ba5] hover:bg-[#324f92] text-white font-bold px-8 py-3.5 rounded-xl transition-colors tracking-wide text-sm flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    ABRIR CÂMERA
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}