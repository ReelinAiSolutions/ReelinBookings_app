import React, { useMemo } from 'react';
import { TimeSlot } from '@/types';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, ChevronRight, Clock, Check } from 'lucide-react';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';

interface DateSelectionProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    selectedTime: string | null;
    onSelectTime: (time: string) => void;
    timeSlots: TimeSlot[];
    onBack: () => void;
    onNext: () => void;
}

export default function DateSelection({
    selectedDate,
    onSelectDate,
    selectedTime,
    onSelectTime,
    timeSlots,
    onBack,
    onNext
}: DateSelectionProps) {

    // Generate next 14 days for calendar
    const calendarDays = useMemo(() => {
        return Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));
    }, []);

    return (
        <div className="p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Select Date & Time</h2>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 h-full">
                {/* Calendar Strip */}
                <div className="lg:w-1/3 border-r border-gray-100 pr-0 lg:pr-8">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <CalendarIcon className="w-4 h-4" /> Available Dates
                    </h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {calendarDays.map((date) => {
                            const isSelected = isSameDay(date, selectedDate);
                            return (
                                <button
                                    key={date.toISOString()}
                                    onClick={() => onSelectDate(date)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all duration-200 ${isSelected
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 transform scale-[1.02]'
                                        : 'bg-white hover:bg-gray-50 border border-transparent hover:border-gray-200 text-gray-700'
                                        }`}
                                >
                                    <div className="flex flex-col">
                                        <span className={`text-xs uppercase font-bold tracking-wider ${isSelected ? 'text-primary-100' : 'text-gray-400'}`}>{format(date, 'EEEE')}</span>
                                        <span className="text-xl font-extrabold mt-0.5">{format(date, 'MMMM d')}</span>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-300'}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Slots Grid */}
                <div className="flex-1">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Clock className="w-4 h-4" /> Available Slots
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {timeSlots.map((slot, i) => (
                            <button
                                key={i}
                                disabled={!slot.available}
                                onClick={() => onSelectTime(slot.time)}
                                className={`relative py-3 px-2 rounded-xl text-sm font-bold transition-all duration-200 ${!slot.available
                                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-transparent'
                                    : selectedTime === slot.time
                                        ? 'bg-white border-2 border-primary-600 text-primary-600 shadow-md transform scale-[1.05] z-10'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-400 hover:text-primary-600 hover:shadow-sm'
                                    }`}
                            >
                                {slot.time}
                                {selectedTime === slot.time && (
                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {!selectedTime ? (
                        <div className="mt-8 p-6 bg-gray-50 rounded-2xl text-center border border-dashed border-gray-200">
                            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 font-medium">Select a time slot to continue</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Button */}
                            <div className="hidden md:flex mt-8 justify-end animate-in fade-in slide-in-from-bottom-2">
                                <Button size="lg" onClick={onNext} className="shadow-xl shadow-primary-600/20">
                                    Continue to Review <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>

                            {/* Mobile Sticky Footer */}
                            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom-full duration-300">
                                <Button size="lg" onClick={onNext} className="w-full shadow-xl shadow-primary-600/20">
                                    Continue to Review <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                            {/* Spacer to prevent content being hidden behind footer */}
                            <div className="md:hidden h-24"></div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
