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
    colorMode?: 'staff' | 'service'; // New Prop for coloring
}

export default function VerticalDayTimeline({ appointments, staff, services, availability = [], businessHours, date, onAppointmentClick, colorMode = 'staff' }: VerticalDayTimelineProps) {
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
            <div className="flex w-full h-full min-w-0 overflow-auto pb-32">
                <div className="flex w-full h-full relative min-h-full">

                    {/* Time Column - Compact */}
                    <div className="relative z-[60] bg-white border-r border-gray-100 flex-shrink-0 w-10 flex flex-col sticky left-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                        {/* Corner Spacer */}
                        <div className="h-10 bg-white z-[60] border-b border-gray-100 flex items-center justify-center flex-shrink-0 sticky top-0">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        {/* Time Slots */}
                        <div className="relative flex-1 w-full bg-white min-h-full mt-2">
                            {hours.map((hour, i) => {
                                const topPercent = (i / TOTAL_HOURS) * 100;
                                return (
                                    <div key={hour} className="absolute w-full text-center" style={{
                                        top: `${topPercent}%`,
                                        transform: 'translateY(-50%)'
                                    }}>
                                        {i !== hours.length && (
                                            <span className="text-[10px] font-bold text-gray-400 leading-none block">
                                                {hour > 12 ? hour - 12 : hour}
                                                <span className="text-[8px] font-normal text-gray-300 ml-0.5">{hour >= 12 ? 'p' : 'a'}</span>
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Staff Columns - Compact */}
                    <div className="flex flex-1 relative h-full divide-x divide-gray-100">
                        {Array.from(new Set(staff.map(s => s.name.toLowerCase()))).map((normalizedName, index) => {
                            const staffGroup = staff.filter(s => s.name.toLowerCase() === normalizedName);
                            const primaryStaff = staffGroup[0];
                            const staffIds = staffGroup.map(s => s.id);
                            const memberAppointments = renderAppointments.filter(apt => staffIds.includes(apt.staffId));

                            const memberRule = availability.find(r => r.staffId === primaryStaff.id && r.dayOfWeek === todayDayOfWeek);
                            const showOffDuty = memberRule && !memberRule.isWorking;

                            return (
                                <div key={primaryStaff.id} className="flex-1 min-w-[9rem] relative flex flex-col h-full bg-white first:border-l-0">
                                    {/* Staff Header - Compact */}
                                    <div className="h-10 flex-shrink-0 bg-white z-[50] border-b border-gray-100 flex items-center justify-center gap-1.5 p-1 shadow-sm sticky top-0">
                                        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-600 border border-gray-200 overflow-hidden">
                                            {primaryStaff.avatar ? <img src={primaryStaff.avatar} alt={primaryStaff.name} className="w-full h-full object-cover" /> : primaryStaff.name.charAt(0)}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-900 truncate max-w-[5rem] uppercase tracking-tight">{primaryStaff.name.split(' ')[0]}</span>
                                    </div>

                                    {/* Vertical Timeline Lane */}
                                    <div className={`relative flex-1 w-full mt-2 ${showOffDuty ? 'bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMTlMMTkgMU0wIDIwTDIwIDAiIHN0cm9rZT0iI2YzZjRmNiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+")] opacity-60' : ''}`}>

                                        {/* Grid Lines */}
                                        {hours.map((hour, i) => (
                                            <div key={`bg-${hour}`} className="absolute w-full border-t border-gray-50" style={{ top: `${(i / TOTAL_HOURS) * 100}%` }}></div>
                                        ))}

                                        {/* Half-Hour Guidelines (Subtle) */}
                                        {hours.map((hour, i) => i < hours.length - 1 && (
                                            <div key={`half-${hour}`} className="absolute w-full border-t border-dashed border-gray-50/50" style={{ top: `${((i + 0.5) / TOTAL_HOURS) * 100}%` }}></div>
                                        ))}

                                        {showOffDuty && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                <span className="text-[9px] font-bold text-gray-300 bg-white/80 px-2 py-0.5 rounded border border-gray-100 uppercase tracking-widest">
                                                    Off
                                                </span>
                                            </div>
                                        )}

                                        {currentTimeTopPercent !== -1 && (
                                            <div className="absolute w-full flex items-center z-40 pointer-events-none" style={{ top: `${currentTimeTopPercent}%` }}>
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full -ml-0.5 shadow-sm"></div>
                                                <div className="h-px bg-red-400 w-full opacity-40"></div>
                                            </div>
                                        )}

                                        {memberAppointments.map(apt => {
                                            const [h, m] = apt.timeSlot.split(':').map(Number);
                                            const aptStartMins = (h - START_HOUR) * 60 + m;
                                            const service = services?.find(s => s.id === apt.serviceId);
                                            const durationMins = service?.durationMinutes || 60;
                                            const topPercent = (aptStartMins / TOTAL_MINUTES) * 100;
                                            const heightPercent = (durationMins / TOTAL_MINUTES) * 100;
                                            const isFocused = false;

                                            const colors = [
                                                { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900', sub: 'text-blue-700' },
                                                { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-900', sub: 'text-purple-700' },
                                                { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-900', sub: 'text-emerald-700' },
                                                { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-900', sub: 'text-orange-700' },
                                                { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-900', sub: 'text-pink-700' },
                                                { bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-900', sub: 'text-cyan-700' },
                                                { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-900', sub: 'text-rose-700' },
                                                { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-900', sub: 'text-amber-700' },
                                                { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-900', sub: 'text-indigo-700' },
                                                { bg: 'bg-lime-50', border: 'border-lime-500', text: 'text-lime-900', sub: 'text-lime-700' },
                                                { bg: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-900', sub: 'text-teal-700' },
                                                { bg: 'bg-fuchsia-50', border: 'border-fuchsia-500', text: 'text-fuchsia-900', sub: 'text-fuchsia-700' },
                                            ];

                                            let colorIndex = 0;
                                            if (colorMode === 'service') {
                                                const service = services?.find(s => s.id === apt.serviceId);
                                                const hash = service?.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
                                                colorIndex = hash % colors.length;
                                            } else {
                                                const sortedStaff = [...staff].sort((a, b) => a.name.localeCompare(b.name));
                                                const staffIdx = sortedStaff.findIndex(s => s.id === apt.staffId);
                                                colorIndex = staffIdx >= 0 ? staffIdx % colors.length : 0;
                                            }
                                            const staffColor = colors[colorIndex];

                                            return (
                                                <div
                                                    key={apt.id}
                                                    onClick={(e) => handleCardClick(e, apt.id)}
                                                    className={`absolute left-0.5 right-0.5 rounded border-l-2 px-1 py-0.5 flex flex-col cursor-pointer transition-all overflow-hidden shadow-sm hover:shadow-md
                                                        ${isFocused ? 'z-50 shadow-xl ring-2 ring-black bg-white h-auto' : `z-10 ${apt.status === 'CONFIRMED' ? `${staffColor.bg} ${staffColor.border}` : 'bg-gray-50 border-gray-400'}`}
                                                    `}
                                                    style={{ top: `${topPercent}%`, height: `${heightPercent}%`, minHeight: '2rem' }}
                                                >
                                                    <div className={`flex flex-col leading-none h-full ${apt.status === 'CONFIRMED' ? staffColor.text : 'text-gray-900'}`}>
                                                        <span className="text-[9px] font-bold line-clamp-1">{apt.clientName}</span>
                                                        <span className={`text-[8px] font-medium opacity-90 line-clamp-1`}>{service?.name || 'Service'}</span>
                                                        <span className="text-[8px] font-semibold opacity-70 mt-auto">{apt.timeSlot}</span>
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
        </div>
    );
}
