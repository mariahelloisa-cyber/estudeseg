# Auditoria de Segurança — Estude Seguro

Data: 2026-09-09 · Escopo: repositório `estudeseg` (branch `main`) + projeto Supabase `mknvmcpnlytuzpuzelsn`
**Nenhum código foi alterado nesta fase.**

## RESUMO EXECUTIVO

**Estado geral: 🔴 NÃO PRONTO PARA PRODUÇÃO**

O modelo de autorização inteiro da aplicação é "possui uma sessão Supabase = é administrador".
O cadastro público de usuários está **HABILITADO** no projeto Supabase em produção
(`/auth/v1/settings` → `disable_signup: false`, provider `email: true`), e o repositório
GitHub é **público**, expondo URL do projeto, anon key e o esquema completo do banco.

Consequência: qualquer pessoa na internet pode criar uma conta com um e-mail próprio,
confirmá-la, entrar em `/admin` e ler/alterar/apagar todos os dados — incluindo
CPF, RG, endereço, telefone, e-mail e documentos digitalizados de matrículas.

## ESTATÍSTICAS

| Severidade | Qtd |
|---|---|
| CRITICAL | 1 |
| HIGH | 4 |
| MEDIUM | 6 |
| LOW | 5 |
| INFORMATIONAL | 4 |

## TOP 10 RISCOS

1. [C-01] Cadastro público habilitado + `authenticated` = admin → tomada total do painel
2. [H-01] RLS de todas as tabelas usa `to authenticated using(true)` — não há papel de admin
3. [H-02] PII sensível (CPF/RG/anexos) acessível a qualquer conta criada
4. [H-03] Repositório público com esquema e RPCs; `.env` ainda no histórico Git
5. [H-04] Ausência total de rate limiting nas RPCs anônimas (comprovado)
6. [M-01] Brute force de vouchers de 5 caracteres via RPC anônima
7. [M-02] `girar_roleta_premiada` é oráculo de CPF (revela participação e prêmio só com CPF)
8. [M-03] Rate limit do chat-agent baseado em `sessionId` do cliente → custo de IA ilimitado
9. [M-04] Upload anônimo ilimitado no bucket `matriculas-anexos`
10. [M-05] Insert anônimo ilimitado em `matriculas` (spam/poluição, sem captcha)

---

## 1. ARQUITETURA (arquivos analisados)

| Camada | Tecnologia | Evidência |
|---|---|---|
| Frontend | React 19 + Vite 8 + React Router 7 + Tailwind 4 + Zustand | `package.json`, `vite.config.js` |
| Backend | Nenhum servidor próprio — BaaS | — |
| Banco | Supabase Postgres (projeto `mknvmcpnlytuzpuzelsn`) | `supabase/config.toml`, `.env` |
| API | PostgREST (`/rest/v1`) + RPC + GoTrue (`/auth/v1`) + Storage | `src/supabaseClient.js` |
| Auth | Supabase Auth, e-mail+senha, sessão em localStorage (padrão do SDK) | `src/pages/Login.jsx` |
| Autorização | **Inexistente além de "tem sessão"** | `src/pages/admin.jsx:471-497` |
| Serverless | 1 Edge Function Deno: `chat-agent` | `supabase/functions/chat-agent/index.ts` |
| Storage | buckets `banners` (público) e `matriculas-anexos` (privado) | testado via API |
| Deploy | Estático com `_headers`/`_redirects` (Cloudflare Pages / Netlify) | `public/_headers`, `public/_redirects` |
| Terceiros | Microsoft Clarity, Meta Pixel, Formspree, Chatvolt, Anthropic/OpenAI/Gemini | ver seção 15 |

