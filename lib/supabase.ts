/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase environment variables are missing. Please check .env.local');
}

// Fallback to hardcoded values if env vars fail to load in Windows/Vite environment
const finalUrl = supabaseUrl || 'https://xihgmsmdcpufeennodlg.supabase.co';
const finalKey = supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpaGdtc21kY3B1ZmVlbm5vZGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzI5OTAsImV4cCI6MjA4MTY0ODk5MH0.BpDOOANvcTZG_gboCQKerVzWsbUiq_DACBzdBE3vJm8';

if (!supabaseUrl) {
    console.warn('Using hardcoded Supabase URL fallback');
}

export const supabase = createClient(finalUrl, finalKey);
