import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ClockIcon,
  BoltIcon,
  BookOpenIcon,
  AcademicCapIcon,
  MapPinIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { useCartStore } from '../store/cartStore';
import { parseGradeCurricular } from '../utils/gradeCurricular';

function calcularHorasSemestre(disciplinas) {
  let soma = 0;
  let temValor = false;
  for (const disciplina of disciplinas) {
    const match = String(disciplina.horas || '').match(/\d+/);
    if (match) {
      soma += parseInt(match[0], 10);
      temValor = true;
    }
  }
  return temValor ? `${soma}h` : null;
}

export default function CursoDetalhe() {
  const { id } = useParams();
  const adicionarAoCarrinho = useCartStore((state) => state.adicionarAoCarrinho);

  const [curso, setCurso] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('detalhes');
  const [semestresFechados, setSemestresFechados] = useState({});

  useEffect(() => {
    async function carregarCurso() {
      try {
        setCarregando(true);
        const { data, error } = await supabase
          .from('cursos_cadastrados')
          .select('*, categorias_cursos(nome)')
          .eq('id', id)
          .single();

        if (error || !data) throw new Error('Curso não encontrado');
        setCurso(data);
      } catch (err) {
        console.error('Erro ao carregar curso:', err);
        setCurso(null);
      } finally {
        setCarregando(false);
      }
    }
    if (id) carregarCurso();
  }, [id]);

  function alternarSemestre(indice) {
    setSemestresFechados((prev) => ({ ...prev, [indice]: !prev[indice] }));
  }

  const handleComprar = () => {
    if (!curso) return;
    adicionarAoCarrinho({
      id: `curso-admin-${curso.id}`,
      titulo: curso.titulo,
      preco: curso.preco || 0,
      horas: curso.carga_horaria || '',
    });
  };

  if (carregando) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="w-full flex flex-col items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#fed106]"></div>
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] font-sans">
        <Navbar />
        <div className="max-w-xl mx-auto text-center py-24 px-4">
          <h2 className="text-2xl font-bold text-gray-800">Curso não encontrado</h2>
          <Link to="/cursos" className="mt-6 inline-block bg-[#fed106] text-black px-6 py-2.5 rounded-full font-bold text-sm shadow-sm">
            Voltar para Cursos
          </Link>
        </div>
      </div>
    );
  }

  const categoriaNome = curso.categorias_cursos?.nome || 'Geral';
  const gradeCurricular = parseGradeCurricular(curso.grade_curricular);

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] font-sans antialiased">
      <Navbar />

      {/* --- FAIXA SUPERIOR COM BREADCRUMB E TÍTULO --- */}
      <div className="w-full bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-sm text-white/60 font-medium mb-4 flex items-center flex-wrap gap-2">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link to="/cursos" className="hover:text-white transition-colors">Cursos</Link>
            <span>/</span>
            <span className="text-white font-semibold truncate max-w-[240px] sm:max-w-md">{curso.titulo}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 max-w-3xl">{curso.titulo}</h1>
          <div className="flex flex-wrap gap-2.5">
            <span className="bg-white/10 text-white text-sm font-bold px-4 py-2 rounded-full">{curso.modalidade}</span>
            <span className="bg-white/10 text-white text-sm font-bold px-4 py-2 rounded-full">{categoriaNome}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* --- COLUNA PRINCIPAL --- */}
        <div className="lg:col-span-8">
          <div className="w-full h-64 sm:h-96 md:h-[28rem] rounded-2xl overflow-hidden shadow-sm bg-gray-100 mb-7 relative">
            <img src={curso.imagem_url} alt={curso.titulo} className="w-full h-full object-cover" />
            {curso.selo_mec && (
              <span className="absolute top-4 left-4 bg-white text-gray-800 text-sm font-bold px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-[#fed106]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 1l2.39 4.84L18 6.91l-4 3.9.94 5.49L10 13.77l-4.94 2.53L6 10.81l-4-3.9 5.61-1.07L10 1z" />
                </svg>
                MEC
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="inline-flex bg-gray-100 rounded-full p-1.5 mb-7">
            <button
              onClick={() => setAbaAtiva('detalhes')}
              className={`px-7 py-3 rounded-full text-sm font-bold transition-all cursor-pointer ${abaAtiva === 'detalhes' ? 'bg-[#fed106] shadow-sm text-black' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Detalhes do Curso
            </button>
            <button
              onClick={() => setAbaAtiva('grade')}
              className={`px-7 py-3 rounded-full text-sm font-bold transition-all cursor-pointer ${abaAtiva === 'grade' ? 'bg-[#fed106] shadow-sm text-black' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Grade Curricular
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 md:p-10">
            {abaAtiva === 'detalhes' ? (
              <>
                <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-[#fff4cc] text-[#8a6d00] flex items-center justify-center shrink-0">
                    <BookOpenIcon className="w-5 h-5" />
                  </span>
                  Sobre o Curso
                </h2>
                <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">
                  {curso.descricao || 'Descrição indisponível.'}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <h2 className="text-xl font-black text-gray-900">Estrutura Curricular</h2>
                  {gradeCurricular.length > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-2 bg-[#fff4cc] text-[#8a6d00] text-sm font-bold px-4 py-2 rounded-full shrink-0">
                      <BookOpenIcon className="w-4 h-4" />
                      {gradeCurricular.length} {gradeCurricular.length === 1 ? 'Semestre' : 'Semestres'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-6">Conheça todas as disciplinas do curso organizadas por semestre</p>

                {gradeCurricular.length === 0 ? (
                  <p className="text-base text-gray-400 italic">Grade curricular ainda não cadastrada.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {gradeCurricular.map((semestre, idx) => {
                      const aberto = !semestresFechados[idx];
                      const horasSemestre = calcularHorasSemestre(semestre.disciplinas);
                      return (
                        <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => alternarSemestre(idx)}
                            className="w-full flex items-center justify-between gap-3 bg-gray-50 hover:bg-gray-100 transition-colors px-5 py-4 text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <span className="w-12 h-12 rounded-full bg-black text-[#fed106] flex items-center justify-center font-black text-base shrink-0">
                                {idx + 1}º
                              </span>
                              <div>
                                <p className="text-lg font-black text-gray-900">{semestre.titulo}</p>
                                <p className="text-sm text-gray-500 font-medium">
                                  {semestre.disciplinas.length} {semestre.disciplinas.length === 1 ? 'disciplina' : 'disciplinas'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {horasSemestre && (
                                <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#fff4cc] text-[#8a6d00] text-sm font-bold px-3 py-1.5 rounded-full">
                                  <ClockIcon className="w-4 h-4" />
                                  {horasSemestre}
                                </span>
                              )}
                              <span className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                                {aberto ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                              </span>
                            </div>
                          </button>

                          {aberto && (
                            <div className="divide-y divide-gray-50">
                              {semestre.disciplinas.map((disciplina, dIdx) => (
                                <div key={dIdx} className="flex items-center justify-between gap-3 px-5 py-4">
                                  <div className="flex items-center gap-4">
                                    <span className="w-10 h-10 rounded-full bg-[#fff4cc] text-[#8a6d00] flex items-center justify-center shrink-0">
                                      <BookOpenIcon className="w-5 h-5" />
                                    </span>
                                    <p className="text-base font-bold text-gray-800">{disciplina.nome}</p>
                                  </div>
                                  {disciplina.horas && (
                                    <span className="bg-gray-100 text-gray-600 text-sm font-bold px-3 py-1.5 rounded-full shrink-0">
                                      {disciplina.horas}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* --- SIDEBAR: INFORMAÇÕES + COMPRAR --- */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 lg:sticky lg:top-24">
            <h3 className="text-xl font-black text-gray-900 mb-5">Informações do Curso</h3>
            <div className="space-y-5 text-base">
              <div className="flex items-center gap-4">
                <ClockIcon className="w-6 h-6 text-[#fed106] shrink-0" />
                <div>
                  <p className="text-sm text-gray-400 font-medium">Duração</p>
                  <p className="font-bold text-gray-800 text-lg">{curso.duracao || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <BoltIcon className="w-6 h-6 text-[#7c3aed] shrink-0" />
                <div>
                  <p className="text-sm text-gray-400 font-medium">Carga Horária</p>
                  <p className="font-bold text-gray-800 text-lg">{curso.carga_horaria || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <MapPinIcon className="w-6 h-6 text-gray-700 shrink-0" />
                <div>
                  <p className="text-sm text-gray-400 font-medium">Modalidade</p>
                  <p className="font-bold text-gray-800 text-lg">{curso.modalidade}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <AcademicCapIcon className="w-6 h-6 text-[#fed106] shrink-0" />
                <div>
                  <p className="text-sm text-gray-400 font-medium">Categoria</p>
                  <p className="font-bold text-gray-800 text-lg">{categoriaNome}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 mt-6 pt-6">
              <p className="text-sm text-gray-400 font-medium mb-1">Investimento</p>
              <p className="text-3xl font-black text-gray-900 mb-5">
                R$ {(curso.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <button
                onClick={handleComprar}
                className="w-full bg-[#fed106] hover:bg-black hover:text-white text-black py-4 rounded-full font-black uppercase tracking-wider text-base transition-all active:scale-[0.98] cursor-pointer shadow-sm"
              >
                Comprar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
