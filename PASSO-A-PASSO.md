# Passo a passo da remediação — Estude Seguro

Marque cada item conforme for fazendo. Tempo total: **cerca de 40 minutos.**

> **A ordem importa de verdade.** O site novo precisa de funções que só existem
> depois do SQL, e o SQL derruba o jeito antigo de enviar matrícula. Fazer fora
> de ordem deixa o formulário de matrícula quebrado ou, pior, tranca você fora
> do painel. Faça os passos 1 a 7 de uma sentada só.

---

## AMBIENTE (confirmado)

- **Site:** https://estudeseg.pages.dev — **Cloudflare Pages**, respondendo
  HTTP 200 com todos os headers de segurança já aplicados (CSP, HSTS,
  X-Frame-Options, COOP, CORP).
- **Deploy:** conectado ao Git pelo painel do Cloudflare Pages. Não há arquivo
  de configuração no repositório, então a publicação é disparada por push.
- **Banco:** Supabase, projeto `mknvmcpnlytuzpuzelsn`.

O domínio já foi corrigido no código (`chat-agent/index.ts`). Antes eu tinha
chutado `estudeseguro.com.br`, que não existia em lugar nenhum.

**Confirme só uma coisa** no painel do Cloudflare Pages → seu projeto →
Settings → Builds & deployments: **de qual branch ele publica** (quase
certamente `main`). Isso importa no passo 6.

> Se você tiver um domínio próprio apontando para este Pages (ex.:
> `www.seusite.com.br`), me avise — ele precisa entrar também na lista de
> origens do passo 7, senão o chat quebra nele.

---

## PASSO 1 — Diagnóstico (5 min, não muda nada)

1. Abra o Supabase → projeto **estudeseg** → **SQL Editor**.
2. Abra o arquivo `supabase-seguranca-00-diagnostico.sql` daqui do projeto.
3. Rode **uma consulta por vez** (selecione o bloco e clique em Run).
4. **Guarde o resultado das consultas 7 e 8** — são a lista de usuários.

### 🚨 Olhe a consulta 7 com atenção

Ela lista todas as contas do projeto com o e-mail mascarado.

- **Só aparecem contas que você reconhece?** Ótimo, siga em frente.
- **Aparece alguma conta estranha?** Então o problema crítico foi explorado.
  Pare aqui e me chame — muda a resposta (vira tratamento de incidente, com
  rotação de chaves e possível notificação à ANPD pela LGPD).

- [ ] Diagnóstico rodado e resultado guardado
- [ ] Lista de usuários conferida, sem contas desconhecidas

---

## PASSO 2 — Descobrir seu user_id e criar a autorização (5 min)

1. No SQL Editor, rode:

```sql
select id, email, created_at, last_sign_in_at
from auth.users
order by created_at;
```

2. **Copie o `id`** (aquele texto comprido com hífens) da SUA conta de admin.

3. Abra `supabase-seguranca-01-autorizacao.sql`, cole tudo no SQL Editor e rode.
   Vai aparecer um aviso dizendo que `public.admins` está vazia — é esperado.

4. Agora rode isto, **trocando pelo seu id de verdade**:

```sql
insert into public.admins (user_id, observacao)
values ('COLE-SEU-USER-ID-AQUI', 'admin principal')
on conflict (user_id) do nothing;
```

5. Confirme que funcionou:

```sql
select a.user_id, u.email from public.admins a
join auth.users u on u.id = a.user_id;
```

Se você tem mais de uma pessoa que administra o site, repita o passo 4 para cada
uma. **Quem não estiver nessa lista não vai mais conseguir entrar no painel.**

- [ ] Arquivo 01 rodado
- [ ] Meu user_id cadastrado em `public.admins`
- [ ] Consulta de confirmação mostrou meu e-mail

---

## PASSO 3 — Funções de matrícula e vouchers (5 min)

> A partir daqui começa a janela em que o formulário de matrícula do site fica
> temporariamente fora do ar. Ela fecha no passo 6. Por isso não pare no meio.

1. Rode `supabase-seguranca-03-matricula-storage.sql` inteiro.
2. Rode `supabase-seguranca-04-rpcs.sql` inteiro.

Se aparecer erro em vez de aviso, **pare e me mande a mensagem** antes de seguir.

- [ ] Arquivo 03 rodado sem erro
- [ ] Arquivo 04 rodado sem erro

---

## PASSO 4 — Trancar as permissões (3 min)

Rode `supabase-seguranca-02-rls.sql` inteiro.

Ele começa se recusando a rodar caso `public.admins` esteja vazia. Se você fez o
passo 2 direito, vai passar e mostrar `Policies aplicadas em 26 tabela(s).`

- [ ] Arquivo 02 rodado
- [ ] Mensagem de policies aplicadas apareceu
- [ ] Nenhum aviso de "policy de escrita permissiva" no final

