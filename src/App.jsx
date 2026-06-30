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
import Checkout from './pages/Checkout';
import Login from './pages/Login';

function LayoutGlobal() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <>
      <CarrinhoSidebar />

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
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
      </Routes>

      {/* O Footer SÓ aparece se NÃO for a página de login */}
      {!isLoginPage && <Footer />}
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