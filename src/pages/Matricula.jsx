import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import logo from '../assets/logo-estud.png';

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const OPCOES_RACA_COR = ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Prefiro não informar'];
const OPCOES_ESTADO_CIVIL = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'];

const TIPOS_ANEXO_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
const TAMANHO_MAXIMO_ANEXO_MB = 10;

// Campos obrigatórios do formulário (mesma lista dos que têm `required` no JSX)
const CAMPOS_OBRIGATORIOS = [
  'curso', 'nomeCompleto', 'cpf', 'dataNascimento', 'rg', 'orgaoEmissor', 'naturalidade',
  'estadoCivil', 'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado', 'telefone', 'email',
];

const FORM_INICIAL = {
  curso: '',
  nomeCompleto: '',
  cpf: '',
  dataNascimento: '',
  rg: '',
  orgaoEmissor: '',
  dataEmissao: '',
  naturalidade: '',
  racaCor: '',
  estadoCivil: '',
  pai: '',
  mae: '',
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  telefone: '',
  email: '',
  observacoes: '',
};

// Algoritmo oficial de validação de CPF (mesma lógica usada no Checkout)
function validarCPF(cpfOriginal) {
  const cpf = (cpfOriginal || '').replace(/[^\d]+/g, '');
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
}

function mascaraCPF(valor) {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
}

function mascaraCEP(valor) {
  return valor.replace(/\D/g, '').replace(/(\d{5})(\d{1,3})/, '$1-$2').slice(0, 9);
}

function mascaraTelefone(valor) {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4})$/, '$1-$2')
    .slice(0, 15);
}

// Remove caracteres perigosos do nome original antes de usá-lo como chave no Storage
function sanitizarNomeArquivo(nomeOriginal) {
  const extensaoMatch = nomeOriginal.match(/\.[a-zA-Z0-9]+$/);
  const extensao = extensaoMatch ? extensaoMatch[0].toLowerCase() : '';
  return `${crypto.randomUUID()}${extensao}`;
}

function validarAnexo(arquivo) {
  if (!TIPOS_ANEXO_PERMITIDOS.includes(arquivo.type)) {
    throw new Error(`Formato não suportado: ${arquivo.name}. Envie imagens (PNG/JPEG/WebP) ou PDF.`);
  }
  if (arquivo.size > TAMANHO_MAXIMO_ANEXO_MB * 1024 * 1024) {
    throw new Error(`Arquivo muito grande: ${arquivo.name} (máx. ${TAMANHO_MAXIMO_ANEXO_MB}MB).`);
  }
}

function Secao({ titulo, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-black px-6 py-3.5">
        <h2 className="text-white text-xs font-black uppercase tracking-widest">{titulo}</h2>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {children}
      </div>
    </div>
  );
}

