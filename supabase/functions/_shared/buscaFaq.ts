// Carrega o FAQ oficial do site (tabela `faqs`, editada no painel admin) para dentro do
// prompt do Segurinho.
//
// Lê da tabela em vez de copiar as perguntas para o código: assim, qualquer pergunta
// criada, editada ou apagada no admin passa a valer no assistente sozinha, sem deploy.
//
// São poucas perguntas (~30, ~3 mil tokens), então entram TODAS no prompt — não há
// busca/ranking aqui. O resultado fica em cache na memória da instância por alguns
// minutos para não fazer uma consulta ao banco a cada mensagem do chat.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TEMPO_CACHE_MS = 5 * 60 * 1000;

let cache: { bloco: string; expiraEm: number } | null = null;

// Respostas do FAQ podem ter quebras de linha/parágrafos; no prompt basta uma linha por
// resposta (economiza tokens e mantém o formato "P:/R:" fácil de ler pro modelo).
function emUmaLinha(texto: string): string {
  return String(texto ?? '').replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

type LinhaFaq = { pergunta: string | null; resposta: string | null; topico: string | null };

function montarBloco(linhas: LinhaFaq[]): string {
  const porTopico = new Map<string, string[]>();
  for (const { pergunta, resposta, topico } of linhas) {
    if (!pergunta?.trim() || !resposta?.trim()) continue;
    const nomeTopico = topico?.trim() || 'Geral';
    if (!porTopico.has(nomeTopico)) porTopico.set(nomeTopico, []);
    porTopico.get(nomeTopico)!.push(`P: ${emUmaLinha(pergunta)}\nR: ${emUmaLinha(resposta)}`);
  }
  if (porTopico.size === 0) return '';

  const secoes = [...porTopico.entries()].map(([topico, itens]) => `[${topico}]\n${itens.join('\n')}`);
  return `\n\nPERGUNTAS FREQUENTES OFICIAIS (FAQ do site — informação confirmada pela Estude Seguro):\n\n${secoes.join('\n\n')}`;
}

export async function buscarFaqs(supabase: SupabaseClient): Promise<string> {
  const agora = Date.now();
  if (cache && cache.expiraEm > agora) return cache.bloco;

  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('pergunta, resposta, topico')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const bloco = montarBloco(data ?? []);
    cache = { bloco, expiraEm: agora + TEMPO_CACHE_MS };
    return bloco;
  } catch (erro) {
    console.error('Falha ao carregar o FAQ para o assistente:', erro);
    // Se o banco falhou, melhor usar o último FAQ conhecido (mesmo vencido) do que ficar sem.
    // Não guardamos o erro no cache: a próxima mensagem tenta de novo.
    return cache?.bloco ?? '';
  }
}
