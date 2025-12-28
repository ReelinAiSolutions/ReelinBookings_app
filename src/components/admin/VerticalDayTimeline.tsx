import React, { useState, useMemo } from 'react';
import { Appointment, Service, Staff, Organization } from '@/types';
import { Clock } from 'lucide-react';

const PulseStyle = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes gravityPulse {
            0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .live-pulse {
            animation: gravityPulse 2s infinite ease-in-out;
        }
    `}} />
);

interface VerticalDayTimelineProps {
    appointments: Appointment[];
    staff: Staff[];
    services: Service[];
    availability?: any[];
    businessHours?: Organization['business_hours'];
    date?: Date | string;
    onAppointmentClick?: (id: string) => void;
    onSelectSlot?: (date: Date, time: string, staffId?: string) => void;
    colorMode?: 'staff' | 'service';
}

const HOUR_HEIGHT = 68;

export default function VerticalDayTimeline({ appointments, staff, services, availability = [], businessHours, date, onAppointmentClick, onSelectSlot, colorMode = 'staff' }: VerticalDayTimelineProps) {
    const [focusedId, setFocusedId] = useState<string | null>(null);

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

        if (!businessHours) return { startHour: 9, endHour: 21, viewDayIndex: dayIndex };
        const todaySettings = businessHours[dayName] || businessHours[dayName.toLowerCase()];
        if (!todaySettings || !todaySettings.isOpen) return { startHour: 9, endHour: 21, viewDayIndex: dayIndex };

        const [openH] = todaySettings.open.split(':').map(Number);
        const [closeH, closeM] = todaySettings.close.split(':').map(Number);
        const s = openH;
        const closeTime = closeM > 0 ? closeH + 1 : closeH;
        const e = Math.max(closeTime, s + 12);
        return { startHour: s, endHour: e + 1, viewDayIndex: dayIndex };
    }, [businessHours, date]);

    const START_HOUR = startHour;
    const END_HOUR = endHour;
    const TOTAL_HOURS = END_HOUR - START_HOUR;
    const TOP_PADDING = 20;
    const BOTTOM_BUFFER = 100;
    const TOTAL_HEIGHT_PX = (TOTAL_HOURS * HOUR_HEIGHT) + TOP_PADDING + BOTTOM_BUFFER;

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
        currentTimeTopPx = ((minutesSinceStart / 60) * HOUR_HEIGHT) + TOP_PADDING;
    }

    const handleSlotClick = (hour: number, staffId: string) => {
        if (!onSelectSlot) return;
        const hStr = hour.toString().padStart(2, '0');
        const timeStr = `${hStr}:00`;
        let targetDate = new Date();
        if (date) {
            if (typeof date === 'string') {
                const [y, m, d] = date.split('-').map(Number);
                targetDate = new Date(y, m - 1, d);
            } else {
                targetDate = date;
            }
        }
        onSelectSlot(targetDate, timeStr, staffId);
    };

    return (
        <div className="flex flex-1 relative bg-transparent h-auto lg:h-full lg:overflow-hidden min-w-0" onClick={() => setFocusedId(null)}>
            <PulseStyle />
            <div className="flex w-full h-auto lg:h-full min-w-0 overflow-visible lg:overflow-auto no-scrollbar">
                <div className="flex w-full relative" style={{ height: `${TOTAL_HEIGHT_PX}px` }}>

                    {/* Static Time Column */}
                    <div
                        className="relative z-[100] bg-white/5 backdrop-blur-md border-r border-gray-100 flex-shrink-0 w-14 flex flex-col sticky left-0"
                        style={{ height: `${TOTAL_HEIGHT_PX}px` }}
                    >
                        <div className="h-10 bg-transparent z-[110] border-b border-gray-100 flex items-center justify-center flex-shrink-0 sticky top-0">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <div className="relative w-full h-full">
                            {hours.map((hour, i) => {
                                const topPx = (i * HOUR_HEIGHT) + TOP_PADDING;
                                return (
                                    <div key={hour} className={`absolute w-full text-right pr-3 ${i === 0 ? '' : 'transform -translate-y-1/2'}`} style={{ top: `${topPx}px` }}>
                                        <span className="text-[10px] font-black text-gray-400 leading-none block uppercase">
                                            {hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)}
                                            <span className="text-[8px] font-bold text-gray-300 ml-1">{hour >= 12 ? 'PM' : 'AM'}</span>
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Staff Columns */}
                    <div className="flex flex-1 relative h-full divide-x divide-gray-100/50" style={{ height: `${TOTAL_HEIGHT_PX}px` }}>
                        {Array.from(new Set(staff.map(s => s.name.toLowerCase()))).map((normalizedName) => {
                            const staffGroup = staff.filter(s => s.name.toLowerCase() === normalizedName);
                            const primaryStaff = staffGroup[0];
                            const memberAppointments = renderAppointments.filter(apt => staffGroup.some(s => s.id === apt.staffId));
                            const memberRule = availability.find(r => r.staffId === primaryStaff.id && r.dayOfWeek === todayDayOfWeek);
                            const showOffDuty = memberRule && !memberRule.isWorking;

                            return (
                                <div key={primaryStaff.id} className="flex-1 min-w-[10rem] relative flex flex-col h-full bg-transparent group/col">
                                    <div className="h-10 flex-shrink-0 bg-white/10 backdrop-blur-xl z-[50] border-b border-gray-100/50 flex items-center justify-center p-1 sticky top-0">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full border border-white shadow-sm transition-all hover:scale-105">
                                            <div className="w-5 h-5 rounded-full bg-gray-100 overflow-hidden border border-gray-100">
                                                {primaryStaff.avatar ? <img src={primaryStaff.avatar} alt={primaryStaff.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400">{primaryStaff.name.charAt(0)}</div>}
                                            </div>
                                            <span className="text-[11px] font-black text-gray-900 truncate max-w-[5rem] uppercase tracking-tight">{primaryStaff.name.split(' ')[0]}</span>
                                            <div className={`w-1.5 h-1.5 rounded-full ${primaryStaff.id.includes('1') ? 'bg-primary-500' : 'bg-green-500'}`}></div>
                                        </div>
                                    </div>

                                    <div className={`relative w-full flex-1 ${showOffDuty ? 'bg-stripes-gray' : ''}`} style={{ height: `${TOTAL_HEIGHT_PX}px` }}>
                                        {/* Clickable Grid Slots */}
                                        {hours.map((hour, i) => (
                                            <div
                                                key={`slot-${hour}`}
                                                className="absolute w-full border-t border-gray-100/30 z-0 bg-transparent hover:bg-white/5 transition-colors cursor-pointer"
                                                style={{ top: `${(i * HOUR_HEIGHT) + TOP_PADDING}px`, height: `${HOUR_HEIGHT}px` }}
                                                onClick={() => !showOffDuty && handleSlotClick(hour, primaryStaff.id)}
                                            >
                                                <div className="absolute top-1/2 w-full border-t border-dashed border-gray-50/20 pointer-events-none"></div>
                                            </div>
                                        ))}

                                        {currentTimeTopPx !== -1 && (
                                            <div className="absolute w-full flex items-center z-[60] pointer-events-none" style={{ top: `${currentTimeTopPx}px` }}>
                                                <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 shadow-lg live-pulse border-2 border-white"></div>
                                                <div className="h-0.5 bg-red-500/50 w-full"></div>
                                            </div>
                                        )}

                                        {/* Appointments */}
                                        {memberAppointments.map(apt => {
                                            const [h, m] = apt.timeSlot.split(':').map(Number);
                                            const aptStartMins = (h - START_HOUR) * 60 + m;
                                            const service = services?.find(s => s.id === apt.serviceId);
                                            const durationMins = service?.durationMinutes || 60;
                                            const topPx = (aptStartMins / 60) * HOUR_HEIGHT + TOP_PADDING;
                                            const heightPx = (durationMins / 60) * HOUR_HEIGHT;

                                            const colors = [
                                                { bg: 'bg-primary-500/10 hover:bg-primary-500/20', border: 'border-primary-500', text: 'text-primary-900', pill: 'bg-primary-500' },
                                                { bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-900', pill: 'bg-emerald-500' },
                                                { bg: 'bg-purple-500/10 hover:bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-900', pill: 'bg-purple-500' },
                                                { bg: 'bg-amber-500/10 hover:bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-900', pill: 'bg-amber-500' },
                                            ];

                                            const colorIdx = staff.findIndex(s => s.id === apt.staffId) % colors.length;
                                            const staffColor = colors[colorIdx];

                                            return (
                                                <div key={apt.id} onClick={(e) => { e.stopPropagation(); if (onAppointmentClick) onAppointmentClick(apt.id); }}
                                                    className={`absolute left-1 right-1 rounded-2xl border-l-[4px] px-3 py-2 flex flex-col cursor-pointer transition-all overflow-hidden shadow-sm hover:shadow-lg backdrop-blur-md z-20 group/apt ${apt.status === 'CONFIRMED' ? `${staffColor.bg} ${staffColor.border}` : 'bg-gray-100/60 border-gray-400'}`}
                                                    style={{ top: `${topPx}px`, height: `${heightPx}px`, minHeight: '38px' }}>
                                                    <div className={`flex items-center gap-2 leading-none mb-1`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${staffColor.pill}`}></div>
                                                        <span className="text-[11px] font-black text-gray-900 truncate">{apt.clientName}</span>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight truncate">{service?.name || 'Service'}</span>
                                                    <span className="text-[9px] font-black text-gray-400 mt-auto">{apt.timeSlot}</span>
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
