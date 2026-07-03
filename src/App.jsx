import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Importação dos componentes globais
import Footer from './components/Footer'; 
import CarrinhoSidebar from './components/CarrinhoSidebar';

// Importação das tuas páginas
import Inicio from './pages/Inicio';
import Blog from './pages/Blog';
import Vagas from './pages/Vagas';
import Ouvidoria from './pages/ouvidoria';
import PostDetalhe from './pages/PostDetalhe';
import FAQ from './pages/FAQ';
import ValidacaoRastreio from './pages/ValidacaoRastreio';
import Sobre from './pages/sobre';
import ListaCursos from './pages/ListaCursos';
import CursoDetalhe from './pages/CursoDetalhe';
import Depoimentos from './pages/Depoimentos';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Admin from './pages/admin';


function LayoutGlobal() {
  const location = useLocation();
  const paginaSemLayoutPublico = location.pathname === '/login' || location.pathname === '/admin';

  return (
    <>
      {!paginaSemLayoutPublico && <CarrinhoSidebar />}

      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<PostDetalhe />} />
        <Route path="/vagas" element={<Vagas />} />
        <Route path="/ouvidoria" element={<Ouvidoria />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/validacaoRastreio" element={<ValidacaoRastreio />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/cursos" element={<ListaCursos />} />
        <Route path="/cursos/:id" element={<CursoDetalhe />} />
        <Route path="/depoimentos" element={<Depoimentos />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>

      {/* O Footer e o carrinho só aparecem nas páginas públicas, não no login/admin */}
      {!paginaSemLayoutPublico && <Footer />}
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