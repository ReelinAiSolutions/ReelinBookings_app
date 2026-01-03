const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

// 1. Generate fresh keys
console.log('Generating fresh VAPID keys...');
const keys = webpush.generateVAPIDKeys();
const public_key = keys.publicKey;
const private_key = keys.privateKey;

// 2. Update .env.local
console.log('Updating .env.local...');
const envPath = '.env.local';
let envContent = fs.readFileSync(envPath, 'utf8');
let envLines = envContent.split(/\r?\n/);
// Filter out old VAPID lines
envLines = envLines.filter(l => !l.startsWith('VAPID_'));
// Add new ones
envLines.push(`VAPID_PUBLIC_KEY=${public_key}`);
envLines.push(`VAPID_PRIVATE_KEY=${private_key}`);
envLines.push(`VAPID_SUBJECT=mailto:admin@reelin.ca`);
fs.writeFileSync(envPath, envLines.join('\n'));

// 3. Update NotificationManager.tsx
console.log('Updating NotificationManager.tsx...');
const managerPath = 'src/components/admin/NotificationManager.tsx';
let managerContent = fs.readFileSync(managerPath, 'utf8');
const searchString = /const VAPID_PUBLIC_KEY = '.*';/;
const replacementString = `const VAPID_PUBLIC_KEY = '${public_key}';`;
managerContent = managerContent.replace(searchString, replacementString);
fs.writeFileSync(managerPath, managerContent);

console.log('--- REPAIR COMPLETE ---');
console.log('New Public Key:', public_key);
console.log('New Private Key (First 10):', private_key.substring(0, 10) + '...');
console.log('Server and Client are now in sync.');
console.log('-----------------------');