Arquivos lidos integralmente: `package.json`, `vite.config.js`, `index.html`, `public/_headers`,
`public/_redirects`, `public/chatvolt-widget.js`, `.env` (apenas nomes), `.gitignore`,
`src/supabaseClient.js`, `src/App.jsx`, `src/main.jsx`, `src/pages/Login.jsx`,
`src/pages/Matricula.jsx`, `src/pages/Checkout.jsx`, `src/pages/ouvidoria.jsx`,
`src/components/MetaPixel.jsx`, `src/components/ChatWidget.jsx`, `src/store/cartStore.js`,
`src/utils/linkSeguro.js`, `src/utils/camposAluno.js`, `supabase/functions/**`,
`supabase-*.sql` (atuais e recuperados do histórico Git), `dist/assets/index-*.js` (varredura).

Lido parcialmente (6.828 linhas): `src/pages/admin.jsx` — cabeçalho, guarda de sessão,
validações de upload e todas as chamadas a Storage/Supabase, via grep dirigido.

## 2. SUPERFÍCIE DE ATAQUE

### Rotas
Públicas: `/`, `/blog`, `/blog/:id`, `/faq`, `/validacaoRastreio`, `/sobre`, `/cursos`,
`/cursos/:id`, `/depoimentos`, `/checkout`, `/matricula`, `/sorteios`, `/resgate-premio`, `/login`.
"Privada": `/admin` — protegida **apenas no cliente**.
Rotas comentadas mas com código presente: `/vagas`, `/ouvidoria`.

### Entradas externas

| Entrada | Quem acessa | Validação | Autorização |
|---|---|---|---|
| Formulário `/matricula` (23 campos + anexos) | anônimo | CPF e MIME/10MB no cliente; MIME/tamanho também no bucket | insert liberado a `anon` |
| Upload `matriculas-anexos` | anônimo | MIME/size pelo bucket | insert liberado a `anon`, sem limite |
| RPC `girar_roleta_premiada(nome,cpf,matrícula)` | anônimo | no servidor (nome+cpf+matrícula+status=7) | `grant execute to anon` |
| RPC `girar_roleta_resgate(nome,código,funcionário)` | anônimo | no servidor | `grant execute to anon` |
| RPC `buscar_status_matricula(nome,cpf,nascimento)` | anônimo | no servidor, exige as 3 credenciais | `grant execute to anon` |
| RPC `gerar_vouchers_resgate(qtd)` | autenticado | 1..200 | `authenticated` (= qualquer conta) |
| POST `functions/v1/chat-agent` | anônimo | 500 chars, histórico de 6 msgs | anon key |
| `/auth/v1/signup` | **anônimo — ABERTO** | — | — |
| Formulário `/ouvidoria` → Formspree | anônimo | nenhuma | — |
| localStorage `meu-carrinho-cursos` | usuário local | nenhuma | — |
| Todo o painel `/admin` (CRUD de 26 tabelas + uploads) | qualquer sessão | validações só no cliente | `using(true)` |

---

## 3–4. ACHADOS

### [C-01] Cadastro público aberto transforma qualquer pessoa em administrador

- **Severidade:** CRITICAL · **Categoria:** Broken Access Control / Vertical Privilege Escalation
- **Arquivos:** `src/pages/admin.jsx:471-497`; todos os `supabase-*.sql`; configuração do projeto Supabase
- **Descrição:** a guarda do painel é `supabase.auth.getSession()` → se existe sessão,
  `setModoAdmin(true)`. Não há verificação de papel, lista de e-mails permitidos, claim
  customizada ou tabela `admins`. No banco, todas as policies concedem tudo ao papel
  `authenticated`. E o cadastro público está habilitado no projeto.
- **Evidência (verificada ao vivo, somente leitura):**
  `GET https://<projeto>.supabase.co/auth/v1/settings` →
  `{"external":{"email":true,...},"disable_signup":false,"mailer_autoconfirm":false}`.
  Repositório GitHub `mariahelloisa-cyber/estudeseg` → `"private": false`.
