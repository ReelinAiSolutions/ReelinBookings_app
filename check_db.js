
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { count: clientCount, error: clientError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

    if (clientError) console.error('Appointment Error:', clientError);
    else console.log('Appointment Count:', clientCount);

    const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id, name');

    if (orgError) console.error('Org Error:', orgError);
    else console.log('Organizations:', orgs);
}

checkData();
