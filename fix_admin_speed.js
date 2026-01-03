const fs = require('fs');
const path = require('path');

const targetFile = 'src/app/admin/page.tsx';
const absPath = path.resolve(process.cwd(), targetFile);

if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
}

let content = fs.readFileSync(absPath, 'utf8');

// Regex to find the Promise.all block for fetching core data
const fetchRegex = /const\s+\[fetchedApts,\s*fetchedServices,\s*fetchedStaff,\s*fetchedAvailability\]\s*=\s*await\s*Promise\.all\(\[\s*getAppointments\(orgId\),\s*getServices\(orgId\),\s*getStaff\(orgId\),\s*getAllAvailability\(orgId\)\s*\]\);/;

if (!fetchRegex.test(content)) {
    console.error('Core fetch block not found. Checking alternate spacing...');
    // Alternate broader regex
    const broadRegex = /const\s+\[fetchedApts,\s*fetchedServices,\s*fetchedStaff,\s*fetchedAvailability\]\s*=\s*await\s*Promise\.all\([\s\S]*?getAppointments\(orgId\)[\s\S]*?\]\);/;

    if (broadRegex.test(content)) {
        const replacement = `const now = new Date();
            const startStr = format(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
            const endStr = format(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

            const [fetchedApts, fetchedServices, fetchedStaff, fetchedAvailability] = await Promise.all([
                getAppointments(orgId, startStr, endStr),
                getServices(orgId),
                getStaff(orgId),
                getAllAvailability(orgId)
            ]);`;

        content = content.replace(broadRegex, replacement);
        fs.writeFileSync(absPath, content);
        console.log('Successfully applied windowed fetch optimization.');
    } else {
        console.error('COULD NOT FIND TARGET BLOCK.');
    }
} else {
    const replacement = `const now = new Date();
            const startStr = format(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
            const endStr = format(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

            const [fetchedApts, fetchedServices, fetchedStaff, fetchedAvailability] = await Promise.all([
                getAppointments(orgId, startStr, endStr),
                getServices(orgId),
                getStaff(orgId),
                getAllAvailability(orgId)
            ]);`;
    content = content.replace(fetchRegex, replacement);
    fs.writeFileSync(absPath, content);
    console.log('Successfully applied windowed fetch optimization.');
}