- **Cenário de exploração:** o atacante lê a anon key no bundle público (ou no repositório) →
  `POST /auth/v1/signup` com um e-mail próprio → confirma pelo próprio inbox →
  `POST /auth/v1/token?grant_type=password` → recebe JWT com `role: authenticated` →
  acessa `/admin` ou fala direto com o PostgREST. `GET /rest/v1/matriculados?select=*`
  devolve CPF, RG, filiação, endereço, telefone e e-mail de todos os alunos;
  `createSignedUrl` nos anexos entrega os documentos digitalizados; `DELETE` apaga tudo.
- **Impacto:** comprometimento total de confidencialidade, integridade e disponibilidade.
  Vazamento de dados pessoais sensíveis (LGPD, arts. 46/48 — dever de notificação à ANPD
  e aos titulares).
- **Risco residual após correção:** contas criadas indevidamente antes da correção — é preciso
  auditar `auth.users` e remover qualquer usuário não reconhecido.

> Não cadastrei um usuário de teste porque isso alteraria o ambiente de produção.
> A prova é a configuração do próprio servidor (`disable_signup: false`), que é conclusiva.

### [H-01] Nenhuma separação entre "usuário autenticado" e "administrador"

- **Severidade:** HIGH · **Categoria:** Broken Access Control
- **Evidência:** `supabase-resgate-premio-setup.sql`
  (`for all to authenticated using (true) with check (true)`, repetido em 4 tabelas),
  `supabase-matriculados-setup.sql`, `supabase-configuracoes-setup.sql`,
  `supabase-sorteios-menu-setup.sql`, `supabase-sorteio-premiada-setup.sql`.
- **Impacto:** mesmo depois de fechar o cadastro público, no dia em que a aplicação ganhar
  uma área logada de aluno, todo aluno vira administrador. A falha é estrutural.

### [H-02] PII sensível sem controle de acesso granular

- **Severidade:** HIGH · **Categoria:** Sensitive Data Exposure
- **Tabelas:** `matriculas`, `matriculados` (CPF, RG, órgão emissor, filiação, endereço completo,
  telefone, e-mail, anexos), `sorteio_participantes` (nome, CPF, IP, user-agent), `contatos`.
- **Verificado:** a leitura anônima está corretamente bloqueada (retorno `[]` para `anon`).
  O problema é o acesso irrestrito de qualquer `authenticated` e a ausência de log de acesso.

### [H-03] Repositório público e `.env` ainda presente no histórico Git

- **Severidade:** HIGH pelo contexto · **Categoria:** Information Disclosure
- **Evidência:** o commit `3380a06` contém `.env` com `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_ANON_KEY`; o commit `a1c7095` contém `.env` com `VITE_API_URL`.
  O commit `129ca2c` ("security: remover .env do historico") apagou apenas a versão atual —
  **o histórico não foi reescrito** e os blobs continuam acessíveis (`git show 3380a06:.env` funciona).
- **Impacto:** a anon key é pública por design e não é, sozinha, uma vulnerabilidade. O problema
  é que o repositório público entrega o project ref, o esquema completo, as assinaturas das RPCs
  e a lógica de negócio — reduzindo a zero o custo de descoberta do [C-01]. E a limpeza que a
  equipe acredita ter feito não aconteceu de fato.

### [H-04] Ausência total de rate limiting (comprovado)

- **Severidade:** HIGH · **Categoria:** Abuse / DoS / Enumeration
- **Evidência:** 10 chamadas consecutivas a `POST /rest/v1/rpc/girar_roleta_resgate` como `anon`
  retornaram HTTP 200 em ~0,2 s cada, sem qualquer throttling.
- **Endpoints afetados:** `/auth/v1/token` (brute force da senha do admin), `/auth/v1/recover`
  (abuso de envio de e-mail), as 3 RPCs anônimas, insert em `matriculas`, upload de anexos,
  `functions/v1/chat-agent`.

### [M-01] Brute force de vouchers de resgate

