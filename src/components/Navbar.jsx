import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo-estud.png';
import { useCartStore } from '../store/cartStore';
import { supabase } from '../supabaseClient';

const LINKS = [
  { to: '/', label: 'Início' },
  { to: '/sobre', label: 'Sobre Nós' },
  { to: '/cursos', label: 'Cursos' },
  { to: '/aproveitamento', label: 'Téc./Tecnólogo' },
  { to: '/depoimentos', label: 'Depoimentos' },
  { to: '/sorteios', label: 'Sorteios', dropdownSorteios: true },
  { to: '/blog', label: 'Blog' },
  // Desativado temporariamente — reativar quando as páginas entrarem no ar
  // { to: '/vagas', label: 'Vagas' },
  // { to: '/ouvidoria', label: 'Ouvidoria' },
  { to: '/validacaoRastreio', label: 'Consulte sua tragetória' },
];

// Data de hoje como 'AAAA-MM-DD' (fuso do visitante), para comparar com as
// colunas date do Supabase sem passar por UTC e errar o dia.
function hojeISO() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

// Só entram no menu os sorteios dentro do período informado no admin.
function estaAcontecendo(sorteio) {
  const hoje = hojeISO();
  if (sorteio.data_inicio && sorteio.data_inicio > hoje) return false;
  if (sorteio.data_fim && sorteio.data_fim < hoje) return false;
  return true;
}

const ehLinkExterno = (link) => /^https?:\/\//i.test(link || '');

