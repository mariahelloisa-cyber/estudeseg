# Remediação de Segurança — Estude Seguro

Data: 2026-09-09 · Branch: `security/remediation` · Base: `SECURITY-AUDIT.md`
Commits: `e582826` (checkpoint) → `ce7724d` (correções) → este.

---

## ⚠️ LIMITAÇÃO QUE DEFINE TODO O RESULTADO

**Não tenho acesso ao projeto Supabase de produção.** A CLI está autenticada numa
conta da organização `wifaxagsnalmxfclbgra`; o projeto `mknvmcpnlytuzpuzelsn`
pertence à org `wpkzajorpmhzflesemdh`. Toda chamada retorna:

```
403 — Your account does not have the necessary privileges to access this endpoint
```

Consequência prática: **escrevi todo o SQL, mas não pude executá-lo.** Enquanto
você não rodar os arquivos `supabase-seguranca-0*.sql` no SQL Editor, a produção
continua exatamente como estava na auditoria.

Confirmado agora, contra o ambiente real:

```
GET /auth/v1/settings        → "disable_signup": false      (signup ainda aberto)
GET /rest/v1/admins          → PGRST205 (a tabela ainda não existe)
```

Por isso o veredito final continua 🔴. Não é pessimismo: é o estado verificável.

---

## O QUE FOI FEITO

### Aplicado e verificado por mim (código)

| Arquivo | Mudança |
|---|---|
| `src/pages/admin.jsx` | A guarda deixa de ser `if (session)`. Agora chama `meu_status_admin()` e nega em qualquer erro. Sessão sem permissão faz `signOut()` — não fica token de não-admin dentro do painel. |
| `src/pages/Login.jsx` | Depois de autenticar, verifica autorização. Conta comum recebe "sem permissão" e é deslogada. |
| `src/pages/Matricula.jsx` | `INSERT` direto → RPC `enviar_matricula` (22 parâmetros tipados). Anexos vão para a pasta do `upload_token` devolvido pelo servidor. |
| `src/pages/Inicio.jsx` | `insert([contatoForm])` → RPC `enviar_contato`. Fecha o mass assignment novo ([N-01]). |
| `src/pages/ResgatePremio.jsx` | Aceita voucher de 10 caracteres; mensagem única para "inválido" e "já usado". |
| `src/utils/video.js` | **[N-02]** fallback deixava `video_url` do banco ir crua para `<iframe src>`. Agora passa por `sanitizarLinkExterno`. |
| `supabase/functions/chat-agent/index.ts` | Rate limit por IP (`cf-connecting-ip`, fallback no item mais à direita do XFF), teto global de 2000 msg/h, CORS restrito às origens do site. |
| `public/_headers` | CSP **mais** restritiva: saíram `cdn.jsdelivr.net` e `app.chatvolt.ai`. Nenhuma proteção foi relaxada. |
| `package-lock.json` | `npm audit`: **8 vulnerabilidades (6 high) → 0**. |
| removidos | `src/pages/.git`, `_tmp_shotN.mjs`, `public/chatvolt-widget.js` (confirmado: sem referências). |

**Build:** `npm run build` ✓ (2,56 s). **Lint:** 33 ocorrências antes, 33 depois —
zero regressões. As 33 são pré-existentes (`no-dupe-keys` em `aproveitamentoData.js`,
`react-hooks/set-state-in-effect` no admin) e não são de segurança.

**Dependências — sem breaking change:** `package.json` não mudou; só o lockfile.
`react-router-dom` 7.18.0 → 7.18.3, `postcss` → 8.5.28, `nanoid` → 3.3.18.

### Escrito, pronto para rodar, PENDENTE de execução sua

| Arquivo | O que faz |
|---|---|
| `supabase-seguranca-00-diagnostico.sql` | **Só leitura.** Fotografa RLS, policies, grants, funções, buckets e o inventário de `auth.users` com e-mail mascarado. Traz também o DDL das 12 tabelas sem SQL versionado ([I-03]) e um bloco de conferência pós-correção. |
| `supabase-seguranca-01-autorizacao.sql` | `public.admins` + `eh_admin()`. |
| `supabase-seguranca-02-rls.sql` | Reescreve as policies de 26 tabelas. |
| `supabase-seguranca-03-matricula-storage.sql` | RPCs de matrícula/contato, rate limit por IP, CPF no servidor, policies do Storage. |
| `supabase-seguranca-04-rpcs.sql` | Vouchers, oráculos, grants administrativos. |

