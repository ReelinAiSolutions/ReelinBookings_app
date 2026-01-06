
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

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    // Check total appointments
    const { count: totalApts, error: err1 } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

    console.log('Total Appointments in DB:', totalApts);
    if (err1) console.error('Error 1:', err1);

    // Check organizations
    const { data: orgs, error: err2 } = await supabase
        .from('organizations')
        .select('id, name');

    console.log('Organizations:', orgs);
    if (err2) console.error('Error 2:', err2);

    if (orgs && orgs.length > 0) {
        // Check appointments for the first org
        const { count: orgApts, error: err3 } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgs[0].id);

        console.log(`Appointments for Org ${orgs[0].name}:`, orgApts);
        if (err3) console.error('Error 3:', err3);
    }
}

checkData();
