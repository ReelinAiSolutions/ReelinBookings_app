const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function dumpStaff() {
    try {
        const env = fs.readFileSync('.env.local', 'utf8');
        const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
        const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

        const supabase = createClient(url, key);
        const { data, error } = await supabase.from('staff').select('*');

        if (error) {
            console.error('Error fetching staff:', error);
            return;
        }

        console.log('--- STAFF TABLE DUMP ---');
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Execution failed:', err.message);
    }
}

dumpStaff();
