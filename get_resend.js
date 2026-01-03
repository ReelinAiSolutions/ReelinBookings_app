const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
const match = content.match(/RESEND_API_KEY=([^\s\r\n]+)/);
if (match) {
    console.log('--- FOUND RESEND ---');
    console.log(match[1]);
    console.log('--- END ---');
} else {
    console.log('RESEND NOT FOUND');
}
