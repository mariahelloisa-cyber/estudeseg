-- ============================================================================
-- SEGURANÇA 03 — MATRÍCULA, CONTATO E STORAGE
-- Corrige [M-04], [M-05], [N-01 mass assignment] e a validação server-side.
-- ----------------------------------------------------------------------------
-- PROBLEMA QUE ESTE ARQUIVO RESOLVE
--
-- Hoje o visitante anônimo tem INSERT direto em public.matriculas e em
-- public.contatos, e INSERT livre no bucket matriculas-anexos. Como o cliente
-- fala direto com o PostgREST, ele pode: ignorar a validação de CPF do React,
-- gravar em colunas que o formulário nem mostra (mass assignment), inserir em
-- massa, e encher o bucket com arquivos sem nenhum vínculo com uma matrícula.
--
-- DESENHO DA CORREÇÃO
--
-- O acesso anônimo direto acaba. Toda escrita pública passa por funções
-- SECURITY DEFINER que validam campo a campo e aplicam rate limit por IP.
--
-- O upload continua indo DIRETO do navegador para o Storage — de propósito.
-- Passar 5 arquivos de 10MB por dentro de uma Edge Function esbarraria no
-- limite de tamanho de requisição. Em vez disso, o arquivo fica amarrado a um
-- token de matrícula: a policy do Storage só aceita o upload se a primeira
-- pasta do caminho for um token que existe, é recente e ainda não estourou a
-- cota de arquivos. O vínculo é verificado no servidor, não no cliente.
--
-- PRÉ-REQUISITO: arquivos 01 e 02 já rodados.
-- ============================================================================

-- ###########################################################################
-- PARTE 1 — INFRAESTRUTURA DE RATE LIMIT (usada aqui e no arquivo 04)
-- ###########################################################################

create table if not exists public.seguranca_rate_limit (
  chave       text        not null,
  identidade  text        not null,
  janela      timestamptz not null,
  contagem    integer     not null default 0,
  primary key (chave, identidade, janela)
);

comment on table public.seguranca_rate_limit is
  'Contadores de rate limit por (operação, IP, janela de tempo). Escrita exclusivamente '
  'por funções SECURITY DEFINER — nenhum papel público tem acesso direto.';

revoke all on public.seguranca_rate_limit from anon, authenticated;
alter table public.seguranca_rate_limit enable row level security;
alter table public.seguranca_rate_limit force row level security;

create index if not exists seguranca_rate_limit_janela_idx
  on public.seguranca_rate_limit (janela);

-- ---------------------------------------------------------------------------
-- Identidade do chamador para fins de rate limit
-- ---------------------------------------------------------------------------
-- NOTA DE HONESTIDADE SOBRE O IP:
-- `cf-connecting-ip` é preenchido pela borda da Cloudflare (que fica na frente
-- do Supabase) e sobrescreve qualquer valor que o cliente mande — por isso é a
-- primeira escolha. `x-forwarded-for` é uma lista onde o cliente controla os
-- itens da ESQUERDA; por isso, no fallback, pegamos o item mais à DIREITA, que
-- é o que foi acrescentado pelo proxy mais próximo e o cliente não consegue
-- forjar. Ainda assim, rate limit por IP não resiste a um atacante com uma rede
-- grande de IPs — é por isso que o item [H-04] do relatório pede também rate
-- limit na borda (Cloudflare), que este arquivo não substitui.
create or replace function public.identidade_requisicao()
returns text
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_headers json;
  v_cf      text;
  v_xff     text;
  v_partes  text[];
begin
  begin
    v_headers := current_setting('request.headers', true)::json;
  exception when others then
    return 'desconhecido';
  end;

  if v_headers is null then
    return 'desconhecido';
  end if;

  v_cf := nullif(trim(v_headers ->> 'cf-connecting-ip'), '');
  if v_cf is not null then
    return v_cf;
  end if;

  v_xff := nullif(trim(v_headers ->> 'x-forwarded-for'), '');
  if v_xff is not null then
    v_partes := string_to_array(v_xff, ',');
    return trim(v_partes[array_length(v_partes, 1)]);
  end if;

  return 'desconhecido';
