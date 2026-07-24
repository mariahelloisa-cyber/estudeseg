import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo-estud.png';
import { useCartStore } from '../store/cartStore';

const LINKS = [
  { to: '/', label: 'Início' },
  { to: '/sobre', label: 'Sobre Nós' },
  { to: '/cursos', label: 'Cursos' },
  { to: '/aproveitamento', label: 'Téc./Tecnólogo' },
  { to: '/depoimentos', label: 'Depoimentos' },
  { to: '/blog', label: 'Blog' },
  // Desativado temporariamente — reativar quando as páginas entrarem no ar
  // { to: '/vagas', label: 'Vagas' },
  // { to: '/ouvidoria', label: 'Ouvidoria' },
  { to: '/validacaoRastreio', label: 'Validação e Rastreio' },
];

export default function Navbar() {
  const carrinho = useCartStore((state) => state.carrinho);
  const setCarrinhoAberto = useCartStore((state) => state.setCarrinhoAberto);
  const [menuAberto, setMenuAberto] = useState(false);
  const location = useLocation();

  const linkEstaAtivo = (to) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to));

  return (
    <div className="w-full">
      {/* --- BARRA DE CONTATOS NO TOPO --- */}
      <div className="bg-[#efc819] text-white py-2 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex gap-6">

          </div>
          
          {/* 👇 AQUI ESTÁ O NOVO BOTÃO ADMIN 👇 */}
          <div className="flex items-center gap-5">
            <Link to="/login" className="font-bold hover:underline text-white/80 hover:text-white transition-colors">Admin</Link>
          </div>
          {/* 👆 ============================= 👆 */}

        </div>
      </div>

      {/* --- NAVBAR PRINCIPAL --- */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/">
                <img className="h-14 w-auto" src={logo} alt="LATec" />
              </Link>
            </div>

            {/* Links das Abas */}
            <div className="hidden md:flex space-x-6 items-center">
              {LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`hover:text-[#fed106] font-medium text-sm transition-colors ${
                    linkEstaAtivo(link.to) ? 'text-[#fed106]' : 'text-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Botão Matricule-se + Botão Fale Conosco + Ícone do Carrinho */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/matricula" className="hidden sm:inline-block bg-[#000000] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#fed106] hover:text-black transition-all shadow-sm whitespace-nowrap">
                Matricule-se
              </Link>

              <a href="https://wa.me/5527998392172" target="_blank" rel="noreferrer" className="hidden sm:inline-block bg-[#fed106] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#000000] transition-all shadow-sm whitespace-nowrap">
                Fale Conosco
              </a>

              {/* ÍCONE DO CARRINHO */}
              <button
                onClick={() => setCarrinhoAberto(true)}
                className="relative p-2 text-gray-800 hover:text-black transition-colors cursor-pointer flex items-center justify-center rounded-full hover:bg-gray-100 shrink-0"
                title="Ver meu carrinho"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>

                {carrinho.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#fed106] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white shadow-xs animate-in zoom-in-50 duration-200">
                    {carrinho.length}
                  </span>
                )}
              </button>

              {/* ÍCONE DO FAQ */}
              <Link
                to="/faq"
                className="relative p-2 text-gray-800 hover:text-black transition-colors cursor-pointer flex items-center justify-center rounded-full hover:bg-gray-100 shrink-0"
                title="Perguntas Frequentes"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </Link>

              {/* BOTÃO HAMBÚRGUER (MOBILE) */}
              <button
                onClick={() => setMenuAberto(true)}
                className="md:hidden p-2 text-gray-800 hover:text-black transition-colors cursor-pointer flex items-center justify-center rounded-full hover:bg-gray-100 shrink-0"
                title="Abrir menu"
                aria-label="Abrir menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* --- SIDEBAR MOBILE --- */}
      {menuAberto && (
        <div className="fixed inset-0 z-[100] flex justify-end md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuAberto(false)}
          />

          <div className="relative flex w-full max-w-xs flex-col bg-white h-full shadow-2xl animate-slide-in-right z-10 overflow-y-auto text-left">
            <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
              <img className="h-10 w-auto" src={logo} alt="LATec" />
              <button
                onClick={() => setMenuAberto(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
                aria-label="Fechar menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <nav className="flex flex-col px-5 py-4 gap-1">
              {LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuAberto(false)}
                  className={`hover:text-[#fed106] hover:bg-gray-50 font-medium text-sm transition-colors px-3 py-3 rounded-lg ${
                    linkEstaAtivo(link.to) ? 'text-[#fed106]' : 'text-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/login"
                onClick={() => setMenuAberto(false)}
                className="text-gray-700 hover:text-[#fed106] hover:bg-gray-50 font-medium text-sm transition-colors px-3 py-3 rounded-lg"
              >
                Admin
              </Link>
            </nav>

            <div className="px-5 py-4 mt-auto border-t border-gray-100">
              <a
                href="https://wa.me/5527998392172"
                target="_blank"
                rel="noreferrer"
                className="block text-center bg-[#fed106] text-white px-4 py-3 rounded-md text-sm font-medium hover:bg-[#000000] transition-all shadow-sm"
              >
                Fale Conosco
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}