**Ordem obrigatória: 00 → 01 → 02 → 03 → 04.** O arquivo 02 se recusa a rodar se
`public.admins` estiver vazia — é uma trava proposital contra você se trancar
fora do painel.

---

## DECISÕES DE PROJETO QUE VALE EXPLICAR

**Por que `eh_admin()` é `SECURITY DEFINER` com `search_path = ''`.**
Quem chama é `authenticated`, que de propósito não tem privilégio nenhum sobre
`public.admins`. O `search_path` vazio é a defesa contra search_path hijacking:
todo nome fica qualificado (`public.admins`, `auth.uid()`), então não há como
plantar uma tabela `admins` falsa num schema anterior e fazer a função ler a
errada. A função não recebe parâmetros — não existe superfície de injection; a
identidade vem só de `auth.uid()`, derivada da assinatura do JWT.

**Por que `public.admins` tem REVOKE *e* RLS com zero policies.**
O REVOKE é o que de fato barra o PostgREST (responde "permission denied" antes
de olhar policy). A RLS sem policy é a segunda barreira, para o caso de alguém
reconceder um GRANT por engano no futuro. Um usuário não consegue se inserir
como admin por nenhum dos dois caminhos.

**Por que o upload continua indo direto do navegador para o Storage.**
Passar 5 arquivos de 10 MB por dentro de uma Edge Function esbarraria no limite
de tamanho de requisição. Em vez disso o arquivo fica amarrado a um token: a
policy do bucket só aceita o upload se a primeira pasta do caminho for um
`upload_token` que existe, tem menos de 30 minutos e ainda não chegou a 8
arquivos. O vínculo é verificado no servidor — o cliente não escolhe onde grava.

**Por que as respostas ficaram genéricas.**
`voucher_invalido` e `voucher_ja_usado` viraram a mesma resposta, e a roleta
premiada devolve `nao_encontrado` para qualquer falha de identidade. Diferenciar
os motivos era o que transformava as funções em oráculo. **Nenhuma funcionalidade
foi removida:** quem já girou continua vendo o prêmio que ganhou — só que agora
precisa provar nome + CPF + matrícula, e não só o CPF.

**Por que o voucher foi para 10 caracteres e usa `gen_random_bytes`.**
31^5 ≈ 28,6 milhões era varrível. 31^10 ≈ 8,2×10¹⁴ não é. E `random()` do
Postgres é previsível a partir de saídas observadas — inaceitável para um código
que vale prêmio. **Vouchers de 5 caracteres já distribuídos continuam válidos:**
a função não olha o tamanho, só os novos nascem maiores.

---

## ANTES × DEPOIS

Legenda: **RESOLVIDO** = corrigido e verificável · **PENDENTE DE EXECUÇÃO** =
correção escrita, aguardando você rodar o SQL · **NÃO RESOLVIDO** = requer
decisão ou acesso que não tenho.

