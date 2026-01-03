const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/app/admin/page.tsx',
    'src/app/debug-admin/page.tsx',
    'src/app/debug/page.tsx',
    'src/app/page.tsx',
    'src/app/signup/page.tsx',
    'src/app/staff/page.tsx',
    'src/app/super-admin/page.tsx',
    'src/app/login/page.tsx',
    'src/components/AuthProvider.tsx',
    'src/components/admin/ProfileManager.tsx',
    'src/components/admin/ServiceFormModal.tsx',
    'src/components/admin/SettingsManager.tsx',
    'src/components/admin/StaffManager.tsx',
    'src/components/barber/StaffSettings.tsx'
];

filesToFix.forEach(relPath => {
    const absPath = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(absPath)) return;

    let content = fs.readFileSync(absPath, 'utf8');

    // Check if 'use client' is present but not at the top
    if (content.includes("'use client'") || content.includes('"use client"')) {
        const lines = content.split('\n');
        let directiveIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith("'use client'") || lines[i].trim().startsWith('"use client"')) {
                directiveIndex = i;
                break;
            }
        }

        if (directiveIndex > 0) {
            console.log(`Fixing directive in: ${relPath}`);
            const directiveLine = lines[directiveIndex];
            lines.splice(directiveIndex, 1); // Remove from current position
            lines.unshift(directiveLine);   // Add to very top
            fs.writeFileSync(absPath, lines.join('\n'));
        }
    }
});
