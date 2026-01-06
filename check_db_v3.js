
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

async function checkAll() {
    const { data: orgs } = await supabase.from('organizations').select('*');
    console.log('--- ALL ORGANIZATIONS ---');
    console.log(orgs);

    for (const org of orgs || []) {
        const { count } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id);
        console.log(`Appointments for ${org.name} (${org.id}): ${count}`);
    }

    const { count: total } = await supabase.from('appointments').select('*', { count: 'exact', head: true });
    console.log('Total Appointments (No filter):', total);
}

checkAll();
