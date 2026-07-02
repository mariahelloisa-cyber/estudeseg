// Formato armazenado em `grade_curricular` (texto): JSON de semestres.
// [{ titulo: '1º Semestre', disciplinas: [{ nome: 'Português', horas: '200h' }] }]
export function parseGradeCurricular(raw) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Formato antigo: texto simples, uma disciplina por linha.
  }

  const linhas = String(raw)
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean);

  if (linhas.length === 0) return [];

  return [{ titulo: '1º Semestre', disciplinas: linhas.map((nome) => ({ nome, horas: '' })) }];
}

export function serializarGradeCurricular(semestres) {
  const limpos = (semestres || [])
    .map((semestre) => ({
      titulo: (semestre.titulo || '').trim(),
      disciplinas: (semestre.disciplinas || [])
        .map((d) => ({ nome: (d.nome || '').trim(), horas: (d.horas || '').trim() }))
        .filter((d) => d.nome),
    }))
    .filter((semestre) => semestre.titulo && semestre.disciplinas.length > 0);

  return limpos.length > 0 ? JSON.stringify(limpos) : '';
}