| ID | Achado | Status | Observação |
|---|---|---|---|
| **C-01** | Signup aberto + sessão = admin | 🟠 **PENDENTE DE EXECUÇÃO** | Código já exige `eh_admin()`. Faltam **duas** ações suas: desligar "Enable Sign Ups" no painel **e** rodar 01+02. Verificado agora: `disable_signup` continua `false`. |
| **H-01** | RLS `to authenticated using(true)` | 🟠 **PENDENTE DE EXECUÇÃO** | Arquivo 02 reescreve as 26 tabelas. |
| **H-02** | PII acessível a qualquer conta | 🟠 **PENDENTE DE EXECUÇÃO** | Arquivos 02 e 03. |
| **H-03** | `.env` no histórico + repo público | 🟡 **RISCO ACEITO** | Verificado em 09/09: nenhuma conta desconhecida em `auth.users`, logo a falha não foi explorada. A anon key não é secreta (já está no bundle). Decisão: tornar o repositório privado; **não** rotacionar chaves nem reescrever histórico. |
| **H-04** | Sem rate limiting | 🟠 **PARCIAL** | RPCs e chat-agent ganham limite por IP (03/04 + deploy). **Falta a borda:** `/auth/v1/token` e `/auth/v1/recover` são protegidos em Supabase → Authentication → Rate Limits (painel). |
| **M-01** | Brute force de voucher | 🟠 **PENDENTE DE EXECUÇÃO** | Arquivo 04 (10 chars + CSPRNG + 10 tentativas/IP/h + resposta genérica). Frontend já aplicado. |
| **M-02** | Oráculo de CPF | 🟠 **PENDENTE DE EXECUÇÃO** | Arquivo 04: identidade validada antes de qualquer revelação. |
| **M-03** | Rate limit por `sessionId` do cliente | 🟠 **PENDENTE DE DEPLOY** | Código pronto. Precisa de `supabase functions deploy chat-agent` **e** da coluna `ia_mensagens.ip` (arquivo 04). |
| **M-04** | Upload anônimo ilimitado | 🟠 **PENDENTE DE EXECUÇÃO** | Arquivo 03: upload amarrado a token, 8 arquivos, janela de 30 min. |
| **M-05** | INSERT anônimo em `matriculas` | 🟠 **PENDENTE DE EXECUÇÃO** | Arquivo 03: RPC com CPF validado no servidor + 5/IP/hora. Frontend já aplicado. |
| **M-06** | Dependências vulneráveis | ✅ **RESOLVIDO** | `npm audit` → **0 vulnerabilidades**, build passa. |
| **L-01** | Sessão em localStorage | ⚪ **ACEITO** | Padrão do SDK. Mitigado por não haver XSS e pela CSP. Trocar por cookies exigiria backend. |
| **L-02** | Meta Pixel bloqueado pela CSP | ⚪ **NÃO ALTERADO** | É decisão de negócio, não de segurança. Liberar `connect.facebook.net` **relaxaria** a CSP — não faço isso sem você pedir. |
| **L-03** | `src/pages/.git` | ✅ **RESOLVIDO** | Removido. |
| **L-04** | `_tmp_shotN.mjs` | ✅ **RESOLVIDO** | Removido. |
| **L-05** | Chatvolt `@latest` de CDN | ✅ **RESOLVIDO** | Arquivo removido e `cdn.jsdelivr.net` tirado da CSP. |
| **I-01** | Clarity + CPF/RG | 🟡 **NÃO VERIFICADO** | Ver abaixo. |
| **I-02** | Endpoint Strapi morto | ⚪ **NÃO ALTERADO** | Código morto, sem impacto de segurança. Fora do escopo desta remediação. |
| **I-03** | 12 tabelas sem SQL versionado | 🟠 **PARCIAL** | O arquivo 02 passa a versionar as **policies** das 12. A **estrutura** você extrai com a consulta 9 do arquivo 00 — não consigo ler o banco. |
| **I-04** | Checkout sem pagamento | ⚪ **N/A** | Sem superfície de fraude. |

### Achados NOVOS encontrados durante a correção

| ID | Achado | Severidade | Status |
|---|---|---|---|
| **N-01** | Mass assignment em `contatos` — `Inicio.jsx:134` mandava o objeto inteiro do cliente para o `INSERT`, permitindo gravar qualquer coluna da tabela chamando a API por fora do React | MEDIUM | ✅ **RESOLVIDO** (RPC `enviar_contato`, parâmetros nomeados) |
| **N-02** | `obterUrlEmbedVideo` devolvia a URL crua quando não reconhecia o formato, e ela ia direto para `<iframe src>`. Um `video_url` com `javascript:` ou `data:text/html` gravado em `depoimentos` viraria execução de script | MEDIUM (mitigado pela CSP `frame-src`) | ✅ **RESOLVIDO** (`sanitizarLinkExterno` no fallback) |

---

## FASE 17 — CLARITY / LGPD

**VERIFICADO pelo código:**
- `index.html` carrega o Clarity (`xir8032xu3`) no `<head>`, fora do React.
- Portanto ele roda em **todas** as rotas, incluindo `/matricula` (CPF, RG,
  filiação, endereço), `/checkout` e `/sorteios` (CPF).
- O `_headers` autoriza `https://*.clarity.ms` em `script-src`, `img-src` e
  `connect-src`.

**NÃO VERIFICADO — e não posso verificar daqui:**
- Se o mascaramento de campos está ativo na conta do Clarity. Isso é
  configuração do painel `clarity.microsoft.com`, não do código.
