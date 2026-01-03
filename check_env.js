const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
const lines = content.split(/\r?\n/);
console.log('Total Lines:', lines.length);
lines.forEach((l, i) => {
    console.log(`Line ${i + 1} (${l.length} chars): ${l.substring(0, 15)}...`);
});
if (lines.some(l => l.includes('VAPID_PRIVATE_KEY'))) {
    console.log('✅ Found VAPID_PRIVATE_KEY in file!');
} else {
    console.log('❌ VAPID_PRIVATE_KEY NOT FOUND in file!');
}
