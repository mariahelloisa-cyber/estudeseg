import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import imagemInstitucional from '../assets/capa-video.png';
import fundoHero from '../assets/fundoo.png';
import selo6 from '../assets/selo6.png';
import fotoMissao from '../assets/pilar-missao.jpg';
import fotoVisao from '../assets/pilar-visao.png';
import fotoValores from '../assets/pilar-valores.jpg';
import seloAbed from '../assets/abed.png';

const VIDEO_DRIVE_ID = '1PFZab6pHDCmfEseEQjoRVA8Rb1g1FE08';

function IconePilar({ id, className }) {
  if (id === 'missao') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (id === 'visao') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}

const PILARES = [
  {
    id: 'missao',
    titulo: 'Missão',
    texto: 'Garantir ao aluno a segurança total de estudar e pagar apenas por cursos verdadeiramente reconhecidos, enquanto fortalece a credibilidade das instituições sérias e comprometidas.',
    imagem: fotoMissao
  },
  {
    id: 'visao',
    titulo: 'Visão',
    texto: 'Ser o maior marketplace de cursos seguros do Brasil até 2028, tornando-se sinônimo de confiança e referência no setor educacional digital.',
    imagem: fotoVisao
  },
  {
    id: 'valores',
    titulo: 'Valores',
    texto: 'Estude Seguro se posiciona como "o Mercado Pago da Educação", com garantia e confiança para ambas as partes.',
    imagem: fotoValores
  }
];

