// ============================================================================
// A-02 — Prova de concorrência: algoritmo ANTIGO vs. algoritmo NOVO
// ----------------------------------------------------------------------------
// POR QUE ESTE TESTE EXISTE NESTE FORMATO
//
// Provar a race condition exige DUAS OU MAIS transações simultâneas contra o
// mesmo banco. Nesta máquina não há Docker, psql, Postgres local nem Deno, e
// o PGlite (usado em a02-postgres-real.mjs) tem uma conexão só — nenhum deles
// consegue produzir duas transações concorrentes. Rodar contra o Supabase de
// produção está fora de questão: gravaria linhas reais.
//
// Então este teste modela o que importa do PostgreSQL, com honestidade:
//
//   * READ COMMITTED — cada comando enxerga o que estava COMMITADO quando o
//     comando começou, mais as alterações da própria transação. Transações
//     concorrentes ainda não commitadas são invisíveis. É esse detalhe que
//     produz a race condition.
//   * autocommit por chamada — no código antigo cada consulta ia pelo
//     PostgREST como sua própria transação, e é assim que está modelado.
//   * pg_advisory_xact_lock — exclusão mútua por chave, liberada no commit.
//   * intercalação real — cada operação cede o controle ao event loop do Node
//     um número aleatório de vezes, então as requisições realmente se
//     intercalam em ordens diferentes a cada rodada.
//
// A VALIDAÇÃO DO PRÓPRIO MODELO: o teste 1 exige que o modelo REPRODUZA o bug
// antigo. Um modelo que não consegue mostrar a falha conhecida não serviria
// para atestar a correção. Se o teste 1 parar de falhar, o modelo está errado.
// ============================================================================

const LIMITE = 3;
const CONCORRENTES = 12;
const RODADAS = 300;

// --- Intercalação: cede o controle um número imprevisível de vezes ----------
const aleatorio = (n) => Math.floor(Math.random() * n);
async function ceder() {
  const vezes = aleatorio(4);
  for (let i = 0; i < vezes; i++) await Promise.resolve();
  if (aleatorio(3) === 0) await new Promise((r) => setTimeout(r, 0));
}

// --- Banco simulado ---------------------------------------------------------
class BancoSimulado {
  constructor() {
    this.commitadas = [];        // linhas visíveis para todos
    this.filaDeLocks = new Map(); // chave -> promessa do último da fila
  }

  // Um comando em READ COMMITTED enxerga o estado commitado no instante em que
  // começa, mais o que a própria transação já escreveu e ainda não commitou.
  async contar(pendentesDaPropriaTx, filtro) {
    await ceder();
    const visiveis = this.commitadas.concat(pendentesDaPropriaTx);
    await ceder();
    return visiveis.filter(filtro).length;
  }

  async commitar(pendentes) {
    await ceder();
    this.commitadas.push(...pendentes);
  }

  // pg_advisory_xact_lock: serializa por chave. Devolve a função que libera,
  // chamada no commit ou no rollback — como o escopo `xact` faz de verdade.
  async travar(chave) {
    const anterior = this.filaDeLocks.get(chave) ?? Promise.resolve();
    let liberar;
    const minhaVez = new Promise((r) => { liberar = r; });
    this.filaDeLocks.set(chave, anterior.then(() => minhaVez));
    await anterior;
    await ceder();
    return liberar;
  }
}

// --- A IA custa dinheiro: cada invocação é contada -------------------------
function criarIA() {
  const estado = { chamadas: 0 };
  return {
    estado,
    async gerar() {
      estado.chamadas++;
      await ceder();
      await new Promise((r) => setTimeout(r, 1)); // latência da API
      return 'resposta';
    },
  };
}

// ============================================================================
// ALGORITMO ANTIGO — o que estava no chat-agent antes da correção
// ============================================================================
// 1) três contagens          2) decide
// 3) chama a IA              4) INSERT depois, sem await, transação própria
async function requisicaoAntiga(db, ia, ip) {
  const noMinuto = (l) => l.ip === ip;
  const contagem = await db.contar([], noMinuto);   // passo 1

  if (contagem >= LIMITE) return { resultado: 'bloqueado', contagemVista: contagem }; // passo 2

  await ia.gerar();                                  // passo 3 — janela enorme

  // passo 4: fire-and-forget, transação própria que commita sozinha.
  db.commitar([{ ip }]);

  return { resultado: 'ok', contagemVista: contagem };
}

