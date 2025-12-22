import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Appointment } from '@/types';

interface MonthViewProps {
    currentDate: Date;
    appointments: Appointment[];
    onDaySelect: (date: Date) => void;
    onMonthChange: (date: Date) => void;
    onTitleClick: () => void;
}

export default function MonthView({ currentDate, appointments, onDaySelect, onMonthChange, onTitleClick }: MonthViewProps) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [startDate, endDate]);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Helper to check for events on a day
    const getEventsForDay = (day: Date) => {
        const dayString = day.toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });
        return appointments.filter(apt => apt.date === dayString && apt.status !== 'CANCELLED');
    };

    return (
        <div className="flex flex-col h-full bg-white animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-2 border-b border-gray-100 bg-white z-10 shrink-0">
                <button
                    onClick={() => onMonthChange(addMonths(currentDate, -1))}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                    onClick={onTitleClick}
                    className="text-lg font-bold text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-2 rounded-lg transition-colors"
                >
                    <span className="text-blue-900/50 mr-1">Month</span>
                    {format(currentDate, 'MMMM yyyy')}
                </button>

                <button
                    onClick={() => onMonthChange(addMonths(currentDate, 1))}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                {weekDays.map(day => (
                    <div key={day} className="text-center py-2 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Month Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 md:grid-rows-5 overflow-hidden">
                {calendarDays.map((day, index) => {
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isToday = isSameDay(day, new Date());
                    const events = getEventsForDay(day);
                    const hasEvents = events.length > 0;

                    return (
                        <div
                            key={day.toISOString()}
                            onClick={() => onDaySelect(day)}
                            className={`
                                relative border-b border-r border-gray-100 flex flex-col items-center pt-2 cursor-pointer transition-colors
                                ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/30 text-gray-300 hover:bg-gray-50'}
                            `}
                        >
                            <span className={`
                                text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full mb-1
                                ${isToday ? 'bg-blue-600 text-white font-bold shadow-sm' : ''}
                                ${!isToday && isCurrentMonth ? 'text-gray-900' : ''}
                                ${!isToday && !isCurrentMonth ? 'text-gray-300' : ''}
                            `}>
                                {format(day, 'd')}
                            </span>

                            {/* Event Dots */}
                            <div className="flex gap-1 flex-wrap justify-center px-2 max-w-full">
                                {hasEvents && (
                                    <div className="flex gap-0.5">
                                        {events.slice(0, 3).map((apt, i) => (
                                            <div
                                                key={i}
                                                className={`w-1.5 h-1.5 rounded-full ${isCurrentMonth ? 'bg-blue-400' : 'bg-blue-200'}`}
                                            ></div>
                                        ))}
                                        {events.length > 3 && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
