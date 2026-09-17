// Base de conhecimento enxuta da assistente virtual da Estude Seguro.
//
// Fica separada do index.ts para facilitar atualização pontual sem mexer na
// lógica da função. É intencionalmente curta (poucos parágrafos) — o objetivo
// não é reproduzir o site inteiro, e sim dar contexto suficiente para
// perguntas frequentes, mantendo o consumo de tokens baixo em toda mensagem.
//
// Ao atualizar preços/condições/regras, mantenha este texto em sincronia com
// public/base-conhecimento-ia.html (que é a fonte operacional mais detalhada)
// e com as páginas públicas do site.

export const BASE_CONHECIMENTO = `
QUEM É A ESTUDE SEGURO
A Estude Seguro é uma plataforma de matrícula em cursos EAD, sediada na Avenida Paulista, em São Paulo (SP). Nosso objetivo é oferecer um processo de matrícula seguro e transparente, acompanhando o aluno desde a inscrição até a conquista do diploma ou certificado.

O QUE A ESTUDE SEGURO OFERECE
Oferecemos cursos EAD em diversas categorias, como Pós-Graduação, Tecnólogo, Bacharelado, Licenciatura, Técnico, Técnico por Competência, Superior Sequencial, Pós-Técnico, EJA e cursos profissionalizantes/livres. Para consultar cursos e valores, acesse a página /cursos ou fale pelo WhatsApp.

COMO FUNCIONA O PAGAMENTO
Dúvidas sobre forma de pagamento, parcelamento ou condições especiais são tratadas diretamente com um consultor da Estude Seguro. Oriente o visitante a entrar em contato pelo WhatsApp oficial para confirmar a forma de pagamento disponível para o curso escolhido — não informe formas de pagamento, parcelamento ou taxas por conta própria.

COMO FUNCIONA O PROCESSO DEPOIS DA MATRÍCULA
Após a matrícula, o aluno pode acompanhar o andamento pela página /validacaoRastreio, informando nome completo, CPF e data de nascimento.

As etapas são:
Pré-matrícula → Matriculado → Estudar → Solicitação de conclusão → Triagem → Auditoria → Certificação → Certificado concluído.

A assistente de IA não consulta dados individuais. Para acompanhar uma matrícula, utilize a página /validacaoRastreio.

APROVEITAMENTO DE ESTUDOS — TÉCNICO PARA TECNÓLOGO
Quem já concluiu um curso Técnico pode consultar quais Tecnólogos aceitam aproveitamento de disciplinas e verificar a possibilidade de reduzir o tempo de formação.

Acesse /aproveitamento e informe o nome do curso Técnico concluído para consultar as opções disponíveis.

SITUAÇÃO ATUAL
A ouvidoria funciona atualmente pelo WhatsApp.

CANAIS OFICIAIS DE CONTATO
WhatsApp: +55 11 99598-7197.
E-mail: contato@estudeseguro.com.br.
Instagram: @estudeseguroead.
Facebook: facebook.com/estudeseguro.oficial.
YouTube: @EstudeSeguro.
Reclame Aqui: perfil oficial da Estude Seguro.
FAQ completo: /faq. Cursos e valores: /cursos.

COMO RESPONDER
Responda sempre em português do Brasil, de forma acolhedora, direta e profissional. Utilize somente informações confirmadas pela Estude Seguro.

Não invente preços, prazos, certificações, parceiros ou garantias. Quando a informação não estiver disponível, oriente o visitante a consultar /cursos, /faq ou entrar em contato pelo WhatsApp oficial.
`.trim();
