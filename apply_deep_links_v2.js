const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update notifyStaff helper
const updatedNotifyStaff = \`const notifyStaff = async (staffId: string, title: string, body: string, appointmentId?: string, type: string = 'update') => {
        try {
            const target = staff.find(s => s.id === staffId);
            const recipientId = target?.userId || staffId;

            const deepLink = appointmentId ? \\\`&appointmentId=\\\${appointmentId}\\\` : '';

            await fetch('/api/push-notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: recipientId,
                    title,
                    body,
                    url: \\\`/staff?tab=schedule\\\${deepLink}\\\`,
                    type
                })
            });
        } catch (e) {
            console.error("Staff notification failed:", e);
        }
    };\`;

// Replace the old notifyStaff
content = content.replace(/const notifyStaff = async \(\s*staffId: string,\s*title: string,\s*body: string,\s*type: string = 'update'\s*\) => \{[\s\S]*?url: '\/staff\?tab=schedule',[\s\S]*?\};/, updatedNotifyStaff);

// 2. Update onReschedule call
content = content.replace(/notifyStaff\(\s*newStaffId,\s*'Appointment Rescheduled 📅',([\s\S]*?),'reschedule'\s*\);/, \`notifyStaff(
            newStaffId,
            'Appointment Rescheduled 📅',
            $1,
            id,
            'reschedule'
        );\`);

// 3. Update onCancel call
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

// 5. Update handleCreateConfirm
content = content.replace(/await createAppointment\(\{([\s\S]*?)\}, currentOrg\.id\);/, \`const created = await createAppointment({$1}, currentOrg.id);\`);
content = content.replace(/notifyStaff\(\s*data\.staffId,\s*'New Booking \(Admin\) 📅',([\s\S]*?),'new_booking'\s*\);/, \`notifyStaff(
            data.staffId,
            'New Booking (Admin) 📅',
            $1,
            created.id,
            'new_booking'
        );\`);

// 6. Update Reassignment notifications (Staff Swaps) - already handled by p3 in regex? 
// No, the reassignment logic I added earlier needs updating too.
content = content.replace(/notifyStaff\(\s*oldStaffId,\s*'Appointment Reassigned 📤',([\s\S]*?),'reassignment'\s*\);/g, \`notifyStaff(
                oldStaffId,
                'Appointment Reassigned 📤',
                $1,
                undefined, // original staff doesn't need to link to an appt they no longer have?
                'reassignment'
            );\`);
// Wait, actually reassigned AWAY means it's gone from their view. Maybe link anyway? 
// The user said "everytime a notification comes in... go to the booking".
// If it's reassigned, the new person should go to it. The old person... maybe not.
// But let's look at the Reassigned notification for handleAppointmentDrop.
content = content.replace(/notifyStaff\(\s*oldStaffId,\s*'Appointment Removed 📤',([\s\S]*?),'reassignment'\s*\);/g, \`notifyStaff(
                oldStaffId,
                'Appointment Removed 📤',
                $1,
                undefined,
                'reassignment'
            );\`);

fs.writeFileSync(filePath, content);
console.log('Admin notifications updated with deep links.');
