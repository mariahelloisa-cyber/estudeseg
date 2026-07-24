// Só aceita links http(s): bloqueia esquemas perigosos como javascript:
export function sanitizarLinkExterno(url) {
  return /^https?:\/\//i.test(url || '') ? url : null;
}