function Campo({ label, required, className = '', children }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const CLASSE_INPUT = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#fed106] bg-gray-50/50 text-sm text-gray-800 transition-colors disabled:opacity-50';

export default function Matricula() {
  const formRef = useRef(null);
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [cpfErro, setCpfErro] = useState('');
  const [camposComErro, setCamposComErro] = useState([]);
  const [status, setStatus] = useState('');

  function rolarAteCampo(nome) {
    const elemento = formRef.current?.elements?.namedItem(nome);
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
      elemento.focus({ preventScroll: true });
    }
  }

  function handleChange(e) {
    let { name, value } = e.target;
    if (name === 'cpf') { value = mascaraCPF(value); setCpfErro(''); }
    if (name === 'cep') value = mascaraCEP(value);
    if (name === 'telefone') value = mascaraTelefone(value);
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (camposComErro.includes(name)) {
      setCamposComErro((prev) => prev.filter((campo) => campo !== name));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const camposVazios = CAMPOS_OBRIGATORIOS.filter((campo) => !String(formData[campo] || '').trim());
    if (camposVazios.length > 0) {
      setCamposComErro(camposVazios);
      rolarAteCampo(camposVazios[0]);
      return;
    }
    setCamposComErro([]);

    if (!validarCPF(formData.cpf)) {
      setCpfErro('⚠️ CPF inválido. Verifique os números digitados.');
      rolarAteCampo('cpf');
      return;
    }

    const inputAnexos = document.getElementById('anexos-matricula');
    const arquivos = inputAnexos?.files ? Array.from(inputAnexos.files) : [];

    setStatus('enviando');
    try {
      arquivos.forEach(validarAnexo);

      const caminhosAnexos = [];
      for (const arquivo of arquivos) {
        const nomeArquivo = sanitizarNomeArquivo(arquivo.name);
        const { error: uploadError } = await supabase.storage
          .from('matriculas-anexos')
          .upload(nomeArquivo, arquivo);
        if (uploadError) throw uploadError;
        caminhosAnexos.push(nomeArquivo);
      }

      const { error: insertError } = await supabase.from('matriculas').insert([{
        curso: formData.curso,
        nome_completo: formData.nomeCompleto,
        cpf: formData.cpf,
        data_nascimento: formData.dataNascimento,
        rg: formData.rg,
        orgao_emissor: formData.orgaoEmissor,
        data_emissao: formData.dataEmissao || null,
        naturalidade: formData.naturalidade,
        raca_cor: formData.racaCor || null,
        estado_civil: formData.estadoCivil,
        pai: formData.pai || null,
        mae: formData.mae || null,
        cep: formData.cep,
        rua: formData.rua,
        numero: formData.numero,
        complemento: formData.complemento || null,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        telefone: formData.telefone,
        email: formData.email,
        anexos: caminhosAnexos,
        observacoes: formData.observacoes || null,
      }]);

      if (insertError) throw insertError;

      setStatus('sucesso');
      setFormData(FORM_INICIAL);
      if (inputAnexos) inputAnexos.value = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Erro ao enviar matrícula:', err);
      setStatus('erro');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function classeInput(campo) {
    return `${CLASSE_INPUT} ${camposComErro.includes(campo) ? 'border-red-400 bg-red-50 focus:border-red-500' : ''}`;
  }

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] font-sans antialiased pb-24">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        {/* --- CARD DO TOPO: espaço para foto/logo + barra nas cores da Estude Seguro --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-center py-10 px-6">
            {/* Troque o src abaixo pela foto/logo que preferir exibir aqui */}
            <img src={logo} alt="Estude Seguro" className="h-20 w-auto object-contain" />
          </div>
          <div className="h-1.5 w-full bg-gradient-to-r from-[#fed106] to-black" />
        </div>

        <div className="text-center mt-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Formulário de Matrícula</h1>
          <p className="text-gray-500 text-sm md:text-base font-medium mt-2">
            Preencha todos os campos obrigatórios para concluir sua matrícula.
          </p>
        </div>

        {status === 'sucesso' && (
          <div className="w-full bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Matrícula enviada com sucesso! Nossa equipe entrará em contato em breve.
          </div>
        )}
        {status === 'erro' && (
          <div className="w-full bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Ocorreu um erro ao enviar sua matrícula. Tente novamente mais tarde.
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <Secao titulo="Seleção do Curso">
            <Campo label="Curso" required>
              <input required disabled={status === 'enviando'} type="text" name="curso" value={formData.curso} onChange={handleChange} placeholder="Digite o curso" className={classeInput('curso')} />
            </Campo>
          </Secao>

          <Secao titulo="Dados Pessoais">
            <Campo label="Nome Completo" required className="sm:col-span-2 lg:col-span-3">
              <input required disabled={status === 'enviando'} type="text" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleChange} placeholder="Digite o nome completo" className={classeInput('nomeCompleto')} />
            </Campo>
            <Campo label="CPF" required>
              <input required disabled={status === 'enviando'} type="text" name="cpf" value={formData.cpf} onChange={handleChange} maxLength="14" placeholder="000.000.000-00" className={`${classeInput('cpf')} ${cpfErro ? 'border-red-400 bg-red-50 focus:border-red-500' : ''}`} />
              {cpfErro && <span className="text-red-500 text-xs font-bold mt-1 block">{cpfErro}</span>}
            </Campo>
            <Campo label="Data de Nascimento" required>
              <input required disabled={status === 'enviando'} type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} className={classeInput('dataNascimento')} />
            </Campo>
            <Campo label="RG" required>
              <input required disabled={status === 'enviando'} type="text" name="rg" value={formData.rg} onChange={handleChange} placeholder="Digite o RG" className={classeInput('rg')} />
            </Campo>
            <Campo label="Órgão Emissor" required>
              <input required disabled={status === 'enviando'} type="text" name="orgaoEmissor" value={formData.orgaoEmissor} onChange={handleChange} placeholder="Ex.: SSP/SP" className={classeInput('orgaoEmissor')} />
            </Campo>
            <Campo label="Data de Emissão">
              <input disabled={status === 'enviando'} type="date" name="dataEmissao" value={formData.dataEmissao} onChange={handleChange} className={CLASSE_INPUT} />
            </Campo>
            <Campo label="Naturalidade" required>
              <input required disabled={status === 'enviando'} type="text" name="naturalidade" value={formData.naturalidade} onChange={handleChange} placeholder="Ex.: São Paulo, SP" className={classeInput('naturalidade')} />
            </Campo>
            <Campo label="Raça/Cor">
              <select disabled={status === 'enviando'} name="racaCor" value={formData.racaCor} onChange={handleChange} className={CLASSE_INPUT}>
                <option value="">Selecione</option>
                {OPCOES_RACA_COR.map((op) => <option key={op} value={op}>{op}</option>)}
              </select>
            </Campo>
            <Campo label="Estado Civil" required>
              <select required disabled={status === 'enviando'} name="estadoCivil" value={formData.estadoCivil} onChange={handleChange} className={classeInput('estadoCivil')}>
                <option value="">Selecione</option>
                {OPCOES_ESTADO_CIVIL.map((op) => <option key={op} value={op}>{op}</option>)}
              </select>
            </Campo>
          </Secao>

          <Secao titulo="Filiação">
            <Campo label="Pai">
              <input disabled={status === 'enviando'} type="text" name="pai" value={formData.pai} onChange={handleChange} placeholder="Nome completo do pai" className={CLASSE_INPUT} />
            </Campo>
            <Campo label="Mãe">
              <input disabled={status === 'enviando'} type="text" name="mae" value={formData.mae} onChange={handleChange} placeholder="Nome completo da mãe" className={CLASSE_INPUT} />
            </Campo>
          </Secao>

          <Secao titulo="Endereço">
            <Campo label="CEP" required>
              <input required disabled={status === 'enviando'} type="text" name="cep" value={formData.cep} onChange={handleChange} maxLength="9" placeholder="00000-000" className={classeInput('cep')} />
            </Campo>
            <Campo label="Rua" required>
              <input required disabled={status === 'enviando'} type="text" name="rua" value={formData.rua} onChange={handleChange} placeholder="Digite a rua" className={classeInput('rua')} />
            </Campo>
            <Campo label="Número" required>
              <input required disabled={status === 'enviando'} type="text" name="numero" value={formData.numero} onChange={handleChange} placeholder="Digite o número" className={classeInput('numero')} />
            </Campo>
            <Campo label="Complemento">
              <input disabled={status === 'enviando'} type="text" name="complemento" value={formData.complemento} onChange={handleChange} placeholder="Apartamento, bloco, etc." className={CLASSE_INPUT} />
            </Campo>
            <Campo label="Bairro" required>
              <input required disabled={status === 'enviando'} type="text" name="bairro" value={formData.bairro} onChange={handleChange} placeholder="Digite o bairro" className={classeInput('bairro')} />
            </Campo>
            <Campo label="Cidade" required>
              <input required disabled={status === 'enviando'} type="text" name="cidade" value={formData.cidade} onChange={handleChange} placeholder="Digite a cidade" className={classeInput('cidade')} />
            </Campo>
            <Campo label="Estado" required>
              <select required disabled={status === 'enviando'} name="estado" value={formData.estado} onChange={handleChange} className={classeInput('estado')}>
                <option value="">Selecione</option>
                {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </Campo>
          </Secao>

          <Secao titulo="Contatos">
            <Campo label="Telefone" required>
              <input required disabled={status === 'enviando'} type="tel" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(00) 00000-0000" className={classeInput('telefone')} />
            </Campo>
            <Campo label="E-mail" required>
              <input required disabled={status === 'enviando'} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="exemplo@dominio.com" className={classeInput('email')} />
            </Campo>
          </Secao>

          <Secao titulo="Documentos e Observações">
            <Campo label="Anexos complementares" className="sm:col-span-2 lg:col-span-3">
              <input
                type="file"
                id="anexos-matricula"
                multiple
                accept="image/png,image/jpeg,image/webp,application/pdf"
                disabled={status === 'enviando'}
                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 file:bg-[#fed106] file:text-black file:border-0 file:rounded-full file:px-3 file:py-1.5 file:text-xs file:font-bold file:mr-3 cursor-pointer disabled:opacity-50"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">RG, CPF e outros documentos. Limite de {TAMANHO_MAXIMO_ANEXO_MB}MB por arquivo.</p>
            </Campo>
            <Campo label="Observações do atendimento" className="sm:col-span-2 lg:col-span-3">
              <textarea disabled={status === 'enviando'} name="observacoes" value={formData.observacoes} onChange={handleChange} rows="3" placeholder="Adicione observações úteis sobre a matrícula ou os documentos." className={`${CLASSE_INPUT} resize-none`} />
            </Campo>
          </Secao>

          <button
            type="submit"
            disabled={status === 'enviando'}
            className="w-full bg-[#fed106] hover:bg-black text-black hover:text-white font-black text-sm uppercase tracking-wider py-4.5 rounded-2xl shadow-md transition-all active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {status === 'enviando' ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </>
            ) : (
              'Enviar Matrícula'
            )}
          </button>

          <Link to="/" className="text-center text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
            ← Voltar para o início
          </Link>
        </form>
      </div>
    </div>
  );
}