end;
$$;

alter function public.identidade_requisicao() owner to postgres;
revoke all on function public.identidade_requisicao() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Consome uma unidade de cota. Retorna false quando o limite foi estourado.
-- ---------------------------------------------------------------------------
create or replace function public.consumir_rate_limit(
  p_chave  text,
  p_limite integer,
  p_janela interval
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_identidade text := public.identidade_requisicao();
  v_janela     timestamptz := date_trunc('second', now()) - (
                  extract(epoch from now())::bigint % greatest(extract(epoch from p_janela)::bigint, 1)
                ) * interval '1 second';
  v_contagem   integer;
begin
  -- Limpeza oportunista: descarta janelas velhas para a tabela não crescer.
  delete from public.seguranca_rate_limit
  where janela < now() - interval '1 day';

  insert into public.seguranca_rate_limit (chave, identidade, janela, contagem)
  values (p_chave, v_identidade, v_janela, 1)
  on conflict (chave, identidade, janela)
    do update set contagem = public.seguranca_rate_limit.contagem + 1
  returning contagem into v_contagem;

  return v_contagem <= p_limite;
end;
$$;

alter function public.consumir_rate_limit(text, integer, interval) owner to postgres;
revoke all on function public.consumir_rate_limit(text, integer, interval) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Validação de CPF no SERVIDOR (dígitos verificadores)
-- ---------------------------------------------------------------------------
-- A validação que existe em src/pages/Matricula.jsx continua lá para dar
-- feedback imediato ao usuário, mas ela não é segurança: quem chama a API
-- direto nem carrega o React. Esta aqui é a que vale.
create or replace function public.cpf_valido(p_cpf text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_cpf   text := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
  v_soma  integer;
  v_resto integer;
  i       integer;
begin
  if length(v_cpf) <> 11 then
    return false;
  end if;

  -- Rejeita as sequências repetidas (00000000000, 11111111111, ...), que passam
  -- na conta dos dígitos verificadores mas não são CPFs válidos.
  if v_cpf ~ '^(\d)\1{10}$' then
    return false;
  end if;

  v_soma := 0;
  for i in 1..9 loop
    v_soma := v_soma + substr(v_cpf, i, 1)::int * (11 - i);
  end loop;
  v_resto := (v_soma * 10) % 11;
  if v_resto = 10 then v_resto := 0; end if;
  if v_resto <> substr(v_cpf, 10, 1)::int then
    return false;
  end if;

  v_soma := 0;
  for i in 1..10 loop
    v_soma := v_soma + substr(v_cpf, i, 1)::int * (12 - i);
  end loop;
  v_resto := (v_soma * 10) % 11;
  if v_resto = 10 then v_resto := 0; end if;
  if v_resto <> substr(v_cpf, 11, 1)::int then
    return false;
  end if;

  return true;
end;
$$;

alter function public.cpf_valido(text) owner to postgres;

-- ###########################################################################
-- PARTE 2 — MATRÍCULA
-- ###########################################################################

-- Token que amarra os anexos à matrícula. Sem ele, o upload é recusado.
alter table public.matriculas
  add column if not exists upload_token uuid unique default gen_random_uuid();

comment on column public.matriculas.upload_token is
  'Pasta do Storage onde os anexos desta matrícula podem ser gravados. A policy do '
  'bucket matriculas-anexos só aceita upload sob um token existente e recente.';

create index if not exists matriculas_upload_token_idx
  on public.matriculas (upload_token);

-- ---------------------------------------------------------------------------
-- enviar_matricula — único caminho público de escrita em public.matriculas
-- ---------------------------------------------------------------------------
-- Cada campo é um parâmetro nomeado e tipado. Não existe "objeto do cliente"
-- sendo despejado na tabela, então mass assignment deixa de ser possível: o
-- visitante não consegue escrever em coluna nenhuma que não esteja aqui.
create or replace function public.enviar_matricula(
  p_curso            text,
  p_nome_completo    text,
  p_cpf              text,
  p_data_nascimento  date,
  p_rg               text,
  p_orgao_emissor    text,
  p_data_emissao     date,
  p_naturalidade     text,
  p_raca_cor         text,
  p_estado_civil     text,
  p_pai              text,
  p_mae              text,
  p_cep              text,
  p_rua              text,
  p_numero           text,
  p_complemento      text,
  p_bairro           text,
  p_cidade           text,
  p_estado           text,
  p_telefone         text,
  p_email            text,
  p_observacoes      text
)
returns table (resultado text, upload_token uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token uuid;
begin
  -- 1) Rate limit ANTES de qualquer trabalho: 5 matrículas por IP por hora.
  if not public.consumir_rate_limit('matricula', 5, interval '1 hour') then
    return query select 'limite_excedido'::text, null::uuid;
    return;
  end if;

  -- 2) Obrigatórios. Mesma lista de CAMPOS_OBRIGATORIOS_ALUNO do frontend,
  --    agora aplicada onde o cliente não alcança.
  if coalesce(trim(p_curso), '')           = ''
     or coalesce(trim(p_nome_completo), '') = ''
     or coalesce(trim(p_rg), '')            = ''
     or coalesce(trim(p_orgao_emissor), '') = ''
     or coalesce(trim(p_naturalidade), '')  = ''
     or coalesce(trim(p_estado_civil), '')  = ''
     or coalesce(trim(p_cep), '')           = ''
     or coalesce(trim(p_rua), '')           = ''
     or coalesce(trim(p_numero), '')        = ''
     or coalesce(trim(p_bairro), '')        = ''
     or coalesce(trim(p_cidade), '')        = ''
     or coalesce(trim(p_estado), '')        = ''
     or coalesce(trim(p_telefone), '')      = ''
     or coalesce(trim(p_email), '')         = ''
     or p_data_nascimento is null
  then
    return query select 'campos_obrigatorios'::text, null::uuid;
    return;
  end if;

  -- 3) Formato
  if not public.cpf_valido(p_cpf) then
    return query select 'cpf_invalido'::text, null::uuid;
    return;
  end if;

  if p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-zA-Z]{2,}$' then
    return query select 'email_invalido'::text, null::uuid;
    return;
  end if;

  -- Data de nascimento plausível: nem no futuro, nem 150 anos atrás.
  if p_data_nascimento > current_date
     or p_data_nascimento < current_date - interval '150 years' then
    return query select 'data_invalida'::text, null::uuid;
    return;
  end if;

  -- 4) Tamanho: impede que alguém use a tabela como depósito de texto.
  if length(p_nome_completo) > 200 or length(p_email) > 200
     or length(coalesce(p_observacoes, '')) > 2000
     or length(coalesce(p_complemento, '')) > 200
     or length(p_curso) > 300 or length(coalesce(p_pai, '')) > 200
     or length(coalesce(p_mae, '')) > 200 or length(p_rua) > 300 then
    return query select 'campo_muito_longo'::text, null::uuid;
    return;
  end if;

  -- 5) Grava. `anexos` começa vazio e só é preenchido por anexar_documentos_matricula.
  insert into public.matriculas (
    curso, nome_completo, cpf, data_nascimento, rg, orgao_emissor, data_emissao,
    naturalidade, raca_cor, estado_civil, pai, mae, cep, rua, numero, complemento,
    bairro, cidade, estado, telefone, email, observacoes, anexos
  ) values (
    trim(p_curso), trim(p_nome_completo),
    regexp_replace(p_cpf, '\D', '', 'g'), p_data_nascimento,
    trim(p_rg), trim(p_orgao_emissor), p_data_emissao,
    trim(p_naturalidade), nullif(trim(coalesce(p_raca_cor, '')), ''),
    trim(p_estado_civil), nullif(trim(coalesce(p_pai, '')), ''),
    nullif(trim(coalesce(p_mae, '')), ''), trim(p_cep), trim(p_rua),
    trim(p_numero), nullif(trim(coalesce(p_complemento, '')), ''),
    trim(p_bairro), trim(p_cidade), trim(p_estado), trim(p_telefone),
    lower(trim(p_email)), nullif(trim(coalesce(p_observacoes, '')), ''),
    '{}'
  )
  returning matriculas.upload_token into v_token;

  return query select 'sucesso'::text, v_token;