export default function Navbar() {
  const carrinho = useCartStore((state) => state.carrinho);
  const setCarrinhoAberto = useCartStore((state) => state.setCarrinhoAberto);
  const [menuAberto, setMenuAberto] = useState(false);
  const [sorteios, setSorteios] = useState([]);
  const [sorteiosAberto, setSorteiosAberto] = useState(false);
  const [sorteiosAbertoMobile, setSorteiosAbertoMobile] = useState(false);
  const timeoutSorteios = useRef(null);
  const location = useLocation();

  const linkEstaAtivo = (to) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to));
  // Pedido específico da página "Sobre Nós": sem sombra abaixo do header, só nela.
  const semSombraHeader = location.pathname === '/sobre';

  // Sorteios que estão acontecendo agora (tabela `sorteios` do Supabase).
  useEffect(() => {
    let montado = true;
    async function carregarSorteios() {
      const { data, error } = await supabase
        .from('sorteios')
        .select('id, nome, descricao, link, data_inicio, data_fim')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) {
        console.error('Erro ao carregar os sorteios do menu:', error);
        return;
      }
      if (montado) setSorteios((data || []).filter(estaAcontecendo));
    }
    carregarSorteios();
    return () => {
      montado = false;
    };
  }, []);

  // Pequeno atraso ao sair com o mouse, para dar tempo de descer até o menu
  const abrirSorteios = () => {
    clearTimeout(timeoutSorteios.current);
    setSorteiosAberto(true);
  };
  const fecharSorteios = () => {
    clearTimeout(timeoutSorteios.current);
    timeoutSorteios.current = setTimeout(() => setSorteiosAberto(false), 150);
  };
  useEffect(() => () => clearTimeout(timeoutSorteios.current), []);

  return (
    <div className="w-full">
      {/* --- BARRA DE CONTATOS NO TOPO --- */}
      <div className="bg-[#efc819] text-white py-2 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex gap-6">

          </div>
        </div>
      </div>

      {/* --- NAVBAR PRINCIPAL --- */}
      <nav className={`bg-white sticky top-0 z-50 ${semSombraHeader ? '' : 'shadow-md'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/">
                <img className="h-14 w-auto" src={logo} alt="LATec" />
              </Link>
            </div>

            {/* Links das Abas */}
            <div className="hidden md:flex space-x-7 items-center">
              {LINKS.map((link) => {
                const classeLink = `hover:text-[#fed106] font-medium text-sm transition-colors ${
                  linkEstaAtivo(link.to) ? 'text-[#fed106]' : 'text-gray-700'
                }`;

                // "Sorteios" abre a lista dos sorteios que estão acontecendo.
                // Sem nenhum sorteio no ar, continua sendo um link normal.
                if (link.dropdownSorteios && sorteios.length > 0) {
                  return (
                    <div
                      key={link.to}
                      className="relative"
                      onMouseEnter={abrirSorteios}
                      onMouseLeave={fecharSorteios}
                      onFocus={abrirSorteios}
                      onBlur={fecharSorteios}
                    >
                      <Link
                        to={link.to}
                        onClick={() => setSorteiosAberto(false)}
                        aria-expanded={sorteiosAberto}
                        aria-haspopup="true"
                        className={`${classeLink} flex items-center gap-1`}
                      >
                        {link.label}
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${sorteiosAberto ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </Link>

                      {sorteiosAberto && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 z-50">
                          <div className="w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2">
                            <p className="px-4 pt-2 pb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Acontecendo agora
                            </p>
                            {sorteios.map((sorteio) => {
                              const conteudo = (
                                <>
                                  <span className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#fed106] shrink-0" />
                                    <span className="font-semibold text-sm text-gray-800 group-hover:text-black">
                                      {sorteio.nome}
                                    </span>
                                  </span>
                                  {sorteio.descricao && (
                                    <span className="block pl-3.5 text-xs text-gray-400 mt-0.5">{sorteio.descricao}</span>
                                  )}
                                </>
                              );
                              const classeItem = 'group block px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors';

                              return ehLinkExterno(sorteio.link) ? (
                                <a
                                  key={sorteio.id}
                                  href={sorteio.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setSorteiosAberto(false)}
                                  className={classeItem}
                                >
                                  {conteudo}
                                </a>
                              ) : (
                                <Link
                                  key={sorteio.id}
                                  to={sorteio.link || '/sorteios'}
                                  onClick={() => setSorteiosAberto(false)}
                                  className={classeItem}
                                >
                                  {conteudo}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link key={link.to} to={link.to} className={classeLink}>
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Botão Matricule-se + Botão Fale Conosco + Ícone do Carrinho */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex flex-col items-center gap-1 -translate-y-1">
                <span className="text-[11px] text-gray-400 font-medium">Já é aluno?</span>
                <a href={`https://wa.me/5511995987197?text=${encodeURIComponent('Olá! Vim pelo site e gostaria de falar com a ouvidoria.')}`} target="_blank" rel="noreferrer" className="inline-block bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#fed106] transition-all shadow-sm whitespace-nowrap">
                  Ouvidoria
                </a>
              </div>

              <div className="hidden sm:flex flex-col items-center gap-1 -translate-y-1">
                <span className="text-[11px] text-gray-400 font-medium">Quer ser aluno?</span>
                <a href={`https://wa.me/5511995987197?text=${encodeURIComponent('Olá! Vim pelo site e gostaria de falar com um consultor da Estude Seguro.')}`} target="_blank" rel="noreferrer" className="inline-block bg-[#fed106] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#000000] transition-all shadow-sm whitespace-nowrap">
                  Fale Conosco
                </a>
              </div>

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
              {LINKS.map((link) => {
                const classeLink = `hover:text-[#fed106] hover:bg-gray-50 font-medium text-sm transition-colors px-3 py-3 rounded-lg ${
                  linkEstaAtivo(link.to) ? 'text-[#fed106]' : 'text-gray-700'
                }`;

                // No mobile, "Sorteios" vira uma sanfona com os sorteios do momento
                if (link.dropdownSorteios && sorteios.length > 0) {
                  return (
                    <div key={link.to}>
                      <button
                        type="button"
                        onClick={() => setSorteiosAbertoMobile((valor) => !valor)}
                        aria-expanded={sorteiosAbertoMobile}
                        className={`${classeLink} w-full flex items-center justify-between cursor-pointer`}
                      >
                        {link.label}
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${sorteiosAbertoMobile ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {sorteiosAbertoMobile && (
                        <div className="pl-3 ml-3 mt-1 mb-1 border-l-2 border-[#fed106]/40 flex flex-col">
                          <p className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Acontecendo agora
                          </p>
                          {sorteios.map((sorteio) => {
                            const conteudo = (
                              <>
                                <span className="block font-semibold text-sm text-gray-800">{sorteio.nome}</span>
                                {sorteio.descricao && (
                                  <span className="block text-xs text-gray-400 mt-0.5">{sorteio.descricao}</span>
                                )}
                              </>
                            );
                            const classeItem = 'px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors';

                            return ehLinkExterno(sorteio.link) ? (
                              <a
                                key={sorteio.id}
                                href={sorteio.link}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setMenuAberto(false)}
                                className={classeItem}
                              >
                                {conteudo}
                              </a>
                            ) : (
                              <Link
                                key={sorteio.id}
                                to={sorteio.link || '/sorteios'}
                                onClick={() => setMenuAberto(false)}
                                className={classeItem}
                              >
                                {conteudo}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuAberto(false)}
                    className={classeLink}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="px-5 py-4 mt-auto border-t border-gray-100">
              <a
                href={`https://wa.me/5511995987197?text=${encodeURIComponent('Olá! Vim pelo site e gostaria de falar com um consultor da Estude Seguro.')}`}
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
