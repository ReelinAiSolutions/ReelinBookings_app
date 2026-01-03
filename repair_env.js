const fs = require('fs');
const path = '.env.local';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);

// Filter out all VAPID lines
const newLines = lines.filter(l => l.trim() !== '' && !l.startsWith('VAPID_'));

// Add the correct, verified VAPID keys
newLines.push('VAPID_PUBLIC_KEY=BH4VKL1kQkq-TB90SgTYYS-N2AfZpfh6Tau7LA7yv2WOb-7gxhiXA72Xut5nKASWtZ2AFH2ezTLw_Lv0AeLtdTc');
newLines.push('VAPID_PRIVATE_KEY=DK4oqIaxjsC89nTzyay_nQ/D1uG3dgnVdxjfecY3Tyj1D-4KkG5963E8Pq-2l2D_2I=');
newLines.push('VAPID_SUBJECT=mailto:admin@reelin.ca');

fs.writeFileSync(path, newLines.join('\n'));
console.log('Environment repaired with full VAPID keys.');