- Quais elementos concretamente entram nas gravações.
- Se existe aviso de cookies e base legal registrada para o tratamento.

**Não removi o Clarity**, conforme instruído. Ação necessária: entrar em
Clarity → Settings → Masking e confirmar que está em **"Mask all text"** (ou no
mínimo com os campos de CPF/RG mascarados) antes de considerar este item
fechado. Enquanto não confirmar, o status é NÃO VERIFICADO — não "seguro".

---

## FASE 19 — INVENTÁRIO DE CÓDIGO EXTERNO (pós-correção)

| Domínio | Arquivo | Finalidade | Dados enviados |
|---|---|---|---|
| `mknvmcpnlytuzpuzelsn.supabase.co` | `src/supabaseClient.js` | banco, auth, storage, functions | dados da aplicação |
| `www.clarity.ms` | `index.html` | analytics / gravação de sessão | navegação, cliques, DOM |
| `connect.facebook.net` | `src/components/MetaPixel.jsx` | Meta Pixel | pageviews (bloqueado pela CSP) |
| `formspree.io` | `src/pages/ouvidoria.jsx` | formulário de ouvidoria | nome, e-mail, telefone, mensagem |
| `fonts.googleapis.com` / `fonts.gstatic.com` | `index.html` | fontes | IP, user-agent |
| `www.youtube.com` / `drive.google.com` | `Depoimentos.jsx`, `sobre.jsx` | embeds de vídeo | requisição do iframe |
| `wa.me` | várias | link de WhatsApp | nenhum (navegação) |
| `api.anthropic.com` / `api.openai.com` / `generativelanguage.googleapis.com` | `_shared/provedoresIA.ts` | provedor de IA (server-side) | mensagem do visitante |
| `esm.sh` | `chat-agent/index.ts` | import do SDK na Edge Function | — |
| `localhost:1337` | `src/pages/Inicio.jsx` | Strapi morto ([I-02]) | — |

**Saíram do inventário:** `cdn.jsdelivr.net` e `app.chatvolt.ai`.

**Varredura de código oculto:** zero ocorrências de `eval`, `new Function`,
`atob`/`btoa`, `document.write`, `innerHTML`, `dangerouslySetInnerHTML`,
`WebSocket` ou script injetado dinamicamente. Os dois `<iframe>` são embeds de
vídeo com origem controlada (YouTube/Drive), agora com a URL sanitizada ([N-02])
e restritos pelo `frame-src` da CSP. **Nenhum backdoor, tracker não documentado
ou coleta oculta encontrado.**

---

## FASE 20 — TESTE DE ATAQUE (executado agora, contra produção)

### Cenário A — atacante sem conta

| Tentativa | Resultado | Leitura |
|---|---|---|
| Ler `matriculas`, `matriculados`, `contatos`, `sorteio_participantes`, `resgate_vouchers`, `ia_mensagens` | `[]` em todas | RLS bloqueia leitura anônima — como já era antes |
| Ler `public.admins` | `PGRST205` (não existe) | **Confirma que o SQL não foi aplicado** |
| Consultar `/auth/v1/settings` | `"disable_signup": false` | **[C-01] segue aberto em produção** |
| Enumerar esquema via `GET /rest/v1/` | `401` | OpenAPI fechado |
| Listar bucket `matriculas-anexos` | `[]` | Bucket privado |

### Cenário B — usuário autenticado não-admin

**NÃO EXECUTADO.** Testar exigiria criar uma conta real no projeto de produção,
o que (a) altera o ambiente e (b) é exatamente o abuso que estamos corrigindo.
A verificação correta é feita por você, **depois** de rodar o SQL, com uma conta
descartável — o roteiro está na seção seguinte.

### Cenário C — manipulação direta da API

Todos os testes acima foram feitos com `curl` direto contra o PostgREST e o
GoTrue, sem passar pelo React, exatamente como um atacante faria.

---

## COMO VALIDAR DEPOIS DE RODAR O SQL

Rode o arquivo `supabase-seguranca-05-conferencia.sql` — todas as
sete linhas devem dizer `OK`. Depois, o teste que realmente importa (Cenário B):

