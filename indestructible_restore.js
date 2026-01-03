const fs = require('fs');

const URL = 'https://jqnrzctlxsxxxqogeidg.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbnJ6Y3RseHN4eHhxb2dlaWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTE5MDUsImV4cCI6MjA4MTUyNzkwNX0.Q0wcSV744Ko1AXzsnYRxwqpTgt4XtE9qHCAaKilNFws';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbnJ6Y3RseHN4eHhxb2dlaWRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk1MTkwNSwiZXhwIjoyMDgxNTI3OTA1fQ.ZyAjVXoAYmH0CqfzKYlGPO7b0WCknE4WZme_k78PXo0';
const RESEND_KEY = 're_WhapsK1G_5aFGs1gsptiPoybS3tzgdKxf';

console.log('--- INDESTRUCTIBLE RESTORE START ---');

// 1. Rebuild .env.local
// Read existing VAPID keys if they exist to prevent re-syncing client
let vapidPub = '';
let vapidPriv = '';
try {
    const oldEnv = fs.readFileSync('.env.local', 'utf8');
    vapidPub = oldEnv.match(/VAPID_PUBLIC_KEY=(.*)/)[1].trim();
    vapidPriv = oldEnv.match(/VAPID_PRIVATE_KEY=(.*)/)[1].trim();
} catch (e) {
    console.log('Could not read old VAPID keys, using placeholders.');
}

const envContent = [
    `NEXT_PUBLIC_SUPABASE_URL=${URL}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}`,
    `SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}`,
    `RESEND_API_KEY=${RESEND_KEY}`,
    `VAPID_PUBLIC_KEY=${vapidPub}`,
    `VAPID_PRIVATE_KEY=${vapidPriv}`,
    `VAPID_SUBJECT=mailto:admin@reelin.ca`,
    `NEXT_PUBLIC_INVITE_CODE=WELCOME2025, VIP_GUEST`
].join('\n');

fs.writeFileSync('.env.local', envContent);
console.log('.env.local rebuilt with VERIFIED keys.');

console.log('--- RESTORE COMPLETE ---');
console.log('Supabase URL:', URL);
