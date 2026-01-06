
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
        }
    });
    return env;
}

const env = getEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
    const { data, error } = await supabase.rpc('check_table_counts_override');
    if (error) {
        console.log('RPC check_table_counts_override not found or failed. Trying standard select...');
        const { count, error: err2 } = await supabase.from('appointments').select('*', { count: 'exact', head: true });
        console.log('Standard Appointment Count (Anon):', count);
        if (err2) console.log('Error:', err2.message);
    } else {
        console.log('Table Counts (Bypass):', data);
    }
}

checkPolicies();
