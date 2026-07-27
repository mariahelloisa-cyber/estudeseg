import { useState } from 'react';
import Navbar from '../components/Navbar';
import LinhaDoTempoMatricula from '../components/LinhaDoTempoMatricula';
import { supabase } from '../supabaseClient';
import { mascaraCPF } from '../utils/mascaras';

const FORM_INICIAL = { nomeCompleto: '', cpf: '', dataNascimento: '' };

const CLASSE_INPUT =
  'w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#fed106] focus:ring-2 focus:ring-[#fed106]/15 bg-gray-50/40 text-sm text-gray-800 transition-all';

export default function ValidacaoRastreio() {
  const [form, setForm] = useState(FORM_INICIAL);
  // 'idle' | 'buscando' | 'erro' | 'sucesso'
  const [status, setStatus] = useState('idle');
  const [resultado, setResultado] = useState(null);
  const [buscaId, setBuscaId] = useState(0);

  function handleChange(e) {
    let { name, value } = e.target;
    if (name === 'cpf') value = mascaraCPF(value);
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('buscando');
    setResultado(null);

    try {
      const { data, error } = await supabase.rpc('buscar_status_matricula', {
        p_nome_completo: form.nomeCompleto.trim(),
        p_cpf: form.cpf,
        p_data_nascimento: form.dataNascimento,
      });

      if (error) throw error;

      const encontrado = Array.isArray(data) ? data[0] : data;
      if (!encontrado) {
        setStatus('erro');
        return;
      }

      setResultado(encontrado);
      setBuscaId((id) => id + 1); // muda a key da linha do tempo -> anima do zero a cada consulta
      setStatus('sucesso');
    } catch (err) {
      console.error('Erro ao consultar status da matrícula:', err);
      setStatus('erro');
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] text-gray-900 font-sans antialiased pb-24">
      <Navbar />

      {/* --- BANNER SUPERIOR --- */}
      <div className="w-full bg-gradient-to-r from-[#fed106] via-[#fed106] to-[#fffff] pt-20 pb-24 px-4 text-center flex flex-col items-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center text-black mb-5 backdrop-blur-sm border border-black/10">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.083 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <h1 className="text-black font-extrabold text-3xl md:text-[40px] tracking-tight mb-3">
          Acompanhe sua Matrícula
        </h1>
        <p className="text-black text-sm md:text-base max-w-2xl font-medium tracking-wide">
          Consulte em tempo real o andamento da sua matrícula, do cadastro até a certificação.
        </p>
      </div>

      {/* --- FORMULÁRIO DE CONSULTA --- */}
      <div className="max-w-3xl mx-auto px-6 -mt-14 relative z-10" style={{ fontFamily: "'Inter', sans-serif" }}>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
          <h2 className="text-[#0f1a30] text-base md:text-lg font-bold mb-1 tracking-tight">Consultar andamento</h2>
          <p className="text-gray-500 text-xs md:text-sm mb-6">
            Preencha os dados abaixo exatamente como enviados na sua matrícula.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Nome Completo</label>
              <input
                required
                type="text"
                name="nomeCompleto"
                value={form.nomeCompleto}
                onChange={handleChange}
                placeholder="Digite seu nome completo"
                disabled={status === 'buscando'}
                className={CLASSE_INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">CPF</label>
              <input
                required
                type="text"
                name="cpf"
                value={form.cpf}
                onChange={handleChange}
                maxLength="14"
                placeholder="000.000.000-00"
                disabled={status === 'buscando'}
                className={CLASSE_INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Data de Nascimento</label>
              <input
                required
                type="date"
                name="dataNascimento"
                value={form.dataNascimento}
                onChange={handleChange}
                disabled={status === 'buscando'}
                className={CLASSE_INPUT}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'buscando'}
            className="w-full mt-6 bg-black hover:bg-[#fed106] text-white hover:text-black font-bold py-4 rounded-xl transition-colors tracking-wide text-sm disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            {status === 'buscando' ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Consultando...
              </>
            ) : (
              'CONSULTAR ANDAMENTO'
            )}
          </button>
        </form>

        {/* --- ESTADO DE ERRO --- */}
        {status === 'erro' && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in duration-300">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Não encontramos nenhuma matrícula com esses dados. Confira as informações e tente novamente.
          </div>
        )}

        {/* --- ESTADO VAZIO (antes de qualquer consulta) --- */}
        {status === 'idle' && (
          <p className="text-center text-gray-400 text-xs font-medium mt-6">
            Assim que você consultar, o progresso da sua matrícula aparece aqui.
          </p>
        )}
      </div>

      {/* --- RESULTADO: PROGRESSO DA MATRÍCULA --- */}
      {status === 'sucesso' && resultado && (
        <div className="max-w-6xl mx-auto px-6 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-10">
            <div className="text-center mb-10">
              <h3 className="text-xl md:text-2xl font-black text-[#0f1a30] tracking-tight">{resultado.nome_completo}</h3>
              {resultado.curso && <p className="text-gray-500 text-sm font-medium mt-1">{resultado.curso}</p>}
            </div>

            <LinhaDoTempoMatricula key={buscaId} statusAtual={resultado.status_order ?? 0} />
          </div>
        </div>
      )}
    </div>
  );
}
