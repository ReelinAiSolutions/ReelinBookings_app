import { Appointment, Service, Staff } from '@/types';
import { isWithinInterval, startOfDay, endOfDay, differenceInCalendarDays, subDays } from 'date-fns';

export type DateRange = { start: Date; end: Date };

export interface GrowthMetric {
    value: number | string;
    growth: number; // Percentage change vs previous period
    trend: 'up' | 'down' | 'neutral';
}

export interface AnalyticMetrics {
    period: { start: Date; end: Date };
    totalBookings: GrowthMetric;
    revenue: {
        total: GrowthMetric;
        average: number;
        lost: number;
    };
    clients: {
        totalActive: number;
        newCount: GrowthMetric;
        returningCount: number;
        returnRate: string;
    };
    utilization: GrowthMetric; // Based on 8-hour operational day assumption
    busiest: {
        day: string;
        hour: string;
    };
    topServices: { name: string; count: number; revenue: number; share: number }[];
    topStaff: { name: string; bookings: number; revenue: number; rank: number; avgTicket: number; hours: number; utilization: number; clients: number; rebookingRate: number; noShowRate: number }[];
    topClients: { name: string; email: string; spent: number; visits: number; lastVisit: Date }[];
    heatmap: { hour: string; count: number }[];
    cancellationRate: string;
    noShowRate: string;
    rebookingRate: string;
}
heatmap: { hour: string; count: number } [];
cancellationRate: string;
}

// Helper to calculate percentage growth
const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

// Core processor for a single set of appointments (stateless)
const calculatePeriodStats = (
    appointments: Appointment[],
    services: Service[],
    staff: Staff[],
    start: Date,
    end: Date
) => {
    let revenue = 0;
    let bookings = 0;
    let lostRevenue = 0;
    let cancelled = 0;
    let noShows = 0;
    let rebookedCount = 0;
    let serviceCounts: Record<string, { count: number, val: number }> = {};
    let staffCounts: Record<string, { count: number, val: number, minutes: number, clients: Set<string>, noShows: number, rebooked: number }> = {};
    let clientStats: Record<string, { name: string, email: string, spent: number, visits: number, lastVisit: Date }> = {};
    let hourCounts: Record<string, number> = {};
    let dayCounts: Record<string, number> = {};
    let totalDurationMinutes = 0;

    // Helper to check for future bookings (Rebooking Logic)
    const hasFutureBooking = (clientEmail: string, currentAptDate: Date) => {
        return appointments.some(futureApt =>
            futureApt.clientEmail === clientEmail &&
            futureApt.status !== 'CANCELLED' &&
            new Date(futureApt.date) > currentAptDate
        );
    };

    appointments.forEach(apt => {
        const aptDate = new Date(apt.date);

        // Filter by Date Range
        if (!isWithinInterval(aptDate, { start, end })) return;

        bookings++;
        const service = services.find(s => s.id === apt.serviceId);
        const price = Number(service?.price || 0);
        const duration = service?.durationMinutes || 60;
        const member = staff.find(s => s.id === apt.staffId);
        const staffName = member?.name || 'Unknown';
        const serviceName = service?.name || 'Unknown';

        // Initialize Staff Counts
        if (!staffCounts[staffName]) staffCounts[staffName] = { count: 0, val: 0, minutes: 0, clients: new Set<string>(), noShows: 0, rebooked: 0 };

        // No-Show Logic
        if (apt.status === 'NO_SHOW') {
            noShows++;
            staffCounts[staffName].noShows++;
            // No revenue for no-show usually? Assume lost revenue.
            lostRevenue += price;
            return;
        }

        // Cancellation Logic
        if (apt.status === 'CANCELLED') {
            cancelled++;
            lostRevenue += price;
            return;
        }

        // Active Stats (CONFIRMED/PENDING/COMPLETED/ARRIVED/IN_PROGRESS)
        if (['CONFIRMED', 'PENDING', 'COMPLETED', 'ARRIVED', 'IN_PROGRESS'].includes(apt.status)) {
            revenue += price;
            totalDurationMinutes += duration;

            // Rebooking Check
            const isRebooked = hasFutureBooking(apt.clientEmail, aptDate);
            if (isRebooked) {
                rebookedCount++;
                staffCounts[staffName].rebooked++;
            }

            // Client Stats
            const cEmail = apt.clientEmail || 'anonymous';
            const cName = apt.clientName || 'Walk-in';
            if (!clientStats[cEmail]) clientStats[cEmail] = { name: cName, email: cEmail, spent: 0, visits: 0, lastVisit: aptDate };
            clientStats[cEmail].spent += price;
            clientStats[cEmail].visits++;
            if (aptDate > clientStats[cEmail].lastVisit) clientStats[cEmail].lastVisit = aptDate;

            // Service Stats
            if (!serviceCounts[serviceName]) serviceCounts[serviceName] = { count: 0, val: 0 };
            serviceCounts[serviceName].count++;
            serviceCounts[serviceName].val += price;

            // Staff Stats
            staffCounts[staffName].count++;
            staffCounts[staffName].val += price;
            staffCounts[staffName].minutes += duration;
            if (apt.clientEmail) staffCounts[staffName].clients.add(apt.clientEmail);

            // Time Stats
            if (apt.timeSlot) {
                const hour = apt.timeSlot.split(':')[0] + ':00';
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            }
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = days[aptDate.getDay()];
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        }
    });

    // Utilization Calculation: (Total Duration) / (Staff * Days * 8 hours * 60 mins)
    const daysInPeriod = Math.max(1, differenceInCalendarDays(end, start) + 1);
    const capacityMinutes = (staff.length || 1) * daysInPeriod * 8 * 60;
    const utilization = capacityMinutes > 0 ? (totalDurationMinutes / capacityMinutes) * 100 : 0;

    return {
        revenue,
        bookings,
        lostRevenue,
        cancelled,
        noShows,
        rebookedCount,
        activeClients: Object.keys(clientStats).length,
        serviceCounts,
        staffCounts,
        clientStats,
        hourCounts,
        dayCounts,
        utilization
    };
};

