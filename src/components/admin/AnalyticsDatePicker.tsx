import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears, addDays, getDaysInMonth, getDay, isSameDay, isWithinInterval } from 'date-fns';

export type DateRangePreset = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';

export interface DateRange {
    start: Date;
    end: Date;
}

interface AnalyticsDatePickerProps {
    selectedRange: DateRange;
    onRangeChange: (range: DateRange, preset: DateRangePreset) => void;
    compareMode?: boolean;
    onCompareModeToggle?: (enabled: boolean) => void;
}

export default function AnalyticsDatePicker({
    selectedRange,
    onRangeChange,
    compareMode = false,
    onCompareModeToggle
}: AnalyticsDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activePreset, setActivePreset] = useState<DateRangePreset>('this_week');
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [customStart, setCustomStart] = useState<Date | null>(null);
    const [customEnd, setCustomEnd] = useState<Date | null>(null);
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowCustomPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const presets = [
        {
            id: 'this_week' as DateRangePreset,
            label: 'This Week',
            getRange: () => ({
                start: startOfWeek(new Date(), { weekStartsOn: 1 }),
                end: endOfWeek(new Date(), { weekStartsOn: 1 })
            })
        },
        {
            id: 'last_week' as DateRangePreset,
            label: 'Last Week',
            getRange: () => ({
                start: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
                end: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
            })
        },
        {
            id: 'this_month' as DateRangePreset,
            label: 'This Month',
            getRange: () => ({
                start: startOfMonth(new Date()),
                end: new Date()
            })
        },
        {
            id: 'last_month' as DateRangePreset,
            label: 'Last Month',
            getRange: () => ({
                start: startOfMonth(subMonths(new Date(), 1)),
                end: endOfMonth(subMonths(new Date(), 1))
            })
        },
        {
            id: 'this_year' as DateRangePreset,
            label: 'This Year',
            getRange: () => ({
                start: startOfYear(new Date()),
                end: new Date()
            })
        },
        {
            id: 'last_year' as DateRangePreset,
            label: 'Last Year',
            getRange: () => ({
                start: startOfYear(subYears(new Date(), 1)),
                end: endOfYear(subYears(new Date(), 1))
            })
        }
    ];

    const handlePresetClick = (preset: typeof presets[0]) => {
        const range = preset.getRange();
        setActivePreset(preset.id);
        onRangeChange(range, preset.id);
        setIsOpen(false);
        setShowCustomPicker(false);
    };

    const handleCustomRangeClick = () => {
        setShowCustomPicker(true);
        setCustomStart(null);
        setCustomEnd(null);
    };

    const handleDateClick = (date: Date) => {
        if (!customStart || (customStart && customEnd)) {
            setCustomStart(date);
            setCustomEnd(null);
        } else {
            if (date < customStart) {
                setCustomEnd(customStart);
                setCustomStart(date);
            } else {
                setCustomEnd(date);
            }
        }
    };

    const applyCustomRange = () => {
        if (customStart && customEnd) {
            onRangeChange({ start: customStart, end: customEnd }, 'custom');
            setActivePreset('custom');
            setIsOpen(false);
            setShowCustomPicker(false);
        }
    };

    const navigatePeriod = (direction: 'prev' | 'next') => {
        let newRange: DateRange;
        const daysDiff = Math.ceil((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24));

        if (direction === 'prev') {
            newRange = {
                start: addDays(selectedRange.start, -daysDiff - 1),
                end: addDays(selectedRange.end, -daysDiff - 1)
            };
        } else {
            newRange = {
                start: addDays(selectedRange.start, daysDiff + 1),
                end: addDays(selectedRange.end, daysDiff + 1)
            };
        }

        onRangeChange(newRange, 'custom');
        setActivePreset('custom');
    };

    const formatDateRange = () => {
        if (selectedRange.start.toDateString() === selectedRange.end.toDateString()) {
            return format(selectedRange.start, 'MMM d, yyyy');
        }

        if (selectedRange.start.getFullYear() === selectedRange.end.getFullYear()) {
            if (selectedRange.start.getMonth() === selectedRange.end.getMonth()) {
                return `${format(selectedRange.start, 'MMM d')} - ${format(selectedRange.end, 'd, yyyy')}`;
            }
            return `${format(selectedRange.start, 'MMM d')} - ${format(selectedRange.end, 'MMM d, yyyy')}`;
        }

        return `${format(selectedRange.start, 'MMM d, yyyy')} - ${format(selectedRange.end, 'MMM d, yyyy')}`;
    };

    // Calendar rendering
    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(calendarMonth);
        const firstDayOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
        const startDay = getDay(firstDayOfMonth);
        const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

        const days = [];
        for (let i = 0; i < adjustedStartDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
            const isStart = customStart && isSameDay(date, customStart);
            const isEnd = customEnd && isSameDay(date, customEnd);
            const isInRange = customStart && customEnd && isWithinInterval(date, { start: customStart, end: customEnd });
            const isToday = isSameDay(date, new Date());

            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(date)}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-all ${isStart || isEnd
                        ? 'bg-blue-600 text-white'
                        : isInRange
                            ? 'bg-blue-100 text-blue-900'
                            : isToday
                                ? 'bg-gray-200 text-gray-900'
                                : 'hover:bg-gray-100 text-gray-700'
                        }`}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Main Button */}
            <div className="flex items-center gap-2">
                {/* Previous Period Button */}
                <button
                    onClick={() => navigatePeriod('prev')}
                    className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                    title="Previous period"
                >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>

                {/* Date Range Display */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex flex-1 items-center gap-2 md:gap-3 px-3 md:px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all shadow-sm min-w-0 md:min-w-[280px]"
                >
                    <div className="hidden xs:flex p-1 md:p-1.5 bg-blue-50 rounded-lg shrink-0">
                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">
                            {presets.find(p => p.id === activePreset)?.label || 'Custom'}
                        </div>
                        <div className="text-xs md:text-sm font-black text-gray-900 truncate">
                            {formatDateRange()}
                        </div>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Next Period Button */}
                <button
                    onClick={() => navigatePeriod('next')}
                    className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                    title="Next period"
                >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>

                {/* Compare Mode Toggle */}
                {onCompareModeToggle && (
                    <button
                        onClick={() => onCompareModeToggle(!compareMode)}
                        className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${compareMode
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {compareMode ? '✓ Comparing' : 'Compare'}
                    </button>
                )}
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {!showCustomPicker ? (
                        <div className="w-80">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900">Select Time Period</h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Quick Presets */}
                            <div className="p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    Quick Picks
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {presets.map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={() => handlePresetClick(preset)}
                                            className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activePreset === preset.id
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Range Button */}
                                <button
                                    onClick={handleCustomRangeClick}
                                    className="w-full mt-3 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
                                >
                                    📅 Custom Date Range
                                </button>
                            </div>

                            {/* Info Footer */}
                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                <p className="text-xs text-gray-500 text-center">
                                    Use ← → arrows to navigate periods
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-96">
                            {/* Custom Picker Header */}
                            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                                <div className="flex items-center justify-between mb-3">
                                    <button
                                        onClick={() => setShowCustomPicker(false)}
                                        className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Back
                                    </button>
                                    <h3 className="font-bold text-gray-900">Custom Range</h3>
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            setShowCustomPicker(false);
                                        }}
                                        className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>

                                {/* Selected Range Display */}
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="flex-1 px-3 py-2 bg-white rounded-lg">
                                        <span className="text-xs text-gray-500">Start:</span>
                                        <div className="font-semibold text-gray-900">
                                            {customStart ? format(customStart, 'MMM d, yyyy') : 'Select date'}
                                        </div>
                                    </div>
                                    <div className="flex-1 px-3 py-2 bg-white rounded-lg">
                                        <span className="text-xs text-gray-500">End:</span>
                                        <div className="font-semibold text-gray-900">
                                            {customEnd ? format(customEnd, 'MMM d, yyyy') : 'Select date'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Calendar */}
                            <div className="p-4">
                                {/* Month/Year Navigation */}
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <div className="font-bold text-gray-900">
                                        {format(calendarMonth, 'MMMM yyyy')}
                                    </div>
                                    <button
                                        onClick={() => setCalendarMonth(addDays(calendarMonth, 31))}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Day Headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                        <div key={i} className="h-8 flex items-center justify-center text-xs font-semibold text-gray-500">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {renderCalendar()}
                                </div>
                            </div>

                            {/* Apply Button */}
                            <div className="p-4 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={applyCustomRange}
                                    disabled={!customStart || !customEnd}
                                    className={`w-full px-4 py-3 rounded-xl font-semibold transition-all ${customStart && customEnd
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Apply Custom Range
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
