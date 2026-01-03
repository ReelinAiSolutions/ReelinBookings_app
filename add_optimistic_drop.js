const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const dropHandlerRegex = /(const handleAppointmentDrop = async \([\s\S]*?\)\s*=>\s*\{[\s\S]*?const dateStr = format\(newDate, 'yyyy-MM-dd'\);)/;
const optimisticInject = `

        // Optimistic Update: Move the card instantly in the UI
        setAppointments(prev => prev.map(a => 
            a.id === apt.id 
                ? { ...a, date: dateStr, timeSlot: newTime, staffId: newStaffId || a.staffId } 
                : a
        ));`;

if (dropHandlerRegex.test(content) && !content.includes('// Optimistic Update')) {
    content = content.replace(dropHandlerRegex, `$1${optimisticInject}`);
    fs.writeFileSync(filePath, content);
    console.log('Optimistic UI implemented in handleAppointmentDrop.');
} else {
    console.error('handleAppointmentDrop not found or already has optimistic update.');
}
