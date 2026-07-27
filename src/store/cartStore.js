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
            carrinhoAberto: true 
          });
        } else {
          set({ carrinhoAberto: true }); 
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
     
      partialize: (state) => ({ carrinho: state.carrinho }), 
    }
  )
);