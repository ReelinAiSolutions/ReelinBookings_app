import React, { useState, useMemo } from 'react';
import { Appointment, Service, Staff, Organization } from '@/types';
import { Clock } from 'lucide-react';

interface VerticalDayTimelineProps {
    appointments: Appointment[];
    staff: Staff[];
    services: Service[];
    availability?: any[];
    businessHours?: Organization['business_hours'];
    date?: Date | string;
    onAppointmentClick?: (id: string) => void;
    colorMode?: 'staff' | 'service';
}

const HOUR_HEIGHT = 68; // 68px per hour to fit ~8h on screen

export default function VerticalDayTimeline({ appointments, staff, services, availability = [], businessHours, date, onAppointmentClick, colorMode = 'staff' }: VerticalDayTimelineProps) {
    const [focusedId, setFocusedId] = useState<string | null>(null);

    // Dynamic Business Hours Logic
    const { startHour, endHour, viewDayIndex } = useMemo(() => {
        let viewDate = new Date();
        if (date) {
            if (typeof date === 'string') {
                const [y, m, d] = date.split('-').map(Number);
                viewDate = new Date(y, m - 1, d);
            } else {
                viewDate = date;
            }
        }

        const dayIndex = viewDate.getDay();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[dayIndex];

        if (!businessHours) return { startHour: 9, endHour: 21, viewDayIndex: dayIndex }; // Default 12h

        const todaySettings = businessHours[dayName] || businessHours[dayName.toLowerCase()];

        if (!todaySettings || !todaySettings.isOpen) return { startHour: 9, endHour: 21, viewDayIndex: dayIndex };

        const [openH] = todaySettings.open.split(':').map(Number);
        const [closeH, closeM] = todaySettings.close.split(':').map(Number);
        const s = openH;
        // If close is 17:00, show 17. If 17:30, show 18.
        const closeTime = closeM > 0 ? closeH + 1 : closeH;

        // Enforce MINIMUM 12 hours depth to fill the mobile screen
        // If s=9, 9+12 = 21 (9pm). If e=17 (5pm), we force e to 21.
        const e = Math.max(closeTime, s + 12);

        return { startHour: s, endHour: e, viewDayIndex: dayIndex };
    }, [businessHours, date]);

    const START_HOUR = startHour;
    const END_HOUR = endHour;
    const TOTAL_HOURS = END_HOUR - START_HOUR;
    const BOTTOM_BUFFER = 120; // Enough space for FAB but no "useless white space"
    const TOTAL_HEIGHT_PX = (TOTAL_HOURS * HOUR_HEIGHT) + BOTTOM_BUFFER;

    const todayDayOfWeek = viewDayIndex;
    const hours = Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => i + START_HOUR);

    const uniqueAppointments = Array.from(new Map(appointments.map(item => [item.id, item])).values());
    const renderAppointments = uniqueAppointments.filter(apt => {
        const hour = parseInt(apt.timeSlot.split(':')[0]);
        return hour < END_HOUR && hour >= START_HOUR;
    });

    const [now, setNow] = useState(new Date());
    React.useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    let currentTimeTopPx = -1;

    if (currentHour >= START_HOUR && currentHour < END_HOUR) {
        const minutesSinceStart = (currentHour - START_HOUR) * 60 + currentMinute;
        currentTimeTopPx = (minutesSinceStart / 60) * HOUR_HEIGHT;
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
            <div className="flex w-full h-full min-w-0 overflow-auto pb-10">
                <div className="flex w-full relative" style={{ height: `${TOTAL_HEIGHT_PX}px` }}>

                    {/* Static Time Column - LOCKED LEFT */}
                    <div
                        className="relative z-[100] bg-white border-r border-gray-200/80 flex-shrink-0 w-12 flex flex-col sticky left-0 shadow-[4px_0_20px_rgba(0,0,0,0.06)]"
                        style={{ height: `${TOTAL_HEIGHT_PX}px` }}
                    >
                        {/* ROCK SOLID TOP-LEFT HEADER */}
                        <div className="h-10 bg-white z-[110] border-b border-gray-100 flex items-center justify-center flex-shrink-0 sticky top-0 shadow-sm">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div className="relative w-full h-full">
                            {hours.map((hour, i) => {
                                const topPx = i * HOUR_HEIGHT;
                                return (
                                    <div key={hour} className={`absolute w-full text-center ${i === 0 ? '' : 'transform -translate-y-1/2'}`} style={{ top: `${topPx}px` }}>
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

                    {/* Staff Columns */}
                    <div className="flex flex-1 relative h-full divide-x divide-gray-100" style={{ height: `${TOTAL_HEIGHT_PX}px` }}>
                        {Array.from(new Set(staff.map(s => s.name.toLowerCase()))).map((normalizedName) => {
                            const staffGroup = staff.filter(s => s.name.toLowerCase() === normalizedName);
                            const primaryStaff = staffGroup[0];
                            const staffIds = staffGroup.map(s => s.id);
                            const memberAppointments = renderAppointments.filter(apt => staffIds.includes(apt.staffId));

                            const memberRule = availability.find(r => r.staffId === primaryStaff.id && r.dayOfWeek === todayDayOfWeek);
                            const showOffDuty = memberRule && !memberRule.isWorking;

                            return (
                                <div key={primaryStaff.id} className="flex-1 min-w-[9rem] relative flex flex-col h-full bg-white first:border-l-0">
                                    <div className="h-10 flex-shrink-0 bg-white z-[50] border-b border-gray-100 flex items-center justify-center gap-1.5 p-1 shadow-sm sticky top-0">
                                        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-600 border border-gray-200 overflow-hidden">
                                            {primaryStaff.avatar ? <img src={primaryStaff.avatar} alt={primaryStaff.name} className="w-full h-full object-cover" /> : primaryStaff.name.charAt(0)}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-900 truncate max-w-[5rem] uppercase tracking-tight">{primaryStaff.name.split(' ')[0]}</span>
                                    </div>

                                    <div className={`relative w-full flex-1 ${showOffDuty ? 'bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMTlMMTkgMU0wIDIwTDIwIDAiIHN0cm9rZT0iI2YzZjRmNiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+")] opacity-60' : ''}`} style={{ height: `${TOTAL_HEIGHT_PX}px` }}>

                                        {/* FULL WIDTH GRID LINES */}
                                        {hours.map((hour, i) => (
                                            <div key={`bg-${hour}`} className="absolute w-full border-t border-gray-200 z-0" style={{ top: `${i * HOUR_HEIGHT}px` }}></div>
                                        ))}

                                        {/* Half-Hour Guidelines */}
                                        {hours.map((hour, i) => i < hours.length - 1 && (
                                            <div key={`half-${hour}`} className="absolute w-full border-t border-dashed border-gray-100 z-0" style={{ top: `${(i + 0.5) * HOUR_HEIGHT}px` }}></div>
                                        ))}

                                        {showOffDuty && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                <span className="text-[9px] font-bold text-gray-300 bg-white/80 px-2 py-0.5 rounded border border-gray-100 uppercase tracking-widest">Off</span>
                                            </div>
                                        )}

                                        {currentTimeTopPx !== -1 && (
                                            <div className="absolute w-full flex items-center z-40 pointer-events-none" style={{ top: `${currentTimeTopPx}px` }}>
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full -ml-0.5 shadow-sm"></div>
                                                <div className="h-px bg-red-400 w-full opacity-40"></div>
                                            </div>
                                        )}

                                        {memberAppointments.map(apt => {
                                            const [h, m] = apt.timeSlot.split(':').map(Number);
                                            const aptStartMins = (h - START_HOUR) * 60 + m;
                                            const service = services?.find(s => s.id === apt.serviceId);
                                            const durationMins = service?.durationMinutes || 60;

                                            const topPx = (aptStartMins / 60) * HOUR_HEIGHT;
                                            const heightPx = (durationMins / 60) * HOUR_HEIGHT;

                                            const colors = [
                                                { bg: 'bg-blue-500/10 hover:bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-900' },
                                                { bg: 'bg-purple-500/10 hover:bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-900' },
                                                { bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-900' },
                                                { bg: 'bg-orange-500/10 hover:bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-900' },
                                                { bg: 'bg-pink-500/10 hover:bg-pink-500/20', border: 'border-pink-500', text: 'text-pink-900' },
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
                                                <div key={apt.id} onClick={(e) => handleCardClick(e, apt.id)}
                                                    className={`absolute left-0.5 right-0.5 rounded border-l-[3px] px-1.5 py-1 flex flex-col cursor-pointer transition-all overflow-hidden shadow-sm hover:shadow-md backdrop-blur-sm z-10 ${apt.status === 'CONFIRMED' ? `${staffColor.bg} ${staffColor.border}` : 'bg-gray-100/80 border-gray-400'}`}
                                                    style={{ top: `${topPx}px`, height: `${heightPx}px`, minHeight: '32px' }}>
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
