import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Componentes globais críticos (aparecem em toda página pública) — carregam junto com o app
import Footer from './components/Footer';

// A página inicial é a porta de entrada: fica no bundle principal para pintar rápido
import Inicio from './pages/Inicio';

// Todo o resto é carregado sob demanda (code splitting): o visitante só baixa o JS da
// página que abre — o painel admin (enorme) nunca é baixado por quem só navega no site.
const Blog = lazy(() => import('./pages/Blog'));
const PostDetalhe = lazy(() => import('./pages/PostDetalhe'));
const FAQ = lazy(() => import('./pages/FAQ'));
const ValidacaoRastreio = lazy(() => import('./pages/ValidacaoRastreio'));
const Sobre = lazy(() => import('./pages/sobre'));
const ListaCursos = lazy(() => import('./pages/ListaCursos'));
const CursoDetalhe = lazy(() => import('./pages/CursoDetalhe'));
const Depoimentos = lazy(() => import('./pages/Depoimentos'));
const Login = lazy(() => import('./pages/Login'));
const Admin = lazy(() => import('./pages/admin'));
const Aproveitamento = lazy(() => import('./pages/Aproveitamento'));
const Matricula = lazy(() => import('./pages/Matricula'));
const Sorteios = lazy(() => import('./pages/Sorteios'));
const ResgatePremio = lazy(() => import('./pages/ResgatePremio'));

// Widgets não essenciais para a primeira pintura: carregam depois, sem bloquear a página
const PopupAvisos = lazy(() => import('./components/PopupAvisos'));
const ChatWidget = lazy(() => import('./components/ChatWidget'));
const MetaPixel = lazy(() => import('./components/MetaPixel'));

// Mostrado enquanto o JS de uma página ainda está sendo baixado. Ocupa a altura da tela
// pra o Footer não "pular" pro topo durante a troca de rota.
function CarregandoPagina() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white" role="status" aria-label="Carregando">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#fed106]"></div>
    </div>
  );
}


function LayoutGlobal() {
  const location = useLocation();
  const paginaSemLayoutPublico = location.pathname === '/login' || location.pathname === '/admin';

  return (
    <>
      <Suspense fallback={<CarregandoPagina />}>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<PostDetalhe />} />
        {/* <Route path="/vagas" element={<Vagas />} /> */}
        {/* <Route path="/ouvidoria" element={<Ouvidoria />} /> */}
        <Route path="/faq" element={<FAQ />} />
        <Route path="/validacaoRastreio" element={<ValidacaoRastreio />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/cursos" element={<ListaCursos />} />
        <Route path="/cursos/:id" element={<CursoDetalhe />} />
        <Route path="/depoimentos" element={<Depoimentos />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/aproveitamento" element={<Aproveitamento />} />
        <Route path="/matricula" element={<Matricula />} />
        <Route path="/sorteios" element={<Sorteios />} />
        <Route path="/resgate-premio" element={<ResgatePremio />} />
      </Routes>
      </Suspense>

      {/* O Footer e o WhatsApp só aparecem nas páginas públicas, não no login/admin */}
      {!paginaSemLayoutPublico && <Footer />}
      {/* Widgets em Suspense próprio (fallback vazio): não travam nem piscam a página */}
      {!paginaSemLayoutPublico && (
        <Suspense fallback={null}>
          <PopupAvisos />
          <ChatWidget />
          <MetaPixel />
        </Suspense>
      )}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <LayoutGlobal />
    </Router>
  );
}