export default function Sobre() {
  const [videoReproduzindo, setVideoReproduzindo] = useState(false);
  const [pilarEmFoco, setPilarEmFoco] = useState(null);

  // Array completo com os 6 cards configurados
  const linhaDoTempo = [
    {
      ano: '2020 - 2021',
      categoria: 'IDEALIZAÇÃO',
      titulo: 'O Início de um Sonho',
      descricao: 'Nasce a Estude Seguro, com o propósito de ampliar o acesso à educação técnica de qualidade e contribuir para o desenvolvimento regional.',
      imagem: selo6 
    },
    {
      ano: '2022',
      categoria: 'EAD',
      titulo: 'Metodologia EAD',
      descricao: 'Implementação da metodologia EAD, permitindo que alunos estudem de qualquer lugar com flexibilidade e autonomia.',
      imagem: selo6 
    },
    {
      ano: '2023',
      categoria: 'EXPANSÃO',
      titulo: 'Crescimento Exponencial',
      descricao: 'Ampliação do portfólio de cursos técnicos voltados às necessidades reais das empresas e indústrias.',
      imagem: selo6
    },
    {
      ano: '2024',
      categoria: 'INOVAÇÃO',
      titulo: 'Crescimento e Impacto',
      descricao: 'Consolidação da Estude Seguro como uma instituição comprometida com a qualificação profissional e a transformação de vidas.',
      imagem: selo6
    },
    {
      ano: '2025 - 2026',
      categoria: 'CONSOLIDAÇÃO',
      titulo: 'Suporte e Acompanhamento',
      descricao: 'Fortalecimento do atendimento humanizado e da proximidade com os alunos durante toda a jornada acadêmica.',
      imagem: selo6
    },
    {
      ano: '2026',
      categoria: 'O FUTURO CONTINUA',
      titulo: 'O Futuro Continua',
      descricao: 'A Estude Seguro segue investindo em inovação, tecnologia e educação para criar novas oportunidades e formar profissionais preparados para os desafios do amanhã.',
      imagem: selo6
    }
  ];

  return (
    <div className="w-full bg-white font-sans antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      <Navbar />

      {/* 1. SEÇÃO HERO */}
      <section className="relative w-full min-h-[70vh] flex items-center bg-gray-900 overflow-hidden">
        <img 
          src={fundoHero} 
          alt="Alunos LA Educação" 
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#fed106]/40 via-[#fed106]/10 to-transparent pointer-events-none"></div>
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-[#fed106] opacity-40 blur-[150px] pointer-events-none rounded-full transform -translate-y-1/2 -translate-x-1/4"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl text-left">
            <h1 className="text-4xl md:text-6xl lg:text-[64px] font-black text-white mb-4 leading-[1.1] tracking-tight">
              Veja aqui a história da Estude Seguro
            </h1>
            <p className="text-lg md:text-xl text-gray-200 font-medium mb-10 max-w-lg leading-relaxed">
              Escolher onde estudar é também escolher como você quer se preparar para o futuro.
            </p>
            <a 
              href="#historia" 
              className="inline-flex items-center gap-3 bg-[#fed106] hover:bg-[#000000] text-white font-bold py-4 px-8 rounded-full transition-transform hover:scale-105 duration-300 w-max shadow-lg"
            >
              Nossa história
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* 2. SEÇÃO HISTÓRIA (Ajustada com formas vetorizadas de alta definição e sem os pontos circulados) */}
      <section id="historia" className="relative max-w-7xl mx-auto px-6 py-24 overflow-hidden">
        
        {/* Padrão de Pontos Decorativos (Mantido apenas o do Canto Inferior Esquerdo) */}
        <div className="absolute bottom-12 left-2 pointer-events-none opacity-40 hidden md:block">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#fed106]"></div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* LADO ESQUERDO: TEXTOS */}
          <div className="flex flex-col lg:col-span-5 text-[##ffeea0]">
            
            {/* Título com Barra Lateral e Letra em Degradê */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-[5px] h-14 bg-gradient-to-b from-[#fed106] to-[#6366f1] rounded-full"></div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight flex flex-wrap gap-x-3">
                <span className="text-[#000000]">Nossa</span>
                <span className="bg-gradient-to-r from-[#fed106] via-[#ffe057] to-[#ffeea0] bg-clip-text text-transparent">
                  História
                </span>
              </h2>
            </div>

            {/* Parágrafos de Conteúdo */}
            <div className="space-y-6 text-gray-700 text-sm md:text-[15px] font-medium leading-relaxed max-w-xl">
              <p>
                A <strong className="text-gray-900 font-bold">Estude Seguro</strong> nasceu com o propósito de transformar a forma como os brasileiros se matriculam em cursos EAD. Localizada na maior metrópole da América Latina, na Avenida Paulista – São Paulo (SP), nossa equipe está preparada para oferecer o suporte que você precisa com <strong className="text-gray-900 font-bold">transparência, segurança e credibilidade.</strong>

              </p>
              <p>
                Somos <strong className="text-gray-900 font-bold">intermediadores oficiais</strong> entre alunos e instituições de ensino credenciadas, garantindo que todo o processo — da matrícula até a certificação — aconteça com total segurança e respaldo jurídico.
Aqui, <strong className="text-gray-900 font-bold">não trabalhamos com vendedores</strong>, mas sim com <strong className="text-gray-900 font-bold">consultores educacionais especializados</strong>, capacitados para esclarecer todas as suas dúvidas e orientá-lo de acordo com a  <strong className="text-gray-900 font-bold">legislação educacional vigente.</strong>
              </p>
              <p>
                Nosso compromisso é com o seu sonho.
Por isso, <strong className="text-gray-900 font-bold">cada matrícula é protegida por lei</strong>, garantindo que seu investimento esteja seguro até o recebimento do diploma devidamente reconhecido.
              </p>
              <p>
                Você pode <strong className="text-gray-900 font-bold">nos visitar</strong> ou <strong className="text-gray-900 font-bold">entrar em contato</strong> pelos nossos canais oficiais.
A Estude Seguro é mais do que uma plataforma — <strong className="text-gray-900 font-bold">é a sua garantia de estudar com confiança.</strong>

              </p>
            </div>
          </div>

          {/* LADO DIREITO: FOTO E COMPOSIÇÃO DE VETORES */}
          <div className="relative lg:col-span-7 w-full flex justify-center items-center py-12">
            
            {/* 1. FORMA VETORIAL DE ALTA QUALIDADE: Curva Rosa/Roxa de Trás */}
            <svg className="absolute -top-6 -right-2 w-[85%] h-[55%] z-0 pointer-events-none" viewBox="0 0 500 350" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M120 20C240 -10 380 -5 450 60C520 125 510 220 460 280C400 350 280 340 180 320C70 300 15 240 5 160C-5 80 30 40 120 20Z" fill="url(#hdPinkPurpleGrad)" />
              <defs>
                <linearGradient id="hdPinkPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fed106" />
                  <stop offset="100%" stopColor="#ffeea0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Aura Azul Clara de Brilho de Fundo */}
            <div className="absolute -left-10 top-1/4 w-[60%] h-[60%] bg-[#fed106]/50 rounded-full blur-3xl z-0 pointer-events-none"></div>

            {/* CONTAINER DA FOTO PRINCIPAL */}
            <div className="relative w-full aspect-[4/3] md:aspect-[1.35/1] rounded-[48px_120px_40px_140px] overflow-hidden shadow-[0_30px_70px_rgba(15,23,42,0.18)] z-10">
              <img 
                src={imagemInstitucional} 
                alt="Alunos LA Tec" 
                className="w-full h-full object-cover object-center" 
              />
            </div>

            {/* 2. FORMA VETORIAL DE ALTA QUALIDADE: Onda Azul da Frente (Sobrepõe suavemente a foto) */}
            <svg className="absolute -bottom-8 -left-6 w-[95%] h-[50%] z-0 pointer-events-none" viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 130C10 50 120 10 240 5C400 -2 550 50 590 130C630 210 590 285 510 295C400 310 280 290 160 295C50 300 -5 230 0 130Z" fill="url(#hdBlueGrad)" />
              <defs>
                <linearGradient id="hdBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#000000" />
                  <stop offset="100%" stopColor="#000000" />
                </linearGradient>
              </defs>
            </svg>
            
          </div>

        </div>
      </section>

      {/* 2.4 SEÇÃO CREDIBILIDADE (ABED / Reclame Aqui) */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="relative bg-gradient-to-br from-[#fed106]/70 to-[#f5a300]/90 rounded-[48px] overflow-hidden px-8 py-14 md:px-16 md:py-20">
          {/* Formas decorativas estilo "pincelada" */}
          <div className="absolute top-10 left-8 w-44 h-16 bg-[#ffdb4d] rounded-full opacity-70 -rotate-6 pointer-events-none hidden md:block"></div>
          <div className="absolute bottom-10 left-16 w-56 h-20 bg-[#ffdb4d] rounded-full opacity-70 rotate-3 pointer-events-none hidden md:block"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center relative z-10">
            {/* LADO ESQUERDO: TEXTOS */}
            <div className="lg:col-span-7">
              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-6 max-w-xl">
                Compromisso com a Transparência e a Credibilidade
              </h2>
              <p className="text-white/90 text-sm md:text-base font-medium leading-relaxed mb-4 max-w-xl">
                A Estude Seguro é associada à ABED – Associação Brasileira de Educação a Distância, reforçando nosso compromisso com a seriedade, a qualidade e as boas práticas do ensino a distância no Brasil.
              </p>
              <p className="text-white/90 text-sm md:text-base font-medium leading-relaxed max-w-xl">
                Além disso, somos uma empresa verificada pelo Reclame Aqui, o maior e mais rigoroso site de reputação da América Latina, reconhecimento que reflete nossa dedicação à confiança e à satisfação de cada aluno.
              </p>
            </div>

            {/* LADO DIREITO: ESPAÇO PARA IMAGEM */}
            <div className="lg:col-span-5 flex justify-center relative">
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0 p-2">
                <img
                  src={seloAbed}
                  alt="Selo de Qualidade ABED - Educação a Distância"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 SEÇÃO MISSÃO, VISÃO E VALORES */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="bg-gray-50 rounded-[48px] p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[440px]">
            {PILARES.map((pilar) => {
              const emFoco = pilarEmFoco === pilar.id;

              return (
                <div
                  key={pilar.id}
                  onMouseEnter={() => setPilarEmFoco(pilar.id)}
                  onMouseLeave={() => setPilarEmFoco(null)}
                  onClick={() => setPilarEmFoco((atual) => (atual === pilar.id ? null : pilar.id))}
                  style={emFoco && pilar.imagem ? { backgroundImage: `url(${pilar.imagem})` } : undefined}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer border transition-none md:transition-all md:duration-500 md:ease-in-out bg-cover bg-center min-h-[220px] md:min-h-0 ${
                    emFoco
                      ? 'md:flex-[1.6] border-transparent bg-gradient-to-br from-black to-[#3a2f00]'
                      : `md:flex-1 bg-white border-gray-100 ${pilarEmFoco ? 'md:opacity-50' : ''}`
                  }`}
                >
                  {emFoco ? (
                    <div className="absolute inset-0 flex flex-col justify-end items-start text-left p-6 md:p-8">
                      <IconePilar id={pilar.id} className="relative z-10 w-12 h-12 text-[#fed106] -mb-12" />
                      <div className="relative -left-6 -right-6 -bottom-6 md:-left-8 md:-right-8 md:-bottom-8 w-[calc(100%+3rem)] md:w-[calc(100%+4rem)] pt-6 px-6 pb-6 md:px-8 md:pb-8">
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
                        <span className="relative text-white text-2xl md:text-3xl font-black tracking-tight uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                          {pilar.titulo}
                        </span>
                        <p className="relative mt-2 text-white text-sm md:text-base font-bold leading-relaxed w-[300px] md:w-[400px] transition-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                          {pilar.texto}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      <IconePilar id={pilar.id} className="w-9 h-9 text-[#fed106]" />
                      <span className="text-gray-800 text-xl md:text-2xl font-black tracking-tight uppercase">
                        {pilar.titulo}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. SEÇÃO MANIFESTO (Container mais largo e vídeo sem borda) */}
      {/* Alterado para w-full e max-w-[1440px] para ocupar mais espaço nas laterais */}
      <section className="w-full max-w-[1440px] mx-auto px-4 md:px-6 pb-24">
        {/* Container Envelopado com Cantos Ultra Arredondados */}
        <div className="bg-[#fed106]/10 rounded-[48px] py-16 px-6 md:px-12 flex flex-col items-center text-center w-full">
          
          <span className="text-[#fed106] text-xs font-black tracking-widest uppercase mb-4">
            Educação acessível, inovação digital e compromisso com o seu futuro.
          </span>

          <h2 className="text-3xl md:text-5xl font-black text-[#000000] mb-6 tracking-tight max-w-2xl">
            Dê o play e conheça a<span className="text-[#fed106]"> Estude Seguro</span> de perto.
          </h2>

          <p className="text-gray-600 font-medium text-sm md:text-base max-w-xl leading-relaxed mb-12">
            A história da Estude Seguro é construída diariamente por alunos, professores e colaboradores que acreditam no poder transformador da educação.

Assista ao vídeo e descubra como estamos conectando conhecimento, oportunidades e desenvolvimento profissional para ajudar milhares de estudantes a conquistarem seus objetivos.
          </p>

          {/* Espaço para o Vídeo / Player (SEM A BORDA BRANCA e um pouco mais largo: max-w-4xl) */}
          <div className="relative w-full max-w-4xl aspect-video rounded-[32px] overflow-hidden shadow-2xl group">
            {videoReproduzindo ? (
              <iframe
                src={`https://drive.google.com/file/d/${VIDEO_DRIVE_ID}/preview`}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                title="Vídeo institucional Estude Seguro"
              />
            ) : (
              <button
                type="button"
                onClick={() => setVideoReproduzindo(true)}
                className="absolute inset-0 w-full h-full cursor-pointer"
                aria-label="Reproduzir vídeo institucional"
              >
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                  <img
                    src={imagemInstitucional}
                    alt="Capa do Manifesto"
                    className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="absolute inset-0 bg-black/20 transition-opacity duration-300 group-hover:bg-black/30"></div>

                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-[#fed106]/30">
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-[#fed106] ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </button>
            )}
          </div>

        </div>
      </section>


      {/* 4. SEÇÃO LINHA DO TEMPO */}
      <section className="bg-gray-50 py-24 px-6 border-t border-gray-200/60">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-[40px] font-black text-[#1e293b] mb-3 tracking-tight">
              Uma trajetória de crescimento
            </h2>
            <p className="text-gray-500 font-medium text-base md:text-lg">
              Inovação e compromisso com a educação brasileira
            </p>
          </div>

          <div className="relative w-full space-y-12 md:space-y-0">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-gray-200 transform md:-translate-x-1/2"></div>

            {linhaDoTempo.map((item, index) => {
              const renderizaNaEsquerda = index % 2 === 0;

              return (
                <div 
                  key={index} 
                  className={`relative flex flex-col md:flex-row items-start md:items-center w-full md:mb-16 ${
                    renderizaNaEsquerda ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Card Lateral */}
                  <div className={`w-full md:w-1/2 pl-12 pr-4 md:px-12 flex ${
                    renderizaNaEsquerda ? 'md:justify-end' : 'md:justify-start'
                  }`}>
                    <div className="group bg-white p-6 md:p-7 rounded-2xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.03)] border border-gray-100 border-l-4 border-l-[#fed106] w-full max-w-[510px] transition-all hover:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.06)]">
                      
                      <div className="flex items-center gap-2.5 mb-3.5">
                        <span className="bg-[#fed106] text-white font-extrabold py-1 px-3 rounded-full text-xs tracking-wide">
                          {item.ano}
                        </span>
                        <span className="text-[#fed106] font-black text-xs tracking-wider uppercase">
                          {item.categoria}
                        </span>
                      </div>

                      <h3 className="text-lg md:text-xl font-extrabold text-[#000000] mb-2.5 tracking-tight transition-colors duration-300 group-hover:text-[#fed106]">
                        {item.titulo}
                      </h3>
                      
                      <p className="text-gray-500 font-medium leading-relaxed text-xs md:text-sm mb-4">
                        {item.descricao}
                      </p>

                      {item.imagem && (
                        <div className="w-full rounded-xl overflow-hidden mt-2 border border-gray-100 shadow-inner">
                          <img 
                            src={item.imagem} 
                            alt={item.titulo} 
                            className="w-full h-auto max-h-[240px] object-cover transition-transform duration-500 group-hover:scale-105" 
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="absolute left-[10px] md:left-1/2 transform md:-translate-x-1/2 top-7 md:top-auto w-[14px] h-[14px] bg-[#fed106] rounded-full z-10 border-4 border-white shadow-sm"></div>
                  <div className="hidden md:block w-1/2"></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}