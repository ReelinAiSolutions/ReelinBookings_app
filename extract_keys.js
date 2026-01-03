const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach(l => {
    if (l.includes('RESEND_API_KEY')) console.log('RESEND:' + l);
    if (l.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) console.log('ANON:' + l);
});
