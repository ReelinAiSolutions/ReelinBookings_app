import React, { useMemo } from 'react';
import { Appointment, Staff, Service, Organization } from '@/types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import VerticalDayTimeline from './VerticalDayTimeline';
import { addDays, format, startOfWeek, addHours, startOfDay, isSameDay, addYears, addMonths } from 'date-fns';
import YearView from './YearView';
import MonthView from './MonthView';

interface WeeklyCalendarProps {
    appointments: Appointment[];
    staff: Staff[];
    services: Service[];
    availability?: any[];
    businessHours?: Organization['business_hours'];
    isBlockingMode?: boolean;
    onSelectSlot: (date: Date, time: string) => void;
    onAppointmentClick: (appointment: Appointment) => void;
}

export default function WeeklyCalendar({ appointments, staff, services, availability = [], businessHours, isBlockingMode = false, onSelectSlot, onAppointmentClick }: WeeklyCalendarProps) {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [viewMode, setViewMode] = React.useState<'week' | 'month' | 'year'>('week');

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start

    // Generate week days
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    // Dynamic Grid Hours Logic: Find earliest open and latest close across the week
    const { startHour, endHour } = useMemo(() => {
        if (!businessHours) return { startHour: 9, endHour: 17 };

        let earliest = 9;
        let latest = 17;

        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        // Check all days to find range
        let hasOpen = false;
        days.forEach(day => {
            const settings = businessHours[day] || businessHours[day.toLowerCase()];
            if (settings?.isOpen) {
                hasOpen = true;
                const [openH] = settings.open.split(':').map(Number);
                const [closeH, closeM] = settings.close.split(':').map(Number);

                if (openH < earliest) earliest = openH;
                const e = closeM > 0 ? closeH + 1 : closeH;
                if (e > latest) latest = e;
            }
        });

        return { startHour: hasOpen ? earliest : 9, endHour: hasOpen ? latest : 17 };
    }, [businessHours]);

    const hours = Array.from({ length: endHour - startHour + 1 }).map((_, i) => i + startHour);

    const getAppointmentsForCell = (day: Date, hour: number) => {
        const dayString = day.toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });
        return appointments.filter(apt => {
            const aptHour = parseInt(apt.timeSlot?.split(':')[0] || '0');
            if (aptHour >= 17) return false;
            return apt.date === dayString && aptHour === hour;
        });
    };

    const [selectedDate, setSelectedDate] = React.useState(new Date());

    const selectedDateAppointments = appointments.filter(apt => {
        const selectedDateString = selectedDate.toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });
        return apt.date === selectedDateString;
    }).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    // -- NAVIGATION HANDLERS --

    // From YearView -> Click Month -> Go to Month View
    const handleMonthSelect = (date: Date) => {
        setCurrentDate(date);
        setViewMode('month');
    };

    // From MonthView -> Click Day -> Go to Week View
    const handleDaySelect = (date: Date) => {
        setCurrentDate(date);
        setSelectedDate(date); // For mobile detail view
        setViewMode('week');
    };

    if (viewMode === 'year') {
        return (
            <YearView
                currentDate={currentDate}
                onMonthSelect={handleMonthSelect}
                onYearChange={setCurrentDate}
                onTitleClick={() => setViewMode('week')} // Click Title -> Go to Week (Cycle Complete)
            />
        );
    }

    if (viewMode === 'month') {
        return (
            <MonthView
                currentDate={currentDate}
                appointments={appointments}
                onDaySelect={handleDaySelect}
                onMonthChange={setCurrentDate}
                onTitleClick={() => setViewMode('year')} // Click Title -> Go to Year (Step 2 of Cycle)
            />
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
            {/* Desktop Calendar Header */}
            <div className="hidden md:flex p-4 border-b border-gray-200 justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setViewMode('month')} // Week -> Month
                        className="text-lg font-bold text-gray-900 hover:bg-gray-100 px-3 py-1 rounded-md transition-colors flex items-center gap-2 group"
                    >
                        <span className="text-gray-400 font-medium">Week •</span>
                        {format(startDate, 'MMMM yyyy')}
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 rotate-90 transition-transform" />
                    </button>
                    <div className="flex items-center rounded-md border border-gray-200 bg-white">
                        <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1 hover:bg-gray-50"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
                        <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1 hover:bg-gray-50"><ChevronRight className="w-5 h-5 text-gray-500" /></button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1.5 rounded-md">Week View</span>
                </div>
            </div>

            {/* Desktop Calendar Grid */}
            <div className="hidden md:flex flex-1 overflow-auto flex-col pb-20">
                {/* ... (Existing Desktop Grid Code - largely unchanged structure, just logic wrappers) ... */}
                {/* Header Row */}
                <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10 shadow-sm">
                    <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50/50"></div>
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className="flex-1 w-0 min-w-[100px] text-center py-3 border-r border-gray-200 last:border-r-0">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{format(day, 'EEE')}</div>
                            <div className={`text-sm font-black mt-1 w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors ${isSameDay(day, new Date()) ? 'bg-primary-600 text-white shadow-md' : 'text-gray-900 group-hover:bg-gray-100'}`}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Time Grid */}
                <div className="flex-1 bg-white relative">
                    {hours.map((hour, index) => {
                        const isLast = index === hours.length - 1;

                        if (isLast) {
                            return (
                                <div key={hour} className="flex h-0 border-t border-gray-200 relative">
                                    <div className="w-12 flex-shrink-0 -mt-2.5 text-[10px] font-bold text-gray-400 text-center uppercase bg-white">
                                        {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'pm' : 'am'}
                                    </div>
                                    <div className="flex-1 bg-gray-50/30"></div>
                                </div>
                            );
                        }

                        return (
                            <div key={hour} className="flex min-h-[60px] border-b border-gray-200">
                                <div className="w-12 flex-shrink-0 border-r border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-500 text-center pt-2 uppercase">
                                    {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'pm' : 'am'}
                                </div>
                                {weekDays.map(day => {
                                    const cellApts = getAppointmentsForCell(day, hour);
                                    return (
                                        <div
                                            key={`${day.toISOString()}-${hour}`}
                                            onClick={() => onSelectSlot(day, `${hour}:00`)}
                                            className={`flex-1 w-0 min-w-[100px] border-r border-gray-200 last:border-r-0 relative group transition-all p-0.5
                                                ${isBlockingMode
                                                    ? 'cursor-cell hover:bg-stripes-gray hover:bg-gray-50 ring-inset hover:ring-2 hover:ring-gray-400'
                                                    : 'hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            <div className={`invisible group-hover:visible absolute top-0.5 right-0.5 flex items-center justify-center pointer-events-none ${isBlockingMode ? 'text-gray-800' : 'text-gray-300'}`}>
                                                {isBlockingMode ? <span className="text-[9px] font-black uppercase bg-gray-900 text-white px-1 py-0 rounded">BLK</span> : <Plus className="w-3 h-3" />}
                                            </div>
                                            <div className={`h-full ${cellApts.length > 2 ? 'grid grid-cols-2 gap-0.5 content-start' : 'flex flex-col gap-0.5'}`}>
                                                {cellApts.map(apt => {
                                                    const isDense = cellApts.length > 2;
                                                    const colors = [
                                                        { bg: 'bg-blue-50', border: 'border-blue-600', text: 'text-blue-900' },
                                                        { bg: 'bg-purple-50', border: 'border-purple-600', text: 'text-purple-900' },
                                                        { bg: 'bg-emerald-50', border: 'border-emerald-600', text: 'text-emerald-900' },
                                                        { bg: 'bg-orange-50', border: 'border-orange-600', text: 'text-orange-900' },
                                                        { bg: 'bg-pink-50', border: 'border-pink-600', text: 'text-pink-900' },
                                                    ];
                                                    const staffIndex = apt.staffId ? apt.staffId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length : 0;
                                                    const staffColor = colors[staffIndex];
                                                    const staffMember = staff.find(s => s.id === apt.staffId);
                                                    const service = services.find(s => s.id === apt.serviceId);

                                                    return (
                                                        <div
                                                            key={apt.id}
                                                            className={`rounded-sm border shadow-sm cursor-pointer hover:shadow-md transition-all relative overflow-hidden group/card
                                                                ${isDense ? 'p-0.5' : 'p-1'}
                                                                ${apt.clientName?.startsWith('Blocked') ? 'bg-gray-100 border-gray-400 text-gray-500' : `${staffColor.bg} ${staffColor.border} ${staffColor.text}`}
                                                                ${apt.status === 'CANCELLED' ? 'opacity-60 grayscale-[0.8] border-dashed' : ''}
                                                            `}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onAppointmentClick(apt);
                                                            }}
                                                        >
                                                            <div className={`font-black uppercase tracking-wider leading-none mb-0.5 ${isDense ? 'text-[8px]' : 'text-[9px]'}`}>
                                                                {staffMember?.name?.split(' ')[0] || 'Unassigned'}
                                                            </div>
                                                            <div className={`font-bold truncate leading-tight ${isDense ? 'text-[9px]' : 'text-[10px]'}`}>
                                                                {apt.clientName}
                                                            </div>
                                                            {!isDense && (
                                                                <>
                                                                    <div className="text-[9px] truncate font-medium opacity-80 mb-0.5">
                                                                        {service?.name || 'Service'}
                                                                    </div>
                                                                    <div className="text-[8px] truncate font-bold opacity-70">
                                                                        {apt.timeSlot}
                                                                    </div>
                                                                </>
                                                            )}
                                                            {isDense && (
                                                                <div className="flex items-center justify-between font-bold opacity-80 text-[8px] mt-0.5">
                                                                    <span>{apt.timeSlot}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MOBILE iOS STYLE VIEW */}
            <div className="md:hidden flex flex-col h-full bg-white pb-[5.5rem]">
                <div className="flex flex-col border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center justify-between px-2 py-2">
                        <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setViewMode('month')} // Mobile Header -> Month View
                            className="text-lg font-bold text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-2 rounded-lg transition-colors"
                        >
                            <span className="text-blue-900/50 mr-1">Week</span>
                            {format(currentDate, 'MMMM yyyy')}
                            <ChevronRight className="w-4 h-4 text-blue-400 rotate-90" />
                        </button>

                        <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex justify-between px-2 pb-3 overflow-x-auto no-scrollbar">
                        {weekDays.map(day => {
                            const isSelected = isSameDay(day, selectedDate);
                            const isToday = isSameDay(day, new Date());
                            return (
                                <div
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    className="flex flex-col items-center justify-center min-w-[3.5rem] cursor-pointer"
                                >
                                    <span className={`text-[10px] uppercase font-bold mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {format(day, 'EEE')}
                                    </span>
                                    <div className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md scale-110' : isToday ? 'text-blue-600 bg-blue-50' : 'text-gray-900 hover:bg-gray-50'}`}>
                                        {format(day, 'd')}
                                    </div>
                                    {isToday && !isSelected && <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <VerticalDayTimeline
                        appointments={selectedDateAppointments}
                        staff={staff}
                        services={services}
                        availability={availability}
                        businessHours={businessHours}
                        date={selectedDate}
                        onAppointmentClick={(id) => {
                            const apt = appointments.find(a => a.id === id);
                            if (apt) onAppointmentClick(apt);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
