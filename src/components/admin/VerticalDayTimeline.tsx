import React, { useState, useMemo } from 'react';
import { Appointment, Service, Staff, Organization } from '@/types';
import { Clock, Mail, Info, User as UserIcon } from 'lucide-react';

interface VerticalDayTimelineProps {
    appointments: Appointment[];
    staff: Staff[];
    services: Service[];
    availability?: any[];
    businessHours?: Organization['business_hours'];
    date?: Date | string; // New prop for context
    onAppointmentClick?: (id: string) => void;
}

export default function VerticalDayTimeline({ appointments, staff, services, availability = [], businessHours, date, onAppointmentClick }: VerticalDayTimelineProps) {
    const [focusedId, setFocusedId] = useState<string | null>(null);

    // Dynamic Business Hours Logic
    const { startHour, endHour, viewDayIndex } = useMemo(() => {
        // Safe Date Parsing to avoid UTC shifts
        let viewDate = new Date();
        if (date) {
            if (typeof date === 'string') {
                // "2025-12-19" -> Split to avoid UTC conversion
                const [y, m, d] = date.split('-').map(Number);
                viewDate = new Date(y, m - 1, d);
            } else {
                viewDate = date;
            }
        }

        const dayIndex = viewDate.getDay(); // 0-6 Local
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[dayIndex];

        if (!businessHours) return { startHour: 9, endHour: 17, viewDayIndex: dayIndex };

        const todaySettings = businessHours[dayName] || businessHours[dayName.toLowerCase()];

        if (!todaySettings || !todaySettings.isOpen) return { startHour: 9, endHour: 17, viewDayIndex: dayIndex };

        // Parse "HH:mm"
        const [openH] = todaySettings.open.split(':').map(Number);
        const [closeH, closeM] = todaySettings.close.split(':').map(Number);

        // Round start down, end up
        const s = openH;
        // If close is 17:00, show 17. If 17:30, show 18.
        const e = closeM > 0 ? closeH + 1 : closeH;

        return { startHour: s, endHour: e, viewDayIndex: dayIndex };
    }, [businessHours, date]); // Re-run if date changes

    const START_HOUR = startHour;
    const END_HOUR = endHour;
    const TOTAL_HOURS = END_HOUR - START_HOUR;
    const TOTAL_MINUTES = TOTAL_HOURS * 60;

    // Use viewDayIndex for consistency
    const todayDayOfWeek = viewDayIndex;

    // We render labels for start..end
    const hours = Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => i + START_HOUR);

    // ... (rest of simple setup) ...

    // Deduplicate appointments by ID just in case
    const uniqueAppointments = Array.from(new Map(appointments.map(item => [item.id, item])).values());

    // Filter out appointments that start at or after END_HOUR
    const renderAppointments = uniqueAppointments.filter(apt => {
        const hour = parseInt(apt.timeSlot.split(':')[0]);
        return hour < END_HOUR && hour >= START_HOUR;
    });

    const [now, setNow] = useState(new Date());

    React.useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    // Calculate Current Time Line Position (%)
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    let currentTimeTopPercent = -1;

    // Only show if within view hours (9 AM - 5 PM)
    if (currentHour >= START_HOUR && currentHour < END_HOUR) {
        const minutesSinceStart = (currentHour - START_HOUR) * 60 + currentMinute;
        currentTimeTopPercent = (minutesSinceStart / TOTAL_MINUTES) * 100;
    }

    const handleCardClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (onAppointmentClick) onAppointmentClick(id);
    };

    const handleGridClick = () => {
        setFocusedId(null);
    };

    return (
        <div className="flex flex-1 relative bg-white h-full overflow-hidden min-w-0" onClick={handleGridClick}>
            <div className="flex w-full h-full min-w-0">

                {/* Time Column */}
                <div className="relative z-30 bg-white border-r border-gray-200 flex-shrink-0 w-14 shadow-sm h-full flex flex-col">
                    {/* Corner Spacer */}
                    <div className="h-14 bg-white z-40 border-b border-gray-200 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    {/* Time Slots (Flex/Percentage) */}
                    <div className="relative flex-1 w-full">
                        {hours.map((hour, i) => {
                            const topPercent = (i / TOTAL_HOURS) * 100;
                            return (
                                <div key={hour} className="absolute w-full text-center" style={{
                                    top: `${topPercent}%`,
                                    transform: i === 0 ? 'translateY(2px)' : i === hours.length - 1 ? 'translateY(-100%)' : 'translateY(-50%)'
                                }}>
                                    <span className="text-[10px] font-bold text-gray-500">{hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Staff Columns (Scrollable) */}
                <div className="flex flex-1 relative h-full w-full overflow-x-auto overflow-y-hidden divide-x divide-gray-200">


                    {Array.from(new Set(staff.map(s => s.name.toLowerCase()))).map((normalizedName, index) => {
                        const staffGroup = staff.filter(s => s.name.toLowerCase() === normalizedName);
                        const primaryStaff = staffGroup[0];
                        const staffIds = staffGroup.map(s => s.id);
                        const memberAppointments = renderAppointments.filter(apt => staffIds.includes(apt.staffId));

                        // Check Availability
                        // Use calculated todayDayOfWeek from useMemo
                        const memberRule = availability.find(r => r.staffId === primaryStaff.id && r.dayOfWeek === todayDayOfWeek);
                        const isWorking = memberRule ? memberRule.isWorking : true; // Default to TRUE if no rule found? Or logic audit says default to true/false?
                        // Usually availability records are "exclusions" or "specifics". If data is "Weekly Hours", missing record might mean default hours.
                        // But looking at screenshots, unchecked = Day Off.
                        // If "Monday" is checked, we get a record isWorking=true.
                        // If "Tuesday" is unchecked, we get isWorking=false OR no record?
                        // If the user's DB saves ALL days, then finding the record is reliable.
                        // If it only saves "Working" days, then missing = off?
                        // Let's assume the previous logic: `const isWorking = memberRule?.isWorking;`
                        // If memberRule is undefined (no record), isWorking is undefined -> falsy?
                        // In previous code: `!isWorking` was used to show "Off Duty".
                        // If isWorking is undefined, !undefined is TRUE. So missing record = Off Duty.
                        // This seems risky if records aren't fully populated.
                        // However, let's stick to the explicit rule found.

                        const showOffDuty = memberRule && !memberRule.isWorking; // Only explicit OFF is OFF?
                        // Or implicit off? The screenshot implies it thinks it found a record.

                        return (
                            <div key={primaryStaff.id} className="flex-1 min-w-[10rem] md:min-w-[12rem] relative flex flex-col h-full bg-white first:border-l-0">
                                {/* Staff Header - Darker border */}
                                <div className="h-14 flex-shrink-0 bg-white z-20 border-b border-gray-300 flex flex-col items-center justify-center p-1 shadow-sm">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 border border-gray-200 mb-0.5 overflow-hidden">
                                        {primaryStaff.avatar ? <img src={primaryStaff.avatar} alt={primaryStaff.name} className="w-full h-full object-cover" /> : primaryStaff.name.charAt(0)}
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-900 truncate max-w-full leading-none mt-1 uppercase tracking-tight">{primaryStaff.name.split(' ')[0]}</span>
                                </div>

                                {/* Vertical Timeline Lane (Dynamic Height) */}
                                <div className={`relative flex-1 w-full bg-white ${showOffDuty ? 'bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMTlMMTkgMU0wIDIwTDIwIDAiIHN0cm9rZT0iI2YzZjRmNiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+")]' : ''}`}>

                                    {showOffDuty && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 flex-col gap-1">
                                            <span className="text-[10px] font-bold text-gray-400 bg-white/80 px-2 py-0.5 rounded border border-gray-200 uppercase tracking-widest text-center mx-2">
                                                Off Duty
                                            </span>
                                        </div>
                                    )}

                                    {/* Solid Grid Lines for cleaner look */}
                                    {hours.map((hour, i) => (
                                        <div key={`bg-${hour}`} className="absolute w-full border-t border-gray-200" style={{ top: `${(i / TOTAL_HOURS) * 100}%` }}></div>
                                    ))}

                                    {/* Red Line Correction: Inside lane */}



                                    {/* Appointments */}
                                    {memberAppointments.map(apt => {
                                        const [h, m] = apt.timeSlot.split(':').map(Number);
                                        const aptStartMins = (h - START_HOUR) * 60 + m;

                                        const service = services?.find(s => s.id === apt.serviceId);
                                        const durationMins = service?.durationMinutes || 60;

                                        const topPercent = (aptStartMins / TOTAL_MINUTES) * 100;
                                        const heightPercent = (durationMins / TOTAL_MINUTES) * 100;

                                        const isFocused = false;

                                        const colors = [
                                            { bg: 'bg-blue-50', border: 'border-blue-600', text: 'text-blue-900', sub: 'text-blue-700' },
                                            { bg: 'bg-purple-50', border: 'border-purple-600', text: 'text-purple-900', sub: 'text-purple-700' },
                                            { bg: 'bg-emerald-50', border: 'border-emerald-600', text: 'text-emerald-900', sub: 'text-emerald-700' },
                                            { bg: 'bg-orange-50', border: 'border-orange-600', text: 'text-orange-900', sub: 'text-orange-700' },
                                            { bg: 'bg-pink-50', border: 'border-pink-600', text: 'text-pink-900', sub: 'text-pink-700' },
                                        ];

                                        const staffIndex = apt.staffId
                                            ? apt.staffId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
                                            : 0;
                                        const staffColor = colors[staffIndex];

                                        return (
                                            <div
                                                key={apt.id}
                                                className={`absolute left-0.5 right-0.5 rounded border px-1.5 py-1 flex flex-col cursor-pointer transition-all overflow-hidden shadow-sm
                                                    ${isFocused
                                                        ? 'z-50 shadow-xl ring-2 ring-black bg-white h-auto'
                                                        : `z-10 ${apt.status === 'CONFIRMED' ? `${staffColor.bg} ${staffColor.border}` : 'bg-gray-50 border-gray-400'}`
                                                    }
                                                `}
                                                style={{
                                                    top: `${topPercent}%`,
                                                    height: `${heightPercent}%`,
                                                    minHeight: '2%' // Minimum visibility
                                                }}
                                                onClick={(e) => handleCardClick(e, apt.id)}
                                            >
                                                <div className={`flex flex-col gap-0 leading-none h-full ${apt.status === 'CONFIRMED' ? staffColor.text : 'text-gray-900'}`}>
                                                    <span className="text-[10px] font-black truncate">{apt.clientName}</span>
                                                    {heightPercent > 5 && (
                                                        <>
                                                            <div className="flex items-center justify-between mt-0.5">
                                                                <span className={`text-[9px] font-medium truncate ${staffColor.sub}`}>{service?.name}</span>
                                                            </div>
                                                            <div className="mt-0.5">
                                                                <span className="text-[8px] font-bold opacity-70">{apt.timeSlot}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
