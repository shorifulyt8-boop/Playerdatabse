import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wbbthsnuzxqacctgmpwi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiYnRoc251enhxYWNjdGdtcHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDYyODEsImV4cCI6MjA4ODgyMjI4MX0.T6W8cgnFPes79SnYELP9WDE1zCRA0av_mIUCwbiUXLQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