---

## PASSO 5 — Fechar o cadastro público (2 min) — **este é o crítico**

1. Supabase → **Authentication** → **Sign In / Providers** (em versões mais
   antigas: **Providers**) → **Email**.
2. Desligue **"Allow new users to sign up"** (pode aparecer como
   **"Enable Sign Ups"**).
3. Salve.

Confirme que pegou — cole no seu navegador, trocando a chave:

```
https://mknvmcpnlytuzpuzelsn.supabase.co/auth/v1/settings?apikey=SUA_ANON_KEY
```

Tem que aparecer `"disable_signup":true`. Se ainda estiver `false`, a alteração
não salvou.

> A partir daqui, contas novas só são criadas por você, pelo Dashboard
> (Authentication → Users → Add user).

- [ ] "Allow new users to sign up" desligado
- [ ] `/auth/v1/settings` retornando `"disable_signup":true`

---

## PASSO 6 — Publicar o site novo (5 min) — fecha a janela do passo 3

No terminal, dentro da pasta do projeto:

```bash
git checkout main
git merge security/remediation
git push
```

Isso dispara a publicação automática. Acompanhe no painel do Cloudflare/Netlify
até dizer que terminou.

> Se preferir revisar antes de mesclar, abra um Pull Request de
> `security/remediation` para `main` no GitHub e faça o merge por lá.

- [ ] Merge feito e enviado
- [ ] Deploy concluído no painel

---

## PASSO 7 — Publicar o assistente de IA (5 min)

A CLI está logada numa conta **sem acesso** a este projeto — por isso eu não
consegui publicar. Você precisa logar com a conta certa:

```bash
npx supabase login
npx supabase link --project-ref mknvmcpnlytuzpuzelsn
```

O domínio correto já está embutido no código, então este comando é **opcional** —
só é necessário se você tiver um domínio próprio além do `pages.dev`:

```bash
npx supabase secrets set ORIGENS_PERMITIDAS="https://estudeseg.pages.dev,https://www.seudominio.com.br"
```

Publique:

```bash
npx supabase functions deploy chat-agent
```

Depois **abra https://estudeseg.pages.dev e mande uma mensagem no chat.**
Se não responder, abra o console do navegador (F12) e veja se há erro de CORS —
seria sinal de domínio faltando na lista.

- [ ] Login e link feitos
- [ ] Função publicada
- [ ] Chat testado no site e respondendo

---

## PASSO 8 — Conferir que funcionou (10 min)

### 8.1 — Conferência automática

No SQL Editor, rode o **bloco 10** do arquivo
`supabase-seguranca-00-diagnostico.sql` (o último, "CONFERÊNCIA PÓS-CORREÇÃO").

**As 7 linhas precisam dizer `OK`.** Qualquer `FALHA` significa que algum passo
não pegou — me mande o resultado.

- [ ] 7 linhas `OK`

### 8.2 — Teste do site (o que os visitantes usam)

Abra o site e teste, de verdade:

- [ ] Página inicial carrega com banners, cursos e depoimentos
- [ ] Formulário de contato da home envia e mostra sucesso
- [ ] `/matricula` envia com anexo e mostra sucesso
- [ ] `/cursos` e uma página de curso abrem normalmente
- [ ] `/sorteios` e `/resgate-premio` carregam a roleta
- [ ] Chat do Segurinho responde

### 8.3 — Teste do painel

- [ ] Entro em `/login` com minha conta e chego no painel
- [ ] Consigo **salvar** uma alteração (edite um banner e salve)
- [ ] A matrícula que enviei no teste 8.2 aparece em Matrículas
- [ ] Consigo abrir o anexo dela

### 8.4 — Teste de ataque (o que realmente prova que fechou)

Este é o teste que importa. Sem ele, você só sabe que o código mudou — não que a
falha fechou.

**Crie uma conta comum descartável:** Supabase → Authentication → Users →
Add user → um e-mail qualquer seu + uma senha. **Não** cadastre em
`public.admins`.

Agora, no terminal (Git Bash), cole isto trocando os 3 valores no topo:

```bash
URL="https://mknvmcpnlytuzpuzelsn.supabase.co"
KEY="sua_anon_key"
EMAIL="email-da-conta-teste"
SENHA="senha-da-conta-teste"

TOKEN=$(curl -s "$URL/auth/v1/token?grant_type=password" \
  -H "apikey: $KEY" -H "content-type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$SENHA\"}" \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "1) Ler dados de alunos (esperado: [] vazio)"
curl -s "$URL/rest/v1/matriculados?select=*&limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN"; echo

echo "2) Tentar virar admin (esperado: permission denied)"
curl -s -X POST "$URL/rest/v1/admins" -H "apikey: $KEY" -H "Authorization: Bearer $TOKEN" \
  -H "content-type: application/json" -d '{"user_id":"00000000-0000-0000-0000-000000000000"}'; echo

echo "3) Tentar gerar vouchers (esperado: Acesso negado)"
curl -s -X POST "$URL/rest/v1/rpc/gerar_vouchers_resgate" -H "apikey: $KEY" \
  -H "Authorization: Bearer $TOKEN" -H "content-type: application/json" -d '{"p_quantidade":1}'; echo

echo "4) Tentar alterar um curso (esperado: nada alterado)"
curl -s -X PATCH "$URL/rest/v1/cursos_cadastrados?id=eq.1" -H "apikey: $KEY" \
  -H "Authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -H "Prefer: return=representation" -d '{"titulo":"INVADIDO"}'; echo
```

