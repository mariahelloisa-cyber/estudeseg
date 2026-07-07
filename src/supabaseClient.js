import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Bloqueia a execução do app se as variáveis sumirem no deploy
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'ERRO CRÍTICO: As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram encontradas no arquivo .env!'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);