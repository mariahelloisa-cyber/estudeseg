import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ImagemVagas from '../assets/vagas.png';
import { supabase } from '../supabaseClient'; // <-- ADICIONA ESTA LINHA // Importação estática da imagem de fundo

export default function Vagas() {
  const [vagas, setVagas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscarVagas() {
      try {
        setCarregando(true);
        // Busca direta na tabela 'vagas' do Supabase
        const { data, error } = await supabase
          .from('vagas')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;

        if (data) {
          const vagasFormatadas = data.map(item => ({
            id: item.id,
            titulo: item.titulo || "Título da Vaga",
            departamento: item.departamento || "Geral",
            localizacao: item.localizacao || "Remoto / Híbrido",
            tipoContrato: item.tipo_contrato || "CLT",
            descricao: item.descricao || "Descrição da oportunidade...",
            linkFormulario: item.link_formulario || "#"
          }));
          
          setVagas(vagasFormatadas);
        }
      } catch (erro) {
        console.error("Erro ao buscar vagas no Supabase:", erro);
      } finally {
        setCarregando(false);
      }
    }

    buscarVagas();
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] text-gray-900 font-sans antialiased">
      <Navbar />

      {/* Banner Quadrado de Ponta a Ponta da Tela (Sem margens) */}
      <div 
        className="w-full h-[360px] sm:h-[350px] md:h-[400px] bg-cover bg-center relative z-0"
        style={{ 
          backgroundImage: `url(${ImagemVagas})`,
          boxShadow: '0 20px 35px -10px #fed106' /* Sombra Rosa Projetada Abaixo */
        }}
      >
        {/* Banner 100% limpo, servindo puramente para exibir a imagem de fundo */}
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 pb-24 relative z-10">
        {carregando ? (
          <div className="w-full flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#fed106]"></div>
          </div>
        ) : vagas.length === 0 ? (
          
          /* LAYOUT ELABORADO: Card Premium posicionado totalmente ABAIXO do banner */
          <div className="w-full max-w-xl mx-auto bg-white rounded-[2.5rem] p-10 md:p-12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.06)] border border-gray-100 text-center mt-10 md:mt-14 transition-all duration-300 animate-fade-in">
            
            {/* Ícone de Maleta / Carreira Executiva com gradiente suave */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#fdf2f7] to-[#fed106] text-[#ffeea0] mb-6 shadow-inner">
              <svg 
                className="w-8 h-8" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="1.8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 18.4V14.15m16.5 0c0-.621-.504-1.125-1.125-1.125H4.875c-.621 0-1.125.504-1.125 1.125m16.5 0a9 9 0 00-16.5 0M12 3v3.375m0 0H8.25m3.75 0h3.75M9.75 14.25h4.5" />
              </svg>
            </div>
            
            {/* Tag explicativa sutil */}
            <span className="block text-[11px] font-bold text-[#fed106] tracking-widest uppercase bg-[#fdf2f7] py-1 px-3.5 rounded-full w-max mx-auto mb-4">
              Mural de Oportunidades
            </span>
            
            {/* Título e frase reestruturados */}
            <h3 className="text-gray-800 font-extrabold text-xl md:text-2xl tracking-tight mb-3">
              Não há vagas disponíveis no momento.
            </h3>
            
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
              No momento nosso time está completo, mas estamos sempre crescendo. Volte a nos visitar em breve para novas oportunidades!
            </p>
          </div>

        ) : (
          
          /* Lista de Vagas Existentes (Caso existam dados na API) */
          <div className="pt-12">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">
              Oportunidades abertas ({vagas.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {vagas.map(vaga => (
                <div key={vaga.id} className="flex flex-col bg-white rounded-[2.5rem] p-8 md:p-10 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-gray-100 group">
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="bg-gradient-to-r from-[#fed106] to-[#fed106] text-white font-bold text-xs tracking-wider uppercase py-1.5 px-4 rounded-full shadow-sm">
                      {vaga.departamento}
                    </span>
                    <span className="bg-gray-100 text-gray-600 font-semibold text-xs py-1.5 px-4 rounded-full">
                      {vaga.tipoContrato}
                    </span>
                  </div>

                  <h3 className="text-2xl font-extrabold text-slate-800 mb-3 leading-snug group-hover:text-[#fed106] transition-colors duration-300">
                    {vaga.titulo}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-6">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span>{vaga.localizacao}</span>
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-4 mb-8 leading-relaxed">
                    {vaga.descricao}
                  </p>

                  <a 
                    href={`https://wa.me/5527998392172?text=${encodeURIComponent(`Olá! Gostaria de me candidatar à vaga de ${vaga.titulo}.`)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full text-center bg-gray-50 hover:bg-[#fed106] text-gray-700 hover:text-white font-bold text-sm uppercase tracking-wider py-4 rounded-full transition-all duration-300 shadow-inner mt-auto"
                  >
                    Candidatar-se à vaga
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}