# [H-03] `.env` no histórico Git — análise e procedimento

**Status: NÃO CORRIGIDO. Requer decisão sua — não executei nada.**

O plano pede explicitamente que um force push seja explicado antes de executado.
Reescrever histórico é destrutivo e irreversível para quem já clonou o repositório,
então este arquivo descreve o que existe, o que fazer e o que quebra.

## O que está exposto, exatamente

Dois blobs continuam alcançáveis no repositório:

| Commit | Blob | Conteúdo |
|---|---|---|
| `a1c7095` ("first commit") | `88b2cb04…` | `VITE_API_URL` (endpoint Strapi antigo) |
| `3380a06` ("melhorias") | `13b6ce5e…` | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |

O commit `129ca2c` ("security: remover .env do historico") apagou o arquivo da
árvore **atual**, mas não tocou no histórico. `git show 3380a06:.env` continua
funcionando, e o repositório `mariahelloisa-cyber/estudeseg` é **público**.

## Qual é o risco real

Sendo direto: **a anon key não é um segredo.** Ela é desenhada para ficar no
bundle JavaScript, visível para qualquer visitante — ela já está em
`dist/assets/index-*.js` hoje. Removê-la do histórico não muda o nível de
proteção do banco em nada.

O que protege o banco é a RLS. Foi exatamente isso que falhou, e é o que os
arquivos `supabase-seguranca-0*.sql` corrigem.

Nada de verdadeiramente secreto vazou: **não há service_role key, chave privada,
credencial de banco nem token de provedor de IA no histórico** (verificado com
`git grep` sobre todos os commits alcançáveis).

Então o item [H-03] é HIGH pelo **contexto**, não pela chave: um repositório
público entrega o project ref, o esquema completo e as assinaturas das RPCs,
o que reduziu a zero o custo de descoberta do [C-01].

## O que fazer, em ordem de valor

### 1. Tornar o repositório privado (alto valor, custo zero, reversível)

GitHub → Settings → General → Danger Zone → Change repository visibility → Private.

Resolve a maior parte do [H-03] sozinho e não quebra nada.

### 2. Rotacionar a anon key — opcional, e mais caro do que parece

No Supabase, girar a anon key significa girar o **JWT secret** do projeto, o que
invalida **todas** as chaves de uma vez, inclusive a `service_role`. Depois disso
é obrigatório atualizar, na mesma janela:

- `.env` local e as variáveis de ambiente do deploy (Cloudflare Pages/Netlify);
- as variáveis da Edge Function `chat-agent` (ela usa `SUPABASE_SERVICE_ROLE_KEY`);
- qualquer integração externa que use as chaves do projeto.

Enquanto isso não estiver feito, **o site sai do ar**. E o ganho é pequeno,
porque a chave nova vai para o bundle público exatamente como a antiga.

**Recomendação:** faça isto apenas se o inventário de `auth.users` (consulta 7 do
arquivo `supabase-seguranca-00-diagnostico.sql`) mostrar contas desconhecidas —
ou seja, se houver indício de que o [C-01] foi de fato explorado. Nesse caso
trate como incidente e gire tudo.

> **VERIFICADO EM 2026-09-09: a consulta 7 mostrou apenas a conta da própria
> administradora.** Nenhuma conta desconhecida foi criada enquanto o cadastro
> público esteve aberto.
>
> Como a leitura de qualquer dado sensível exigia uma conta autenticada (a RLS
> já bloqueava o acesso anônimo — testado na auditoria), a ausência de contas
> estranhas é evidência forte de que o [C-01] **não foi explorado**.
>
> **Conclusão: não rotacione as chaves e não reescreva o histórico.** O custo é
> alto, o site sai do ar durante a troca, e não há incidente a conter. Basta
> tornar o repositório privado.
>
> Ressalva honesta: uma conta criada e apagada antes desta consulta não
> apareceria. Se quiser certeza documental, o Supabase guarda os eventos de
> autenticação em Logs & Analytics → Auth Logs — dá para conferir se houve
> algum `signup` além do seu.

### 3. Limpar o histórico — o que quebra

`git filter-repo` **não está instalado** nesta máquina e não há `pip` disponível.
Para instalar:

```
winget install Python.Python.3.12
pip install git-filter-repo
```

Depois, a partir de um clone fresco do repositório:

```
git clone --mirror https://github.com/mariahelloisa-cyber/estudeseg.git estudeseg-limpo
cd estudeseg-limpo
git filter-repo --invert-paths --path .env --force
git push --force --all
git push --force --tags
```

**Impacto do force push — leia antes de rodar:**

- **Todo hash de commit muda.** O histórico depois do primeiro commit tocado é
  reescrito por inteiro.
- **Qualquer clone existente quebra.** Quem tiver o repositório na máquina
  precisa apagar e clonar de novo; um `git pull` comum vai gerar conflito ou
  duplicar todo o histórico.
- **PRs abertos e branches remotos** precisam ser refeitos.
- **Links para commits** (issues, mensagens, documentação) param de resolver.
- **O GitHub não apaga tudo na hora.** Objetos ficam acessíveis por um tempo em
  caches e forks. Se alguém tiver forkado o repositório, o blob continua lá,
  fora do seu controle — por isso um segredo exposto deve ser considerado
  comprometido de forma permanente, e a resposta correta é sempre rotacionar,
  não só apagar.
- **Faça backup do repositório antes** (`git clone --mirror` guardado à parte).

Com um único desenvolvedor no projeto, o custo é baixo. Com mais gente, combine
o horário antes.

## Prevenção (já aplicada)

O `.gitignore` já cobre `.env`, `.env.local` e `.env.*`, e o `.env` atual não
está rastreado (confirmado com `git status`). O problema é só o passado.

Sugestão adicional, se quiser fechar o assunto de vez: habilite o **Push
Protection** do GitHub (Settings → Code security → Secret scanning), que barra
o commit de segredos antes de eles entrarem no histórico.
