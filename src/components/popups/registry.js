import { PhotoIcon, TicketIcon, EnvelopeIcon, GiftIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline';
import PopupBanner from './templates/PopupBanner';
import PopupCupom from './templates/PopupCupom';
import PopupCaptura from './templates/PopupCaptura';
import PopupCadastro from './templates/PopupCadastro';
import PopupBannerBotao from './templates/PopupBannerBotao';

// Registro central dos modelos de pop-up. Cada entrada descreve:
// - `campos`: usados pelo admin para montar o formulário automaticamente (ver CampoFormulario.jsx)
// - `Componente`: desenha o pop-up de verdade — o MESMO componente é usado na prévia do
//   admin (miniatura e modal de prévia) e na renderização real do site público.
//
// Para adicionar um modelo novo no futuro: criar um componente em ./templates e incluir
// uma entrada aqui. Não é preciso alterar admin.jsx, PopupAvisos.jsx nem o banco de dados
// (os campos específicos do modelo ficam livres na coluna `dados`, em JSON).
export const MODELOS_POPUP = [
  {
    chave: 'banner',
    rotulo: 'Imagem / Banner',
    descricao: 'Só a imagem, em tela cheia. Ideal para uma arte já pronta.',
    Icon: PhotoIcon,
    variante: 'imagem',
    campos: [
      { nome: 'imagem_url', rotulo: 'Imagem do Pop-up', tipo: 'imagem', obrigatorio: true },
      { nome: 'link_redirecionamento', rotulo: 'Link de Redirecionamento (opcional)', tipo: 'url', obrigatorio: false, placeholder: 'https://...' },
    ],
    dadosExemplo: { imagem_url: '', link_redirecionamento: '' },
    Componente: PopupBanner,
  },
  {
    chave: 'cupom',
    rotulo: 'Cupom / Oferta',
    descricao: 'Destaca um código de cupom com botão de copiar.',
    Icon: TicketIcon,
    variante: 'cartao',
    campos: [
      { nome: 'imagem_url', rotulo: 'Imagem (opcional)', tipo: 'imagem', obrigatorio: false },
      { nome: 'titulo', rotulo: 'Título', tipo: 'texto', obrigatorio: true, placeholder: 'Ex: Oferta relâmpago' },
      { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea', obrigatorio: false },
      { nome: 'cupom_codigo', rotulo: 'Código do Cupom', tipo: 'texto', obrigatorio: true, placeholder: 'Ex: ESTUDE10' },
      { nome: 'botao_texto', rotulo: 'Texto do Botão', tipo: 'texto', obrigatorio: false, placeholder: 'Aproveitar oferta' },
      { nome: 'botao_link', rotulo: 'Link do Botão (opcional)', tipo: 'url', obrigatorio: false, placeholder: 'https://...' },
    ],
    dadosExemplo: {
      titulo: 'Oferta relâmpago',
      descricao: 'Use o cupom abaixo e garanta desconto na matrícula.',
      cupom_codigo: 'ESTUDE10',
      botao_texto: 'Aproveitar oferta',
    },
    Componente: PopupCupom,
  },
  {
    chave: 'captura',
    rotulo: 'Captura com Imagem',
    descricao: 'Imagem de um lado e formulário de e-mail do outro. Ideal pra oferecer um guia ou material gratuito.',
    Icon: EnvelopeIcon,
    variante: 'dividido',
    campos: [
      { nome: 'imagem_url', rotulo: 'Imagem', tipo: 'imagem', obrigatorio: true },
      { nome: 'titulo', rotulo: 'Título', tipo: 'texto', obrigatorio: true, placeholder: 'Ex: Receba nosso guia gratuito' },
      { nome: 'campo_email_label', rotulo: 'Texto do campo de e-mail (placeholder)', tipo: 'texto', obrigatorio: false, placeholder: 'Endereço de e-mail' },
      { nome: 'botao_texto', rotulo: 'Texto do Botão', tipo: 'texto', obrigatorio: false, placeholder: 'Enviar' },
      { nome: 'texto_privacidade', rotulo: 'Texto de privacidade (opcional)', tipo: 'textarea', obrigatorio: false, placeholder: 'Respeitamos sua privacidade. Cancele quando quiser.' },
    ],
    dadosExemplo: {
      imagem_url: '',
      titulo: 'Receba nosso guia gratuito',
      campo_email_label: 'Endereço de e-mail',
      botao_texto: 'Enviar',
      texto_privacidade: 'Respeitamos sua privacidade. Cancele quando quiser.',
    },
    Componente: PopupCaptura,
  },
  {
    chave: 'cadastro',
    rotulo: 'Cadastro com Desconto',
    descricao: 'Imagem com selo de desconto sobreposto e formulário de nome e e-mail.',
    Icon: GiftIcon,
    variante: 'cartao',
    campos: [
      { nome: 'imagem_url', rotulo: 'Imagem', tipo: 'imagem', obrigatorio: true },
      { nome: 'badge_texto', rotulo: 'Texto do Selo de Destaque', tipo: 'textarea', obrigatorio: true, placeholder: 'Ex: Cadastre-se e ganhe 10% OFF' },
      { nome: 'campo_nome_placeholder', rotulo: 'Texto do campo Nome (placeholder)', tipo: 'texto', obrigatorio: false, placeholder: 'Nome' },
      { nome: 'campo_email_placeholder', rotulo: 'Texto do campo E-mail (placeholder)', tipo: 'texto', obrigatorio: false, placeholder: 'E-mail' },
      { nome: 'botao_texto', rotulo: 'Texto do Botão', tipo: 'texto', obrigatorio: false, placeholder: 'Cadastrar' },
    ],
    dadosExemplo: {
      imagem_url: '',
      badge_texto: 'Cadastre-se e ganhe 10% OFF',
      campo_nome_placeholder: 'Nome',
      campo_email_placeholder: 'E-mail',
      botao_texto: 'Cadastrar',
    },
    Componente: PopupCadastro,
  },
  {
    chave: 'banner-botao',
    rotulo: 'Banner com Botão',
    descricao: 'Imagem retangular, tela cheia, com um botão de ação sobreposto.',
    Icon: CursorArrowRaysIcon,
    variante: 'imagem',
    campos: [
      { nome: 'imagem_url', rotulo: 'Imagem do Pop-up', tipo: 'imagem', obrigatorio: true },
      { nome: 'botao_texto', rotulo: 'Texto do Botão', tipo: 'texto', obrigatorio: true, placeholder: 'Ex: Quero fazer!' },
      { nome: 'botao_link', rotulo: 'Link do Botão (opcional)', tipo: 'url', obrigatorio: false, placeholder: 'https://...' },
    ],
    dadosExemplo: { imagem_url: '', botao_texto: 'Quero fazer!', botao_link: '' },
    Componente: PopupBannerBotao,
  },
];

export function obterModeloPopup(chave) {
  return MODELOS_POPUP.find((modelo) => modelo.chave === chave) || MODELOS_POPUP[0];
}

// Confere se um pop-up tem preenchidos ao menos os campos obrigatórios do seu modelo —
// usado no site público pra nunca exibir um pop-up mal configurado (ex.: sem imagem).
export function popupTemDadosMinimos(modelo, dados) {
  return modelo.campos.every((campo) => !campo.obrigatorio || !!String(dados?.[campo.nome] || '').trim());
}
