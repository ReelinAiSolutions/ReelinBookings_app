const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const onCancelRegex = /(const onCancel = async \(id: string\) => \{[\s\S]*?await cancelAppointment\(id\);[\s\S]*?await loadDashboardData\(\);)(\s*\};)/;
const cancelNotify = `
        const apt = appointments.find(a => a.id === id);
        if (apt) {
            notifyStaff(
                apt.staffId,
                'Appointment Cancelled ❌',
                \`\${apt.clientName} cancelled for \${apt.date} at \${apt.timeSlot}\`,
                'cancellation'
            );
        }`;

if (onCancelRegex.test(content)) {
    content = content.replace(onCancelRegex, `$1${cancelNotify}$2`);
    fs.writeFileSync(filePath, content);
    console.log('Cancellation notifications implemented.');
} else {
    console.error('onCancel block not found.');
}
