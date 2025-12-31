import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronLeft, Plus, Users, ListFilter } from 'lucide-react';
import { Appointment, Staff, Service, Organization, AppointmentStatus } from '@/types';
import { addDays, format, startOfWeek, isSameDay, getDay, getDaysInMonth, startOfMonth, startOfYear, addMonths, addYears, getYear, setYear, setMonth, subMonths, subYears, eachMonthOfInterval, endOfYear } from 'date-fns';

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
        .appointment-card:active {
            transform: scale(0.98);
        }
    `}} />
);

interface WeeklyCalendarProps {
    appointments: Appointment[];
    staff: Staff[];
    services: Service[];
    availability?: any[];
    businessHours?: Organization['business_hours'];
    onSelectSlot: (date: Date, time: string, staffId?: string) => void;
    onAppointmentClick: (appointment: Appointment) => void;
    onAppointmentUpdate?: (appointment: Appointment, newDate: Date, newTime: string, newStaffId?: string) => Promise<void>;
    colorMode?: 'staff' | 'service';
    showStaffFilter?: boolean;
    currentStaffId?: string;
}

interface DragState {
    id: string;
    originalStaffId: string;
    startX: number;
    startY: number;
    initialTop: number;
    currentTop: number;
    currentStaffId: string;
    currentTimeSlot: string; // Dynamic Time HH:mm
}

export default function WeeklyCalendar({
    appointments,
    staff,
    services,
    availability,
    onSelectSlot,
    onAppointmentClick,
    onAppointmentUpdate,
    colorMode,
    showStaffFilter = true,
    currentStaffId
}: WeeklyCalendarProps) {

    // -- STATE --
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [calendarLevel, setCalendarLevel] = useState<'day' | 'month' | 'year'>('day');
    const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
    const [filterStaffId, setFilterStaffId] = useState<string>(currentStaffId || 'ALL');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    const [renderedMonths, setRenderedMonths] = useState<Date[]>([]);
    const [renderedYears, setRenderedYears] = useState<number[]>([]);

    // Swipe State
    // Swipe State
    // Swipe State
    // Swipe State
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);
    const headerTouchStart = useRef<number | null>(null);
    const headerTouchEnd = useRef<number | null>(null);
    const minSwipeDistance = 50;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isPrepending = useRef(false);
    const prevScrollHeight = useRef(0);

    // -- CONSTANTS --
    const now = new Date();
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

    // -- SCROLL START & INFINITE SCROLL INIT --
    const scrollToTime = (hour: number = new Date().getHours()) => {
        if (scrollContainerRef.current) {
            const targetHour = Math.max(0, hour - 2);
            scrollContainerRef.current.scrollTo({
                top: targetHour * 120,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        if (calendarLevel === 'day' && scrollContainerRef.current) {
            // Initial scroll (no smooth)
            const currentHour = new Date().getHours();
            const targetHour = Math.max(0, currentHour - 2);
            scrollContainerRef.current.scrollTop = targetHour * 120;
        } else if (calendarLevel === 'month') {
            // Init Month Range: -6 to +12 months
            const start = subMonths(selectedDate, 6);
            const end = addMonths(selectedDate, 12);
            const months = eachMonthOfInterval({ start, end });
            setRenderedMonths(months);
            // Scroll to selected date after render (timeout for layout)
            setTimeout(() => {
                const el = document.getElementById(`month-${format(selectedDate, 'yyyy-MM')}`);
                if (el) el.scrollIntoView({ behavior: 'auto', block: 'center' });
            }, 10);
        } else if (calendarLevel === 'year') {
            // Init Year Range: -2 to +5 years
            const currentYear = getYear(selectedDate);
            const years = Array.from({ length: 8 }).map((_, i) => currentYear - 2 + i);
            setRenderedYears(years);
            setTimeout(() => {
                const el = document.getElementById(`year-${currentYear}`);
                if (el) el.scrollIntoView({ behavior: 'auto', block: 'center' });
            }, 10);
        }
    }, [calendarLevel]); // Re-init when level changes. Note: selectedDate change shouldn't reset, unless stepping level.

    // Handle Scroll Position Restoration
    useLayoutEffect(() => {
        if (isPrepending.current && scrollContainerRef.current) {
            const newHeight = scrollContainerRef.current.scrollHeight;
            const diff = newHeight - prevScrollHeight.current;
            if (diff > 0) {
                scrollContainerRef.current.scrollTop += diff;
            }
            isPrepending.current = false;
        }
    }, [renderedMonths, renderedYears]);

    const handleInfiniteScroll = (e: React.UIEvent<HTMLDivElement>, type: 'month' | 'year') => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const threshold = 100;

        if (type === 'month') {
            if (scrollTop < threshold) {
                // Prepend
                isPrepending.current = true;
                prevScrollHeight.current = scrollHeight;
                const first = renderedMonths[0];
                const newMonths = Array.from({ length: 6 }).map((_, i) => subMonths(first, 6 - i));
                setRenderedMonths(prev => [...newMonths, ...prev]);
            } else if (scrollTop + clientHeight > scrollHeight - threshold) {
                // Append
                const last = renderedMonths[renderedMonths.length - 1];
                const newMonths = Array.from({ length: 6 }).map((_, i) => addMonths(last, i + 1));
                setRenderedMonths(prev => [...prev, ...newMonths]);
            }
        } else if (type === 'year') {
            if (scrollTop < threshold) {
                // Prepend
                isPrepending.current = true;
                prevScrollHeight.current = scrollHeight;
                const first = renderedYears[0];
                const newYears = Array.from({ length: 3 }).map((_, i) => first - 3 + i);
                setRenderedYears(prev => [...newYears, ...prev]);
            } else if (scrollTop + clientHeight > scrollHeight - threshold) {
                // Append
                const last = renderedYears[renderedYears.length - 1];
                const newYears = Array.from({ length: 3 }).map((_, i) => last + 1 + i);
                setRenderedYears(prev => [...prev, ...newYears]);
            }
        }
    };

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
        if (dragState) return; // Prevent click when dropping
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        onSelectSlot(selectedDate, timeStr, staffId);
    };

    const isDraggingRef = useRef(false);

    // -- DRAG HANDLERS --
    const handlePointerDown = (e: React.PointerEvent, apt: Appointment, topPx: number) => {
        // Disable Drag & Drop for Mobile (Touch)
        if (e.pointerType === 'touch') return;

        e.preventDefault();
        e.stopPropagation();

        const card = e.currentTarget as HTMLDivElement;
        card.setPointerCapture(e.pointerId);

        isDraggingRef.current = false;

        setDragState({
            id: apt.id,
            originalStaffId: apt.staffId,
            startX: e.clientX,
            startY: e.clientY,
            initialTop: topPx,
            currentTop: topPx,
            currentStaffId: apt.staffId,
            currentTimeSlot: apt.timeSlot
        });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragState) return;
        e.preventDefault();

        // Drag Logic
        const moveDistance = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
        if (moveDistance > 5) {
            isDraggingRef.current = true;
        }

        // 1. Calculate Vertical Move
        const deltaY = e.clientY - dragState.startY;
        let newTop = dragState.initialTop + deltaY;

        // Clamp to valid range (0 to 24*120)
        newTop = Math.max(0, Math.min(newTop, 24 * 120 - 60)); // -60 assumption for min height

        // Snap to 15 mins (30px)
        const snappedTop = Math.round(newTop / 30) * 30;

        // Calculate Time
        const totalMinutes = snappedTop / 2;
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const newTimeSlot = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        // 2. Calculate Horizontal Move (Team View Only)
        let newStaffId = dragState.originalStaffId;
        if (viewMode === 'team') {
            // Simple heuristic: If moved significantly X, find which column
            // But we don't have column refs.
            // We can use the elementFromPoint logic or just trust the visual feedback?
            // For MVP, lets just do vertical drag in Personal View, and simplified vertical in Team.
            // Actually, the user asked for "smooth drag and drop rescheduling" which implies time change.
            // Switching staff is harder without knowing column widths.
            // Let's stick to time change first.
        }

        setDragState(prev => prev ? ({
            ...prev,
            currentTop: snappedTop,
            currentTimeSlot: newTimeSlot // Update currentTimeSlot
        }) : null);
    };

    const handlePointerUp = async (e: React.PointerEvent) => {
        if (!dragState) return;
        const { id, currentTop, originalStaffId } = dragState;

        // Release
        const card = e.currentTarget as HTMLDivElement;
        try {
            card.releasePointerCapture(e.pointerId);
        } catch (e) { /* ignore */ }
        setDragState(null);

        // Delay clearing the drag ref so onClick can detect it
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);

        // Calculate new time
        // 120px = 60 mins -> 2 px/min
        const totalMinutes = currentTop / 2;
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const newTimeSlot = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        // Find the appointment
        const apt = appointments.find(a => a.id === id);
        if (apt && apt.timeSlot !== newTimeSlot && onAppointmentUpdate) {
            const updatedApt = { ...apt, timeSlot: newTimeSlot };

            // Open Modal with NEW Data immediately (Optimistic Confirmation)
            onAppointmentClick(updatedApt);

            try {
                // Use the appointment's existing date since we only support vertical (time) drag for now
                const currentAptDate = new Date(`${apt.date}T00:00:00`);
                await onAppointmentUpdate(apt, currentAptDate, newTimeSlot, originalStaffId);
            } catch (err) {
                console.error("Failed to update appointment", err);
                // Toast handled by parent?
            }
        }
    };

    // -- HELPERS --
    const getAppointmentsForDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.filter(apt =>
            apt.date === dateStr &&
            apt.status !== AppointmentStatus.CANCELLED &&
            (viewMode === 'team' || filterStaffId === 'ALL' || apt.staffId === filterStaffId)
        );
    };

    const formatTo12Hour = (timeStr: string) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        return `${h}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // -- HEADER SWIPE HANDLERS --
    const onHeaderTouchStart = (e: React.TouchEvent) => {
        headerTouchEnd.current = null;
        headerTouchStart.current = e.targetTouches[0].clientX;
    };

    const onHeaderTouchMove = (e: React.TouchEvent) => {
        headerTouchEnd.current = e.targetTouches[0].clientX;
    };

    const onHeaderTouchEnd = () => {
        if (!headerTouchStart.current || !headerTouchEnd.current) return;

        const distance = headerTouchStart.current - headerTouchEnd.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) { // Swipe Left -> Next Week
            setDirection('forward');
            setSelectedDate(prev => addDays(prev, 7));
        }
        if (isRightSwipe) { // Swipe Right -> Previous Week
            setDirection('backward'); // Corrected logic: Swipe Right = Go Back
            setSelectedDate(prev => addDays(prev, -7));
        }
    };

    // -- RENDERERS --

    const renderYearBlock = (year: number) => (
        <div key={year} id={`year-${year}`} className="mb-12">
            <h2 className={`text-4xl font-bold px-8 mb-8 border-b border-gray-50/0 ${year === getYear(selectedDate) ? 'text-red-600' : 'text-gray-900'}`}>{year}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 px-8 max-w-[1600px] mx-auto">
                {months.map((m, i) => {
                    const monthDate = new Date(year, i, 1);
                    const days = getDaysInMonth(monthDate);
                    const offset = getDay(monthDate);
                    return (
                        <div
                            key={m}
                            className="flex flex-col gap-4 cursor-pointer hover:bg-gray-50 rounded-2xl p-6 transition-colors border border-transparent hover:border-gray-100"
                            onClick={() => {
                                setDirection('forward');
                                setCalendarLevel('month');
                                setSelectedDate(monthDate);
                            }}
                        >
                            <h3 className={`text-xl font-bold pl-1 ${i === selectedDate.getMonth() && year === selectedDate.getFullYear() ? 'text-red-600' : 'text-gray-900'}`}>{m}</h3>
                            <div className="grid grid-cols-7 gap-y-3 gap-x-1 pointer-events-none">
                                {Array.from({ length: offset }).map((_, k) => <div key={`e-${k}`} className="w-full h-4"></div>)}
                                {Array.from({ length: days }).map((_, d) => {
                                    const dayNum = d + 1;
                                    const currentDayDate = new Date(year, i, dayNum);
                                    const isToday = isSameDay(currentDayDate, new Date());
                                    return (
                                        <div key={d} className={`w-full h-8 flex items-center justify-center text-sm font-semibold rounded-full ${isToday ? 'bg-red-500 text-white shadow-sm' : 'text-gray-700'}`}>
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
        return (
            <div
                ref={scrollContainerRef}
                className={`flex-1 overflow-y-auto bg-white pb-20 pt-2 ${getAnimClass()} scrollbar-hide`}
                onScroll={(e) => handleInfiniteScroll(e, 'year')}
            >
                {renderedYears.map((year, i) => (
                    <React.Fragment key={year}>
                        {renderYearBlock(year)}
                        {i < renderedYears.length - 1 && <div className="h-px bg-gray-100 mx-4 mb-8"></div>}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const renderMonthBlock = (date: Date) => {
        const daysInMonth = getDaysInMonth(date);
        const startDayOffset = getDay(startOfMonth(date));
        const monthName = format(date, 'MMMM');
        const year = date.getFullYear();

        return (
            <div key={`${monthName}-${year}`} id={`month-${format(date, 'yyyy-MM')}`} className="mb-12">
                <h3 className="sticky top-0 bg-white/95 backdrop-blur-sm py-4 px-6 text-2xl font-bold text-gray-900 z-10 border-b border-gray-50/50 flex items-baseline gap-2">
                    {monthName} <span className="text-gray-400 font-normal text-xl">{year}</span>
                </h3>
                <div className="grid grid-cols-7 auto-rows-fr border-l border-gray-100">
                    {Array.from({ length: startDayOffset }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-32 border-b border-gray-100 border-r border-gray-100 bg-gray-50/20"></div>
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
                                className="h-32 border-b border-gray-100 border-r border-gray-100 relative cursor-pointer hover:bg-gray-50 transition-colors group"
                                onClick={() => {
                                    setDirection('forward');
                                    setCalendarLevel('day');
                                    setSelectedDate(cellDate);
                                }}
                            >
                                <span className={`absolute top-3 left-3 text-lg font-semibold flex items-center justify-center transition-all ${isSelectedDay || isTodayDay
                                    ? 'bg-red-500 text-white w-10 h-10 rounded-full shadow-sm'
                                    : 'text-gray-700 group-hover:text-gray-900'
                                    }`}>
                                    {dayNum}
                                </span>

                                {/* Smart Booking Indicator */}
                                {eventCount > 0 && (
                                    <div className="absolute bottom-3 left-3 right-3">
                                        {eventCount === 1 ? (
                                            <div className="flex items-center gap-2 pl-1">
                                                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                                <span className="text-xs text-gray-500 font-medium truncate hidden sm:block">1 Booking</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 pl-1">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                    <span className="text-xs text-indigo-600 font-semibold truncate hidden sm:block">{eventCount} Bookings</span>
                                                </div>
                                                {/* Visual Density Bar */}
                                                <div className="mx-1 h-1 bg-indigo-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 opacity-50" style={{ width: `${Math.min(100, eventCount * 20)}%` }}></div>
                                                </div>
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
        <div
            ref={scrollContainerRef}
            className={`flex-1 overflow-y-auto bg-white ${getAnimClass()} scrollbar-hide`}
            onScroll={(e) => handleInfiniteScroll(e, 'month')}
        >
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-gray-100 pb-2 pt-2 sticky top-0 bg-white z-20 shadow-sm">
                {weekDayLabels.map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
                ))}
            </div>

            <div className="pb-20 pt-2">
                {renderedMonths.map(date => renderMonthBlock(date))}
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
        const currentTimeTopPx = isToday ? ((currentHour * 60) + currentMinute) * 2 : -1;

        return (
            <div
                ref={scrollContainerRef}
                className={`flex-1 overflow-auto bg-white relative ${getAnimClass()} scrollbar-hide pb-20 lg:pb-0`}
                style={{ scrollBehavior: 'smooth' }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {viewMode === 'team' && (
                    <div className="flex w-full sticky top-0 z-40 bg-white border-b border-gray-300 shadow-sm">
                        <div className="w-12 lg:w-20 shrink-0 sticky left-0 z-50 bg-white border-r border-gray-300"></div>
                        {staff.map((member, idx) => {
                            const colorScheme = staffColors[idx % staffColors.length];
                            return (
                                <div key={member.id} className="flex-1 min-w-[120px] text-center border-l border-gray-300 first:border-l-0 py-2 bg-white sticky top-0">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${colorScheme.dot}`}></div>
                                        <div className="text-xs font-bold text-gray-900 truncate px-1">{member.name}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="relative w-full flex" style={{ height: `${hours.length * 120}px` }}>
                    <div className="w-12 lg:w-20 shrink-0 border-r border-gray-300 bg-white z-30 sticky left-0 h-full select-none">
                        {hours.map((h, i) => (
                            <div key={h} className="absolute w-12 lg:w-20 text-right pr-2 lg:pr-4" style={{ top: `${i * 120}px` }}>
                                <span className="text-[10px] font-medium text-gray-400 relative -top-2">
                                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? 'Noon' : `${h - 12} PM`}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 relative items-start min-w-0">
                        {/* Current Time Indicator (Shared for both views) */}
                        {currentTimeTopPx !== -1 && (
                            <div className="absolute w-full z-30 pointer-events-none" style={{ top: `${currentTimeTopPx}px` }}>
                                <div className="w-full h-[1px] bg-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.4)]"></div>
                                <div className="absolute -left-1 -translate-y-1/2 w-3 h-3 rounded-full bg-[#007AFF] live-pulse border-2 border-white shadow-sm"></div>
                            </div>
                        )}

                        {viewMode === 'personal' ? (
                            <div
                                key={selectedDate.toISOString()}
                                className={`w-full relative ${slideDirection === 'left' ? 'animate-in slide-in-from-right duration-300' : slideDirection === 'right' ? 'animate-in slide-in-from-left duration-300' : ''}`}
                                style={{ height: `${hours.length * 120 + 24}px` }}
                            >
                                {hours.map((h, i) => (
                                    <div key={h} className="absolute w-full border-t border-gray-300 h-px z-0" style={{ top: `${i * 120}px` }} onClick={() => handleGridClick(h)}></div>
                                ))}

                                {(() => {
                                    // Layout Helper: Calculate overlapping groups for side-by-side display
                                    const getMinutes = (t: string) => { const parts = t.split(':'); return parseInt(parts[0]) * 60 + parseInt(parts[1]); };

                                    // Sort appointments by time (and ID for stability)
                                    const sortedApts = [...dayAppointments].sort((a, b) => {
                                        const tA = getMinutes(a.timeSlot);
                                        const tB = getMinutes(b.timeSlot);
                                        return tA - tB || a.id.localeCompare(b.id);
                                    });

                                    return sortedApts.map((apt) => {
                                        const start = getMinutes(apt.timeSlot);
                                        const service = services.find(s => s.id === apt.serviceId);
                                        const duration = service?.durationMinutes || 60;
                                        const end = start + duration;

                                        // Find all concurrent events (any overlap)
                                        const concurrent = sortedApts.filter(a => {
                                            const aStart = getMinutes(a.timeSlot);
                                            const aService = services.find(s => s.id === a.serviceId);
                                            const aDuration = aService?.durationMinutes || 60;
                                            const aEnd = aStart + aDuration;
                                            return (start < aEnd && end > aStart); // Intersection test
                                        });

                                        const total = concurrent.length;
                                        const index = concurrent.findIndex(a => a.id === apt.id);

                                        // Calculate Width & Position (with small gaps)
                                        const widthPct = 98 / total;
                                        const leftPct = (index * widthPct);

                                        const [h, m] = apt.timeSlot.split(':').map(Number);
                                        const topPx = ((h * 60) + m) * 2;
                                        const aptDate = new Date(`${apt.date}T${apt.timeSlot}`);
                                        const isPast = aptDate < now;

                                        const isDragging = dragState?.id === apt.id;
                                        const displayTop = isDragging ? dragState.currentTop : topPx;
                                        const displayTime = isDragging ? dragState.currentTimeSlot : apt.timeSlot; // Use displayTime

                                        return (
                                            <div
                                                key={apt.id}
                                                onPointerDown={(e) => handlePointerDown(e, apt, topPx)}
                                                onPointerMove={handlePointerMove}
                                                onPointerUp={handlePointerUp}
                                                onClick={(e) => {
                                                    // Prevent click if just dragged
                                                    if (isDraggingRef.current) {
                                                        e.stopPropagation();
                                                        return;
                                                    }
                                                    if (!isDragging) {
                                                        e.stopPropagation();
                                                        onAppointmentClick(apt);
                                                    }
                                                }}
                                                className={`absolute rounded-[6px] bg-indigo-50 border-l-[4px] border-indigo-500 p-2 text-indigo-900 overflow-hidden cursor-pointer z-10 shadow-md ring-1 ring-white/70 animate-in zoom-in-95 duration-200 appointment-card transition-all flex flex-col justify-center gap-0.5 hover:z-[60] hover:scale-[1.05] hover:shadow-xl hover:ring-2 hover:ring-indigo-500 ${isPast ? 'opacity-60 grayscale-[0.5]' : ''} ${isDragging ? 'z-[100] scale-105 shadow-2xl ring-4 ring-indigo-400 opacity-90 cursor-grabbing' : ''}`}
                                                style={{
                                                    top: `${displayTop}px`,
                                                    height: `${duration * 2}px`,
                                                    left: `calc(${leftPct}% + 1px)`,
                                                    width: `calc(${widthPct}% - 2px)`,
                                                    transition: isDragging ? 'none' : 'all 0.2s ease-out'
                                                }}
                                            >
                                                <div className="text-sm font-[800] leading-tight text-indigo-700 truncate">{apt.clientName}</div>
                                                <div className="text-xs font-bold leading-tight text-indigo-600/90 truncate">{staff.find(s => s.id === apt.staffId)?.name || 'Staff'}</div>
                                                <div className="text-xs font-semibold leading-tight text-indigo-500/90 truncate">{services.find(s => s.id === apt.serviceId)?.name || 'Service'}</div>
                                                <div className="text-[11px] font-medium leading-tight text-indigo-400/90 truncate mt-0.5">
                                                    {formatTo12Hour(displayTime)}
                                                </div>
                                            </div>
                                        );

                                    });
                                })()}
                            </div>
                        ) : (
                            <div className="flex w-full h-full">
                                {staff.map((member, idx) => {
                                    const colorScheme = staffColors[idx % staffColors.length];
                                    const memberAppointments = dayAppointments.filter(apt => apt.staffId === member.id);

                                    return (
                                        <div key={member.id} className="flex-1 min-w-[120px] border-l border-gray-300 relative first:border-l-0 group h-full">
                                            {hours.map(h => (
                                                <div key={h} className="absolute w-full border-t border-gray-300 h-px z-0" style={{ top: `${h * 120}px` }} onClick={() => handleGridClick(h, member.id)}></div>
                                            ))}

                                            {memberAppointments.map(apt => {
                                                const [h, m] = apt.timeSlot.split(':').map(Number);
                                                const service = services.find(s => s.id === apt.serviceId);
                                                const duration = service?.durationMinutes || 60;
                                                const topPx = ((h * 60) + m) * 2;
                                                const aptDate = new Date(`${apt.date}T${apt.timeSlot}`);
                                                const isPast = aptDate < now;

                                                const isDragging = dragState?.id === apt.id;
                                                const displayTop = isDragging ? dragState.currentTop : topPx;
                                                const displayTime = isDragging ? dragState.currentTimeSlot : apt.timeSlot; // Use displayTime

                                                return (
                                                    <div
                                                        key={apt.id}
                                                        onPointerDown={(e) => handlePointerDown(e, apt, topPx)}
                                                        onPointerMove={handlePointerMove}
                                                        onPointerUp={handlePointerUp}
                                                        onClick={(e) => {
                                                            // Prevent click if just dragged
                                                            if (isDraggingRef.current) {
                                                                e.stopPropagation();
                                                                return;
                                                            }
                                                            if (!isDragging) {
                                                                e.stopPropagation();
                                                                onAppointmentClick(apt);
                                                            }
                                                        }}
                                                        className={`absolute left-0.5 right-0.5 rounded-[6px] ${colorScheme.bg} border-l-[4px] ${colorScheme.border} p-2 overflow-hidden z-10 shadow-md ring-1 ring-white/70 animate-in zoom-in-95 appointment-card transition-all flex flex-col justify-center gap-0.5 hover:z-[60] hover:scale-[1.05] hover:shadow-xl hover:ring-2 hover:ring-indigo-500 ${isPast ? 'opacity-60 grayscale-[0.5]' : ''} ${isDragging ? 'z-[100] scale-105 shadow-2xl ring-4 ring-indigo-400 opacity-90 cursor-grabbing' : ''}`}
                                                        style={{
                                                            top: `${displayTop}px`,
                                                            height: `${duration * 2}px`,
                                                            transition: isDragging ? 'none' : 'all 0.2s ease-out'
                                                        }}
                                                    >
                                                        <div className={`text-sm font-[800] leading-tight ${colorScheme.text} truncate`}>{apt.clientName}</div>
                                                        <div className={`text-xs font-bold leading-tight ${colorScheme.text} opacity-90 truncate`}>{member.name}</div>
                                                        <div className={`text-xs font-semibold leading-tight ${colorScheme.text} opacity-80 truncate`}>{service?.name || 'Service'}</div>
                                                        <div className={`text-[11px] font-medium leading-tight ${colorScheme.text} opacity-75 truncate mt-0.5`}>{formatTo12Hour(displayTime)}</div>
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
                            {(!isSameDay(selectedDate, new Date()) || calendarLevel !== 'day') && (
                                <button
                                    className="text-sm font-semibold text-indigo-600 bg-indigo-100/50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors mb-1.5"
                                    onClick={() => {
                                        setDirection('forward');
                                        setCalendarLevel('day');
                                        setSelectedDate(new Date());
                                        setTimeout(() => scrollToTime(), 100);
                                    }}
                                >
                                    Go to Today
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2.5 mb-2">
                            {/* Filter Button */}
                            {showStaffFilter && (
                                <div className="relative">
                                    <button
                                        className={`text-indigo-600 transition-all ${filterStaffId !== 'ALL' || isFilterOpen ? 'bg-indigo-50 rounded-full p-1.5' : ''}`}
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    >
                                        <ListFilter className="w-6 h-6" strokeWidth={2} />
                                    </button>
                                    {isFilterOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)}></div>
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <div
                                                    className={`px-4 py-3 text-sm font-medium hover:bg-gray-50 cursor-pointer border-b border-gray-50 ${filterStaffId === 'ALL' ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-700'}`}
                                                    onClick={() => { setFilterStaffId('ALL'); setIsFilterOpen(false); }}
                                                >
                                                    All Staff
                                                </div>
                                                {staff.map(s => (
                                                    <div
                                                        key={s.id}
                                                        className={`px-4 py-3 text-sm font-medium hover:bg-gray-50 cursor-pointer ${filterStaffId === s.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-700'}`}
                                                        onClick={() => { setFilterStaffId(s.id); setIsFilterOpen(false); }}
                                                    >
                                                        {s.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

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
                    <div
                        className="border-b border-gray-200/50 pb-3 shrink-0 pt-2 transition-all"
                        onTouchStart={onHeaderTouchStart}
                        onTouchMove={onHeaderTouchMove}
                        onTouchEnd={onHeaderTouchEnd}
                    >
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
