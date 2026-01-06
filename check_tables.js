
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

async function listTables() {
    const { data, error } = await supabase.from('organizations').select('id, name').limit(1);
    console.log('Org Check:', data || error);

    // information_schema is usually restricted, but some Supabase setups allow it via RPC or specific views.
    // Let's try to select from a non-existent table to see the error message (it might list suggestions).
    const { error: err2 } = await supabase.from('non_existent_table').select('*').limit(1);
    console.log('Error hint:', err2?.message);

    // Try to get count of staff and services too
    const { count: srvCount } = await supabase.from('services').select('*', { count: 'exact', head: true });
    console.log('Services Count (Anon):', srvCount);

    const { count: stfCount } = await supabase.from('staff').select('*', { count: 'exact', head: true });
    console.log('Staff Count (Anon):', stfCount);
}

listTables();
