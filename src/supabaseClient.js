import { createClient } from '@supabase/supabase-js';

// Substitui com os dados reais do teu projeto no Supabase (Project Settings -> API)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mknvmcpnlytuzpuzelsn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnZtY3BubHl0dXpwdXplbHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5Nzc0ODQsImV4cCI6MjA5ODU1MzQ4NH0.Aw13cGZEZd2g_WrtWopgl2kVrX5Qt6US-2aB6O7V-8U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);