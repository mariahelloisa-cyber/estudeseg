import { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { Link, useNavigate } from 'react-router-dom';

// 1. FUNÇÃO: Algoritmo Oficial de Validação de CPF
const validarCPF = (cpfOriginal) => {
  const cpf = cpfOriginal.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.substring(10, 11));
};

// 2. FUNÇÃO: Máscara automática (000.000.000-00)
const mascaraCPF = (valor) => {
  return valor
    .replace(/\D/g, '') // Remove o que não é número
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1'); // Impede de digitar mais que 11 números
};

export default function Checkout() {
  const { carrinho, limparCarrinho } = useCartStore();
  const navigate = useNavigate();
  const [metodoPagamento, setMetodoPagamento] = useState('pix'); 
  
  const [cpfErro, setCpfErro] = useState(''); // Estado para controlar o erro de CPF

  // Estados do Formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    whatsapp: '',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    parcelas: '1'
  });

  const valorTotal = carrinho.reduce((total, item) => total + (item.preco || 0), 0);

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    
    // Se o campo for o CPF, aplica a máscara
    if (name === 'cpf') {
      value = mascaraCPF(value);
      setCpfErro(''); // Limpa a mensagem de erro ao começar a corrigir
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 3. VALIDAÇÃO ANTES DE ENVIAR O FORMULÁRIO
    if (!validarCPF(formData.cpf)) {
      setCpfErro('⚠️ CPF inválido. Verifique os números digitados.');
      return; // Interrompe o envio se for falso
    }
    
    alert(`🎉 Matrícula Processada com Sucesso!\nForma de pagamento: ${metodoPagamento.toUpperCase()}\nTotal: R$ ${valorTotal.toFixed(2)}`);
    
    limparCarrinho();
    navigate('/'); 
  };

  if (carrinho.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] flex flex-col items-center justify-center p-4 text-center">
        <span className="text-6xl mb-4">🛒</span>
        <h2 className="text-2xl font-black text-[#1a103c] mb-2">Seu carrinho está vazio</h2>
        <p className="text-gray-500 mb-6 text-sm">Adicione algum curso para poder prosseguir para o checkout.</p>
        <Link to="/Cursos" className="bg-[#fed106] hover:bg-[#000000] text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all shadow-md">
          Ver Cursos Disponíveis
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9FB] py-10 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA DA ESQUERDA: FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          
          {/* BLOCO 1: DADOS PESSOAIS */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
            <h2 className="text-lg font-black text-[#1a103c] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-pink-50 text-[#fed106] flex items-center justify-center text-xs font-bold">1</span>
              Dados de Acesso da Matrícula
            </h2>
            <p className="text-xs text-gray-400 mb-4 -mt-2">Seus dados estão seguros e o acesso ao curso será enviado para o seu e-mail.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome Completo</label>
                <input required type="text" name="nome" value={formData.nome} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#fed106] bg-gray-50/50 text-sm text-gray-800" placeholder="Digite seu nome completo" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">E-mail válido</label>
                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#fed106] bg-gray-50/50 text-sm text-gray-800" placeholder="exemplo@email.com" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">WhatsApp / Telefone</label>
                <input required type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#fed106] bg-gray-50/50 text-sm text-gray-800" placeholder="(00) 00000-0000" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">CPF (Para emissão do Certificado)</label>
                <input 
                  required 
                  type="text" 
                  name="cpf" 
                  value={formData.cpf} 
                  onChange={handleInputChange} 
                  maxLength="14" // Trava o tamanho máximo
                  // Se tiver erro, deixa a borda e o fundo vermelhos
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none text-sm text-gray-800 transition-colors ${cpfErro ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-200 bg-gray-50/50 focus:border-[#fed106]'}`} 
                  placeholder="000.000.000-00" 
                />
                {/* Mensagem de Erro do CPF */}
                {cpfErro && <span className="text-red-500 text-xs font-bold mt-1 block animate-pulse">{cpfErro}</span>}
              </div>
            </div>
          </div>

          {/* BLOCO 2: FORMA DE PAGAMENTO */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
            <h2 className="text-lg font-black text-[#1a103c] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-pink-50 text-[#fed106] flex items-center justify-center text-xs font-bold">2</span>
              Forma de Pagamento
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button type="button" onClick={() => setMetodoPagamento('pix')} className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-black text-sm cursor-pointer transition-all ${metodoPagamento === 'pix' ? 'border-[#fed106] bg-pink-50/30 text-[#fed106]' : 'border-gray-100 text-gray-500 bg-white'}`}>
                <span>⚡</span> Pix Imediato
              </button>
              <button type="button" onClick={() => setMetodoPagamento('cartao')} className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-black text-sm cursor-pointer transition-all ${metodoPagamento === 'cartao' ? 'border-[#fed106] bg-pink-50/30 text-[#fed106]' : 'border-gray-100 text-gray-500 bg-white'}`}>
                <span>💳</span> Cartão
              </button>
            </div>

            {metodoPagamento === 'pix' ? (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 text-center">
                <span className="text-3xl">📱</span>
                <h4 className="text-emerald-800 font-bold text-sm mt-1">Liberação instantânea da sua vaga!</h4>
                <p className="text-emerald-600 text-xs mt-1 max-w-md mx-auto">O código QR Code do Pix "Copia e Cola" será gerado assim que você finalizar a sua matrícula.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Número do Cartão</label>
                  <input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#fed106] bg-gray-50/50 text-sm text-gray-800" placeholder="0000 0000 0000 0000" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome impresso no Cartão</label>
                  <input type="text" name="cardName" value={formData.cardName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#fed106] bg-gray-50/50 text-sm text-gray-800" placeholder="COMO ESTÁ NO CARTÃO" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Validade</label>
                  <input type="text" name="cardExpiry" value={formData.cardExpiry} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#fed106] bg-gray-50/50 text-sm text-gray-800" placeholder="MM/AA" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">CVV</label>
                  <input type="text" name="cardCvv" value={formData.cardCvv} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#fed106] bg-gray-50/50 text-sm text-gray-800" placeholder="123" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Opções de Parcelamento</label>
                  <select name="parcelas" value={formData.parcelas} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#fed106] bg-gray-50/50 text-sm text-gray-800 cursor-pointer">
                    <option value="1">1x de R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem juros)</option>
                    <option value="2">2x de R$ {(valorTotal / 2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem juros)</option>
                    <option value="3">3x de R$ {(valorTotal / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem juros)</option>
                    <option value="12">12x de R$ {(valorTotal / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Sem juros)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          <button type="submit" className="w-full lg:hidden bg-[#fed106] hover:bg-[#000000] text-white py-4.5 rounded-2xl font-black uppercase tracking-wider text-sm shadow-lg shadow-pink-100 transition-all active:scale-[0.99] cursor-pointer text-center">
            Finalizar Matrícula Segura
          </button>
        </form>

        {/* COLUNA DA DIREITA: RESUMO DO PEDIDO */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 sticky top-24">
            <h3 className="text-base font-black text-[#1a103c] mb-4 uppercase tracking-wider pb-2 border-b border-gray-50">Resumo do Pedido</h3>
            
            <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto mb-4 pr-1">
              {carrinho.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#1a103c] truncate">{item.titulo}</p>
                    <p className="text-gray-400 mt-0.5">⏱️ Carga horária: {item.horas}h</p>
                  </div>
                  <span className="font-extrabold text-gray-700 shrink-0">R$ {item.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-gray-50 pt-4 text-xs font-semibold text-gray-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-[#1a103c] font-bold">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Matrícula + Emissão de Certificado</span>
                <span className="text-green-600 font-bold uppercase">Grátis</span>
              </div>
              <div className="flex justify-between bg-[#FDF2F7] rounded-xl p-3 text-sm font-black mt-4">
                <span className="text-[#1a103c] uppercase">Valor Total</span>
                <span className="text-[#fed106] text-base">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button type="submit" onClick={handleSubmit} className="hidden lg:block w-full bg-[#fed106] hover:bg-[#000000] text-white py-4.5 rounded-2xl font-black uppercase tracking-wider text-sm shadow-lg shadow-pink-100 transition-all active:scale-[0.99] cursor-pointer text-center mt-6">
              🔒 Finalizar Matrícula Segura
            </button>

            <div className="border-t border-gray-100 pt-5 mt-6 space-y-3">
              <div className="flex items-center gap-3 text-left">
                <span className="text-xl">🛡️</span>
                <div>
                  <h5 className="text-xs font-bold text-[#1a103c]">Compra 100% Protegida</h5>
                  <p className="text-[10px] text-gray-400">Ambiente criptografado com segurança SSL integrada.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <span className="text-xl">✨</span>
                <div>
                  <h5 className="text-xs font-bold text-[#1a103c]">Garantia Incondicional de 7 dias</h5>
                  <p className="text-[10px] text-gray-400">Garantia total de satisfação ou reembolso do valor integral.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}