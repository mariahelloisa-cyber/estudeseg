import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient'; // <-- SUBSTITUA A LINHA DO NAVBAR POR ESTAS DUAS
import Footer from '../components/Footer'; // Garanta que o Footer está importado se usar

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [abertoId, setAbertoId] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscarFAQS() {
      try {
        setCarregando(true);
        // Busca direta na tabela 'faqs' criada no Supabase
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) throw error;

        if (data) {
          const faqsFormatadas = data.map(item => ({
            id: item.id,
            pergunta: item.pergunta || "Pergunta sem título",
            resposta: item.resposta || "Resposta indisponível no momento.",
            topico: item.topico || "Geral"
          }));
          setFaqs(faqsFormatadas);
        }
      } catch (erro) {
        console.error("Erro ao buscar FAQS no Supabase:", erro);
      } finally {
        setCarregando(false);
      }
    }

    buscarFAQS();
  }, []);
  
  const toggleAccordion = (id) => {
    setAbertoId(abertoId === id ? null : id);
  };

  const faqsFiltradas = faqs.filter(faq =>
    faq.pergunta.toLowerCase().includes(pesquisa.toLowerCase()) ||
    faq.resposta.toLowerCase().includes(pesquisa.toLowerCase()) ||
    faq.topico.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const faqsAgrupadas = faqsFiltradas.reduce((grupos, faq) => {
    const { topico } = faq;
    if (!grupos[topico]) grupos[topico] = [];
    grupos[topico].push(faq);
    return grupos;
  }, {});

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] text-gray-900 font-sans antialiased pb-24">
      <Navbar />

      {/* --- BANNER SUPERIOR --- */}
      <div className="w-full bg-gradient-to-r from-[#fed106] via-[#fed106] to-[#fffff] pt-20 pb-28 px-4 text-center relative flex flex-col items-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        
        {/* NOVO ÍCONE DE AJUDA MODERNO (Balão de Mensagem + Interrogação) */}
        <div className="text-black mb-4 transition-transform hover:scale-105 duration-200">
          <svg className="w-11 h-11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <circle cx="12" cy="17" r="0.5" fill="currentColor" />
          </svg>
        </div>
        
        <h1 className="text-black font-extrabold text-3xl md:text-[38px] tracking-tight mb-2.5">
          Como podemos ajudar?
        </h1>
        <p className="text-black text-xs md:text-sm max-w-xl font-medium tracking-wide">
          Tire suas dúvidas sobre nossos cursos, formas de ingresso e metodologia de ensino.
        </p>

        {/* BARRA DE PESQUISA */}
        <div className="absolute bottom-0 translate-y-1/2 w-full max-w-4xl px-6 z-10">
          <div className="relative w-full bg-white rounded-2xl shadow-[0_12px_30px_-5px_rgba(0,0,0,0.06)] border border-gray-100 flex items-center">
            <span className="pl-6 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Digite sua dúvida aqui..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 px-3 py-5 outline-none rounded-2xl font-medium"
            />
          </div>
        </div>
      </div>

      <div className="h-16"></div>

      {/* --- CONTEÚDO CENTRALIZADO --- */}
      <div className="max-w-4xl mx-auto px-6 mt-12 flex flex-col gap-10" style={{ fontFamily: "'Inter', sans-serif" }}>
        {carregando ? (
          <div className="w-full flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-[#fed106]"></div>
          </div>
        ) : Object.keys(faqsAgrupadas).length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12 font-medium">
            Nenhuma dúvida encontrada para a sua busca.
          </div>
        ) : (
          Object.keys(faqsAgrupadas).map((nomeDoTopico) => (
            <div key={nomeDoTopico} className="w-full flex flex-col gap-4">
              
              {/* Título do Tópico */}
              <div className="flex items-center gap-3 mb-1">
                <div className="w-[4px] h-5 bg-[#fed106] rounded-full"></div>
                <h2 className="text-sm md:text-[15px] font-extrabold text-[#0f1a30] tracking-wider uppercase">
                  {nomeDoTopico}
                </h2>
              </div>

              {/* Lista de Encartes Robustos */}
              <div className="flex flex-col gap-3">
                {faqsAgrupadas[nomeDoTopico].map((faq) => {
                  const estaAberto = abertoId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`w-full bg-white rounded-xl transition-all duration-200 border overflow-hidden ${
                        estaAberto 
                          ? 'border-[#fed106] shadow-[0_10px_25px_-5px_rgba(205,20,110,0.04)]' 
                          : 'border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.01)]'
                      }`}
                    >
                      {/* Botão de Clique */}
                      <button
                        onClick={() => toggleAccordion(faq.id)}
                        className="w-full flex items-center justify-between text-left px-7 py-7 md:px-9 gap-4"
                      >
                        <span className={`text-sm md:text-[15.5px] font-bold tracking-tight transition-colors ${
                          estaAberto ? 'text-[#fed106]' : 'text-slate-700'
                        }`}>
                          {faq.pergunta}
                        </span>
                        
                        <span className={`transition-transform duration-200 shrink-0 ${
                          estaAberto ? 'text-[#fed106] rotate-180' : 'text-gray-400'
                        }`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </span>
                      </button>

                      {/* Corpo Expandível */}
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          estaAberto ? 'max-h-[1000px]' : 'max-h-0'
                        }`}
                      >
                        <div className="w-full h-[1px] bg-blue-50"></div>
                        <div className="px-7 py-6 md:px-9 md:py-6.5 text-gray-500 text-sm md:text-[14px] leading-relaxed whitespace-pre-line font-medium tracking-wide">
                          {faq.resposta}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* --- SEÇÃO INFERIOR — WHATSAPP CORRIGIDO --- */}
        <div className="w-full bg-[#fff9de] rounded-2xl border border-pink-100 p-10 md:p-12 text-center flex flex-col items-center mt-6">
          <h3 className="text-[#0f1a30] font-black text-lg md:text-xl mb-2 tracking-tight">
            Ainda tem dúvidas?
          </h3>
          <p className="text-gray-500 text-xs md:text-sm mb-6 font-medium max-w-sm leading-relaxed">
            Nossa equipe de atendimento corporativo está online pronta para te ajudar agora mesmo.
          </p>
          <a
            href="https://wa.me/seu-numero"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex bg-gradient-to-r from-[#fed106] to-[#fffff] text-black text-sm font-extrabold px-12 py-4 rounded-full shadow-lg shadow-[#fed106]/30 hover:opacity-95 transition-all transform active:scale-[0.98] tracking-wide uppercase"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}