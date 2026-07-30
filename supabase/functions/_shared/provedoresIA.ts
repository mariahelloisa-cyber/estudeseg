// Camada de abstração do provedor de IA.
//
// O restante da função (index.ts) não sabe nada sobre Anthropic, OpenAI ou
// Gemini — só chama `gerarResposta(...)`. Trocar de provedor/modelo no futuro
// é só mudar as variáveis de ambiente AI_PROVIDER / AI_MODEL (e a respectiva
// chave de API) nas configurações da Edge Function, sem reescrever nada aqui.

export type MensagemChat = { role: 'user' | 'assistant'; content: string };

interface ChamadaIA {
  provider: string;
  model: string;
  apiKey: string;
  systemPrompt: string;
  mensagens: MensagemChat[];
  maxTokens: number;
}

async function chamarAnthropic({ model, apiKey, systemPrompt, mensagens, maxTokens }: ChamadaIA): Promise<string> {
  const resposta = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: mensagens.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(`Anthropic API (${resposta.status}): ${erro}`);
  }

  const dados = await resposta.json();
  const bloco = dados.content?.find((b: { type: string }) => b.type === 'text');
  if (!bloco?.text) throw new Error('Anthropic API: resposta sem texto');
  return bloco.text;
}

async function chamarOpenAI({ model, apiKey, systemPrompt, mensagens, maxTokens }: ChamadaIA): Promise<string> {
  const resposta = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: systemPrompt }, ...mensagens],
    }),
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(`OpenAI API (${resposta.status}): ${erro}`);
  }

  const dados = await resposta.json();
  const texto = dados.choices?.[0]?.message?.content;
  if (!texto) throw new Error('OpenAI API: resposta sem texto');
  return texto;
}

async function chamarGemini({ model, apiKey, systemPrompt, mensagens, maxTokens }: ChamadaIA): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const resposta = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: mensagens.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(`Gemini API (${resposta.status}): ${erro}`);
  }

  const dados = await resposta.json();
  const texto = dados.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) throw new Error('Gemini API: resposta sem texto');
  return texto;
}

const PROVEDORES: Record<string, (chamada: ChamadaIA) => Promise<string>> = {
  anthropic: chamarAnthropic,
  openai: chamarOpenAI,
  gemini: chamarGemini,
};

export async function gerarResposta(chamada: ChamadaIA): Promise<string> {
  const executar = PROVEDORES[chamada.provider];
  if (!executar) {
    throw new Error(
      `Provedor de IA "${chamada.provider}" não reconhecido. Use: ${Object.keys(PROVEDORES).join(', ')}.`,
    );
  }
  return executar(chamada);
}