Código de 5 caracteres num alfabeto de 31 (`31^5 ≈ 28,6 milhões`), validado por RPC anônima sem
rate limiting. Com N vouchers válidos em circulação, o esforço esperado por acerto cai para
~28,6M/N requisições — a ~50 req/s, ordem de horas para uma campanha com algumas centenas de
vouchers. A função ainda distingue `voucher_invalido` de `voucher_ja_usado`, servindo de oráculo.

- **Impacto:** prêmios de terceiros queimados; relatório de indicações corrompido.
- **Arquivo:** `supabase-resgate-premio-setup.sql`, função `girar_roleta_resgate`.

### [M-02] `girar_roleta_premiada` é oráculo de CPF

A verificação "já participou?" acontece **antes** da verificação de identidade e usa **apenas o CPF**.
Enviando qualquer nome com um CPF real, o retorno `ja_participou` devolve o prêmio, o tipo,
o percentual de cashback e a data do sorteio daquela pessoa.

- **Impacto:** confirma que um CPF pertence a um aluno certificado da instituição e revela seu prêmio.
- **Arquivo:** `supabase-sorteio-premiada-setup.sql`, passo 1 da função.

### [M-03] Rate limit da Edge Function é controlado pelo cliente

`supabase/functions/chat-agent/index.ts:118-133` — o limite de 8 mensagens/minuto é contado por
`sessao_id` **enviado no corpo da requisição**. Gerar um UUID novo a cada chamada zera o contador.

- **Impacto:** consumo ilimitado da API paga de IA por qualquer visitante; crescimento ilimitado
  de `ia_mensagens`. Custo financeiro direto.

### [M-04] Upload anônimo ilimitado no bucket privado

`supabase-matriculas-setup.sql`: `create policy "Qualquer um pode enviar anexo de matricula"
on storage.objects for insert to anon with check (bucket_id = 'matriculas-anexos')` — sem vínculo
com uma matrícula e sem limite de quantidade.

- **Mitigado por:** bucket privado, `allowed_mime_types` restrito a PNG/JPEG/WebP/PDF, teto de
  10 MB por arquivo, e nome de arquivo substituído por `crypto.randomUUID()` no cliente
  (elimina path traversal via nome de arquivo).
- **Risco remanescente:** enchimento de storage (custo); o atacante pode escolher a chave do objeto
  chamando a API diretamente — o UUID é aplicado só no cliente.

### [M-05] Insert anônimo em `matriculas` sem captcha nem rate limit

Qualquer um pode injetar matrículas falsas em massa (`with check (true)` para `anon`).
Nenhum campo é validado no servidor — inclusive o CPF, cuja validação existe só no cliente
(`src/pages/Matricula.jsx:94`) e é trivialmente ignorada falando direto com a API.

- **Impacto:** poluição da base, DoS operacional da equipe, custo de storage.

### [M-06] Dependências com vulnerabilidades conhecidas

`npm audit`: **8 vulnerabilidades (6 high, 2 moderate)**

| Pacote | Sev. | Problema |
|---|---|---|
| `react-router` 7.12–7.18.1 | high | GHSA-qwww-vcr4-c8h2 — bypass de CSRF em modo RSC |
| `postcss` ≤8.5.22 | high | GHSA-fxqj-rqcc-2cmp / GHSA-r28c-9q8g-f849 — path traversal via sourceMappingURL |
| `nanoid` ≤3.3.17 | high | GHSA-28wg-ghj8-5hjv / GHSA-2v37-7h3g-55p8 — loop infinito |
| `brace-expansion` | high | 3 avisos de DoS |
| `@tailwindcss/postcss`, `baseline-browser-mapping` | moderate | transitivas |

Só `react-router` é exposto em runtime no navegador (o modo RSC não é usado aqui, o que reduz o
impacto prático); as demais são de build. `npm audit fix` resolve todas.

### [L-01] Sessão em localStorage

Padrão do `@supabase/supabase-js`. Aceitável dado que não encontrei XSS, mas significa que
**qualquer XSS futuro rouba a sessão de admin**. Sem `HttpOnly`, sem `SameSite`.

### [L-02] Meta Pixel bloqueado pela própria CSP

