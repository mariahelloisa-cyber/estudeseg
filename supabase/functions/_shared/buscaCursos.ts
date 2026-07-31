// Busca pontual e simples no catálogo real de cursos (tabela cursos_cadastrados),
// usada só quando a mensagem do visitante parece citar um curso específico.
//
// Não é RAG/busca semântica — é um ILIKE simples por palavras-chave da própria
// mensagem, propositalmente enxuto para manter o custo e a complexidade baixos.
// O resultado é injetado no prompt daquela mensagem, como dado real e atual,
// complementando (não substituindo) a base de conhecimento estática.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAXIMO_TERMOS_BUSCA = 4;
const MAXIMO_CURSOS_RETORNADOS = 5;
const TAMANHO_MINIMO_TERMO = 4;

// Palavras comuns demais para servirem de termo de busca (dariam falso positivo
// em quase todo curso, já que a maioria dos títulos termina em "EAD").
const PALAVRAS_IGNORADAS = new Set([
  'para', 'como', 'que', 'esta', 'está', 'estao', 'estão', 'disponivel', 'disponível',
  'confirmar', 'todos', 'todas', 'detalhes', 'favor', 'pode', 'poderia', 'saber',
  'sobre', 'tem', 'tenho', 'quero', 'gostaria', 'informacoes', 'informações', 'curso',
  'cursos', 'estude', 'seguro', 'ainda', 'agora', 'hoje', 'preco', 'preço', 'valor',
  'funciona', 'existe', 'onde', 'quando', 'este', 'essa', 'esse', 'isso', 'aqui',
  'olá', 'vocês', 'voces', 'quais', 'qual',
]);

function extrairTermosDeBusca(mensagem: string): string[] {
  const palavras = mensagem.toLowerCase().match(/\p{L}+/gu) || [];
  const termos = palavras.filter((p) => p.length >= TAMANHO_MINIMO_TERMO && !PALAVRAS_IGNORADAS.has(p));
  return [...new Set(termos)].slice(0, MAXIMO_TERMOS_BUSCA);
}

function formatarPreco(valor: number | null): string {
  if (valor === null || valor === undefined) return '';
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

export async function buscarCursosRelacionados(supabase: SupabaseClient, mensagem: string): Promise<string> {
  const termos = extrairTermosDeBusca(mensagem);
  if (termos.length === 0) return '';

  try {
    const filtro = termos.map((termo) => `titulo.ilike.%${termo}%`).join(',');
    const { data, error } = await supabase
      .from('cursos_cadastrados')
      .select('titulo, preco, preco_original, duracao, modalidade, categorias_cursos(nome)')
      .or(filtro)
      .limit(MAXIMO_CURSOS_RETORNADOS);

    if (error) throw error;

    if (!data || data.length === 0) {
      return '\n\nCURSOS ENCONTRADOS AGORA NO CATÁLOGO: nenhum curso com esse nome foi encontrado no sistema neste momento.';
    }

    const linhas = data.map((curso) => {
      const precoAtual = formatarPreco(curso.preco);
      const precoOriginal = curso.preco_original ? ` (de ${formatarPreco(curso.preco_original)})` : '';
      const categoria = curso.categorias_cursos?.nome ? ` — ${curso.categorias_cursos.nome}` : '';
      const duracao = curso.duracao ? ` — ${curso.duracao}` : '';
      return `- ${curso.titulo}${categoria} — ${precoAtual}${precoOriginal}${duracao}`;
    });

    return `\n\nCURSOS ENCONTRADOS AGORA NO CATÁLOGO (dado real, buscado neste momento):\n${linhas.join('\n')}`;
  } catch (erro) {
    console.error('Falha ao buscar cursos relacionados:', erro);
    return '';
  }
}