**Resultado esperado:**

| Teste | Tem que dar |
|---|---|
| 1 | `[]` — vazio |
| 2 | erro de permissão (`42501` / permission denied) |
| 3 | `Acesso negado` |
| 4 | `[]` — nenhuma linha alterada |

Se **qualquer um** desses devolver dados de verdade ou sucesso, algo não pegou.
Me mande a saída.

5. Com a mesma conta logada no navegador, abra `/admin`: tem que deslogar
   sozinho e voltar para `/login`.

6. **Apague a conta de teste** (Authentication → Users → Delete).

- [ ] Os 4 testes deram o resultado esperado
- [ ] `/admin` recusou a conta comum
- [ ] Conta de teste apagada

---

## PASSO 9 — Repositório privado (2 min)

GitHub → repositório `estudeseg` → **Settings** → role até **Danger Zone** →
**Change repository visibility** → **Make private**.

Isso resolve a maior parte do problema do histórico, não quebra nada e é
reversível.

- [ ] Repositório privado

> Sobre apagar o `.env` do histórico do Git: leia
> `SECURITY-GIT-HISTORICO.md`. **Resumo honesto: provavelmente não vale a pena.**
> A chave que está lá (anon key) não é secreta — ela já aparece no JavaScript do
> site para qualquer visitante. Só faça a limpeza se a consulta 7 do passo 1
> tiver mostrado contas desconhecidas.

---

## PASSO 10 — Clarity e LGPD (5 min)

O site grava sessões com o Microsoft Clarity em **todas** as páginas — inclusive
`/matricula`, onde a pessoa digita CPF e RG.

1. Entre em https://clarity.microsoft.com → seu projeto → **Settings** →
   **Masking**.
2. Confirme que está em **"Mask all text"** (ou, no mínimo, que os campos
   sensíveis estão mascarados).

Enquanto você não confirmar isso, o item fica como **NÃO VERIFICADO** — não como
resolvido.

- [ ] Mascaramento do Clarity conferido

---

## PASSO 11 — Rate limiting do login (10 min)

> **Correção de uma orientação que eu tinha dado errada.** Eu havia sugerido
> criar uma regra de WAF na Cloudflare para proteger `/auth/v1/token`. **Isso
> não funcionaria**, por dois motivos:
>
> 1. O navegador chama o Supabase **direto** em
>    `mknvmcpnlytuzpuzelsn.supabase.co`. Esse tráfego nunca passa pelo
>    `estudeseg.pages.dev`, então uma regra no seu site jamais o veria.
> 2. `*.pages.dev` não é uma zona sua na Cloudflare — regras de WAF e rate
>    limiting nem ficam disponíveis para esse domínio.
>
> O lugar certo é o próprio Supabase.

No Supabase → **Authentication** → **Rate Limits**, confira e ajuste:

- **Sign in / Sign up** — quantas tentativas de login por hora e por IP.
- **Password recovery** — quantos e-mails de recuperação por hora.
- **Token refresh** — deixe no padrão.

O Supabase já aplica limites padrão aqui; o ponto é você **conferir** que estão
ativos e apertá-los se estiverem folgados. É o que dificulta tentativa de
adivinhar a senha do admin em massa.

Vale mais do que qualquer regra de borda: **ative MFA na sua conta do Supabase**
(Account → Security), já que é ela que dá acesso ao banco inteiro.

- [ ] Rate limits de Authentication conferidos
- [ ] MFA ativado na conta do Supabase

---

## Depois de tudo

Quando os passos 1 a 10 estiverem marcados, me avise que eu refaço a auditoria
e atualizo o `SECURITY-REMEDIATION.md` com o status real de cada achado.

**Não considere nada resolvido antes do passo 8.4 passar.** O código ter mudado
não é prova de que a falha fechou.

---

## Se der errado no meio

Todo o estado anterior está salvo no commit `e582826`, na branch
`security/remediation`. Para voltar o código:

```bash
git checkout main
git reset --hard e582826
```

O SQL não tem desfazer automático — por isso o passo 1 (diagnóstico) existe:
ele guarda a foto de como as policies estavam antes. Se precisar reverter o
banco, me mande aquele resultado.
