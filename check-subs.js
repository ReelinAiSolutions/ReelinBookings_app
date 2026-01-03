const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDiagnostics() {
    console.log('--- STAFF DATA ---');
    const { data: staff, error: staffErr } = await supabase
        .from('staff')
        .select('id, name, email, user_id');

    if (staffErr) console.error(staffErr);
    else console.table(staff);

    console.log('\n--- SUBSCRIPTION DATA ---');
    const { data: subs, error: subsErr } = await supabase
        .from('push_subscriptions')
        .select('user_id, created_at');

    if (subsErr) console.error(subsErr);
    else console.table(subs);

    const uid = staff.find(s => s.name.includes('Jake'))?.user_id;
    if (uid) {
        const hasSub = subs.some(s => s.user_id === uid);
        console.log(`\nJake's user_id: ${uid}`);
        console.log(`Has Active Subscription: ${hasSub ? 'YES' : 'NO'}`);
    } else {
        console.log('\nJake has NO user_id linked!');
    }
}

checkDiagnostics();