end;
$$;

alter function public.enviar_matricula(
  text, text, text, date, text, text, date, text, text, text, text, text,
  text, text, text, text, text, text, text, text, text, text
) owner to postgres;

revoke all on function public.enviar_matricula(
  text, text, text, date, text, text, date, text, text, text, text, text,
  text, text, text, text, text, text, text, text, text, text
) from public;
grant execute on function public.enviar_matricula(
  text, text, text, date, text, text, date, text, text, text, text, text,
  text, text, text, text, text, text, text, text, text, text
) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Cota de anexos por matrícula
-- ---------------------------------------------------------------------------
create or replace function public.upload_matricula_permitido(p_token text)
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_uuid       uuid;
  v_criado_em  timestamptz;
  v_arquivos   integer;
begin
  -- Token precisa ser um uuid de verdade; qualquer outra coisa é recusada.
  begin
    v_uuid := p_token::uuid;
  exception when others then
    return false;
  end;

  select m.created_at into v_criado_em
  from public.matriculas m
  where m.upload_token = v_uuid;

  -- Token inexistente: recusa.
  if not found then
    return false;
  end if;

  -- Janela curta: o upload acontece segundos depois do envio do formulário.
  -- Passou de 30 minutos, aquela pasta está fechada para sempre.
  if v_criado_em < now() - interval '30 minutes' then
    return false;
  end if;

  -- No máximo 8 arquivos por matrícula.
  select count(*) into v_arquivos
  from storage.objects o
  where o.bucket_id = 'matriculas-anexos'
    and (storage.foldername(o.name))[1] = p_token;

  return v_arquivos < 8;
