import React, { useMemo } from 'react';
import { format, addMonths, startOfYear, eachDayOfInterval, endOfMonth, isSameDay, isSameMonth, setMonth, startOfMonth, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearViewProps {
    currentDate: Date;
    onMonthSelect: (date: Date) => void;
    onYearChange: (date: Date) => void;
    onTitleClick: () => void;
}

export default function YearView({ currentDate, onMonthSelect, onYearChange, onTitleClick }: YearViewProps) {
    const yearStart = startOfYear(currentDate);
    const year = currentDate.getFullYear();
    const today = new Date();

    // Generate 12 months for the current year
    const months = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => {
            const monthStart = addMonths(yearStart, i);
            const daysInMonth = eachDayOfInterval({
                start: monthStart,
                end: endOfMonth(monthStart)
            });

            const startDay = getDay(monthStart); // 0 (Sun) to 6 (Sat)
            const paddingDays = startDay === 0 ? 6 : startDay - 1;

            return {
                date: monthStart,
                name: format(monthStart, 'MMMM'),
                days: daysInMonth,
                padding: paddingDays
            };
        });
    }, [yearStart]);

    return (
        <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-2 border-b border-gray-100 bg-white z-10 shrink-0">
                <button
                    onClick={() => onYearChange(addMonths(currentDate, -12))}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                    onClick={onTitleClick}
                    className="text-lg font-bold text-blue-600 tracking-tight hover:bg-blue-50 px-2 rounded-lg transition-colors flex items-center gap-1 group"
                >
                    <span className="text-blue-900/50 mr-1">Year</span>
                    {format(currentDate, 'yyyy')}
                    <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600 rotate-90 transition-transform" />
                </button>

                <button
                    onClick={() => onYearChange(addMonths(currentDate, 12))}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Year Grid - Scrollable with padding for bottom nav */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 max-w-[1600px] mx-auto">
                    {months.map((month) => {
                        const isCurrentMonth = isSameMonth(month.date, today);

                        return (
                            <div
                                key={month.name}
                                onClick={() => onMonthSelect(month.date)}
                                className="cursor-pointer group hover:bg-gray-50 rounded-2xl p-4 transition-colors duration-200 flex flex-col items-start justify-start border border-transparent hover:border-gray-100"
                            >
                                <h3 className={`font-bold text-lg mb-4 ${isCurrentMonth ? 'text-red-500' : 'text-gray-900 group-hover:text-red-500'} transition-colors`}>
                                    {month.name}
                                </h3>

                                <div className="grid grid-cols-7 gap-y-2 gap-x-1 w-full text-center">
                                    {/* Weekday Headers */}
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                        <div key={i} className="text-gray-300 font-bold text-xs uppercase tracking-wider mb-2">
                                            {day}
                                        </div>
                                    ))}

                                    {/* Padding days */}
                                    {Array.from({ length: month.padding }).map((_, i) => (
                                        <div key={`pad-${i}`} />
                                    ))}

                                    {/* Days */}
                                    {month.days.map((day) => {
                                        const isToday = isSameDay(day, today);
                                        return (
                                            <div
                                                key={day.toISOString()}
                                                className={`
                                                    mx-auto flex items-center justify-center rounded-full font-semibold text-sm w-8 h-8
                                                    ${isToday ? 'bg-red-500 text-white font-bold shadow-sm' : 'text-gray-700 hover:bg-gray-100'}
                                                `}
                                            >
                                                {format(day, 'd')}
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
