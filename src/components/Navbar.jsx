import { Link } from 'react-router-dom';
import logo from '../assets/logo-estud.png';
import { useCartStore } from '../store/cartStore';

export default function Navbar() {
  const carrinho = useCartStore((state) => state.carrinho);
  const setCarrinhoAberto = useCartStore((state) => state.setCarrinhoAberto);

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
              <Link to="/" className="text-gray-700 hover:text-[#efc819] font-medium text-sm transition-colors">Início</Link>
              <Link to="/sobre" className="text-gray-700 hover:text-[#fed106] font-medium text-sm transition-colors">Sobre Nós</Link>
              <Link to="/cursos" className="text-gray-700 hover:text-[#fed106] font-medium text-sm transition-colors">Cursos</Link>
              <Link to="/depoimentos" className="text-gray-700 hover:text-[#fed106] font-medium text-sm transition-colors">Depoimentos</Link>
              <Link to="/blog" className="text-gray-700 hover:text-[#fed106] font-medium text-sm transition-colors">Blog</Link>
              <Link to="/vagas" className="text-gray-700 hover:text-[#fed106] font-medium text-sm transition-colors">Vagas</Link>
              <Link to="/ouvidoria" className="text-gray-700 hover:text-[#fed106] font-medium text-sm transition-colors">Ouvidoria</Link>
              <Link to="/validacaoRastreio" className="text-gray-700 hover:text-[#fed106] font-medium text-sm transition-colors">Validação e Rastreio</Link>
              <Link to="/faq" className="text-gray-700 hover:text-[#fed106] font-medium text-sm transition-colors">FAQ</Link>
            </div>

            {/* Botão Fale Conosco + Ícone do Carrinho */}
            <div className="flex items-center gap-4">
              <a href="https://wa.me/5527998392172" target="_blank" rel="noreferrer" className="bg-[#fed106] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#000000] transition-all shadow-sm whitespace-nowrap">
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
            </div>

          </div>
        </div>
      </nav>
    </div>
  );
}