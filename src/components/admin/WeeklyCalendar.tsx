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
            {/* Header Content (Elite V3 - Design Lab Match) */}
            <div className="flex flex-col pt-2 bg-transparent sticky top-0 z-30 subpixel-antialiased">
                {/* Top Nav Row */}
                <div className="flex items-center justify-between px-6 mb-2">
                    <button
                        onClick={() => setViewMode('month')}
                        className="flex items-center gap-1 text-[#4F46E5] hover:opacity-70 transition-opacity"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-[18px] font-bold">Month</span>
                    </button>

                    <div className="flex items-center gap-5">
                        <Users className="w-6 h-6 text-[#4F46E5] cursor-pointer" />
                        <CalendarIcon className="w-6 h-6 text-[#4F46E5] cursor-pointer" />
                        <button
                            onClick={() => onSelectSlot(selectedDate, "09:00")}
                            className="text-[#4F46E5]"
                        >
                            <Plus className="w-8 h-8" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Day Row */}
                <div className="flex items-center px-6 mb-8 gap-4">
                    <h2 className="text-[44px] font-[900] text-[#111827] tracking-tight leading-none">
                        {format(selectedDate, 'EEEE')}
                    </h2>
                    {isSameDay(selectedDate, new Date()) && (
                        <div className="px-4 py-1.5 bg-[#EEF2FF] text-[#4F46E5] rounded-full text-[14px] font-[900] tracking-tight">
                            Today
                        </div>
                    )}
                </div>

                {/* Date Slider Selection */}
                <div className="flex justify-between px-6 pb-8 overflow-x-auto no-scrollbar max-w-full lg:max-w-[700px]">
                    {weekDays.map(day => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => setSelectedDate(day)}
                                className="flex flex-col items-center group cursor-pointer min-w-[3.5rem]"
                            >
                                <span className={`text-[12px] font-bold uppercase tracking-widest mb-4 transition-colors ${isSelected ? 'text-[#4F46E5]' : 'text-gray-400'}`}>
                                    {format(day, 'EEEEE')}
                                </span>
                                <div
                                    className={`w-12 h-12 flex items-center justify-center rounded-full text-[18px] font-[900] transition-all ${isSelected
                                            ? 'bg-[#4F46E5] text-white shadow-xl shadow-[#4F46E5]/30'
                                            : isToday ? 'text-[#4F46E5] bg-[#EEF2FF]' : 'text-[#111827] hover:bg-white/50'
                                        }`}
                                >
                                    {format(day, 'd')}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area (Timeline) */}
            <div className="flex-1 overflow-visible relative">
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