`connect.facebook.net` e `facebook.com` não constam em `script-src`/`img-src`/`connect-src`
do `public/_headers`, enquanto `src/components/MetaPixel.jsx` tenta injetar `fbevents.js`.
O pixel provavelmente não funciona em produção. Não é risco — é inconsistência a decidir.

### [L-03] Repositório Git aninhado esquecido em `src/pages/.git`

Repositório independente (commit `5d3e2b3 matricula`) dentro do código-fonte. Não é servido
pelo build, mas confunde ferramentas e pode conter versões antigas de arquivos.

### [L-04] Arquivo de desenvolvimento versionado

`_tmp_shotN.mjs` (script Playwright com caminhos locais da máquina do desenvolvedor) na raiz
de um repositório público — vazamento menor de informação de ambiente.

### [L-05] `chatvolt-widget.js` importa `@latest` de CDN

`public/chatvolt-widget.js` faz `import('https://cdn.jsdelivr.net/npm/@chatvolt/embeds@latest/...')`
— versão não fixada, código de terceiro com acesso total ao DOM, permitido pela CSP
(`script-src ... https://cdn.jsdelivr.net`). Hoje o arquivo **não é referenciado** por nenhuma
página (o chat em uso é o próprio `ChatWidget.jsx`), então o risco está dormente.

### [I-01] Microsoft Clarity com gravação de sessão em site que coleta CPF/RG

`index.html` carrega Clarity (`xir8032xu3`) globalmente — inclusive em `/matricula` e `/checkout`.
O Clarity mascara campos por padrão, mas isso **não foi verificado** na configuração da conta.
Ponto de atenção de LGPD.

### [I-02] Endpoint fantasma de Strapi

`src/pages/Inicio.jsx:25,459` — `import.meta.env.VITE_API_URL || 'http://localhost:1337'`.
Em produção a variável não existe, gerando requisições a `localhost:1337` que sempre falham.

### [I-03] Vários painéis do admin sem SQL versionado

O `admin.jsx` usa 26 tabelas, mas só encontrei SQL (atual ou no histórico) para 14.
Não há arquivo de setup para `banners`, `cursos_cadastrados`, `categorias_cursos`, `depoimentos`,
`faqs`, `noticias`, `selos`, `frases`, `diferenciais`, `vagas`, `contatos`, `popups`.
**Não foi possível verificar** as policies dessas tabelas nem as do bucket `banners` sem acesso
ao painel Supabase.

### [I-04] Checkout não processa pagamento

`src/pages/Checkout.jsx:34-47` apenas exibe um `alert()` de sucesso e limpa o carrinho.
Nenhum dado de pagamento é coletado ou transmitido — não há superfície de fraude de valores hoje.

---

## 5. RLS POR TABELA (verificado ao vivo como `anon` + leitura do SQL)

| Tabela | RLS | SELECT anon | Escrita anon | Escrita authenticated |
|---|---|---|---|---|
| matriculas | ✅ | ❌ bloqueado (`[]`) | **INSERT liberado** | select/delete `true` |
| matriculados | ✅ | ❌ bloqueado | ❌ | tudo `true` |
| sorteio_participantes | ✅ | ❌ bloqueado | ❌ (só via RPC) | select/update `true` |
| resgate_vouchers | ✅ | ❌ bloqueado | ❌ (só via RPC) | tudo `true` |
| ia_mensagens | ✅ | ❌ bloqueado | ❌ | select `true` |
| contatos / popups / vagas | ✅ | ❌ bloqueado | ❌ | não verificado |
| configuracoes | ✅ | ✅ (por design) | ❌ | insert/update `true` |
| cursos_cadastrados, banners, categorias_cursos, depoimentos, faqs, noticias, selos, frases, diferenciais, trajetoria, redes_sociais, sorteios, sorteio_premios, sorteio_banners, resgate_premios, resgate_funcionarios, resgate_banners | ✅ | ✅ (conteúdo público, correto) | ❌ | `true` |