// ============================================================================
// ALGORITMO INTERMEDIÁRIO — "só põe await e insere antes da IA"
// ============================================================================
// Esta é a alternativa que a tarefa citava como aceitável e mandava avaliar
// antes de adotar. Ela elimina o fire-and-forget e encurta muito a janela,
// mas continuam sendo DUAS operações separadas: contar e inserir. Sob READ
// COMMITTED, duas transações concorrentes ainda leem o mesmo estado antes de
// qualquer uma commitar. Este algoritmo está aqui para mostrar isso com
// número, não com opinião.
async function requisicaoAwaitAntes(db, ia, ip) {
  const contagem = await db.contar([], (l) => l.ip === ip);   // transação 1

  if (contagem >= LIMITE) return { resultado: 'bloqueado', contagemVista: contagem };

  await db.commitar([{ ip }]);                                 // transação 2, agora com await

  await ia.gerar();                                            // IA só depois
  return { resultado: 'ok', contagemVista: contagem };
}

// ============================================================================
// ALGORITMO NOVO — consumir_cota_chat
// ============================================================================
// 1) advisory lock           2) conta         3) decide
// 4) INSERT dentro do lock   5) commit        6) só então chama a IA, já fora
async function requisicaoNova(db, ia, ip) {
  const pendentes = [];
  const liberar = await db.travar('chat_agent_rate_limit');   // passo 1
  let saida;
  try {
    const contagem = await db.contar(pendentes, (l) => l.ip === ip); // passo 2

    if (contagem >= LIMITE) {                                        // passo 3
      saida = { resultado: 'bloqueado', contagemVista: contagem };
    } else {
      pendentes.push({ ip });                                        // passo 4
      await db.commitar(pendentes);                                  // passo 5
      saida = { resultado: 'ok', contagemVista: contagem };
    }
  } finally {
    liberar(); // escopo xact: sai do lock no commit e também no erro
  }

  if (saida.resultado === 'ok') await ia.gerar();                    // passo 6
  return saida;
}

// ============================================================================
// Execução
// ============================================================================
async function rodada(algoritmo) {
  const db = new BancoSimulado();
  const ia = criarIA();
  const resultados = await Promise.all(
    Array.from({ length: CONCORRENTES }, () => algoritmo(db, ia, '203.0.113.10')),
  );
  // Deixa os fire-and-forget do algoritmo antigo assentarem antes de medir.
  await new Promise((r) => setTimeout(r, 10));

  const autorizadas = resultados.filter((r) => r.resultado === 'ok');
  const contagensVistas = autorizadas.map((r) => r.contagemVista);
  return {
    autorizadas: autorizadas.length,
    bloqueadas: resultados.length - autorizadas.length,
    chamadasIA: ia.estado.chamadas,
    linhasFinais: db.commitadas.length,
    vagasDuplicadas: contagensVistas.length - new Set(contagensVistas).size,
  };
}

