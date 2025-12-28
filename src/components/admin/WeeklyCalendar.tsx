import React from 'react';
import { Appointment, Staff, Service, Organization } from '@/types';
import { ChevronLeft, Plus, Users, Calendar as CalendarIcon } from 'lucide-react';
import VerticalDayTimeline from './VerticalDayTimeline';
import { addDays, format, startOfWeek, isSameDay } from 'date-fns';
import YearView from './YearView';
import MonthView from './MonthView';

interface WeeklyCalendarProps {
    appointments: Appointment[];
    staff: Staff[];
    services: Service[];
    availability?: any[];
    businessHours?: Organization['business_hours'];
    isBlockingMode?: boolean;
    onSelectSlot: (date: Date, time: string, staffId?: string) => void;
    onAppointmentClick: (appointment: Appointment) => void;
    colorMode?: 'staff' | 'service';
}

export default function WeeklyCalendar({ appointments, staff, services, availability = [], businessHours, isBlockingMode = false, onSelectSlot, onAppointmentClick, colorMode = 'staff' }: WeeklyCalendarProps) {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [viewMode, setViewMode] = React.useState<'week' | 'month' | 'year'>('week');
    const [selectedDate, setSelectedDate] = React.useState(new Date());

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    const selectedDateAppointments = appointments.filter(apt => {
        const selectedDateString = selectedDate.toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });
        return apt.date === selectedDateString;
    }).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    const handleMonthSelect = (date: Date) => {
        setCurrentDate(date);
        setViewMode('month');
    };

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
                onTitleClick={() => setViewMode('week')}
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
                onTitleClick={() => setViewMode('year')}
            />
        );
    }

    return (
        <div className="flex flex-col h-full lg:overflow-hidden relative bg-transparent">
            {/* Header Content (Elite V2 Style - Final Polish) */}
            <div className="flex flex-col pt-4 bg-transparent sticky top-0 z-30 subpixel-antialiased">
                {/* Top Nav Row */}
                <div className="flex items-center justify-between px-6 mb-4">
                    <button
                        onClick={() => setViewMode('month')}
                        className="flex items-center gap-1.5 text-[#007AFF] font-bold hover:opacity-70 transition-opacity"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-[17px]">Month</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <Users className="w-6 h-6 text-[#007AFF] hover:opacity-80 cursor-pointer transition-colors" />
                        <CalendarIcon className="w-6 h-6 text-[#007AFF] hover:opacity-80 cursor-pointer transition-colors" />
                        <button
                            onClick={() => onSelectSlot(selectedDate, "09:00")}
                            className="text-[#007AFF] hover:opacity-70 transition-opacity"
                        >
                            <Plus className="w-7 h-7" />
                        </button>
                    </div>
                </div>

                {/* Day Row */}
                <div className="flex items-center px-6 mb-6 gap-3">
                    <h2 className="text-[34px] font-black text-gray-900 tracking-tight leading-none">
                        {format(selectedDate, 'EEEE')}
                    </h2>
                    {isSameDay(selectedDate, new Date()) && (
                        <div className="px-3 py-1 bg-primary-100 text-primary-600 rounded-full text-[13px] font-black tracking-tight self-center">
                            Today
                        </div>
                    )}
                </div>

                {/* Date Slider Selection */}
                <div className="flex justify-between px-6 pb-6 overflow-x-auto no-scrollbar max-w-[500px]">
                    {weekDays.map(day => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => setSelectedDate(day)}
                                className="flex flex-col items-center group cursor-pointer min-w-[3rem]"
                            >
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                    {format(day, 'EEEEE')}
                                </span>
                                <div
                                    className={`w-11 h-11 flex items-center justify-center rounded-full text-[17px] font-black transition-all ${isSelected
                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 ring-4 ring-primary-100'
                                            : isToday ? 'text-primary-600 border border-primary-100' : 'text-gray-900 hover:bg-gray-100'
                                        }`}
                                >
                                    {format(day, 'd')}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area (Timeline) - No Borders/Shadows to revealed background */}
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
                    onSelectSlot={onSelectSlot}
                    colorMode={colorMode}
                />
            </div>
        </div>
    );
}
