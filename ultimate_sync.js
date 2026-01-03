const fs = require('fs');
const webpush = require('web-push');

const URL = 'https://ovnwouiaaavwzocigu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bndvdWlhYWF2d3pvY2lndSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzQzMjI0MTQsImV4cCI6MjA0OTg5ODQxNH0.qIsP7D6t88-k0q6p7xQ30SrrrqPJ3Cer7GZ6KfCQehGWMhr';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bndvdWlhYWF2d3pvY2lndSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0MzIyNDE0LCJleHAiOjIwNDk4OTg0MTR9.sJ2m7P33-4KkG5963E8Pq-2l2D_2I';

console.log('--- ULTIMATE SYNC START ---');

// 1. Fresh VAPID
const v = webpush.generateVAPIDKeys();
console.log('Keys generated.');

// 2. Rebuild .env.local
const envContent = [
    `NEXT_PUBLIC_SUPABASE_URL=${URL}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}`,
    `SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}`,
    `VAPID_PUBLIC_KEY=${v.publicKey}`,
    `VAPID_PRIVATE_KEY=${v.privateKey}`,
    `VAPID_SUBJECT=mailto:admin@reelin.ca`,
    `# RESEND_API_KEY=re_Y9e8dc83_JL7GZ6KfCQ_PLACEHOLDER`
].join('\n');
fs.writeFileSync('.env.local', envContent);
console.log('.env.local rebuilt.');

// 3. Update NotificationManager.tsx
const managerPath = 'src/components/admin/NotificationManager.tsx';
let managerText = fs.readFileSync(managerPath, 'utf8');
const search = /const VAPID_PUBLIC_KEY = '.*';/;
const replace = `const VAPID_PUBLIC_KEY = '${v.publicKey}';`;
managerText = managerText.replace(search, replace);
fs.writeFileSync(managerPath, managerText);
console.log('NotificationManager.tsx updated.');

console.log('--- SYNC COMPLETE ---');
console.log('New VAPID Public Key:', v.publicKey);
