import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rtgcxbibcxstdfsfgonx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_aa7PCvVN1dzcNGpouR35DQ_1yV6-M1z';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testConnection() {
  console.log('🔄 Connecting to Supabase project...');
  
  // Try querying profiles or auth
  const { data, error } = await supabase.from('profiles').select('*').limit(5);

  if (error) {
    console.log('ℹ️ Supabase Response:', error.message);
    if (error.message.includes('relation "public.profiles" does not exist')) {
      console.log('👉 REASON FOR EMPTY TABLE EDITOR: The SQL tables have not been created yet in PostgreSQL schema!');
    }
  } else {
    console.log('✅ Connected successfully! Found', data.length, 'profiles in Supabase.');
  }
}

testConnection();