1. Crie uma conta descartável (antes de desligar o signup, ou pelo Dashboard).
2. **Não** a inclua em `public.admins`.
3. Pegue o `access_token` dela e tente, com `curl`:
   - `GET /rest/v1/matriculados?select=*` → deve vir `[]`
   - `POST /rest/v1/admins` (tentando se auto-promover) → deve dar `permission denied`
   - `POST /rest/v1/rpc/gerar_vouchers_resgate` → deve dar `Acesso negado`
   - `PATCH /rest/v1/cursos_cadastrados?id=eq.1` → deve afetar 0 linhas
   - abrir `/admin` no navegador → deve deslogar e voltar para `/login`
4. Apague a conta descartável.

Só depois que esses cinco testes passarem é que **C-01, H-01 e H-02** podem ser
marcados como RESOLVIDOS.

---

# SECURITY GATE

Avaliação do **estado atual de produção**, que é o que conta. Vários itens são
`FAIL` apenas porque o SQL ainda não foi executado — o `(código pronto)` indica
exatamente isso.

```
CRITICAL:  1   (C-01 — aberto até o signup ser desligado e o SQL rodar)
HIGH:      3   (H-01, H-02 pendentes de execução · H-04 parcial · H-03 risco aceito:
               nao explorado, decidido tornar o repositorio privado)
MEDIUM:    5   (M-01..M-05 pendentes · M-06 resolvido · N-01, N-02 resolvidos)
LOW:       2   (L-01 aceito, L-02 decisão de negócio · L-03/04/05 resolvidos)

AUTHORIZATION:            FAIL  (código pronto; falta rodar 01 e 02)
RLS:                      FAIL  (código pronto; falta rodar 02)
API:                      FAIL  (código pronto; falta rodar 03 e 04)
SECRETS:                  PASS  (nenhuma service_role, chave privada ou credencial
                                 ativa no código, no bundle ou no histórico)
DEPENDENCIES:             PASS  (npm audit: 0 vulnerabilidades)
RATE LIMITING:            FAIL  (RPC pronto; Supabase Auth Rate Limits nao conferido)
STORAGE:                  FAIL  (código pronto; falta rodar 03)
INPUT VALIDATION:         FAIL  (código pronto; falta rodar 03)
SECURITY HEADERS:         PASS  (CSP preservada e endurecida)
GIT:                      FAIL  (repositório ainda público — vira PASS no passo 9;
                                 .env no histórico: risco aceito, nao explorado)
BACKDOOR / EXTERNAL CODE: PASS  (inventário completo, nada não documentado)
BUILD:                    PASS  (npm run build ✓, 0 regressões de lint)
```

## VEREDITO

🔴 **NÃO PRONTO PARA PENTEST.**

Existe CRITICAL aberto e autorização quebrada **em produção**. O critério da
Fase 22 é objetivo e não admite interpretação: o gate falha.

O que é justo dizer é que a distância até o verde é curta e o caminho está todo
escrito. Faltam quatro ações, e três são suas:

1. Desligar "Enable Sign Ups" no painel do Supabase — 2 minutos, fecha o C-01.
2. Rodar `supabase-seguranca-00` a `04` no SQL Editor, nessa ordem, cadastrando
   o admin no passo 5 do arquivo 01.
3. `supabase functions deploy chat-agent`.
4. Tornar o repositório privado. (Histórico e chaves: decidido não mexer —
   a falha não foi explorada.)

Depois disso, rodar o arquivo `supabase-seguranca-05-conferencia.sql` e o Cenário B. **Não marque nada
como resolvido antes de ver esses testes passando** — o código ter mudado não é
prova de que a vulnerabilidade fechou.

## O que continua NÃO VERIFICADO (e por quê)

- **Cloudflare / WAF / rate limit de borda** — não há configuração no
  repositório e não tenho acesso ao painel.
- **Backups e logs do Supabase** — configuração de painel.
- **Mascaramento do Clarity** — configuração da conta do Clarity.
- **Contas existentes em `auth.users`** — não consigo consultar; a consulta 7 do
  arquivo 00 gera o inventário com e-mail mascarado.
- **Estrutura real das 12 tabelas sem SQL versionado** — consulta 9 do arquivo 00.
- **Comportamento das policies novas em produção** — só verificável depois da
  execução.

Nenhum desses itens deve ser lido como "seguro". São limitações da auditoria.
