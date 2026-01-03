const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
console.log('--- START ---');
console.log(content);
console.log('--- END ---');
