import React, { useMemo } from 'react';
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
}

export default function DateSelection({
    selectedDate,
    onSelectDate,
    selectedTime,
    onSelectTime,
    timeSlots,
    onBack,
    onNext,
    isLoading = false
}: DateSelectionProps) {

    // Generate next 30 days for calendar
    const calendarDays = useMemo(() => {
        return Array.from({ length: 30 }, (_, i) => addDays(startOfToday(), i));
    }, []);

    return (
        <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full mx-auto max-w-5xl relative pb-32">
            <div className="flex items-center gap-3 mb-8">
                <button onClick={onBack} className="p-3 -ml-3 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900 active:scale-95">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Select Date & Time</h2>
                    <p className="text-gray-500 mt-1">Tap a date to see availability.</p>
                </div>
                <div className="hidden md:block text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">Step 3 of 4</div>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-4">
                {calendarDays.map((date) => {
                    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                    return (
                        <div
                            key={date.toISOString()}
                            className={`rounded-[2rem] transition-all duration-300 border ${isSelected
                                ? 'col-span-4 md:col-span-6 lg:col-span-7 bg-white border-gray-900 shadow-xl shadow-gray-200/50 ring-1 ring-black/5'
                                : 'col-span-1 bg-white border-transparent hover:bg-gray-50 hover:shadow-lg'
                                }`}
                        >
                            <button
                                onClick={() => onSelectDate(isSelected ? null : date)}
                                className={`w-full flex items-center p-4 sm:p-6 transition-all ${isSelected
                                    ? 'justify-between text-left'
                                    : 'flex-col justify-center text-center gap-2 sm:gap-3 min-h-[140px] sm:min-h-[180px]'
                                    }`}
                            >
                                <div className={`flex items-center ${isSelected ? 'gap-4' : 'flex-col gap-1'}`}>
                                    <div className={`rounded-full flex flex-col items-center justify-center shrink-0 transition-colors ${isSelected
                                        ? 'w-14 h-14 sm:w-16 sm:h-16 bg-gray-900 text-white shadow-lg'
                                        : 'w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600'
                                        }`}>
                                        <span className={`${isSelected ? 'text-xs sm:text-sm uppercase tracking-wider font-bold opacity-80' : 'text-[10px] sm:text-xs uppercase tracking-wider font-bold'}`}>
                                            {format(date, 'EEE')}
                                        </span>
                                        <span className={`${isSelected ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'} font-black leading-none`}>
                                            {format(date, 'd')}
                                        </span>
                                    </div>

                                    {isSelected && (
                                        <div className="flex flex-col">
                                            <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                                                {format(date, 'MMMM do')}
                                            </span>
                                            <span className="text-sm font-medium text-gray-400">
                                                Select a time
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {isSelected && (
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center rotate-90 text-gray-900">
                                        <ChevronRight className="w-6 h-6" />
                                    </div>
                                )}
                            </button>

                            {/* Accordion Content */}
                            {isSelected && (
                                <div className="px-4 sm:px-8 pb-8 animate-in slide-in-from-top-2 fade-in duration-300">
                                    <div className="h-px w-full bg-gray-100 mb-8"></div>

                                    {isLoading ? (
                                        <div className="py-20 flex justify-center items-center">
                                            <Loader2 className="w-10 h-10 text-gray-900 animate-spin" />
                                        </div>
                                    ) : timeSlots.length > 0 ? (
                                        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 sm:gap-4">
                                            {timeSlots.map((slot, i) => (
                                                <button
                                                    key={i}
                                                    disabled={!slot.available}
                                                    onClick={() => onSelectTime(slot.time)}
                                                    className={`py-4 px-2 rounded-2xl text-sm font-bold transition-all duration-200 border relative flex items-center justify-center ${!slot.available
                                                        ? 'bg-gray-50 text-gray-200 border-transparent cursor-not-allowed hidden' // Hide unavailable
                                                        : selectedTime === slot.time
                                                            ? 'bg-gray-900 border-gray-900 text-white shadow-xl scale-110 z-10 ring-2 ring-offset-2 ring-gray-900'
                                                            : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:shadow-md hover:-translate-y-1'
                                                        }`}
                                                >
                                                    {formatTime12Hour(slot.time)}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            <p className="text-gray-500 font-medium">No available slots for this date.</p>
                                        </div>
                                    )}

                                    {/* Continue Button */}
                                    {selectedTime && (
                                        <div className="mt-10 flex justify-center animate-in fade-in slide-in-from-bottom-4 zoom-in-95">
                                            <Button
                                                size="lg"
                                                onClick={onNext}
                                                className="w-full sm:w-auto min-w-[200px] shadow-2xl shadow-gray-900/20 px-10 py-7 text-xl rounded-2xl font-black bg-gray-900 hover:bg-black text-white hover:scale-105 transition-all"
                                            >
                                                Review Booking <ArrowRight className="w-6 h-6 ml-3" />
                                            </Button>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
