import { createClient } from '@supabase/supabase-js';

// Substitui com os dados reais do teu projeto no Supabase (Project Settings -> API)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ainyvahxezmeamixcits.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbnl2YWh4ZXptZWFtaXhjaXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0ODM3ODgsImV4cCI6MjA5ODA1OTc4OH0.2tvxJLfgVjm_4IaW4uVBn9QvNm8Vk1kbDUfNZVD_53c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);