const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ovnwouiaaavwzocigu.supabase.co';
const supabaseKey = 'REDACTED_SERVICE_ROLE_KEY'; // I'll use the one from .env.local if I can see it.

// Actually, I'll just read the file and use its contents.
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);

async function run() {
    const { data: staff, error } = await supabase.from('staff').select('id, name, email, user_id');
    if (error) console.error(error);
    else console.log(JSON.stringify(staff, null, 2));
}
run();
