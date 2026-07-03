import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';

export default function Depoimentos() {
  const [depoimentos, setDepoimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscarDepoimentos() {
      try {
        setCarregando(true);
        const { data, error } = await supabase
          .from('depoimentos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDepoimentos(data || []);
      } catch (err) {
        console.error('Erro ao buscar depoimentos:', err);
      } finally {
        setCarregando(false);
      }
    }
    buscarDepoimentos();
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] font-sans antialiased">
      <Navbar />

      {/* --- CABEÇALHO --- */}
      <div className="w-full bg-[#fed106]/5 relative overflow-hidden py-16 md:py-20">
        <svg
          className="absolute -right-60 -top-55 w-[700px] md:w-[1200px] h-[1200px] md:h-[1200px] text-[#fed106]/10 pointer-events-none z-0"
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M851 588.5Q711 677 641.5 794t-190 57.5Q331 792 182.5 731T48 505.5Q62 341 211 299t255-125.5Q572 90 661.5 190T871 395q120 105-20 193.5Z"
          />
        </svg>

        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-xs text-gray-500 font-medium mb-4 flex items-center flex-wrap gap-2">
            <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-900 font-semibold">Depoimentos</span>
          </div>
          <h1 className="text-4xl md:text-[50px] font-black text-gray-900 tracking-tight leading-none mb-4">
            Depoimentos
          </h1>
          <p className="text-sm md:text-base text-gray-700 font-medium max-w-2xl">
            Descubra como a combinação de projetos reais, professores atuantes e uma plataforma completa mudou o jeito de aprender de quem já passou por aqui.
          </p>
        </div>
      </div>

      {/* --- LISTAGEM --- */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        {carregando ? (
          <div className="w-full flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#fed106]"></div>
          </div>
        ) : depoimentos.length === 0 ? (
          <div className="w-full max-w-xl mx-auto bg-white rounded-[2.5rem] p-10 md:p-12 shadow-sm border border-gray-100 text-center">
            <p className="font-black text-gray-800 text-base mb-1">Nenhum depoimento publicado ainda.</p>
            <p className="text-sm text-gray-500">Em breve traremos histórias de quem já estudou com a gente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {depoimentos.map((item) => (
              <a
                key={`depoimento-${item.id}`}
                href={item.video_url}
                target="_blank"
                rel="noreferrer"
                style={{ backgroundImage: `url(${item.foto_url})` }}
                className="w-full h-[440px] rounded-3xl bg-cover bg-center shadow-md relative overflow-hidden flex flex-col justify-between p-5 group cursor-pointer transform hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent z-10"></div>
                <div></div>
                <div className="relative z-20 flex justify-center items-center">
                  <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex justify-center items-center group-hover:scale-110 group-hover:bg-[#fed106] transition-all duration-300 shadow-lg">
                    <svg className="w-5 h-5 text-[#fed106] group-hover:text-white fill-current transform translate-x-0.5 transition-colors" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="relative z-20 text-left">
                  <h4 className="text-white text-base font-extrabold tracking-wide leading-tight">
                    {item.nome}
                  </h4>
                  {item.instagram && (
                    <p className="text-white/70 text-xs font-medium mt-0.5">
                      {item.instagram}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
