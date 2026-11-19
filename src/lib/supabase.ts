import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mxlrjftjejscevccykja.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bHJqZnRqZWpzY2V2Y2N5a2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxMjEwNjIsImV4cCI6MjExMDY5NzA2Mn0.DgOtBhEHQcpmRqUdhEcsREUGsewMOuILpzQpKxCTY0I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
