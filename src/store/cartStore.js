import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      carrinho: [],
      carrinhoAberto: false, // <-- Novo: controla se a aba está visível ou oculta

      // Função para abrir ou fechar o carrinho manualmente
      setCarrinhoAberto: (aberto) => set({ carrinhoAberto: aberto }), 
      
      adicionarAoCarrinho: (curso) => {
        const carrinhoAtual = get().carrinho;
        const jaExiste = carrinhoAtual.find((item) => item.id === curso.id);
        
        if (!jaExiste) {
          set({ 
            carrinho: [...carrinhoAtual, curso],
            carrinhoAberto: true // <-- Abre a aba automaticamente ao adicionar!
          });
        } else {
          set({ carrinhoAberto: true }); // Abre a aba para mostrar que já está lá
        }
      },

      removerDoCarrinho: (cursoId) => {
        set({
          carrinho: get().carrinho.filter((item) => item.id !== cursoId),
        });
      },

      limparCarrinho: () => set({ carrinho: [] }),
    }),
    {
      name: 'meu-carrinho-cursos',
      // Salva apenas a lista de produtos no navegador, ignorando se a aba estava aberta ou fechada
      partialize: (state) => ({ carrinho: state.carrinho }), 
    }
  )
);