const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
const lines = content.split('\n');
console.log('--- ENV VALIDATION ---');
lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed) {
        const [key, ...REST] = line.split('=');
        const val = REST.join('=');
        console.log(`[${i + 1}] ${key} = "${val}" (Len: ${val.length})`);
    }
});
console.log('--- END ---');
