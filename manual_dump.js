const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local to ensure we see exactly what the server sees
const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing keys in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- SYSTEM HEALTH CHECK ---');
    console.log('VAPID Public Key:', env.VAPID_PUBLIC_KEY ? '✅ Present' : '❌ MISSING');
    console.log('VAPID Private Key:', env.VAPID_PRIVATE_KEY ? '✅ Present' : '❌ MISSING');

    console.log('\n--- STAFF MAPPING ---');
    const { data: staff } = await supabase.from('staff').select('name, email, user_id');
    staff.forEach(s => {
        console.log(`- ${s.name} (${s.email}): ${s.user_id ? '✅ LINKED (' + s.user_id.substring(0, 8) + '...)' : '❌ NO LINK'}`);
    });

    const { data: subs } = await supabase.from('push_subscriptions').select('user_id');
    console.log('\n--- ACTIVE SUBSCRIPTIONS ---');
    console.log('Total Subscriptions:', subs?.length || 0);

    // Check if JAKE has a subscription
    const jake = staff.find(s => s.name.toLowerCase().includes('jake') && s.user_id);
    if (jake) {
        const hasSub = subs.some(sub => sub.user_id === jake.user_id);
        console.log(`Jake (${jake.user_id.substring(0, 8)}...): ${hasSub ? '✅ HAS PUSH DEVICE' : '❌ NO PUSH DEVICE'}`);
    } else {
        console.log('Jake: ❌ NOT LINKED TO ANY USER');
    }
}

check();
