// Formato armazenado em `blocos_conteudo` (texto): JSON de blocos de título + texto.
// [{ titulo: 'Curso Técnico em Eletrotécnica EAD: O que é', texto: '...' }]
export function parseBlocosConteudo(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // formato inválido/antigo, ignora
  }
  return [];
}

export function serializarBlocosConteudo(blocos) {
  const limpos = (blocos || [])
    .map((b) => ({ titulo: (b.titulo || '').trim(), texto: (b.texto || '').trim() }))
    .filter((b) => b.titulo || b.texto);

  return limpos.length > 0 ? JSON.stringify(limpos) : '';
}
