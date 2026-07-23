-- Preenche imagem_url com a foto placeholder informada em TODOS os cursos da categoria "Tecnólogos"
-- (31 sem foto nenhuma + 38 que compartilhavam uma foto genérica repetida = 69 no total).
-- Depois é só trocar uma por uma no Admin → Cursos e Categorias quando tiver a foto definitiva de cada curso.

update public.cursos_cadastrados
set imagem_url = 'https://mknvmcpnlytuzpuzelsn.supabase.co/storage/v1/object/public/banners/curso-5067e37e-3e03-43c4-bd01-7fdc672d4896.png'
where categoria_id = (select id from public.categorias_cursos where nome = 'Tecnólogos');
