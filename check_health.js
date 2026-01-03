const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkHealth() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    console.log('--- Checking Staff ---');
    const { data: staff, error: staffError } = await supabase.from('staff').select('*');
    if (staffError) console.error(staffError);
    else staff.forEach(s => console.log(`Staff: ${s.name} | ID: ${s.id} | UserID: ${s.user_id} | Email: ${s.email}`));

    console.log('\n--- Checking Subscriptions ---');
    const { data: subs, error: subError } = await supabase.from('push_subscriptions').select('*');
    if (subError) console.error(subError);
    else subs.forEach(s => console.log(`Sub: ${s.user_id} | Created: ${s.created_at}`));

    // Cross-check: Do we have a subscription for EVERY linked userId?
    console.log('\n--- Gap Analysis ---');
    const linkedUserIds = [...new Set(staff.map(s => s.user_id).filter(Boolean))];
    linkedUserIds.forEach(uid => {
        const hasSub = subs.some(s => s.user_id === uid);
        console.log(`User ${uid}: ${hasSub ? '✅ HAS SUB' : '❌ NO SUB'}`);
    });
}

checkHealth();
