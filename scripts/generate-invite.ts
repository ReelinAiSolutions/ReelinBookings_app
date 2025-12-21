
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use SERVICE_ROLE_KEY for admin bypass, or ANON_KEY if using RLS with login (but script should likely use Service Role)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Environment Variables.');
    console.error('Make sure .env.local exists and contains:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL');
    console.error('  SUPABASE_SERVICE_ROLE_KEY (You may need to find this in your Supabase Dashboard)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const count = parseInt(process.argv[2]) || 1;

async function generateCodeBatch() {
    console.log(`🚀 Generating ${count} Owner Key(s)...`);

    for (let i = 0; i < count; i++) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomPart = '';
        for (let j = 0; j < 5; j++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const code = `OWNER-${randomPart}`;

        const { error } = await supabase
            .from('invitations')
            .insert([{
                code,
                role: 'owner',
                org_id: null,
            }]);

        if (error) {
            console.error(`❌ Error generating key ${i + 1}:`, error.message);
        } else {
            console.log(`✅ [${i + 1}/${count}] Key: ${code}`);
        }
    }
    console.log('\n✨ Batch complete!');
}

generateCodeBatch();
