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
    colorMode?: 'staff' | 'service'; // New Prop
}

export default function WeeklyCalendar({ appointments, staff, services, availability = [], businessHours, isBlockingMode = false, onSelectSlot, onAppointmentClick, colorMode = 'staff' }: WeeklyCalendarProps) {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [viewMode, setViewMode] = React.useState<'week' | 'month' | 'year'>('week');
    const [selectedDate, setSelectedDate] = React.useState(new Date());

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start

    // Generate week days
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

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
        setSelectedDate(date);
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
            {/* UNIFIED VIEW (Matches Admin 'Day Timeline' exactly) */}
            <div className="flex flex-col h-full bg-white">
                <div className="flex flex-col border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
                    {/* Header Navigation */}
                    <div className="flex items-center justify-between px-4 py-4 md:py-3">
                        <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setViewMode('month')} // Header -> Month View
                            className="text-lg font-bold text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-2 rounded-lg transition-colors group"
                        >
                            {format(currentDate, 'MMMM yyyy')}
                            <ChevronRight className="w-4 h-4 text-blue-400 rotate-90 transition-transform group-hover:translate-y-0.5" />
                        </button>

                        <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Day Selection Tabs */}
                    <div className="flex justify-between px-2 pb-3 overflow-x-auto no-scrollbar md:justify-center md:gap-8">
                        {weekDays.map(day => {
                            const isSelected = isSameDay(day, selectedDate);
                            const isToday = isSameDay(day, new Date());
                            return (
                                <div
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    className="flex flex-col items-center justify-center min-w-[3.5rem] cursor-pointer group"
                                >
                                    <span className={`text-[10px] uppercase font-bold mb-1 transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                        {format(day, 'EEE')}
                                    </span>
                                    <div
                                        className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all shadow-sm ${isSelected ? 'scale-110 shadow-blue-200' : isToday ? 'text-blue-600 bg-blue-50 border border-blue-100' : 'text-gray-900 hover:bg-gray-50'}`}
                                        style={isSelected ? {
                                            background: 'linear-gradient(to bottom right, #2563eb, #4f46e5)',
                                            color: '#ffffff',
                                        } : {}}
                                    >
                                        {format(day, 'd')}
                                    </div>
                                    {isToday && !isSelected && <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Day Timeline Content */}
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
                        colorMode={colorMode} // Pass through
                    />
                </div>
            </div>
        </div>
    );
}
