import { useState } from 'react';

export default function WhatsAppButton() {
  const [balaoAberto, setBalaoAberto] = useState(true);

  const numero = '5527998392172';
  const mensagem = 'Olá! Gostaria de falar com um consultor da Estude Seguro.';
  const link = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {balaoAberto && (
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 py-3 pl-4 pr-9 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            type="button"
            onClick={() => setBalaoAberto(false)}
            aria-label="Fechar"
            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
          >
            &#10005;
          </button>
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="block text-sm font-bold text-gray-800 no-underline whitespace-nowrap"
          >
            Fale com um consultor
          </a>
          <span className="absolute -bottom-1.5 right-7 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45" />
        </div>
      )}

      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar no WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5a] shadow-lg flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.52 3.48A11.93 11.93 0 0012.04 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.86 11.86 0 005.64 1.44h.01c6.54 0 11.85-5.3 11.85-11.85 0-3.17-1.23-6.15-3.38-8.43zM12.04 21.3a9.4 9.4 0 01-4.8-1.32l-.34-.2-3.58.94.96-3.5-.22-.36a9.44 9.44 0 01-1.45-5.01c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.9.99 6.69 2.78a9.4 9.4 0 012.77 6.7c0 5.22-4.25 9.44-9.51 9.44zm5.2-7.09c-.28-.14-1.67-.82-1.93-.92-.26-.1-.45-.14-.64.14-.19.28-.74.92-.9 1.1-.17.19-.33.21-.61.07-.28-.14-1.19-.44-2.26-1.4-.84-.75-1.4-1.67-1.57-1.95-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.5-.07-.14-.64-1.53-.87-2.1-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.35-.26.28-1 1-1 2.42 0 1.42 1.02 2.8 1.17 3 .14.19 2 3.05 4.84 4.28.68.29 1.2.47 1.62.6.68.22 1.3.19 1.79.11.55-.08 1.67-.68 1.9-1.34.24-.66.24-1.22.17-1.34-.07-.12-.26-.19-.54-.33z" />
        </svg>
      </a>
    </div>
  );
}
