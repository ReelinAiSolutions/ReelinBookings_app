const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubs() {
    const { data, error } = await supabase
        .from('push_subscriptions')
        .select('count', { count: 'exact' });

    if (error) console.error(error);
    else console.log('Total Subscriptions:', data ? data.length : 0);

    const { data: list } = await supabase.from('push_subscriptions').select('*').limit(5);
    console.log('Recent:', list);
}

checkSubs();
