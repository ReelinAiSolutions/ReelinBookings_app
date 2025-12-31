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

            <div className="grid grid-cols-3 gap-3">
                {calendarDays.map((date) => {
                    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                    return (
                        <div
                            key={date.toISOString()}
                            className={`rounded-[2rem] transition-all duration-300 border ${isSelected
                                ? 'col-span-3 bg-white border-gray-900 shadow-xl shadow-gray-200/50 ring-1 ring-black/5'
                                : 'col-span-1 bg-white border-transparent hover:bg-gray-50 hover:shadow-lg'
                                }`}
                        >
                            <button
                                onClick={() => onSelectDate(isSelected ? null : date)}
                                className={`w-full flex items-center p-6 transition-all ${isSelected
                                    ? 'justify-between text-left'
                                    : 'flex-col justify-center text-center gap-3 min-h-[160px]'
                                    }`}
                            >
                                <div className={`flex items-center ${isSelected ? 'gap-4' : 'flex-col gap-1'}`}>
                                    <div className={`rounded-full flex flex-col items-center justify-center shrink-0 transition-colors ${isSelected
                                        ? 'w-12 h-12 bg-gray-900 text-white'
                                        : 'w-8 h-8 bg-gray-100 text-gray-500'
                                        }`}>
                                        <span className={`${isSelected ? 'text-xs uppercase tracking-wider font-bold' : 'text-[10px] uppercase tracking-wider font-bold'}`}>
                                            {format(date, 'EEE')}
                                        </span>
                                        <span className={`${isSelected ? 'text-3xl' : 'text-2xl'} font-black leading-none`}>
                                            {format(date, 'd')}
                                        </span>
                                    </div>

                                    {isSelected && (
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold text-gray-900">
                                                {format(date, 'MMMM do')}
                                            </span>
                                            <span className="text-sm font-medium text-gray-400">
                                                Viewing slots
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {isSelected && (
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center rotate-90 text-gray-900">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                )}
                            </button>

                            {/* Accordion Content */}
                            {isSelected && (
                                <div className="px-5 pb-6 animate-in slide-in-from-top-2 fade-in duration-300">
                                    <div className="h-px w-full bg-gray-100 mb-6"></div>

                                    {isLoading ? (
                                        <div className="py-12 flex justify-center items-center">
                                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                                        </div>
                                    ) : timeSlots.length > 0 ? (
                                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                            {timeSlots.map((slot, i) => (
                                                <button
                                                    key={i}
                                                    disabled={!slot.available}
                                                    onClick={() => onSelectTime(slot.time)}
                                                    className={`py-3 px-2 rounded-xl text-sm font-bold transition-all duration-200 border relative ${!slot.available
                                                        ? 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed hidden'
                                                        : selectedTime === slot.time
                                                            ? 'bg-gray-900 border-gray-900 text-white shadow-lg transform scale-105 z-10'
                                                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900'
                                                        }`}
                                                >
                                                    {formatTime12Hour(slot.time)}
                                                    {selectedTime === slot.time && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full border-2 border-white"></div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-100">
                                            <p className="text-gray-500 font-medium text-sm">No available slots for this date.</p>
                                        </div>
                                    )}

                                    {/* Continue Button - Right after time slots for this date */}
                                    {selectedTime && (
                                        <div className="mt-6 flex justify-center animate-in fade-in slide-in-from-bottom-4">
                                            <Button
                                                size="lg"
                                                onClick={onNext}
                                                className="w-full md:w-auto shadow-xl shadow-primary-900/20 px-8 py-6 text-lg rounded-2xl font-black"
                                            >
                                                Review Booking <ArrowRight className="w-6 h-6 ml-2" />
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
