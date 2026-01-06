import React, { useMemo, useState, useEffect } from 'react';
import { TimeSlot } from '@/types';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, ChevronRight, Check, Loader2 } from 'lucide-react';
import { format, isSameDay, startOfToday, addDays } from 'date-fns';
import { formatTime12Hour } from '@/lib/utils';

interface DateSelectionProps {
    selectedDate: Date | null;
    onSelectDate: (date: Date | null) => void;
    selectedTime: string | null;
    onSelectTime: (time: string) => void;
    timeSlots: TimeSlot[];
    onBack: () => void;
    onNext: () => void;
    isLoading?: boolean;
    holidays?: string[];
    schedulingSettings?: {
        min_notice_value?: number;
        min_notice_unit?: 'minutes' | 'hours';
        max_advance_value?: number;
        max_advance_unit?: 'days' | 'weeks' | 'months';
        buffer_minutes?: number;
    };
}

export default function DateSelection({
    selectedDate,
    onSelectDate,
    selectedTime,
    onSelectTime,
    timeSlots,
    onBack,
    onNext,
    isLoading = false,
    holidays = [],
    schedulingSettings
}: DateSelectionProps) {
    const [cols, setCols] = useState(7);

    // Detect responsive column count
    useEffect(() => {
        const updateCols = () => {
            if (window.innerWidth < 768) setCols(4);
            else if (window.innerWidth < 1024) setCols(6);
            else setCols(7);
        };
        updateCols();
        window.addEventListener('resize', updateCols);
        return () => window.removeEventListener('resize', updateCols);
    }, []);

    // Generate days for calendar based on scheduling settings
    const calendarDays = useMemo(() => {
        const val = schedulingSettings?.max_advance_value ?? 30;
        const unit = schedulingSettings?.max_advance_unit || 'days';

        let daysToShow = 30;
        if (unit === 'days') daysToShow = val;
        else if (unit === 'weeks') daysToShow = val * 7;
        else if (unit === 'months') daysToShow = val * 30;

        // Cap at something reasonable if not set or zero
        if (daysToShow <= 0) daysToShow = 30;

        return Array.from({ length: daysToShow }, (_, i) => addDays(startOfToday(), i));
    }, [schedulingSettings]);

    return (
        <div className="px-6 md:pt-0 md:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full mx-auto max-w-5xl relative pb-24">
            <div className="flex items-center gap-3 mb-5">
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900 active:scale-95">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Select Date & Time</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Tap a date to see availability.</p>
                </div>
                <div className="hidden md:block text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 uppercase tracking-widest">Step 3 of 4</div>
            </div>

            <div className="space-y-3">
                {Array.from({ length: Math.ceil(calendarDays.length / cols) }, (_, rowIndex) => {
                    const rowDays = calendarDays.slice(rowIndex * cols, (rowIndex + 1) * cols);
                    const isSelectedInRow = selectedDate ? rowDays.some(d => isSameDay(d, selectedDate)) : false;

                    return (
                        <React.Fragment key={rowIndex}>
                            {/* Standard Grid Row */}
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2">
                                {rowDays.map((date) => {
                                    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                                    const isHoliday = holidays.includes(format(date, 'yyyy-MM-dd'));

                                    if (isSelected) {
                                        return (
                                            <div
                                                key={date.toISOString()}
                                                className="col-span-1 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 min-h-[90px] sm:min-h-[110px] flex items-center justify-center animate-pulse"
                                            >
                                                <div className="opacity-10 grayscale flex flex-col items-center gap-0.5">
                                                    <span className="text-[8px] sm:text-[10px] uppercase font-bold text-gray-400">{format(date, 'EEE')}</span>
                                                    <span className="text-lg sm:text-2xl font-black text-gray-900">{format(date, 'd')}</span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={date.toISOString()} className="col-span-1">
                                            <button
                                                onClick={() => !isHoliday && onSelectDate(date)}
                                                disabled={isHoliday}
                                                className={`w-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all duration-300 border gap-1.5 min-h-[90px] sm:min-h-[110px] ${isHoliday
                                                    ? 'bg-gray-50/50 border-transparent opacity-50 cursor-not-allowed'
                                                    : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:shadow-lg hover:-translate-y-1 hover:bg-gray-50/30'
                                                    }`}
                                            >
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-gray-400">
                                                        {format(date, 'EEE')}
                                                    </span>
                                                    <span className="text-lg sm:text-2xl font-black leading-none text-gray-900">
                                                        {format(date, 'd')}
                                                    </span>
                                                </div>
                                                {isHoliday && (
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Closed</span>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Inline Selection Row (Expands below) */}
                            {isSelectedInRow && (
                                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2 bg-gray-50/50 p-2 rounded-3xl animate-in fade-in slide-in-from-top-2 duration-500 ring-1 ring-gray-100">
                                    {/* Active Date Card - This matches the "blank spot" col-span logic */}
                                    <div className="col-span-1">
                                        <button
                                            onClick={() => onSelectDate(null)}
                                            className="w-full h-full min-h-[90px] sm:min-h-[110px] flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-gray-900 text-white shadow-xl ring-2 ring-gray-900 ring-offset-2 transition-all active:scale-95 group"
                                        >
                                            <div className="flex flex-col items-center gap-0.5">
                                                <span className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-white/70">
                                                    {format(selectedDate!, 'EEE')}
                                                </span>
                                                <span className="text-lg sm:text-2xl font-black leading-none">
                                                    {format(selectedDate!, 'd')}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[8px] font-bold uppercase tracking-widest">Change</span>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Time Slots Area (Spans the rest) */}
                                    <div className="col-span-3 md:col-span-5 lg:col-span-6 flex flex-col justify-center p-2">
                                        {isLoading ? (
                                            <div className="flex items-center justify-center h-20">
                                                <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
                                            </div>
                                        ) : timeSlots.length > 0 ? (
                                            <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2">
                                                {timeSlots.map((slot, i) => (
                                                    <button
                                                        key={i}
                                                        disabled={!slot.available}
                                                        onClick={() => {
                                                            onSelectTime(slot.time);
                                                            onNext();
                                                        }}
                                                        className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all duration-200 border flex items-center justify-center ${!slot.available
                                                            ? 'bg-gray-100/50 text-gray-200 border-transparent cursor-not-allowed hidden'
                                                            : selectedTime === slot.time
                                                                ? 'bg-gray-900 border-gray-900 text-white shadow-md scale-105 z-10'
                                                                : 'bg-white border-gray-100 text-gray-600 hover:border-gray-900 hover:text-gray-900 hover:shadow-sm'
                                                            }`}
                                                    >
                                                        {formatTime12Hour(slot.time)}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-20 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">No available slots</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
