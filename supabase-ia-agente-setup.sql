-- ============================================================
-- Agente de IA (assistente virtual) — Estude Seguro
-- ============================================================
-- Reaproveita a tabela "configuracoes" (já existente) para guardar
-- os ajustes editáveis da agente pelo painel admin, e cria uma
-- tabela enxuta apenas para estatísticas de uso (sem dados pessoais).

-- --- Configurações da agente (chave/valor na tabela já existente) ---
insert into public.configuracoes (chave, valor) values
  ('ia_agente_ativo', 'true'),
  ('ia_mensagem_inicial', E'Olá! 👋 Sou o Segurinho, assistente virtual da Estude Seguro.\n\nAqui seu diploma é garantido pelo MEC — ou seu dinheiro de volta. 🔐\n\nComo posso te ajudar?'),
  ('ia_texto_apresentacao', 'Assistente virtual da Estude Seguro'),
  ('ia_sugestoes', '["O que é a Estude Seguro?","Quais serviços vocês oferecem?","Como funciona o pagamento?","Como faço para entrar em contato?"]')
on conflict (chave) do nothing;

-- --- Estatísticas de uso da agente (sem dados pessoais do visitante) ---
create table if not exists public.ia_mensagens (
  id uuid primary key default gen_random_uuid(),
  sessao_id uuid not null,
  pergunta text not null,
  created_at timestamptz not null default now()
);

create index if not exists ia_mensagens_sessao_id_idx on public.ia_mensagens (sessao_id);
create index if not exists ia_mensagens_created_at_idx on public.ia_mensagens (created_at);

alter table public.ia_mensagens enable row level security;

-- Apenas o painel admin (usuário autenticado) pode ler as estatísticas.
drop policy if exists "Admin pode ver mensagens da IA" on public.ia_mensagens;
create policy "Admin pode ver mensagens da IA"
  on public.ia_mensagens for select
  to authenticated using (true);

