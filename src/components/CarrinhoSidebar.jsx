import { useCartStore } from '../store/cartStore';
import { useNavigate } from 'react-router-dom'; // <-- IMPORTANTE: Importando o navegador

export default function CarrinhoSidebar() {
  const { carrinho, carrinhoAberto, setCarrinhoAberto, removerDoCarrinho } = useCartStore();
  const navigate = useNavigate(); // <-- ADICIONEI ESSA LINHA PARA ENCONTRAR AS ROTAS

  const valorTotal = carrinho.reduce((total, item) => total + (item.preco || 0), 0);

  if (!carrinhoAberto) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Fundo Escuro com desfoque leve */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setCarrinhoAberto(false)}
      />

      {/* Janela Lateral */}
      <div className="relative flex w-full max-w-md flex-col bg-[#F9F9FB] h-full shadow-2xl animate-slide-in-right z-10 overflow-hidden text-left">
        
        {/* CABEÇALHO COMPACTO */}
        <div className="flex items-center justify-between px-5 py-5 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FDF2F7] flex items-center justify-center text-[#fed106] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1a103c]">Meu Carrinho</h2>
              <p className="text-gray-400 text-xs font-semibold">{carrinho.length} curso(s) selecionado(s)</p>
            </div>
          </div>
          <button onClick={() => setCarrinhoAberto(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* LISTA DE PRODUTOS */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {carrinho.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 p-4">
              <p className="text-gray-400 text-sm italic">Seu carrinho está vazio.</p>
            </div>
          ) : (
            carrinho.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex items-center gap-4 relative group">
                <div className="w-12 h-12 rounded-xl bg-[#F3E8FF] flex items-center justify-center text-[#7c3aed] shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.083 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="text-sm font-black text-[#1a103c] leading-tight break-words line-clamp-2">{item.titulo}</h3>
                  <div className="inline-flex items-center gap-1 bg-[#F3E8FF]/60 text-[#7c3aed] px-2 py-0.5 rounded-md text-[10px] font-bold mt-1.5">
                    ⏱️ {item.horas}h
                  </div>
                  <div className="mt-2">
                    <span className="text-base font-black text-[#fed106]">R$ {item.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-gray-400 text-[10px] block font-medium">ou 12x de R$ {(item.preco / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <button 
                  onClick={() => removerDoCarrinho(item.id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors cursor-pointer p-2 rounded-full hover:bg-gray-50"
                  title="Remover curso"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* RODAPÉ E VALOR TOTAL */}
        <div className="bg-white px-5 pt-4 pb-6 border-t border-gray-100 space-y-4">
          <div className="space-y-1.5 text-xs font-semibold text-gray-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-[#1a103c] font-bold">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>Matrícula + Certificado</span>
              <span className="text-green-600 font-bold uppercase text-[11px]">Grátis</span>
            </div>
          </div>

          <div className="bg-[#FDF2F7] rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm font-black text-[#1a103c] uppercase tracking-wider">Total</span>
            <span className="text-xl font-black text-[#fed106]">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[#fed106] text-xs font-bold bg-pink-50/50 py-1.5 rounded-lg">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Cursos autorizados e reconhecidos pelo MEC
          </div>

          {/* BOTÃO CORRIGIDO COM EVENTO DE CLIQUE (onClick) */}
          <button 
            onClick={() => {
              setCarrinhoAberto(false); // Fecha o menu lateral
              navigate('/checkout');    // Redireciona para o checkout criado
            }}
            className="w-full bg-[#fed106] hover:bg-[#000000] text-white py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-between px-5 shadow-md shadow-pink-100 transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="text-sm">Ir para o pagamento</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>

          <div className="grid grid-cols-3 gap-1 pt-3 border-t border-gray-50 text-center text-[9px] font-black text-[#1a103c] uppercase tracking-tighter">
            <div className="flex flex-col items-center gap-1">
              <span className="text-blue-500 text-base">🛡️</span>
              <span>Ambiente<br/>Seguro</span>
            </div>
            <div className="flex flex-col items-center gap-1 border-x border-gray-100">
              <span className="text-purple-500 text-base">🎓</span>
              <span>Garantia de<br/>Acesso</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-amber-500 text-base">⚡</span>
              <span>Liberação<br/>Imediata</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}