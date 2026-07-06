import React from 'react';

export default function Footer() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 text-slate-700 border-t border-slate-200">
      {/* Container Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-8">
          
          {/* COLUNA 1: LOGO E SOBRE (Ocupa 4 colunas) */}
          <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              {/* Substitua pelo caminho correto da sua logo se preferir uma tag <img> */}
              <span className="text-3xl font-black tracking-tight text-slate-900">
                Estude<span className="text-[#fed106]">Seguro</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              Transformando a educação através da tecnologia e inovação técnica profissionalizante, preparando você para o futuro.
            </p>
          </div>

          {/* COLUNA 2: LINKS RÁPIDOS (Ocupa 3 colunas) */}
          <div className="md:col-span-5 lg:col-span-3 flex flex-col gap-4">
            <h3 className="text-slate-900 font-bold text-sm uppercase tracking-wider border-l-4 border-[#fed106] pl-3">
              Navegação
            </h3>
            <ul className="flex flex-col gap-3 mt-1 text-slate-600 font-medium">
              <li>
                <a href="/" className="hover:text-yellow-600 transition-all hover:translate-x-1 inline-block">Início</a>
              </li>
              <li>
                <a href="/cursos" className="hover:text-yellow-600 transition-all hover:translate-x-1 inline-block">Cursos</a>
              </li>
              <li>
                <a href="/blog" className="hover:text-yellow-600 transition-all hover:translate-x-1 inline-block">Blog</a>
              </li>
              <li>
                <a href="/sobre" className="hover:text-yellow-600 transition-all hover:translate-x-1 inline-block">Quem Somos</a>
              </li>
            </ul>
          </div>

          {/* COLUNA 3: CONTATO (Ocupa 5 colunas) */}
          <div className="md:col-span-7 lg:col-span-5 flex flex-col gap-4">
            <h3 className="text-slate-900 font-bold text-sm uppercase tracking-wider border-l-4 border-[#fed106] pl-3">
              Contato e Localização
            </h3>
            <ul className="flex flex-col gap-4 mt-1 text-sm text-slate-600">
              {/* Endereço */}
              <li className="flex items-start gap-3 group">
                <div className="bg-yellow-100 p-2 rounded-lg group-hover:bg-[#fed106] transition-colors shrink-0">
                  <svg className="w-5 h-5 text-yellow-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                </div>
                <span className="mt-1 leading-relaxed">Av. Principal, 123 - Centro<br/>Cidade - UF, 00000-000</span>
              </li>
              
              {/* WhatsApp */}
              <li className="flex items-center gap-3 group">
                <div className="bg-yellow-100 p-2 rounded-lg group-hover:bg-[#fed106] transition-colors shrink-0">
                  <svg className="w-5 h-5 text-yellow-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.415-5.127-3.719-6.542-6.542l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.75z" /></svg>
                </div>
                <a href="https://wa.me/5527998392172" target="_blank" rel="noreferrer" className="hover:text-yellow-600 transition-colors font-medium">
                  (27) 99839-2172
                </a>
              </li>

              {/* Email */}
              <li className="flex items-center gap-3 group">
                <div className="bg-yellow-100 p-2 rounded-lg group-hover:bg-[#fed106] transition-colors shrink-0">
                  <svg className="w-5 h-5 text-yellow-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0l-7.5-4.615m19.5 0A2.25 2.25 0 0019.5 4.5" /></svg>
                </div>
                <a href="mailto:contato@estudeseguro.com.br" className="hover:text-yellow-600 transition-colors font-medium">
                  contato@estudeseguro.com.br
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Linha Divisória Inferior */}
        <div className="border-t border-slate-200 mt-5 pt-1 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {anoAtual} Estude Seguro. Todos os direitos reservados.</p>
          
          {/* Redes Sociais */}
          <div className="flex gap-4">
            <a href="https://www.instagram.com/estudeseguroead/" className="text-slate-400 hover:text-[#fed106] transition-colors" aria-label="Instagram">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}