const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ovnwouiaaavwzocigu.supabase.co';
const supabaseKey = 'service_role_key_here'; // Internal use only

async function dump() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: staff } = await supabase.from('staff').select('*');
    const { data: subs } = await supabase.from('push_subscriptions').select('*');

    const output = {
        timestamp: new Date().toISOString(),
        staff: staff || [],
        subscriptions: subs || []
    };

    fs.writeFileSync('db_dump.json', JSON.stringify(output, null, 2));
    console.log('Dump complete: db_dump.json');
}

dump();
