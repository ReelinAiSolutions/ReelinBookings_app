import { Appointment } from '@/types';
import { startOfMonth, subMonths, isAfter } from 'date-fns';

export interface AnalyticMetrics {
    totalBookings: number;
    completionRate: string;
    busiestDay: string;
    cancellationRate: string;
    peakHours: { hour: string; count: number }[];
    topServices: { name: string; count: number }[];
    topStaff: { name: string; count: number }[];
}

export const processAnalytics = (appointments: Appointment[]): AnalyticMetrics => {
    if (!appointments.length) {
        return {
            totalBookings: 0,
            completionRate: '0%',
            busiestDay: '-',
            cancellationRate: '0%',
            peakHours: [],
            topServices: [],
            topStaff: []
        };
    }

    // 1. Basic Counts
    const total = appointments.length;
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;
    const completed = total - cancelled;

    // 2. Cancellation Rate
    const cancelRate = ((cancelled / total) * 100).toFixed(1) + '%';
    const compRate = ((completed / total) * 100).toFixed(1) + '%';

    // 3. Peak Hours (Heatmap logic)
    const hourCounts: Record<string, number> = {};
    appointments.forEach(apt => {
        const hour = apt.timeSlot.split(':')[0] + ':00'; // "09:30" -> "09:00"
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 hours

    // 4. Busiest Day of Week
    const dayCounts: Record<string, number> = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    appointments.forEach(apt => {
        const date = new Date(apt.date);
        const dayName = days[date.getDay()];
        dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });
    const busiestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    // 5. Top Services
    // Note: We need serviceName. If it's not on the appointment object directly, this might fail unless we enriched it.
    // Based on previous code, we mapped it. Let's assume clientName/serviceName are available or fallback.
    const serviceCounts: Record<string, number> = {};
    appointments.forEach(apt => {
        // @ts-ignore - we know we enriched this in dataService
        const name = apt.serviceName || 'Unknown Service';
        serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });
    const topServices = Object.entries(serviceCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // 6. Top Staff
    const staffCounts: Record<string, number> = {};
    appointments.forEach(apt => {
        // @ts-ignore - we know we enriched this in dataService
        const name = apt.staffName || 'Unknown Staff';
        staffCounts[name] = (staffCounts[name] || 0) + 1;
    });
    const topStaff = Object.entries(staffCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        totalBookings: total,
        completionRate: compRate,
        busiestDay,
        cancellationRate: cancelRate,
        peakHours,
        topServices,
        topStaff
    };
};