async function medir(nome, algoritmo) {
  let piorAutorizadas = 0;
  let piorIA = 0;
  let rodadasComExcesso = 0;
  let totalDuplicadas = 0;
  let divergenciaContador = 0;
  let iaEmBloqueada = 0;

  for (let i = 0; i < RODADAS; i++) {
    const r = await rodada(algoritmo);
    piorAutorizadas = Math.max(piorAutorizadas, r.autorizadas);
    piorIA = Math.max(piorIA, r.chamadasIA);
    if (r.autorizadas > LIMITE) rodadasComExcesso++;
    totalDuplicadas += r.vagasDuplicadas;
    if (r.linhasFinais !== r.autorizadas) divergenciaContador++;
    if (r.chamadasIA !== r.autorizadas) iaEmBloqueada++;
  }

  console.log(`\n${nome}`);
  console.log(`  limite=${LIMITE}, ${CONCORRENTES} requisições simultâneas, ${RODADAS} rodadas`);
  console.log(`  máximo de autorizadas numa rodada ....... ${piorAutorizadas}  (limite é ${LIMITE})`);
  console.log(`  máximo de chamadas de IA numa rodada .... ${piorIA}`);
  console.log(`  rodadas que ultrapassaram o limite ...... ${rodadasComExcesso}/${RODADAS}`);
  console.log(`  vagas consumidas em duplicidade ......... ${totalDuplicadas}`);
  console.log(`  rodadas com contador ≠ autorizadas ...... ${divergenciaContador}`);
  console.log(`  rodadas em que bloqueada chamou a IA .... ${iaEmBloqueada}`);
  return { piorAutorizadas, piorIA, rodadasComExcesso, totalDuplicadas, divergenciaContador, iaEmBloqueada };
}

let falhas = 0;
const exigir = (nome, ok, detalhe) => {
  console.log(`  ${ok ? 'OK   ' : 'FALHA'} ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
  if (!ok) falhas++;
};

console.log('='.repeat(66));
console.log('TESTE 1 — o modelo precisa REPRODUZIR o bug antigo');
console.log('='.repeat(66));
const antigo = await medir('ALGORITMO ANTIGO (contar → IA → inserir sem await)', requisicaoAntiga);
console.log('');
exigir('o modelo reproduz o estouro do limite (validação do próprio modelo)',
  antigo.rodadasComExcesso > 0, `${antigo.rodadasComExcesso} rodadas estouraram`);
exigir('o modelo reproduz vagas consumidas em duplicidade',
  antigo.totalDuplicadas > 0, `${antigo.totalDuplicadas} duplicações`);
exigir('o modelo reproduz o excesso de chamadas de IA pagas',
  antigo.piorIA > LIMITE, `até ${antigo.piorIA} chamadas onde cabiam ${LIMITE}`);

console.log(`\n${'='.repeat(66)}`);
console.log('TESTE 2 — a alternativa "await antes da IA" NÃO é suficiente');
console.log('='.repeat(66));
const intermediario = await medir('COM await, INSERT antes da IA (contar e inserir ainda separados)', requisicaoAwaitAntes);
console.log('');
exigir('continua ultrapassando o limite mesmo com await',
  intermediario.rodadasComExcesso > 0,
  `${intermediario.rodadasComExcesso}/${RODADAS} rodadas ainda estouram, até ${intermediario.piorAutorizadas} autorizadas`);
exigir('continua havendo vaga consumida em duplicidade',
  intermediario.totalDuplicadas > 0, `${intermediario.totalDuplicadas} duplicações`);
console.log('  -> por isso a correção NÃO foi feita por este caminho.');

console.log(`\n${'='.repeat(66)}`);
console.log('TESTE 3 — o algoritmo novo tem que segurar sob a mesma pressão');
console.log('='.repeat(66));
const novo = await medir('ALGORITMO NOVO (advisory lock → contar → inserir → commit → IA)', requisicaoNova);
console.log('');
exigir('nunca mais de N autorizadas', novo.piorAutorizadas === LIMITE, `máximo=${novo.piorAutorizadas}`);
exigir('nenhuma rodada ultrapassa o limite', novo.rodadasComExcesso === 0);
exigir('nenhuma vaga consumida duas vezes', novo.totalDuplicadas === 0);
exigir('contador final == número real de autorizadas', novo.divergenciaContador === 0);
exigir('requisição bloqueada nunca chama a IA', novo.iaEmBloqueada === 0);
exigir('chamadas de IA limitadas ao teto', novo.piorIA === LIMITE, `máximo=${novo.piorIA}`);

console.log(`\n${'='.repeat(66)}`);
console.log(falhas === 0
  ? 'RESULTADO: correção comprovada sob concorrência simulada.'
  : `RESULTADO: ${falhas} verificação(ões) falharam.`);
console.log('='.repeat(66));
process.exit(falhas === 0 ? 0 : 1);