Buckets: `banners` público e listável por `anon` (esperado); `matriculas-anexos` privado,
listagem anônima retorna `[]` (correto).

---

## 6–12. DEMAIS ÁREAS

- **Injection (VERIFICADO):** nenhuma concatenação de SQL. Todo acesso passa por PostgREST
  parametrizado ou por funções plpgsql com parâmetros tipados; todas usam `set search_path = public`
  (protege `security definer` contra search_path hijacking). Nenhum `format()`/`execute` dinâmico.
  Sem command injection, LDAP, template injection ou SSRF — não há servidor próprio que faça
  requisições a URLs controladas pelo usuário.
- **XSS (VERIFICADO):** zero ocorrências de `dangerouslySetInnerHTML`, `innerHTML`, `eval`,
  `new Function` ou `document.write` em todo o `src/`. O renderizador de negrito do chat
  (`ChatWidget.jsx:21-31`) usa `split` + elementos React — seguro. `sanitizarLinkExterno`
  bloqueia `javascript:`. **Não encontrei XSS armazenado, refletido ou DOM.**
- **CSRF (NÃO APLICÁVEL na prática):** autenticação por Bearer token em header, não por cookie.
  O aviso do `react-router` (GHSA-qwww-vcr4-c8h2) só afeta o modo RSC, não usado aqui.
- **CORS:** a Edge Function `chat-agent` usa `Access-Control-Allow-Origin: *` (`index.ts:18`)
  sem `Allow-Credentials` — aceitável para um endpoint público, mas restringir ao domínio do site
  elimina o uso do endpoint (e do orçamento de IA) por sites terceiros.
- **Security headers (VERIFICADO, bom):** `public/_headers` traz CSP restritiva com
  `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, além de HSTS com preload,
  `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP e CORP.
  É o ponto mais forte do projeto. `dist/_headers` é idêntico ao de `public/`.
- **Source maps (VERIFICADO):** nenhum `.map` em `dist/`, nenhum `sourceMappingURL`.
  O bundle contém apenas a anon key (`role: anon`) — **nenhuma service_role key vazada**.
- **OpenAPI do PostgREST:** `GET /rest/v1/` retorna 401 — o esquema não é enumerável pela API. Bom.
- **Error handling:** erros do Supabase caem em `console.error` e a UI mostra mensagens genéricas.
  `Login.jsx:64` normaliza o erro para "Credenciais inválidas", evitando enumeração de usuários
  pela tela. O GoTrue continua enumerável pelo endpoint direto (fora do controle da aplicação).
- **Cloudflare (NÃO VERIFICADO):** não há `wrangler.toml`, Workers nem IaC no repositório.
  O par `_headers`/`_redirects` indica Pages ou Netlify. WAF, rate limiting de borda, TLS e
  regras de cache não puderam ser inspecionados a partir do código.
- **Backups / logs (NÃO VERIFICADO):** definidos no painel Supabase, fora do repositório.
- **MFA / OAuth / magic link (NÃO APLICÁVEL):** desabilitados — todos os providers externos
  retornam `false` em `/auth/v1/settings`; `passkeys_enabled: false`. Só e-mail+senha.
- **Backdoors / código ofuscado (VERIFICADO):** nenhuma ofuscação, `atob`/`btoa`, script carregado
  dinamicamente ou domínio não documentado. Nenhum indício de coleta de dados oculta.

---

## 15. COMUNICAÇÕES EXTERNAS

