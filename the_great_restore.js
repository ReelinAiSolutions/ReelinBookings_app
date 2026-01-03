const fs = require('fs');
const webpush = require('web-push');

const URL = 'https://ovnwouiaaavwzocigu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bndvdWlhYWF2d3pvY2lndSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzQzMjI0MTQsImV4cCI6MjA0OTg5ODQxNH0.qIsP7D6t88-k0q6p7xQ30SrrrqPJ3Cer7GZ6KfCQehGWMhr';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bndvdWlhYWF2d3pvY2lndSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0MzIyNDE0LCJleHAiOjIwNDk4OTg0MTR9.sJ2m7P33-4KkG5963E8Pq-2l2D_2I';
const INVITE = 'WELCOME2025, VIP_GUEST';

// Generate BRAND NEW FRESH VAPID
const v = webpush.generateVAPIDKeys();

const lines = [
    `NEXT_PUBLIC_SUPABASE_URL=${URL}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}`,
    `SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}`,
    `NEXT_PUBLIC_INVITE_CODE=${INVITE}`,
    `VAPID_PUBLIC_KEY=${v.publicKey}`,
    `VAPID_PRIVATE_KEY=${v.privateKey}`,
    `VAPID_SUBJECT=mailto:admin@reelin.ca`,
    `# RESEND_API_KEY=PLACEHOLDER_FIX_ME`
];

fs.writeFileSync('.env.local', lines.join('\n'));
console.log('--- RESTORE COMPLETE ---');
console.log('Public Key for NotificationManager: ' + v.publicKey);
