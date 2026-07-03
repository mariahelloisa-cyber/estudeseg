import React from 'react';

export default function Footer() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="bg-black text-gray-300 border-t border-gray-800">
      {/* Container Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* COLUNA 1: LOGO E SOBRE (Ocupa 4 colunas) */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              {/* Substitua pelo caminho correto da sua logo se preferir uma tag <img> */}
              <span className="text-2xl font-black tracking-tight text-white">
                Estude<span className="text-[#fed106]">Seguro</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Transformando a educação através da tecnologia e inovação técnica profissionalizante.
            </p>
          </div>

          {/* COLUNA 2: LINKS RÁPIDOS (Ocupa 3 colunas) */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider border-l-2 border-[#fed106] pl-2">
              Navegação
            </h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <a href="/" className="hover:text-[#fed106] transition-colors">Início</a>
              </li>
              <li>
                <a href="/cursos" className="hover:text-[#fed106] transition-colors">Cursos</a>
              </li>
              <li>
                <a href="/blog" className="hover:text-[#fed106] transition-colors">Blog</a>
              </li>
              <li>
                <a href="/sobre" className="hover:text-[#fed106] transition-colors">Quem Somos</a>
              </li>
            </ul>
          </div>

          {/* COLUNA 3: CONTATO (Ocupa 5 colunas) */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider border-l-2 border-[#fed106] pl-2">
              Contato e Localização
            </h3>
            <ul className="flex flex-col gap-2.5 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-[#fed106] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                <span>Av. Principal, 123 - Centro, Cidade - UF</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#fed106] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.415-5.127-3.719-6.542-6.542l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.75z" /></svg>
                <a href="https://wa.me/5527998392172" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  (27) 99839-2172
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#fed106] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0l-7.5-4.615m19.5 0A2.25 2.25 0 0019.5 4.5" /></svg>
                <a href="mailto:contato@estudeseguro.com.br" className="hover:text-white transition-colors">
                  contato@estudeseguro.com.br
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Linha Divisória Inferior */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {anoAtual} Estude Seguro. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <a href="/privacidade" className="hover:text-gray-400 transition-colors">Política de Privacidade</a>
            <a href="/termos" className="hover:text-gray-400 transition-colors">Termos de Uso</a>
          </div>
        </div>

      </div>
    </footer>
  );
}