end;
$$;

alter function public.upload_matricula_permitido(text) owner to postgres;
-- ATENÇÃO: esta função é chamada de DENTRO da policy do bucket, e policies são
-- avaliadas com os privilégios de quem faz a consulta. Por isso anon e
-- authenticated PRECISAM de EXECUTE aqui — sem isso o upload falha com
-- "permission denied for function upload_matricula_permitido".
-- (Corrigido em supabase-seguranca-07-correcao-upload.sql.)
revoke all on function public.upload_matricula_permitido(text) from public;
grant execute on function public.upload_matricula_permitido(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- anexar_documentos_matricula — registra os caminhos já enviados
-- ---------------------------------------------------------------------------
create or replace function public.anexar_documentos_matricula(
  p_token   uuid,
  p_anexos  text[]
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id      bigint;
  v_caminho text;
begin
  select m.id into v_id
  from public.matriculas m
  where m.upload_token = p_token
    and m.created_at > now() - interval '30 minutes';

  if not found then
    return 'token_invalido';
  end if;

  if coalesce(array_length(p_anexos, 1), 0) > 8 then
    return 'anexos_demais';
  end if;

  -- Cada caminho precisa estar DENTRO da pasta do próprio token. Sem esta
  -- checagem, alguém poderia apontar a matrícula dele para os documentos de
  -- outra pessoa e o painel geraria o link assinado do arquivo alheio.
  foreach v_caminho in array coalesce(p_anexos, '{}') loop
    if v_caminho !~ ('^' || p_token::text || '/[A-Za-z0-9._-]+$') then
      return 'caminho_invalido';
    end if;
  end loop;

  update public.matriculas
  set anexos = coalesce(p_anexos, '{}')
  where id = v_id;

  return 'sucesso';
end;
$$;

alter function public.anexar_documentos_matricula(uuid, text[]) owner to postgres;
revoke all on function public.anexar_documentos_matricula(uuid, text[]) from public;
grant execute on function public.anexar_documentos_matricula(uuid, text[]) to anon, authenticated;

-- ###########################################################################
-- PARTE 3 — CONTATO (formulário da Home)
-- ###########################################################################
-- Antes: supabase.from('contatos').insert([contatoForm]) — o objeto inteiro
-- vindo do cliente ia direto para a tabela. Quem chamasse a API direto podia
-- gravar qualquer coluna existente. Agora são parâmetros tipados.
create or replace function public.enviar_contato(
  p_nome            text,
  p_email           text,
  p_telefone        text,
  p_curso_desejado  text,
  p_mensagem        text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.consumir_rate_limit('contato', 5, interval '1 hour') then
    return 'limite_excedido';
  end if;

  if coalesce(trim(p_nome), '') = '' or coalesce(trim(p_email), '') = '' then
    return 'campos_obrigatorios';
  end if;

  if p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-zA-Z]{2,}$' then
    return 'email_invalido';
  end if;

  if length(p_nome) > 200 or length(p_email) > 200
     or length(coalesce(p_telefone, '')) > 40
     or length(coalesce(p_curso_desejado, '')) > 300
     or length(coalesce(p_mensagem, '')) > 2000 then
    return 'campo_muito_longo';
  end if;

  insert into public.contatos (nome, email, telefone, curso_desejado, mensagem)
  values (
    trim(p_nome), lower(trim(p_email)),
    nullif(trim(coalesce(p_telefone, '')), ''),
    nullif(trim(coalesce(p_curso_desejado, '')), ''),
    nullif(trim(coalesce(p_mensagem, '')), '')
  );

  return 'sucesso';
end;
$$;

alter function public.enviar_contato(text, text, text, text, text) owner to postgres;
revoke all on function public.enviar_contato(text, text, text, text, text) from public;
grant execute on function public.enviar_contato(text, text, text, text, text) to anon, authenticated;

-- ###########################################################################
-- PARTE 4 — STORAGE
-- ###########################################################################

-- Confirma que o bucket é privado e mantém os limites de tipo/tamanho.
update storage.buckets
set public             = false,
    file_size_limit    = 10485760,  -- 10 MB
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
where id = 'matriculas-anexos';

-- Remove as policies antigas do bucket de anexos (a de INSERT anônimo irrestrito
-- é justamente o [M-04]).
drop policy if exists "Qualquer um pode enviar anexo de matricula" on storage.objects;
drop policy if exists "Admin pode ver anexos de matricula"        on storage.objects;
drop policy if exists "Admin pode apagar anexos de matricula"     on storage.objects;
drop policy if exists "anexos matricula upload vinculado"         on storage.objects;
drop policy if exists "anexos matricula leitura admin"            on storage.objects;
drop policy if exists "anexos matricula exclusao admin"           on storage.objects;

-- Upload anônimo continua possível (o formulário é público), mas só dentro da
-- pasta de um token de matrícula válido, recente e dentro da cota.
create policy "anexos matricula upload vinculado"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'matriculas-anexos'
    and array_length(storage.foldername(name), 1) = 1
    and public.upload_matricula_permitido((storage.foldername(name))[1])
  );

-- Leitura e exclusão: só administrador de verdade.
create policy "anexos matricula leitura admin"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'matriculas-anexos' and public.eh_admin());

create policy "anexos matricula exclusao admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'matriculas-anexos' and public.eh_admin());

-- ---------------------------------------------------------------------------
-- Bucket 'banners': público para leitura (é conteúdo do site), escrita só admin
-- ---------------------------------------------------------------------------
do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname ilike '%banner%'
  loop
    execute format('drop policy if exists %I on storage.objects', p.policyname);
  end loop;
end;
$$;

create policy "banners leitura publica"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'banners');

create policy "banners escrita admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'banners' and public.eh_admin());

create policy "banners atualizacao admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'banners' and public.eh_admin())
  with check (bucket_id = 'banners' and public.eh_admin());

create policy "banners exclusao admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'banners' and public.eh_admin());

-- ---------------------------------------------------------------------------
-- Verificação
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from storage.buckets where id = 'matriculas-anexos' and public
  ) then
    raise warning 'ATENÇÃO: o bucket matriculas-anexos ainda está PÚBLICO.';
  else
    raise notice 'OK: matriculas-anexos privado.';
  end if;
end;
$$;
