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
    'src/components/admin/ProfileManager.tsx',
    'src/components/admin/ServiceFormModal.tsx',
    'src/components/admin/SettingsManager.tsx',
    'src/components/admin/StaffManager.tsx',
    'src/components/barber/StaffSettings.tsx'
];

filesToFix.forEach(relPath => {
    const absPath = path.resolve(process.cwd(), relPath);
    if (!fs.existsSync(absPath)) {
        console.log(`Skipping missing file: ${relPath}`);
        return;
    }

    let content = fs.readFileSync(absPath, 'utf8');

    // 1. Update Imports
    const hasSsrImport = /import\s*\{\s*createBrowserClient\s*\}\s*from\s*['"]@supabase\/ssr['"];?/.test(content);
    if (hasSsrImport) {
        content = content.replace(/import\s*\{\s*createBrowserClient\s*\}\s*from\s*['"]@supabase\/ssr['"];?/, '');
    }

    // Add @/lib/supabase import if not present
    if (!content.includes("from '@/lib/supabase'")) {
        content = "import { createClient } from '@/lib/supabase';\n" + content;
    }

    // 2. Update Initialization
    const broadRegex = /const\s+supabase\s*=\s*createBrowserClient\([\s\S]*?\);?/;
    if (broadRegex.test(content)) {
        content = content.replace(broadRegex, 'const supabase = createClient();');
    }

    fs.writeFileSync(absPath, content);
    console.log(`Fixed: ${relPath}`);
});
