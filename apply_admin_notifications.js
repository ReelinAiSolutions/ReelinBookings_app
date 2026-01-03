const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'admin', 'page.tsx');
if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// 1. Add notifyStaff helper
const stateInsertionPoint = "const [selectedStaffId, setSelectedStaffId] = useState<string>('ALL');";
const helperFunction = `
    const notifyStaff = async (staffId: string, title: string, body: string, type: string = 'update') => {
        try {
            const target = staff.find(s => s.id === staffId);
            const recipientId = target?.userId || staffId;

            await fetch('/api/push-notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: recipientId,
                    title,
                    body,
                    url: '/staff?tab=schedule',
                    type
                })
            });
        } catch (e) {
            console.error("Staff notification failed:", e);
        }
    };
`;

if (content.includes(stateInsertionPoint) && !content.includes('const notifyStaff =')) {
    content = content.replace(stateInsertionPoint, stateInsertionPoint + helperFunction);
}

// 2. Update onReschedule
const onRescheduleRegex = /(const onReschedule = async \([\s\S]*?\)\s*=>\s*\{[\s\S]*?await loadDashboardData\(\);)(\s*\};)/;
const rescheduleNotify = `
        // Notify Staff
        notifyStaff(
            newStaffId,
            'Appointment Rescheduled 📅',
            \`Moved to \${newDate} at \${newTime}\`,
            'reschedule'
        );`;

if (onRescheduleRegex.test(content)) {
    content = content.replace(onRescheduleRegex, `$1${rescheduleNotify}$2`);
}

// 3. Update handleAppointmentDrop (Drag & Drop)
const dropRegex = /(const handleAppointmentDrop = async \([\s\S]*?\)\s*=>\s*\{[\s\S]*?await loadDashboardData\(\);)(\s*\};)/;
const dropNotify = `
        // Notify Staff
        notifyStaff(
            newStaffId || apt.staffId,
            'Schedule Updated 🔄',
            \`Appointment for \${apt.clientName} moved to \${newTime}\`,
            'reschedule'
        );`;

if (dropRegex.test(content)) {
    content = content.replace(dropRegex, `$1${dropNotify}$2`);
}

// 4. Update handleCreateConfirm (Manual Admin Booking)
const createRegex = /(const handleCreateConfirm = async \([\s\S]*?\)\s*=>\s*\{[\s\S]*?await loadDashboardData\(\);)(\s*\};)/;
const createNotify = `
        // Notify Staff
        notifyStaff(
            data.staffId,
            'New Booking (Admin) 📅',
            \`\${data.clientName} booked for \${data.timeSlot}\`,
            'new_booking'
        );`;

if (createRegex.test(content)) {
    content = content.replace(createRegex, `$1${createNotify}$2`);
}

fs.writeFileSync(filePath, content);
console.log('Admin notifications successfully implemented.');
