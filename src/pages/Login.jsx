import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { supabase } from '../supabaseClient'; 

import logoLatec from '../assets/logolatec.png'; 
import bgFundo from '../assets/fundo-login.png';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const [formData, setFormData] = useState({
    usuario: '', 
    senha: '',
    lembrarMe: false
  });

  // 1. VERIFICA SE JÁ ESTÁ LOGADO
  // Se o admin clicar na engrenagem e já tiver sessão ativa, vai direto pro painel
  useEffect(() => {
    const verificarSessao = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        localStorage.setItem('painel_liberado', 'true');
        navigate('/');
      }
    };
    verificarSessao();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setErro(''); 
  };

  // 2. FUNÇÃO QUE FAZ O LOGIN NO SUPABASE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.usuario, 
        password: formData.senha,
      });

      if (error) throw error;

      // PASSO MÁGICO: Guarda a chave de acesso e redirecioniona para a Home!
      localStorage.setItem('painel_liberado', 'true');
      alert('✅ Login efetuado com sucesso! Bem-vindo ao Painel.');
      navigate('/'); 
      
    } catch (error) {
      console.error('Erro no login:', error.message);
      setErro('Credenciais inválidas. Verifica o teu e-mail e palavra-passe.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${bgFundo})` }}
    >
      <div className="bg-white rounded-[32px] p-8 sm:p-12 shadow-2xl w-full max-w-md border border-gray-50 flex flex-col items-center relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        <div className="w-20 h-20 flex items-center justify-center mb-2">
          <img src={logoLatec} alt="LATec Logo" className="w-full h-full object-contain" />
        </div>
        
        <span className="text-[11px] font-black tracking-widest text-[#fed106] uppercase mb-6">LA INTEGRAÇÃO</span>

        <h2 className="text-2xl font-black text-[#1a103c] tracking-tight text-center">Painel Administrativo</h2>
        <p className="text-xs text-gray-400 font-medium mt-1 mb-6 text-center">Acesso restrito para administradores</p>

        {erro && (
          <div className="w-full bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl mb-4 text-center border border-red-100 animate-pulse">
            ⚠️ {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">
          
          <div>
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">E-mail de Acesso</label>
            <div className="relative flex items-center">
              <UserIcon className="absolute left-4 w-5 h-5 text-gray-400" />
              <input 
                required 
                type="email"
                name="usuario" 
                value={formData.usuario}
                onChange={handleInputChange}
                placeholder="admin@exemplo.com" 
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/30 focus:outline-none focus:border-[#fed106] focus:bg-white text-sm text-gray-800 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Palavra-passe</label>
            <div className="relative flex items-center">
              <LockClosedIcon className="absolute left-4 w-5 h-5 text-gray-400" />
              <input 
                required 
                type={showPassword ? 'text' : 'password'} 
                name="senha" 
                value={formData.senha}
                onChange={handleInputChange}
                placeholder="Digita a tua palavra-passe" 
                className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 bg-gray-50/30 focus:outline-none focus:border-[#fed106] focus:bg-white text-sm text-gray-800 transition-all"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={carregando}
            className="w-full bg-gradient-to-r from-[#fed106] to-[#6366f1] hover:opacity-95 text-white py-4 rounded-xl font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-pink-100 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-50"
          >
            {carregando ? 'A VERIFICAR...' : 'ENTRAR'}
            {!carregando && <ArrowRightIcon className="w-4 h-4 stroke-[3]" />}
          </button>
        </form>

        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-8 border-t border-gray-50 pt-4 w-full justify-center">
          <ShieldCheckIcon className="w-5 h-5 text-[#fed106] shrink-0" />
          Acesso seguro e monitorado
        </div>

      </div>
    </div>
  );
}