export const processAnalytics = (
    allAppointments: Appointment[],
    services: Service[],
    staff: Staff[],
    currentRange: DateRange,
    previousRange: DateRange
): AnalyticMetrics => {

    // 1. Process Current Period
    const current = calculatePeriodStats(allAppointments, services, staff, currentRange.start, currentRange.end);

    // 2. Process Previous Period (for trends)
    const previous = calculatePeriodStats(allAppointments, services, staff, previousRange.start, previousRange.end);

    // 3. New Client Logic (Requires looking at ALL history before start date)
    // A "New Client" in this period is someone who appears in this period but NEVER before.
    const historicalClients = new Set<string>();
    allAppointments.forEach(apt => {
        const d = new Date(apt.date);
        if (d < currentRange.start && apt.clientEmail) {
            historicalClients.add(apt.clientEmail);
        }
    });

    let newClients = 0;
    let returningClients = 0;

    // Scan current period unique clients
    Object.keys(current.clientStats).forEach(email => {
        if (historicalClients.has(email)) {
            returningClients++;
        } else {
            newClients++;
        }
    });

    // We also need Previous New Clients count for Growth.... rough estimate: active in prev, not active before prev
    // Or we do the same "New Client" check for the previous period.
    const historyBeforePrev = new Set<string>();
    allAppointments.forEach(apt => {
        if (new Date(apt.date) < previousRange.start && apt.clientEmail) historyBeforePrev.add(apt.clientEmail);
    });
    let prevNewClients = 0;
    Object.keys(previous.clientStats).forEach(email => {
        if (!historyBeforePrev.has(email)) prevNewClients++;
    });


    // 4. Construct Final Metric Object
    const busiestDay = Object.entries(current.dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    // Peak Hour
    const peakHour = Object.entries(current.hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    // Top Staff with Enhanced Metrics
    const topStaff = Object.entries(current.staffCounts)
        .map(([name, data]) => {
            // Utilization: Hours Booked / (Days in Period * 8 hours)
            // This is a rough estimate assuming 8 hour days.
            // In a real app we'd map against actual availability schedules.
            const daysInPeriod = Math.max(1, differenceInCalendarDays(currentRange.end, currentRange.start) + 1);
            const capacityHours = daysInPeriod * 8;
            const hoursBooked = data.minutes / 60;
            const utilization = capacityHours > 0 ? (hoursBooked / capacityHours) * 100 : 0;

            const staffTotalOps = data.count + data.noShows; // Active bookings + No Shows
            const staffRebookRate = data.count > 0 ? (data.rebooked / data.count) * 100 : 0;
            const staffNoShowRate = staffTotalOps > 0 ? (data.noShows / staffTotalOps) * 100 : 0;

            return {
                name,
                bookings: data.count,
                revenue: data.val,
                hours: hoursBooked,
                utilization: Math.min(100, utilization), // Cap at 100% just in case of overtime
                clients: data.clients.size,
                avgTicket: data.count > 0 ? data.val / data.count : 0,
                rebookingRate: staffRebookRate,
                noShowRate: staffNoShowRate
            };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .map((s, i) => ({ ...s, rank: i + 1 }));

    // Top Services
    const topServices = Object.entries(current.serviceCounts)
        .map(([name, data]) => ({
            name,
            count: data.count,
            revenue: data.val,
            share: current.revenue > 0 ? (data.val / current.revenue) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Top Clients
    const topClients = Object.values(current.clientStats)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5);

    // Cancellation Rate
    const totalOps = current.bookings + current.cancelled + current.noShows; // Total attempts
    const cancelRate = totalOps > 0 ? ((current.cancelled / totalOps) * 100).toFixed(1) + '%' : '0%';
    const noShowRate = totalOps > 0 ? ((current.noShows / totalOps) * 100).toFixed(1) + '%' : '0%';

    // Rebooking Rate (Global)
    // Only count active bookings for denominator, as cancelled/no-show can't technically "rebook" in the same flow usually (or different stat)
    // Actually using totalBookings (which are the active ones)
    const rebookingRate = current.bookings > 0 ? ((current.rebookedCount / current.bookings) * 100).toFixed(1) + '%' : '0%';

    return {
        period: currentRange,
        totalBookings: {
            value: current.bookings,
            growth: calculateGrowth(current.bookings, previous.bookings),
            trend: current.bookings >= previous.bookings ? 'up' : 'down'
        },
        revenue: {
            total: {
                value: current.revenue,
                growth: calculateGrowth(current.revenue, previous.revenue),
                trend: current.revenue >= previous.revenue ? 'up' : 'down'
            },
            average: current.bookings > 0 ? current.revenue / current.bookings : 0,
            lost: current.lostRevenue
        },
        clients: {
            totalActive: current.activeClients,
            newCount: {
                value: newClients,
                growth: calculateGrowth(newClients, prevNewClients),
                trend: newClients >= prevNewClients ? 'up' : 'down'
            },
            returningCount: returningClients,
            returnRate: (newClients + returningClients) > 0
                ? ((returningClients / (newClients + returningClients)) * 100).toFixed(0) + '%'
                : '0%'
        },
        utilization: {
            value: current.utilization.toFixed(1) + '%',
            growth: calculateGrowth(current.utilization, previous.utilization),
            trend: current.utilization >= previous.utilization ? 'up' : 'down'
        },
        busiest: {
            day: busiestDay,
            hour: peakHour
        },
        topServices,
        topStaff,
        topClients,
        topClients,
        cancellationRate: cancelRate,
        noShowRate,
        rebookingRate,
        heatmap: Object.entries(current.hourCounts)
            .map(([hour, count]) => ({ hour, count }))
            .sort((a, b) => a.hour.localeCompare(b.hour)) // Sort by time for heatmap
    };
};