| Domínio | Arquivo | Finalidade | Dados enviados |
|---|---|---|---|
| `mknvmcpnlytuzpuzelsn.supabase.co` | `src/supabaseClient.js` | banco, auth, storage, functions | todos os dados da aplicação |
| `www.clarity.ms` | `index.html:13-18` | analytics / gravação de sessão | navegação, cliques, DOM da página |
| `connect.facebook.net`, `facebook.com/tr` | `src/components/MetaPixel.jsx` | Meta Pixel (ads) | pageviews (bloqueado pela CSP atual) |
| `formspree.io/f/xpqgwjdr` | `src/pages/ouvidoria.jsx:30` | envio do formulário de ouvidoria | nome, e-mail, telefone, mensagem |
| `cdn.jsdelivr.net` | `public/chatvolt-widget.js` | widget Chatvolt `@latest` | — (arquivo não referenciado hoje) |
| `fonts.googleapis.com` / `fonts.gstatic.com` | `index.html` | fontes | IP, user-agent |
| `api.anthropic.com` / `api.openai.com` / `generativelanguage.googleapis.com` | `supabase/functions/_shared/provedoresIA.ts` | provedor de IA (server-side) | mensagem do visitante + prompt |
| `esm.sh` | `supabase/functions/chat-agent/index.ts:12` | import do SDK na Edge Function | — |
| `localhost:1337` | `src/pages/Inicio.jsx:25` | Strapi morto | — |

## 14. SECRETS (tipo + localização + severidade — valores nunca impressos)

