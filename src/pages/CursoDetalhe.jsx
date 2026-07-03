import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ClockIcon,
  BoltIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PlusIcon,
  MinusIcon,
  ArrowRightIcon,
  VideoCameraIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { useCartStore } from '../store/cartStore';
import { parseGradeCurricular } from '../utils/gradeCurricular';
import { parseBlocosConteudo } from '../utils/blocosConteudo';
import imagemFundoHero from '../assets/imghero.png';

const BENEFICIOS = [
  {
    Icon: VideoCameraIcon,
    titulo: 'Videoaulas',
    descricao: 'E apostilas para você estudar onde e quando quiser.',
  },
  {
    Icon: LifebuoyIcon,
    titulo: 'Tutoria',
    descricao: 'Para sanar todas as dúvidas durante o curso.',
  },
  {
    Icon: ShieldCheckIcon,
    titulo: 'Diploma',
    descricao: 'Certificado digital ao concluir o curso.',
  },
];

const FAQ_ITEMS = [
  {
    pergunta: 'Como funciona o certificado?',
    resposta: 'Ao concluir o curso, você recebe um certificado digital que pode ser baixado e compartilhado, comprovando sua qualificação.',
  },
  {
    pergunta: 'Posso estudar no meu próprio ritmo?',
    resposta: 'Sim. O conteúdo fica disponível 24 horas por dia, então você organiza os estudos de acordo com a sua rotina.',
  },
  {
    pergunta: 'Quais são as formas de pagamento?',
    resposta: 'Você pode pagar via cartão de crédito, com opção de parcelamento, ou outras formas disponíveis no checkout.',
  },
  {
    pergunta: 'Tenho suporte durante o curso?',
    resposta: 'Sim, nossa equipe está disponível para tirar dúvidas durante toda a sua jornada no curso.',
  },
];

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

