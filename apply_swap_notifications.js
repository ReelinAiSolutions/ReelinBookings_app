const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// helper regex to find staff names
const getNameSnippet = `
        const getStaffName = (id) => staff.find(s => s.id === id)?.name || 'another staff member';
`;

// 1. Update onReschedule to handle swaps
const onRescheduleRegex = /(const onReschedule = async \([\s\S]*?\)\s*=>\s*\{)([\s\S]*?await loadDashboardData\(\);)([\s\S]*?notifyStaff\([\s\S]*?newStaffId,[\s\S]*?'reschedule'[\s\S]*?\);)(\s*\};)/;
if (onRescheduleRegex.test(content)) {
    content = content.replace(onRescheduleRegex, (match, p1, p2, p3, p4) => {
        const injectOriginalLookup = `
        const originalApt = appointments.find(a => a.id === id);
        const oldStaffId = originalApt?.staffId;
        `;
        const injectOriginalNotify = `
        // Notify Original Staff if reassigned away
        if (oldStaffId && oldStaffId !== newStaffId) {
            notifyStaff(
                oldStaffId,
                'Appointment Reassigned 📤',
                \`\${originalApt?.clientName}'s booking was moved to \${staff.find(s => s.id === newStaffId)?.name || 'someone else'}\`,
                'reassignment'
            );
        }
        `;
        return p1 + injectOriginalLookup + p2 + p3 + injectOriginalNotify + p4;
    });
}

// 2. Update handleAppointmentDrop to handle swaps
const dropRegex = /(const handleAppointmentDrop = async \([\s\S]*?newStaffId\?: string\) => \{)([\s\S]*?await loadDashboardData\(\);)([\s\S]*?notifyStaff\([\s\S]*?newStaffId \|\| apt\.staffId,[\s\S]*?'reschedule'[\s\S]*?\);)(\s*\};)/;
if (dropRegex.test(content)) {
    content = content.replace(dropRegex, (match, p1, p2, p3, p4) => {
        const injectOldStaffCheck = `
        const oldStaffId = apt.staffId;
        const finalStaffId = newStaffId || oldStaffId;
        `;
        const injectRemovalNotify = `
        // Notify Original Staff if reassigned away
        if (oldStaffId !== finalStaffId) {
            notifyStaff(
                oldStaffId,
                'Appointment Removed 📤',
                \`\${apt.clientName}'s booking was reassigned to \${staff.find(s => s.id === finalStaffId)?.name || 'another member'}\`,
                'reassignment'
            );
        }
        `;
        return p1 + injectOldStaffCheck + p2 + p3 + injectRemovalNotify + p4;
    });
}

fs.writeFileSync(filePath, content);
console.log('Dual-notifications for staff swaps implemented.');