| Tipo | Localização | Severidade |
|---|---|---|
| Supabase anon key (JWT, `role: anon`) | `.env`, `dist/assets/index-*.js`, histórico Git (`3380a06`) | LOW — pública por design, mas ver [H-03] |
| Supabase URL / project ref | `.env`, `supabase/config.toml`, `supabase/.temp/*`, `public/_headers`, repositório público | INFORMATIONAL |
| Pooler URL do Postgres | `supabase/.temp/pooler-url` (não versionado) | INFORMATIONAL — confirmar que nunca seja commitado |
| `SUPABASE_SERVICE_ROLE_KEY` | referenciada por nome em `chat-agent/index.ts`; **valor não está no repositório** | OK |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` | referenciadas por nome; valores só nas variáveis da Edge Function | OK |
| Chatvolt `agentId` | `public/chatvolt-widget.js` | INFORMATIONAL — identificador público |
| Formspree form id | `src/pages/ouvidoria.jsx` | INFORMATIONAL — público por design |
| Clarity project id | `index.html` | INFORMATIONAL |

Nenhuma service_role key, chave privada, credencial de banco, token de GitHub/Cloudflare ou
credencial SMTP foi encontrada no código, no build ou no histórico Git.

---

## CHECKLIST OWASP TOP 10 (2021)

| # | Categoria | Situação |
|---|---|---|
| A01 | Broken Access Control | 🔴 **[C-01] [H-01] [H-02]** |
| A02 | Cryptographic Failures | 🟠 PII sem criptografia além do padrão do Supabase; sessão em localStorage |
| A03 | Injection | 🟢 nenhum vetor encontrado |
| A04 | Insecure Design | 🟠 sem papel de admin no modelo; validações críticas só no cliente |
| A05 | Security Misconfiguration | 🔴 signup aberto; repositório público; CORS `*` na função |
| A06 | Vulnerable Components | 🟠 8 avisos do `npm audit`, 6 high |
| A07 | Identification & Auth Failures | 🔴 sem MFA, sem rate limit no login, cadastro aberto |
| A08 | Software/Data Integrity | 🟡 sem SRI no widget de CDN `@latest` (dormente) |
| A09 | Logging & Monitoring | 🟠 sem log de acesso a PII, sem alerta de novo usuário |
| A10 | SSRF | 🟢 não aplicável |

## CHECKLIST DE PRODUÇÃO

- [x] HTTPS / HSTS
- [ ] **Auth** — cadastro público aberto, sem MFA, sem rate limit
- [ ] **Authorization** — inexistente
- [~] RLS — habilitada em todas as tabelas verificadas, mas com policies permissivas
- [ ] API security — sem rate limiting
- [ ] Input validation — só no cliente
- [x] XSS
- [x] Injection
- [x] CSRF (não aplicável — Bearer token)
- [~] CORS — `*` na Edge Function
- [~] Cookies — não usados; sessão em localStorage
- [ ] Rate limiting
- [x] Security headers
- [~] Secrets — sem vazamento crítico, mas `.env` continua no histórico
- [ ] Dependencies — 6 high pendentes
- [~] Uploads — MIME/tamanho validados; sem limite de volume
- [x] Error handling
- [x] Source maps
- [ ] **Git history** — `.env` não foi removido de fato; repositório público
- [ ] Cloudflare — não verificável pelo repositório
- [ ] Logs — não verificável
- [ ] Backups — não verificável

---

## PLANO DE CORREÇÃO (aguardando autorização — nada foi alterado)

### Fase 0 — Contenção, hoje, sem tocar em código (~15 min, no painel Supabase/GitHub)

1. **Supabase → Authentication → Providers → Email: desligar "Enable Sign Ups".**
   Isso fecha o [C-01] imediatamente. Contas de admin passam a ser criadas só pelo painel.
2. **Auditar `auth.users`** e apagar qualquer conta que não seja de um administrador conhecido.
3. **Tornar o repositório GitHub privado.**
4. Trocar a senha da(s) conta(s) de administrador e ativar MFA no Supabase Dashboard.

### Fase 1 — Autorização de verdade (a correção estrutural)

5. Criar tabela `public.admins (user_id uuid primary key references auth.users)` e a função
   `public.eh_admin() returns boolean language sql security definer stable
   as $$ select exists(select 1 from public.admins where user_id = auth.uid()) $$`.
6. Reescrever **todas** as policies: trocar `to authenticated using (true)` por
   `using (public.eh_admin()) with check (public.eh_admin())`.
   Manter `using (true)` apenas nas policies de SELECT de conteúdo público.
7. `revoke execute on function public.gerar_vouchers_resgate(integer) from authenticated;`
   e conceder só a admin (ou checar `eh_admin()` dentro da função).
8. Em `src/pages/admin.jsx`, trocar a guarda por uma consulta a `eh_admin()` — mas deixando
   claro que essa é uma melhoria de UX; a segurança real está nas policies.

### Fase 2 — Abuso e enumeração

9. Rate limiting de borda (Cloudflare Rules ou equivalente) em `/auth/v1/token`,
   `/auth/v1/recover`, `/rest/v1/rpc/*`, `/rest/v1/matriculas` e `/functions/v1/chat-agent`.
10. `chat-agent`: contar o limite por IP (`x-forwarded-for`) em vez de `sessionId` do cliente,
    e restringir o CORS ao domínio do site.
11. `girar_roleta_premiada`: mover a checagem "já participou" para **depois** da validação de
    nome+CPF+matrícula, e devolver mensagem genérica.
12. `girar_roleta_resgate`: aumentar o código para 8+ caracteres, registrar tentativas falhas
    por IP e bloquear após N erros; unificar `voucher_invalido` e `voucher_ja_usado`
    numa mesma resposta genérica.
13. Turnstile/hCaptcha em `/matricula` e no upload de anexos; validar CPF também no servidor
    (trigger ou RPC `security definer` em vez de INSERT direto por `anon`).

### Fase 3 — Higiene

14. `npm audit fix` e reteste do build.
15. `git filter-repo` para remover `.env` do histórico; forçar push; rotacionar o que passou por lá.
16. Apagar `src/pages/.git`, `_tmp_shotN.mjs` e `public/chatvolt-widget.js` (se não for usado);
    remover `cdn.jsdelivr.net` da CSP nesse caso.
17. Versionar o SQL das 12 tabelas sem arquivo de setup ([I-03]) e revisar suas policies.
18. Decidir sobre o Meta Pixel ([L-02]) e confirmar o mascaramento do Clarity ([I-01]).

### Depois das correções

Reexecutar os testes desta auditoria — não considerar nada resolvido só porque o código mudou:
reconfirmar `disable_signup`, tentar leitura de `matriculados` com uma conta comum recém-criada,
repetir o teste de rate limiting nas RPCs e rodar `npm audit` de novo.
