const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ovnwouiaaavwzocigu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bndvdWlhYWF2d3pvY2lndSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzQzMjI0MTQsImV4cCI6MjA0OTg5ODQxNH0.qIsP7D6t88-k0q6p7xQ30SrrrqPJ3Cer7GZ6KfCQehGWMhr';

const supabase = createClient(supabaseUrl, supabaseKey);

async function dump() {
    console.log('--- START DIAGNOSTIC ---');
    const staffRes = await supabase.from('staff').select('*');
    if (staffRes.error) console.error('Staff Error:', staffRes.error);
    else console.log('Staff Count:', staffRes.data?.length);

    const subsRes = await supabase.from('push_subscriptions').select('*');
    if (subsRes.error) console.error('Subs Error:', subsRes.error);
    else console.log('Subs Count:', subsRes.data?.length);

    if (staffRes.data) {
        console.log('STAFF_LIST:');
        staffRes.data.forEach(s => {
            console.log(`- ${s.name} (${s.email}) | ID: ${s.id} | UserID: ${s.user_id}`);
        });
    }

    if (subsRes.data) {
        console.log('SUBS_LIST:');
        subsRes.data.forEach(s => {
            console.log(`- User: ${s.user_id} | Created: ${s.created_at}`);
        });
    }
    console.log('--- END DIAGNOSTIC ---');
}

dump();
