const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update notifyStaff helper signature and URL
const notifyStaffRegex = /const notifyStaff = async \(staffId: string, title: string, body: string, type: string = 'update'\) => \{([\s\S]*?)url: '\/staff\?tab=schedule',([\s\S]*?)\};/;
const updatedNotifyStaff = `const notifyStaff = async (staffId: string, title: string, body: string, appointmentId?: string, type: string = 'update') => {
        try {
            const target = staff.find(s => s.id === staffId);
            const recipientId = target?.userId || staffId;

            const deepLink = appointmentId ? \`&appointmentId=\${appointmentId}\` : '';

            await fetch('/api/push-notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: recipientId,
                    title,
                    body,
                    url: \`/staff?tab=schedule\${deepLink}\`,
                    type
                })
            });
        } catch (e) {
            console.error("Staff notification failed:", e);
        }
    };`;

if (content.includes('const notifyStaff =')) {
    content = content.replace(/const notifyStaff = async \(\s*staffId: string,\s*title: string,\s*body: string,\s*type: string = 'update'\s*\) => \{[\s\S]*?url: '\/staff\?tab=schedule',[\s\S]*?\};/, updatedNotifyStaff);
}

// 2. Update onReschedule call
content = content.replace(/notifyStaff\(\s*newStaffId,\s*'Appointment Rescheduled 📅',([\s\S]*?),'reschedule'\s*\);/, \`notifyStaff(
            newStaffId,
            'Appointment Rescheduled 📅',
            $1,
            id,
            'reschedule'
        );\`);

// 3. Update onCancel call (cancellation usually doesn't need a deep link as it's gone, but good for context if it's archived)
// Actually, deep linking to a cancelled appt might not be useful, but let's keep it consistent.
content = content.replace(/notifyStaff\(\s*apt\.staffId,\s*'Appointment Cancelled ❌',([\s\S]*?),'cancellation'\s*\);/, \`notifyStaff(
                apt.staffId,
                'Appointment Cancelled ❌',
                $1,
                id,
                'cancellation'
            );\`);

// 4. Update handleAppointmentDrop call
content = content.replace(/notifyStaff\(\s*newStaffId \|\| apt\.staffId,\s*'Schedule Updated 🔄',([\s\S]*?),'reschedule'\s*\);/, \`notifyStaff(
            newStaffId || apt.staffId,
            'Schedule Updated 🔄',
            $1,
            apt.id,
            'reschedule'
        );\`);

// 5. Update handleCreateConfirm call
content = content.replace(/(const created = await createAppointment\([\s\S]*?\);[\s\S]*?notifyStaff\(\s*data\.staffId,\s*'New Booking \(Admin\) 📅',[\s\S]*?)'new_booking'\s*\);/, \`$1created.id, 'new_booking');\`);
// Note: handleCreateConfirm might not have 'const created =' yet, let me check.

if (!content.includes('const created = await createAppointment')) {
    content = content.replace(/await createAppointment\([\s\S]*?\);/, (match) => 'const created = ' + match);
}

fs.writeFileSync(filePath, content);
console.log('Admin notifications updated with deep links.');