function formatarPreco(valor) {
  return (valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- Envolve o conteúdo com um fade-in suave quando entra na tela ---
function AoRolar({ children, className = '', delayMs = 0 }) {
  const ref = useRef(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisivel(true);
          observer.unobserve(elemento);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(elemento);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-all duration-700 ease-out ${visivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
    >
      {children}
    </div>
  );
}

function TituloSecao({ titulo, destaque, subtitulo }) {
  return (
    <div className="max-w-2xl mb-10 md:mb-12">
      <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
        {titulo} {destaque && <span className="text-[#fed106]">{destaque}</span>}
      </h2>
      {subtitulo && <p className="text-gray-500 text-sm md:text-base mt-3 leading-relaxed">{subtitulo}</p>}
    </div>
  );
}

function CardBeneficio({ Icon, titulo, descricao }) {
  return (
    <div className="aspect-square bg-gradient-to-br from-[#fed106] to-[#fff3b0] rounded-2xl p-5 text-black shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col overflow-hidden">
      <Icon className="w-8 h-8 text-black mb-3 shrink-0 group-hover:scale-110 transition-transform duration-300" />
      <h3 className="text-base font-black mb-1.5 text-whihte-900 shrink-0">{titulo}</h3>
      <p className="text-sm font-medium text-black leading-relaxed line-clamp-3">{descricao}</p>
    </div>
  );
}

function BlocoConteudo({ titulo, texto, ultimo }) {
  return (
    <div className={ultimo ? 'pb-0' : 'pb-6 mb-6 border-b border-gray-100'}>
      {titulo && <h3 className="text-lg font-black text-gray-900 mb-2">{titulo}</h3>}
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{texto}</p>
    </div>
  );
}

function ItemFAQ({ pergunta, resposta, aberto, onToggle }) {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-black text-gray-900">{pergunta}</span>
        <span className="w-8 h-8 rounded-full bg-[#fff4cc] text-[#8a6d00] flex items-center justify-center shrink-0">
          {aberto ? <MinusIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
        </span>
      </button>
      {aberto && (
        <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">
          {resposta}
        </div>
      )}
    </div>
  );
}

function CursoRelacionadoCard({ curso }) {
  return (
    <Link
      to={`/cursos/${curso.id}`}
      className="flex flex-col sm:flex-row bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
    >
      <div className="relative w-full sm:w-48 h-40 sm:h-auto shrink-0 overflow-hidden bg-gray-100">
        <img
          src={curso.imagem_url}
          alt={curso.titulo}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h4 className="text-sm font-black text-gray-900 mb-1.5 uppercase leading-snug">{curso.titulo}</h4>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{curso.descricao}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full">{curso.duracao || '-'}</span>
          <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-full">{curso.modalidade}</span>
        </div>
        <div className="flex items-center justify-between gap-3 mt-auto">
          <span className="text-base font-black text-gray-900">R$ {formatarPreco(curso.preco)}</span>
          <span className="inline-flex items-center gap-1 text-xs font-black text-black uppercase group-hover:gap-2 transition-all">
            Ver mais <ArrowRightIcon className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// --- Card de compra/inscrição: fica sticky ao lado do conteúdo no desktop ---
function CardCompra({ curso, precoAtual, precoOriginal, valorParcela, percentualDesconto, onComprar }) {
  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
      <div className="relative w-full h-48 sm:h-52 bg-gray-800">
        <img src={curso.imagem_url} alt={curso.titulo} className="w-full h-full object-cover" />
        {curso.selo_mec && (
          <span className="absolute top-3 left-3 bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[#fed106]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 1l2.39 4.84L18 6.91l-4 3.9.94 5.49L10 13.77l-4.94 2.53L6 10.81l-4-3.9 5.61-1.07L10 1z" />
            </svg>
            MEC
          </span>
        )}
      </div>

      <div className="p-6">
        {percentualDesconto && (
          <span className="inline-block bg-[#fed106] text-black text-xs font-black px-3 py-1.5 rounded-full mb-4">
            {percentualDesconto}% de desconto
          </span>
        )}

        <h3 className="text-lg font-black text-gray-900 mb-4 leading-snug">{curso.titulo}</h3>

        {precoOriginal && (
          <p className="text-gray-400 text-sm mb-0.5">
            De <span className="line-through">R$ {formatarPreco(precoOriginal)}</span>
          </p>
        )}
        <p className="text-gray-500 text-sm mb-1">Por</p>
        <p className="text-3xl font-black text-gray-900 mb-2">R$ {formatarPreco(precoAtual)}</p>
        {valorParcela > 0 && (
          <p className="text-sm text-gray-500 mb-5">
            <span className="font-bold text-gray-800">12x de R$ {formatarPreco(valorParcela)}</span> sem juros no cartão
          </p>
        )}

        <button
          onClick={onComprar}
          className="w-full bg-[#fed106] hover:bg-black hover:text-white text-black py-4 rounded-full font-black uppercase tracking-wider text-sm transition-all active:scale-[0.98] cursor-pointer shadow-lg"
        >
          Comprar
        </button>
      </div>
    </div>
  );
}

export default function CursoDetalhe() {
  const { id } = useParams();
  const adicionarAoCarrinho = useCartStore((state) => state.adicionarAoCarrinho);

  const [curso, setCurso] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [semestresAbertos, setSemestresAbertos] = useState({});
  const [faqAberta, setFaqAberta] = useState(0);
  const [cursosRelacionados, setCursosRelacionados] = useState([]);

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

  useEffect(() => {
    async function buscarRelacionados() {
      if (!curso) return;
      const { data, error } = await supabase
        .from('cursos_cadastrados')
        .select('*')
        .neq('id', curso.id)
        .order('created_at', { ascending: false })
        .limit(4);
      if (!error) setCursosRelacionados(data || []);
    }
    buscarRelacionados();
  }, [curso]);

  useEffect(() => {
    if (!curso) return;
    document.title = `${curso.titulo} | Estude Seguro`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', (curso.descricao || '').slice(0, 155));
    return () => {
      document.title = 'Estude Seguro';
    };
  }, [curso]);

  function alternarSemestre(indice) {
    setSemestresAbertos((prev) => ({ ...prev, [indice]: !prev[indice] }));
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
  const blocosConteudo = parseBlocosConteudo(curso.blocos_conteudo);
  const precoAtual = curso.preco || 0;
  const precoOriginal = curso.preco_original && curso.preco_original > precoAtual ? curso.preco_original : null;
  const valorParcela = precoAtual > 0 ? precoAtual / 12 : 0;
  const percentualDesconto = precoOriginal ? Math.round(((precoOriginal - precoAtual) / precoOriginal) * 100) : null;

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] font-sans antialiased">
      <Navbar />

      {/* --- HERO: foto de fundo ocupando toda a largura da tela (igual em todos os cursos) --- */}
      <div className="w-full relative overflow-hidden bg-black lg:min-h-[420px]">
        <img src={imagemFundoHero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/65 to-black/80"></div>
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#fed106]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="text-sm text-white/50 font-medium mb-5 flex items-center flex-wrap gap-2">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link to="/cursos" className="hover:text-white transition-colors">Cursos</Link>
            <span>/</span>
            <span className="text-white font-semibold truncate max-w-[160px] sm:max-w-md">{curso.titulo}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white max-w-2xl">{curso.titulo}</h1>
          <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-lg mb-7">{curso.descricao}</p>

          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 border border-white/25 text-white rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold">
              <ClockIcon className="w-4 h-4 text-[#fed106] shrink-0" />
              {curso.duracao || '-'}
            </span>
            <span className="inline-flex items-center gap-2 border border-white/25 text-white rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold">
              <BoltIcon className="w-4 h-4 text-[#fed106] shrink-0" />
              {curso.carga_horaria || '-'}
            </span>
            <span className="inline-flex items-center gap-2 border border-white/25 text-white rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold">
              <AcademicCapIcon className="w-4 h-4 text-[#fed106] shrink-0" />
              {categoriaNome}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-16 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-16">
        {/* --- COLUNA LATERAL: CARD DE COMPRA (logo após o hero no mobile; sobrepõe a hero e fica sticky no desktop) --- */}
        <div className="lg:order-2 lg:-mt-80">
          <div className="lg:sticky lg:top-24">
            <CardCompra
              curso={curso}
              precoAtual={precoAtual}
              precoOriginal={precoOriginal}
              valorParcela={valorParcela}
              percentualDesconto={percentualDesconto}
              onComprar={handleComprar}
            />
          </div>
        </div>

        {/* --- RESTANTE DO CONTEÚDO --- */}
        <div className="lg:order-1 flex flex-col gap-14 md:gap-20">
          {/* --- SOBRE O CURSO --- */}
          <AoRolar>
            <div className="mb-6">
              <h2 className="relative inline-block text-2xl md:text-3xl font-black text-gray-900">
                Sobre o Curso
                <span className="absolute left-0 -bottom-2 w-16 h-1.5 rounded-full bg-[#fed106]"></span>
              </h2>
            </div>
            <p className="text-gray-600 text-base leading-relaxed mt-8 whitespace-pre-line">
              {curso.descricao || 'Descrição indisponível.'}
            </p>
          </AoRolar>

          {/* --- O QUE VOCÊ TERÁ ACESSO --- */}
          <div>
            <AoRolar>
              <TituloSecao
                titulo="O que você terá"
                destaque="acesso"
                subtitulo="Tudo o que você precisa para aprender com qualidade, do início ao certificado."
              />
            </AoRolar>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {BENEFICIOS.map((beneficio, idx) => (
                <AoRolar key={beneficio.titulo} delayMs={idx * 80}>
                  <CardBeneficio Icon={beneficio.Icon} titulo={beneficio.titulo} descricao={beneficio.descricao} />
                </AoRolar>
              ))}
            </div>
          </div>

          {/* --- COMO FUNCIONA --- */}
          <div className="-mt-6 md:-mt-10">
            <AoRolar>
              <TituloSecao
                titulo="Entenda como vai funcionar o"
                destaque="curso"
              />
            </AoRolar>
            {blocosConteudo.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Conteúdo ainda não cadastrado.</p>
            ) : (
              <div>
                {blocosConteudo.map((bloco, idx) => (
                  <AoRolar key={idx} delayMs={idx * 100}>
                    <BlocoConteudo
                      titulo={bloco.titulo}
                      texto={bloco.texto}
                      ultimo={idx === blocosConteudo.length - 1}
                    />
                  </AoRolar>
                ))}
              </div>
            )}
          </div>
          {/* --- CONTEÚDO PROGRAMÁTICO (GRADE CURRICULAR) --- */}
          <div className="bg-gray-50 rounded-3xl p-6 sm:p-0">
            <AoRolar>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                <h2 className="text-2xl md:text-3xl font-black text-gray-900">Conteúdo Programático</h2>
                {gradeCurricular.length > 0 && (
                  <span className="inline-flex items-center gap-2 bg-[#fed106] text-[#000000] text-sm font-bold px-4 py-2 rounded-full w-fit">
                    <BookOpenIcon className="w-4 h-4" />
                    {gradeCurricular.length} {gradeCurricular.length === 1 ? 'Semestre' : 'Semestres'}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm md:text-base mb-8">Conheça todas as disciplinas do curso organizadas por semestre.</p>
            </AoRolar>

            {gradeCurricular.length === 0 ? (
              <p className="text-gray-400 italic text-sm">Grade curricular ainda não cadastrada.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {gradeCurricular.map((semestre, idx) => {
                  const aberto = !!semestresAbertos[idx];
                  const horasSemestre = calcularHorasSemestre(semestre.disciplinas);
                  return (
                    <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => alternarSemestre(idx)}
                        className="w-full flex items-center justify-between gap-3 bg-gray-50 hover:bg-gray-100 transition-colors px-5 py-4 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-11 h-11 rounded-full bg-black text-[#fed106] flex items-center justify-center font-black text-base shrink-0">
                            {idx + 1}º
                          </span>
                          <div>
                            <p className="text-base font-black text-gray-900">{semestre.titulo}</p>
                            <p className="text-sm text-gray-500 font-medium">
                              {semestre.disciplinas.length} {semestre.disciplinas.length === 1 ? 'disciplina' : 'disciplinas'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {horasSemestre && (
                            <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#fed106] text-[#000000] text-sm font-bold px-3 py-1.5 rounded-full">
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
                              <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-full bg-[#fed106] text-[#000000] flex items-center justify-center shrink-0">
                                  <BookOpenIcon className="w-4 h-4" />
                                </span>
                                <p className="text-sm font-bold text-gray-800">{disciplina.nome}</p>
                              </div>
                              {disciplina.horas && (
                                <span className="bg-[#fed106] text-[#000000] text-sm font-bold px-3 py-1.5 rounded-full shrink-0">
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
          </div>

          {/* --- DÚVIDAS FREQUENTES (FAQ) --- */}
          <div>
            <AoRolar>
              <TituloSecao
                titulo="Dúvidas"
                destaque="Frequentes"
                subtitulo="Reunimos as perguntas mais comuns para te ajudar a decidir com segurança."
              />
            </AoRolar>
            <div className="flex flex-col gap-3">
              {FAQ_ITEMS.map((item, idx) => (
                <ItemFAQ
                  key={item.pergunta}
                  pergunta={item.pergunta}
                  resposta={item.resposta}
                  aberto={faqAberta === idx}
                  onToggle={() => setFaqAberta(faqAberta === idx ? null : idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- CURSOS RELACIONADOS (fora da coluna, largura total) --- */}
      {cursosRelacionados.length > 0 && (
        <section className="bg-gray-50 border-t border-gray-100 py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <AoRolar>
              <TituloSecao
                titulo="Cursos que você também pode"
                destaque="gostar"
                subtitulo="Continue explorando outras oportunidades para acelerar sua carreira."
              />
            </AoRolar>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {cursosRelacionados.map((relacionado) => (
                <CursoRelacionadoCard key={relacionado.id} curso={relacionado} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
