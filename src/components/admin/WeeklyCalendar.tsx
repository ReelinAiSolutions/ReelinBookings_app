import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Plus, Users } from 'lucide-react';
import { Appointment, Staff, Service, Organization, AppointmentStatus } from '@/types';
import { addDays, format, startOfWeek, isSameDay, getDay, getDaysInMonth, startOfMonth, startOfYear, addMonths, addYears, getYear, setYear, setMonth } from 'date-fns';

const PulseStyle = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes gravityPulse {
            0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
            70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
            100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        .live-pulse {
            animation: gravityPulse 2s infinite ease-in-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    `}} />
);

interface WeeklyCalendarProps {
    appointments: Appointment[];
    staff: Staff[];
    services: Service[];
    businessHours?: Organization['business_hours'];
    onSelectSlot: (date: Date, time: string, staffId?: string) => void;
    onAppointmentClick: (appointment: Appointment) => void;
}

export default function WeeklyCalendar({
    appointments,
    staff,
    services,
    onSelectSlot,
    onAppointmentClick
}: WeeklyCalendarProps) {

    // -- STATE --
    const [calendarLevel, setCalendarLevel] = useState<'day' | 'month' | 'year'>('day');
    const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

    // Swipe State
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);
    const minSwipeDistance = 50;
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // -- CONSTANTS --
    const hours = Array.from({ length: 24 }).map((_, i) => i);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // Calculate week dates dynamically
    const startOfCurrentWeek = startOfWeek(selectedDate);
    const weekDates = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

    // Staff colors mapping (Design Labs style)
    const staffColors = [
        { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-700', dot: 'bg-indigo-500' },
        { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-700', dot: 'bg-rose-500' },
        { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', dot: 'bg-amber-500' },
        { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', dot: 'bg-purple-500' },
        { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', dot: 'bg-blue-500' },
    ];

    // -- SCROLL START --
    useEffect(() => {
        if (calendarLevel === 'day' && scrollContainerRef.current) {
            const currentHour = new Date().getHours();
            // Scroll to 2 hours before current time, or 8 AM if early
            const targetHour = Math.max(0, currentHour - 2);
            scrollContainerRef.current.scrollTop = targetHour * 60;
        }
    }, [calendarLevel]);

    // -- ANIMATION CLASS --
    const getAnimClass = () => {
        return direction === 'forward'
            ? 'animate-in zoom-in-90 fade-in duration-300'
            : 'animate-in zoom-out-105 fade-in duration-300';
    };

    // -- SWIPE HANDLERS --
    const onTouchStart = (e: React.TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;

        // Only allow swipe to change dates in personal view for now (simplifies logic)
        if (viewMode !== 'personal') return;

        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            setSlideDirection('left');
            setSelectedDate(prev => addDays(prev, 1));
        }
        if (isRightSwipe) {
            setSlideDirection('right');
            setSelectedDate(prev => addDays(prev, -1));
        }
    };

    const handleGridClick = (hour: number, staffId?: string) => {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        onSelectSlot(selectedDate, timeStr, staffId);
    };

    // -- HELPERS --
    const getAppointmentsForDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.filter(apt => apt.date === dateStr && apt.status !== AppointmentStatus.CANCELLED);
    };

    // -- RENDERERS --

    const renderYearBlock = (year: number) => (
        <div key={year} className="mb-12">
            <h2 className={`text-3xl font-bold px-4 mb-4 border-b border-gray-50/0 ${year === getYear(selectedDate) ? 'text-indigo-600' : 'text-gray-900'}`}>{year}</h2>
            <div className="grid grid-cols-3 gap-x-2 gap-y-6 px-2">
                {months.map((m, i) => {
                    const monthDate = new Date(year, i, 1);
                    const days = getDaysInMonth(monthDate);
                    const offset = getDay(monthDate);
                    return (
                        <div
                            key={m}
                            className="flex flex-col gap-1 cursor-pointer active:bg-gray-50 rounded-lg p-1 transition-colors"
                            onClick={() => {
                                setDirection('forward');
                                setCalendarLevel('month');
                                setSelectedDate(monthDate);
                            }}
                        >
                            <h3 className={`text-[13px] font-bold pl-0.5 ${i === selectedDate.getMonth() && year === selectedDate.getFullYear() ? 'text-indigo-600' : 'text-gray-900'}`}>{m}</h3>
                            <div className="grid grid-cols-7 gap-y-[2px] gap-x-0 pointer-events-none">
                                {Array.from({ length: offset }).map((_, k) => <div key={`e-${k}`} className="w-full h-[10px]"></div>)}
                                {Array.from({ length: days }).map((_, d) => {
                                    const dayNum = d + 1;
                                    const currentDayDate = new Date(year, i, dayNum);
                                    const isToday = isSameDay(currentDayDate, new Date());
                                    return (
                                        <div key={d} className={`w-full h-[10px] flex items-center justify-center text-[7px] font-medium leading-none ${isToday ? 'bg-indigo-600 text-white rounded-full' : 'text-gray-800'}`}>
                                            {dayNum}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderYearView = () => {
        const currentYear = getYear(selectedDate);
        // Show current year, next year, and year after that just like Design Labs
        return (
            <div className={`flex-1 overflow-y-auto bg-white pb-20 pt-2 ${getAnimClass()} scrollbar-hide`}>
                {renderYearBlock(currentYear)}
                <div className="h-px bg-gray-100 mx-4 mb-8"></div>
                {renderYearBlock(currentYear + 1)}
                <div className="h-px bg-gray-100 mx-4 mb-8"></div>
                {renderYearBlock(currentYear + 2)}
            </div>
        );
    };

    const renderMonthBlock = (date: Date) => {
        const daysInMonth = getDaysInMonth(date);
        const startDayOffset = getDay(startOfMonth(date));
        const monthName = format(date, 'MMMM');
        const year = date.getFullYear();

        return (
            <div key={`${monthName}-${year}`} className="mb-8">
                <h3 className="sticky top-0 bg-white/95 backdrop-blur-sm py-2 px-4 text-xl font-bold text-gray-900 z-10 border-b border-gray-50/50">
                    {monthName} <span className="text-gray-400 font-normal ml-1">{year}</span>
                </h3>
                <div className="grid grid-cols-7 auto-rows-fr">
                    {Array.from({ length: startDayOffset }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-14 border-b border-gray-50 border-r border-gray-50 bg-gray-50/5"></div>
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const cellDate = new Date(year, date.getMonth(), dayNum);
                        const eventCount = getAppointmentsForDate(cellDate).length;
                        const isSelectedDay = isSameDay(cellDate, selectedDate);
                        const isTodayDay = isSameDay(cellDate, new Date());

                        return (
                            <div
                                key={i}
                                className="h-16 border-b border-gray-50 border-r border-gray-50 relative cursor-pointer active:bg-gray-50 transition-colors"
                                onClick={() => {
                                    setDirection('forward');
                                    setCalendarLevel('day');
                                    setSelectedDate(cellDate);
                                }}
                            >
                                <span className={`absolute top-1 left-1/2 -translate-x-1/2 text-sm font-medium ${isSelectedDay || isTodayDay
                                    ? 'bg-[#007AFF] text-white w-7 h-7 rounded-full flex items-center justify-center shadow-sm -mt-0.5'
                                    : 'text-gray-900'
                                    }`}>
                                    {dayNum}
                                </span>

                                {/* Smart Booking Indicator */}
                                {eventCount > 0 && (
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center">
                                        {eventCount === 1 ? (
                                            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                        ) : (
                                            <div className="flex items-center gap-[1px] px-1 py-0.5 rounded-full bg-gray-100/80">
                                                <div className="w-1 h-1 rounded-full bg-[#007AFF]"></div>
                                                <span className="text-[9px] font-black text-[#007AFF] leading-none mb-[0.5px] tracking-tight">{eventCount}</span>
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
    };

    const renderMonthView = () => (
        <div className={`flex-1 overflow-y-auto bg-white ${getAnimClass()} scrollbar-hide`}>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-gray-100 pb-2 pt-2 sticky top-0 bg-white z-20 shadow-sm">
                {weekDayLabels.map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
                ))}
            </div>

            <div className="pb-20 pt-2">
                {renderMonthBlock(selectedDate)}
                {renderMonthBlock(addMonths(startOfMonth(selectedDate), 1))}
                {renderMonthBlock(addMonths(startOfMonth(selectedDate), 2))}
            </div>
        </div>
    );

    // -- DAY VIEW --
    const renderDayView = () => {
        const dayAppointments = getAppointmentsForDate(selectedDate);
        const now = new Date();
        const isToday = isSameDay(selectedDate, now);
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeTopPx = isToday ? (currentHour * 60) + currentMinute : -1;

        return (
            <div
                ref={scrollContainerRef}
                className={`flex-1 overflow-auto bg-white relative ${getAnimClass()} scrollbar-hide`}
                style={{ scrollBehavior: 'smooth' }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {viewMode === 'team' && (
                    <div className="flex w-full sticky top-0 z-40 bg-white border-b border-gray-300 shadow-sm">
                        <div className="w-12 lg:w-20 shrink-0 sticky left-0 z-50 bg-white border-r border-gray-400"></div>
                        {staff.map((member, idx) => {
                            const colorScheme = staffColors[idx % staffColors.length];
                            return (
                                <div key={member.id} className="flex-1 min-w-0 text-center border-l border-gray-400 first:border-l-0 py-2 bg-white sticky top-0">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${colorScheme.dot}`}></div>
                                        <div className="text-xs font-bold text-gray-900 truncate px-1">{member.name}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="relative w-full flex" style={{ height: '1600px' }}>
                    <div className="w-12 lg:w-20 shrink-0 border-r border-gray-400 bg-white z-30 sticky left-0 h-full select-none">
                        {hours.map((h, i) => (
                            <div key={h} className="absolute w-12 lg:w-20 text-right pr-2 lg:pr-4" style={{ top: `${i * 60}px` }}>
                                <span className="text-[10px] font-medium text-gray-400 relative -top-2">
                                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? 'Noon' : `${h - 12} PM`}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 relative items-start min-w-0">
                        {viewMode === 'personal' ? (
                            <div
                                key={selectedDate.toISOString()}
                                className={`w-full relative ${slideDirection === 'left' ? 'animate-in slide-in-from-right duration-300' : slideDirection === 'right' ? 'animate-in slide-in-from-left duration-300' : ''}`}
                                style={{ height: '1600px' }}
                            >
                                {hours.map((h, i) => (
                                    <div key={h} className="absolute w-full border-t border-gray-300 h-px z-0" style={{ top: `${i * 60}px` }} onClick={() => handleGridClick(h)}></div>
                                ))}

                                {/* Current Time Indicator */}
                                {currentTimeTopPx !== -1 && (
                                    <div className="absolute w-full z-30 pointer-events-none" style={{ top: `${currentTimeTopPx}px` }}>
                                        <div className="w-full h-[1px] bg-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.4)]"></div>
                                        <div className="absolute -left-1 -translate-y-1/2 w-3 h-3 rounded-full bg-[#007AFF] live-pulse border-2 border-white shadow-sm"></div>
                                    </div>
                                )}

                                {dayAppointments.map(apt => {
                                    const [h, m] = apt.timeSlot.split(':').map(Number);
                                    const service = services.find(s => s.id === apt.serviceId);
                                    const duration = service?.durationMinutes || 60;
                                    const topPx = (h * 60) + m;

                                    return (
                                        <div
                                            key={apt.id}
                                            onClick={(e) => { e.stopPropagation(); onAppointmentClick(apt); }}
                                            className="absolute left-2 right-2 rounded-[4px] bg-indigo-50 border-l-[3px] border-indigo-500 p-2 text-indigo-900 overflow-hidden cursor-pointer z-10 shadow-sm animate-in zoom-in-95 duration-200"
                                            style={{ top: `${topPx}px`, height: `${duration}px`, minHeight: '40px' }}
                                        >
                                            <div className="text-sm font-bold leading-tight text-indigo-700">{apt.clientName}</div>
                                            <div className="text-xs text-indigo-500 mt-0.5">
                                                {apt.timeSlot}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex w-full h-full">
                                {staff.map((member, idx) => {
                                    const colorScheme = staffColors[idx % staffColors.length];
                                    const memberAppointments = dayAppointments.filter(apt => apt.staffId === member.id);

                                    return (
                                        <div key={member.id} className="flex-1 min-w-0 border-l border-gray-400 relative first:border-l-0 group h-full">
                                            {hours.map(h => (
                                                <div key={h} className="absolute w-full border-t border-gray-300 h-px z-0" style={{ top: `${h * 60}px` }} onClick={() => handleGridClick(h, member.id)}></div>
                                            ))}

                                            {memberAppointments.map(apt => {
                                                const [h, m] = apt.timeSlot.split(':').map(Number);
                                                const service = services.find(s => s.id === apt.serviceId);
                                                const duration = service?.durationMinutes || 60;
                                                const topPx = (h * 60) + m;

                                                return (
                                                    <div
                                                        key={apt.id}
                                                        onClick={(e) => { e.stopPropagation(); onAppointmentClick(apt); }}
                                                        className={`absolute left-1 right-1 rounded-[3px] ${colorScheme.bg} border-l-[3px] ${colorScheme.border} p-1.5 overflow-hidden z-10 shadow-sm animate-in zoom-in-95`}
                                                        style={{ top: `${topPx}px`, height: `${duration}px`, minHeight: '40px' }}
                                                    >
                                                        <div className={`text-xs font-bold leading-tight ${colorScheme.text}`}>{apt.clientName}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-white text-gray-900 flex flex-col font-sans overflow-hidden select-none relative">
            <PulseStyle />

            {/* STICKY HEADER WRAPPER */}
            <div className="sticky top-0 z-50 bg-[#F2F2F7]/90 backdrop-blur-md transition-all">
                {/* MAIN HEADER */}
                <header className="pt-6 pb-2 px-5 flex flex-col shrink-0">
                    {/* Row 1: Back Link */}
                    <div className="h-6 flex items-start">
                        {calendarLevel === 'month' && (
                            <div className="flex items-center gap-1 text-indigo-600 cursor-pointer active:opacity-50" onClick={() => { setDirection('backward'); setCalendarLevel('year'); }}>
                                <ChevronLeft className="w-5 h-5 -ml-1.5" strokeWidth={2.5} />
                                <span className="text-[17px] font-normal">{getYear(selectedDate)}</span>
                            </div>
                        )}
                        {calendarLevel === 'day' && (
                            <div className="flex items-center gap-1 text-indigo-600 cursor-pointer active:opacity-50" onClick={() => { setDirection('backward'); setCalendarLevel('month'); }}>
                                <ChevronLeft className="w-5 h-5 -ml-1.5" strokeWidth={2.5} />
                                <span className="text-[17px] font-normal">Month</span>
                            </div>
                        )}
                    </div>

                    {/* Row 2: Title & Primary Actions */}
                    <div className="flex items-end justify-between mt-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-[30px] font-black tracking-tight text-gray-900 leading-tight">
                                {calendarLevel === 'day' ? format(selectedDate, 'EEEE') : calendarLevel === 'month' ? format(selectedDate, 'MMMM') : getYear(selectedDate)}
                            </h1>
                            {!isSameDay(selectedDate, new Date()) && (
                                <button
                                    className="text-sm font-semibold text-indigo-600 bg-indigo-100/50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors mb-1.5"
                                    onClick={() => { setDirection('forward'); setCalendarLevel('day'); setSelectedDate(new Date()); }}
                                >
                                    Today
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2.5 mb-2">
                            {calendarLevel === 'day' && (
                                <button
                                    className={`text-indigo-600 ${viewMode === 'team' ? 'bg-indigo-100 rounded-full p-1.5' : ''}`}
                                    onClick={() => setViewMode(prev => prev === 'personal' ? 'team' : 'personal')}
                                >
                                    <Users className="w-6 h-6" strokeWidth={2} />
                                </button>
                            )}
                            <button
                                className="text-indigo-600"
                                onClick={() => onSelectSlot(selectedDate, "09:00")}
                            >
                                <Plus className="w-6 h-6" strokeWidth={2} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* DAY SPECIFIC DATE HEADER */}
                {calendarLevel === 'day' && (
                    <div className="border-b border-gray-200/50 pb-3 shrink-0 pt-2 transition-all">
                        <div className="flex justify-between px-5 mb-2">
                            {weekDayLabels.map((day, i) => (
                                <div key={i} className="w-10 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between px-5 text-[17px]">
                            {weekDates.map((date) => {
                                const isSelected = isSameDay(date, selectedDate);
                                const isToday = isSameDay(date, new Date());
                                return (
                                    <div
                                        key={date.toISOString()}
                                        className="w-10 flex flex-col items-center justify-center cursor-pointer"
                                        onClick={() => setSelectedDate(date)}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${isSelected
                                            ? 'bg-[#007AFF] text-white shadow-sm'
                                            : isToday
                                                ? 'text-[#007AFF]'
                                                : 'text-gray-900 bg-transparent'
                                            }`}>
                                            {format(date, 'd')}
                                        </div>
                                        {isToday && !isSelected && <div className="w-1 h-1 rounded-full bg-[#007AFF] mt-1"></div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            {calendarLevel === 'year' && renderYearView()}
            {calendarLevel === 'month' && renderMonthView()}
            {calendarLevel === 'day' && renderDayView()}

        </div>
    );
}
