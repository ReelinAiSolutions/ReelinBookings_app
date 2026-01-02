import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import AgendaView from './AgendaView';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MoreHorizontal, User, Users, AlignJustify, Grid, Plus, Filter, CalendarCheck, CalendarX, Info, X, Search } from 'lucide-react';
import { Appointment, Service, Staff, Organization, AppointmentStatus } from '@/types';
import { addDays, format, startOfWeek, isSameDay, getDay, getDaysInMonth, startOfMonth, startOfYear, addMonths, addYears, getYear, setYear, setMonth, subMonths, subYears, eachMonthOfInterval, endOfYear } from 'date-fns';

// -- EMPTY STATE COMPONENT --
const EmptyState = ({ onAction, mode = 'day' }: { onAction: () => void, mode?: 'day' | 'team' }) => (
    <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white/50 backdrop-blur-[2px] z-[5] animate-in fade-in zoom-in duration-500 ${mode === 'team' ? 'min-h-[600px]' : ''}`}>
        <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-sm ring-1 ring-blue-100 rotate-3 group hover:rotate-6 transition-transform">
            <CalendarCheck className="w-12 h-12 text-blue-500" />
        </div>
        <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-3 px-4 leading-tight">
            Schedule is Clear
        </h3>
        <p className="text-gray-500 font-medium text-lg max-w-[320px] mb-10 leading-relaxed">
            No bookings today. Time to focus on growth or take a well-deserved breather.
        </p>
        <button
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            className="group relative flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-[1.5rem] font-bold text-lg hover:bg-black transition-all hover:scale-[1.03] active:scale-[0.98] shadow-xl"
        >
            <span>Create Booking</span>
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Plus className="w-4 h-4" />
            </div>
        </button>

        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-indigo-200/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-40 right-10 w-48 h-48 bg-emerald-200/20 rounded-full blur-3xl -z-10"></div>
    </div>
);

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
        .pulse-highlight {
            animation: gravityPulse 2s 3 ease-in-out;
            border: 2px solid #4F46E5 !important;
            z-index: 50 !important;
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
    deltaX: number;
    hasConflict: boolean;
}

export default function WeeklyCalendar({
    appointments,
    staff,
    services,
    availability,
    businessHours,
    onSelectSlot,
    onAppointmentClick,
    onAppointmentUpdate,
    colorMode,
    showStaffFilter = true,
    currentStaffId
}: WeeklyCalendarProps) {
    // -- BUSINESS HOURS CALCULATION --
    const { minHour, maxHour, calendarHours } = React.useMemo(() => {
        // Default to 12 AM - 11 PM
        let min = 0;
        let max = 23;

        if (businessHours && Object.values(businessHours).some(day => day.isOpen)) {
            const openHours = Object.values(businessHours)
                .filter(day => day.isOpen)
                .map(day => parseInt(day.open.split(':')[0]));

            const closeHours = Object.values(businessHours)
                .filter(day => day.isOpen)
                .map(day => {
                    const [h, m] = day.close.split(':').map(Number);
                    // If closing at 17:30, we should show the 17:00 (5 PM) slot fully
                    return h;
                });

            if (openHours.length > 0) {
                min = Math.min(...openHours);
                // Ensure we at least show until the closing hour
                max = Math.max(...closeHours);

                // Add a small buffer at the top and bottom for readability if possible
                // but keep it within 0-23
                min = Math.max(0, min - 1);
                max = Math.min(23, max + 1);
            }
        }

        const hoursArray = Array.from({ length: max - min + 1 }).map((_, i) => min + i);
        return { minHour: min, maxHour: max, calendarHours: hoursArray };
    }, [businessHours]);

    // Helper to calculate top position with offset
    const getOffsetTop = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        const totalMinutes = (h * 60) + m;
        const minMinutes = minHour * 60;
        return Math.max(0, (totalMinutes - minMinutes) * 2);
    };

    // -- STATE --
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
    const [calendarLevel, setCalendarLevel] = useState<'day' | 'week' | 'month' | 'year'>('day');
    const [isListMode, setIsListMode] = useState(false);
    // Resize State, setViewMode] = useState<'personal' | 'team'>('personal');
    const [filterStaffId, setFilterStaffId] = useState<string>(currentStaffId || 'ALL');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    const [renderedMonths, setRenderedMonths] = useState<Date[]>([]);
    const [renderedYears, setRenderedYears] = useState<number[]>([]);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [highlightedAptId, setHighlightedAptId] = useState<string | null>(null);

    // -- URL DEEP LINKING LOGIC --
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const aptId = params.get('appointmentId');

        if (aptId) {
            const targetApt = appointments.find(a => a.id === aptId);
            if (targetApt) {
                // 1. Switch Date
                const aptDate = new Date(targetApt.date + 'T12:00:00'); // Use mid-day to avoid TZ shifts
                setSelectedDate(aptDate);

                // 2. Highlight
                setHighlightedAptId(aptId);
                setTimeout(() => setHighlightedAptId(null), 10000); // Clear highlight after 10s

                // 3. Scroll after date switch and layout
                const [h] = targetApt.timeSlot.split(':').map(Number);
                setTimeout(() => {
                    scrollToTime(h);
                }, 500);

                // 4. Remove param from URL to prevent re-triggering on refresh
                const newUrl = window.location.pathname + (window.location.search.replace(/(\?|&)appointmentId=[^&]+/, '').replace(/^&/, '?'));
                window.history.replaceState({}, '', newUrl || '/');
            }
        }
    }, [appointments.length > 0]); // Run once we have appointments

    // Sync filterStaffId and viewMode with currentStaffId prop
    useEffect(() => {
        if (!currentStaffId || currentStaffId === 'NOT_FOUND') {
            // Admin or unmapped user: Default to Team View (All Staff)
            setFilterStaffId('ALL');
            setViewMode('team');
        } else if (currentStaffId !== 'ALL') {
            // Staff member: Default to Personal View
            setFilterStaffId(currentStaffId);
            setViewMode('personal');
        }
    }, [currentStaffId]);

    // AUTOMATION: Switch View Mode based on Filter
    useEffect(() => {
        if (filterStaffId === 'ALL') {
            setViewMode('team');
        } else {
            setViewMode('personal');
        }
    }, [filterStaffId]);

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
    const hours = calendarHours;
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
            const targetHour = Math.max(minHour, hour - 2);
            const relativeHour = targetHour - minHour;
            scrollContainerRef.current.scrollTo({
                top: relativeHour * 120,
                behavior: 'smooth'
            });
        }
    };

    // -- ROBUST VIEW TRANSITION SCROLLING --
    useEffect(() => {
        if (!scrollContainerRef.current) return;

        const timer = setTimeout(() => {
            const container = scrollContainerRef.current;
            if (!container) return;

            if (calendarLevel === 'day') {
                const dayAppointments = getAppointmentsForDate(selectedDate);
                const now = new Date();
                const isToday = isSameDay(selectedDate, now);
                let scrollHour = minHour;

                if (isToday) {
                    const currentHour = now.getHours();
                    if (currentHour < maxHour) {
                        scrollHour = Math.max(minHour, currentHour - 2);
                    } else if (dayAppointments.length > 0) {
                        const sorted = [...dayAppointments].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
                        const firstHour = parseInt(sorted[0].timeSlot.split(':')[0]);
                        scrollHour = Math.max(minHour, firstHour - 1);
                    }
                } else if (dayAppointments.length > 0) {
                    const sorted = [...dayAppointments].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
                    const firstHour = parseInt(sorted[0].timeSlot.split(':')[0]);
                    scrollHour = Math.max(minHour, firstHour - 1);
                }

                container.scrollTo({
                    top: (scrollHour - minHour) * 120,
                    behavior: 'auto'
                });
            } else if (calendarLevel === 'month' && renderedMonths.length > 0) {
                const targetId = `month-${format(selectedDate, 'yyyy-MM')}`;
                const el = document.getElementById(targetId);
                if (el) el.scrollIntoView({ behavior: 'auto', block: 'center' });
            } else if (calendarLevel === 'year' && renderedYears.length > 0) {
                const el = document.getElementById(`year-${getYear(selectedDate)}`);
                if (el) {
                    // Apple style: Align year to top of container
                    const container = scrollContainerRef.current;
                    if (container) {
                        const offsetTop = el.offsetTop;
                        container.scrollTo({ top: offsetTop - 20, behavior: 'auto' });
                    }
                }
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [calendarLevel, selectedDate, appointments, viewMode, filterStaffId, renderedMonths.length, renderedYears.length]);

    // Handle initialization of ranges when switching level
    useEffect(() => {
        if (calendarLevel === 'month') {
            const start = subMonths(selectedDate, 6);
            const end = addMonths(selectedDate, 12);
            setRenderedMonths(eachMonthOfInterval({ start, end }));
        } else if (calendarLevel === 'year') {
            const currentYear = getYear(selectedDate);
            setRenderedYears(Array.from({ length: 8 }).map((_, i) => currentYear - 2 + i));
        }
    }, [calendarLevel]);

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
            currentTimeSlot: apt.timeSlot,
            deltaX: 0,
            hasConflict: false
        });
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
        // Offset considerations: currentTop is relative to grid start
        const totalMinutes = (currentTop / 2) + (minHour * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const newTimeSlot = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        // Find the appointment
        const apt = appointments.find(a => a.id === id);
        if (apt && (apt.timeSlot !== newTimeSlot || (dragState.currentStaffId && dragState.currentStaffId !== originalStaffId)) && onAppointmentUpdate) {
            const updatedApt = { ...apt, timeSlot: newTimeSlot, staffId: dragState.currentStaffId || originalStaffId };

            // Open Modal with NEW Data immediately (Optimistic Confirmation)
            onAppointmentClick(updatedApt);

            try {
                // Support horizontal (staff) reassignment
                const currentAptDate = new Date(`${apt.date}T00:00:00`);
                await onAppointmentUpdate(apt, currentAptDate, newTimeSlot, dragState.currentStaffId || originalStaffId);
            } catch (err) {
                console.error("Failed to update appointment", err);
            }
        }
    };

    // -- RESIZE LOGIC --
    interface ResizeState {
        id: string;
        initialHeight: number;
        startY: number;
        currentHeight: number;
    }
    const [resizeState, setResizeState] = useState<ResizeState | null>(null);

    const handlePointerMove = (e: React.PointerEvent) => {
        // Handle Resize
        if (resizeState) {
            e.preventDefault();
            e.stopPropagation(); // Stop dragging logic

            const deltaY = e.clientY - resizeState.startY;
            let newHeight = resizeState.initialHeight + deltaY;

            // Min height 30px (15 mins)
            newHeight = Math.max(30, newHeight);

            // Snap to 15 mins (30px)
            const snappedHeight = Math.round(newHeight / 30) * 30;

            setResizeState(prev => prev ? ({ ...prev, currentHeight: snappedHeight }) : null);
            return;
        }

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

        // Clamp to valid range (0 to hours.length * 120)
        newTop = Math.max(0, Math.min(newTop, hours.length * 120 - 60)); // -60 assumption for min height

        // Snap to 15 mins (30px)
        const snappedTop = Math.round(newTop / 30) * 30;

        // Calculate Time
        const totalMinutes = (snappedTop / 2) + (minHour * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const newTimeSlot = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        // Calculate Horizontal Move (Team View Only)
        const deltaX = e.clientX - dragState.startX;
        let newStaffId = dragState.originalStaffId;

        if (viewMode === 'team' && scrollContainerRef.current) {
            const timeColumnWidth = window.innerWidth >= 1024 ? 80 : 48;
            const scrollLeft = scrollContainerRef.current.scrollLeft;
            const containerRect = scrollContainerRef.current.getBoundingClientRect();

            // Mouse position relative to the grid start (after time column)
            const relativeX = e.clientX - containerRect.left - timeColumnWidth + scrollLeft;

            // Total width of the staff area
            const gridWidth = scrollContainerRef.current.querySelector('.flex-1.relative')?.clientWidth || (containerRect.width - timeColumnWidth);
            const columnWidth = gridWidth / staff.length;

            const staffIndex = Math.floor(relativeX / columnWidth);
            const clampedIndex = Math.max(0, Math.min(staffIndex, staff.length - 1));
            newStaffId = staff[clampedIndex]?.id || dragState.originalStaffId;
        }

        // CONFLICT CHECK
        const isConflict = appointments.some(a => {
            if (a.id === dragState.id || a.status === 'CANCELLED' || a.status === 'ARCHIVED') return false;
            if (a.staffId !== newStaffId) return false;
            if (a.date !== format(selectedDate, 'yyyy-MM-dd')) return false;

            // Time check
            const aStart = parseInt(a.timeSlot.split(':')[0]) * 60 + parseInt(a.timeSlot.split(':')[1]);
            const aService = services.find(s => s.id === a.serviceId);
            const aDuration = a.durationMinutes || aService?.durationMinutes || 60;
            const aBuffer = aService?.bufferTimeMinutes || 0;
            const aEnd = aStart + aDuration + aBuffer;

            const dStart = h * 60 + m;
            const dApt = appointments.find(ap => ap.id === dragState.id);
            const dService = services.find(s => s.id === dApt?.serviceId);
            const dDuration = dApt?.durationMinutes || dService?.durationMinutes || 60;
            const dBuffer = dService?.bufferTimeMinutes || 0;
            const dEnd = dStart + dDuration + dBuffer;

            return (dStart < aEnd && dEnd > aStart);
        });

        setDragState(prev => prev ? ({
            ...prev,
            currentTop: snappedTop,
            currentTimeSlot: newTimeSlot,
            currentStaffId: newStaffId,
            deltaX,
            hasConflict: isConflict
        }) : null);
    };

    const handleResizeEnd = async (e: React.PointerEvent) => {
        if (!resizeState) return;
        const { id, currentHeight } = resizeState;

        setResizeState(null);

        const newDurationMinutes = currentHeight / 2;

        const apt = appointments.find(a => a.id === id);
        // Only update if duration changed
        if (apt) {
            const currentDuration = apt.durationMinutes || services.find(s => s.id === apt.serviceId)?.durationMinutes || 60;
            if (newDurationMinutes !== currentDuration && onAppointmentUpdate) {
                // We need to call update with new duration.
                // The current onAppointmentUpdate signature focuses on position (date/time/staff).
                // We might need to overload it or manually call dataService here if the prop doesn't support duration.
                // However, onAppointmentUpdate calls updateAppointment which supports partial updates in our previous edit.
                // Let's assume onAppointmentUpdate can handle a Partial<Appointment> or we bypass it?
                // Actually, WeeklyCalendar props define onAppointmentUpdate signature: 
                // (appointment: Appointment, newDate: Date, newTime: string, newStaffId?: string)

                // It does NOT support duration directly.
                // We should probably just call the dataService directly or ask the parent to handle it.
                // But wait, we imported updateAppointment from dataService. Let's use that directly for duration.

                try {
                    await import('@/services/dataService').then(mod =>
                        mod.updateAppointment(apt.id, { durationMinutes: newDurationMinutes })
                    );
                    if (onAppointmentUpdate) {
                        // Refresh parent
                        const currentAptDate = new Date(`${apt.date}T00:00:00`);
                        await onAppointmentUpdate(apt, currentAptDate, apt.timeSlot, apt.staffId);
                    }
                } catch (err) {
                    console.error("Resize failed", err);
                }
            }
        }
    };
    const getAppointmentsForDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return appointments.filter(apt => {
            // Basic filtering: date must match and not be cancelled/archived
            const isMatch = apt.date === dateStr &&
                apt.status !== AppointmentStatus.CANCELLED &&
                apt.status !== AppointmentStatus.ARCHIVED;

            if (!isMatch) return false;

            // In team view, show everyone's appointments
            if (viewMode === 'team') return true;

            // In personal view, show if:
            // 1. It belongs to the current filter (which defaults to currentStaffId)
            if (filterStaffId === 'ALL' || apt.staffId === filterStaffId) return true;

            // 2. It's a "Blocked Time" that is global/shop-wide (no specific staffId)
            const isBlocked = apt.status === 'BLOCKED' || (apt as any).isBlocked; // Keep support for dynamic property
            if (isBlocked && (!apt.staffId || apt.staffId === 'ALL')) return true;

            return false;
        });
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
        <div key={year} id={`year-${year}`} className="mb-8 last:mb-0">
            {/* Apple style: Clean, left-aligned year title with thin divider */}
            <div className="px-5 mb-4">
                <h2 className={`text-3xl font-bold tracking-tight ${year === getYear(selectedDate) ? 'text-red-500' : 'text-gray-900'}`}>
                    {year}
                </h2>
                <div className="h-px bg-gray-100 mt-2 w-full"></div>
            </div>

            {/* Dense 3-column grid for months */}
            <div className="grid grid-cols-3 gap-x-2 gap-y-6 px-4">
                {months.map((m, i) => {
                    const monthDate = new Date(year, i, 1);
                    const days = getDaysInMonth(monthDate);
                    const offset = getDay(monthDate);
                    const isSelectedMonth = i === selectedDate.getMonth() && year === selectedDate.getFullYear();

                    return (
                        <div
                            key={m}
                            className="flex flex-col gap-1.5 cursor-pointer active:opacity-60 transition-opacity"
                            onClick={() => {
                                setDirection('forward');
                                setCalendarLevel('month');
                                setSelectedDate(monthDate);
                            }}
                        >
                            {/* Shortened month name: J, F, M... or Jan, Feb... Apple uses Full but we can use tiny bold */}
                            <h3 className={`text-[13px] font-bold px-1 ${isSelectedMonth ? 'text-red-500' : 'text-gray-900 uppercase tracking-tight'}`}>
                                {m.substring(0, 3)}
                            </h3>

                            <div className="grid grid-cols-7 gap-0.5">
                                {/* Weekday headers? Apple skip them in year view. Let's skip or make them dots? 
                                    Actually Apple just shows the grid of numbers. */}
                                {Array.from({ length: offset }).map((_, k) => (
                                    <div key={`e-${k}`} className="aspect-square"></div>
                                ))}
                                {Array.from({ length: days }).map((_, d) => {
                                    const dayNum = d + 1;
                                    const currentDayDate = new Date(year, i, dayNum);
                                    const isToday = isSameDay(currentDayDate, new Date());
                                    const isSelected = isSameDay(currentDayDate, selectedDate);

                                    return (
                                        <div
                                            key={d}
                                            className={`aspect-square flex items-center justify-center text-[7.5px] font-medium rounded-full transition-colors ${isToday
                                                ? 'bg-red-500 text-white font-bold'
                                                : isSelected
                                                    ? 'bg-gray-100 text-gray-900 font-bold'
                                                    : 'text-gray-600'
                                                }`}
                                        >
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
                className={`flex-1 overflow-y-auto bg-white pb-[100px] ${getAnimClass()} scrollbar-hide`}
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
                <h3 className="sticky top-[32px] bg-white/95 backdrop-blur-md py-4 px-6 text-2xl font-bold text-gray-900 z-10 border-b border-gray-100 flex items-baseline gap-2">
                    {monthName} <span className="text-gray-400 font-normal text-xl">{year}</span>
                </h3>
                <div className="grid grid-cols-7 auto-rows-fr border-l border-gray-100 pt-8 pb-4">
                    {/* Weekday headers for month view */}
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="pb-4 text-center text-[11px] font-bold text-gray-400 border-b border-gray-100 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
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

                                {eventCount > 0 && (
                                    <div className="absolute bottom-3 left-3 right-3">
                                        {/* Desktop: Rich Indicator */}
                                        <div className="hidden sm:block">
                                            {eventCount === 1 ? (
                                                <div className="flex items-center gap-2 pl-1">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                                    <span className="text-xs text-gray-500 font-medium truncate">1 Booking</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 pl-1">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                        <span className="text-xs text-indigo-600 font-semibold truncate">{eventCount} Bookings</span>
                                                    </div>
                                                    {/* Visual Density Bar */}
                                                    <div className="mx-1 h-1 bg-indigo-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 opacity-50" style={{ width: `${Math.min(100, eventCount * 20)}%` }}></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Mobile: Minimal Indicator (Just the Number) */}
                                        <div className="sm:hidden flex justify-start pl-1">
                                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded-md border border-indigo-100/50">
                                                {eventCount}
                                            </span>
                                        </div>
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

            <div className="pb-[100px]">
                {renderedMonths.map(date => renderMonthBlock(date))}
            </div>
        </div>
    );

    // -- DAY VIEW --
    const renderDayView = () => {
        const dayAppointments = getAppointmentsForDate(selectedDate);
        const isDayEmpty = dayAppointments.length === 0 && viewMode === 'personal';
        const now = new Date();
        const isToday = isSameDay(selectedDate, now);
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Offset: current time is relative to minHour
        const totalCurrentMinutes = (currentHour * 60) + currentMinute;
        const minHourMinutes = minHour * 60;
        const currentTimeTopPx = isToday && currentHour >= minHour && currentHour <= maxHour
            ? (totalCurrentMinutes - minHourMinutes) * 2
            : -1;

        return (
            <div
                ref={scrollContainerRef}
                className={`flex-1 overflow-auto bg-white relative ${getAnimClass()} scrollbar-hide pb-[100px] lg:pb-0`}
                style={{ scrollBehavior: 'smooth' }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {viewMode === 'team' && (
                    <div className="flex w-full sticky top-0 z-[45] bg-white border-b border-gray-300 shadow-sm">
                        <div className="w-12 lg:w-20 shrink-0 sticky left-0 z-50 bg-white border-r border-gray-300"></div>
                        {staff.map((member, idx) => {
                            const colorScheme = staffColors[idx % staffColors.length];
                            return (
                                <div key={member.id} className="flex-1 min-w-[120px] text-center border-l border-gray-300 first:border-l-0 py-2 bg-white sticky top-0 z-40">
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
                    <div className="w-12 lg:w-20 shrink-0 border-r border-gray-300 bg-white z-[45] sticky left-0 h-full select-none">
                        {hours.map((h, i) => (
                            <React.Fragment key={h}>
                                <div className="absolute w-12 lg:w-20 text-right pr-2 lg:pr-4" style={{ top: `${i * 120}px` }}>
                                    <span className="text-[10px] font-black text-gray-900 relative -top-2">
                                        {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? 'Noon' : `${h - 12} PM`}
                                    </span>
                                </div>
                                {h < maxHour && (
                                    <>
                                        <div className="absolute w-12 lg:w-20 text-right pr-2 lg:pr-4" style={{ top: `${i * 120 + 30}px` }}>
                                            <span className="text-[8px] font-medium text-gray-400 opacity-50 relative -top-1.5">:15</span>
                                        </div>
                                        <div className="absolute w-12 lg:w-20 text-right pr-2 lg:pr-4" style={{ top: `${i * 120 + 60}px` }}>
                                            <span className="text-[8px] font-bold text-gray-400 opacity-80 relative -top-1.5">:30</span>
                                        </div>
                                        <div className="absolute w-12 lg:w-20 text-right pr-2 lg:pr-4" style={{ top: `${i * 120 + 90}px` }}>
                                            <span className="text-[8px] font-medium text-gray-400 opacity-50 relative -top-1.5">:45</span>
                                        </div>
                                    </>
                                )}
                            </React.Fragment>
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
                                {isDayEmpty && <EmptyState onAction={() => onSelectSlot(selectedDate, `${minHour.toString().padStart(2, '0')}:00`)} />}
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
                                        const duration = apt.durationMinutes || service?.durationMinutes || 60;
                                        const end = start + duration;

                                        // Find all concurrent events (any overlap)
                                        // We find the "clique" of overlapping events to ensure consistent widths
                                        const overlappingEvents = sortedApts.filter(a => {
                                            const aStart = getMinutes(a.timeSlot);
                                            const aService = services.find(s => s.id === a.serviceId);
                                            const aDuration = a.durationMinutes || aService?.durationMinutes || 60;
                                            const aEnd = aStart + aDuration;
                                            // Ensure back-to-back (end == start) don't overlap by using a tiny buffer
                                            return (start < aEnd - 0.1 && end > aStart + 0.1);
                                        });

                                        // To handle complex overlaps (e.g. A overlaps B, B overlaps C, but A doesn't overlap C),
                                        // we use a simple column-based approach:
                                        const columns: string[][] = [];
                                        overlappingEvents.forEach(evt => {
                                            let placed = false;
                                            for (let col of columns) {
                                                const lastInColId = col[col.length - 1];
                                                const lastInCol = sortedApts.find(a => a.id === lastInColId)!;
                                                const lastStart = getMinutes(lastInCol.timeSlot);
                                                const lastService = services.find(s => s.id === lastInCol.serviceId);
                                                const lastDuration = lastInCol.durationMinutes || lastService?.durationMinutes || 60;
                                                const lastEnd = lastStart + lastDuration;

                                                const evtStart = getMinutes(evt.timeSlot);
                                                // Allow back-to-back to share column
                                                if (evtStart >= lastEnd - 0.1) {
                                                    col.push(evt.id);
                                                    placed = true;
                                                    break;
                                                }
                                            }
                                            if (!placed) columns.push([evt.id]);
                                        });

                                        const totalCols = columns.length;
                                        const colIndex = columns.findIndex(col => col.includes(apt.id));

                                        // Calculate Width & Position
                                        const widthPct = 98 / totalCols;
                                        const leftPct = (colIndex * widthPct);

                                        const [h, m] = apt.timeSlot.split(':').map(Number);
                                        const totalMins = (h * 60) + m;
                                        const topPx = (totalMins - (minHour * 60)) * 2;
                                        const aptDate = new Date(`${apt.date}T${apt.timeSlot}`);
                                        const isPast = aptDate < now;

                                        const isDragging = dragState?.id === apt.id;
                                        const displayTop = isDragging ? dragState.currentTop : topPx;
                                        const displayTime = isDragging ? dragState.currentTimeSlot : apt.timeSlot;
                                        const isBlocked = apt.status === AppointmentStatus.BLOCKED ||
                                            apt.clientName?.toLowerCase().startsWith('blocked') ||
                                            apt.clientId === 'blocked@internal.system' ||
                                            (apt as any).isBlocked;

                                        const isHighlighted = highlightedAptId === apt.id;

                                        return (
                                            <React.Fragment key={apt.id}>
                                                {/* GHOST / PHANTOM CARD */}
                                                {isDragging && (
                                                    <div
                                                        className={`absolute rounded-[6px] ${isBlocked ? 'bg-slate-50 border-slate-200 text-slate-300 border-l-[3px]' : 'bg-indigo-50 border-indigo-200 text-indigo-300 border-l-[4px]'} py-1 px-2 opacity-30 z-10 pointer-events-none`}
                                                        style={{
                                                            top: `${topPx}px`,
                                                            height: `${Math.max(24, duration * 2)}px`,
                                                            left: `calc(${leftPct}% + 1px)`,
                                                            width: `calc(${widthPct}% - 2px)`
                                                        }}
                                                    >
                                                        <div className="text-[10px] font-bold opacity-50 uppercase tracking-tighter truncate">Original</div>
                                                    </div>
                                                )}

                                                <div
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
                                                    className={`absolute rounded-[6px] ${isBlocked ? 'bg-slate-100 border-slate-400 text-slate-900 border-l-[3px]' : 'bg-indigo-50 border-indigo-500 text-indigo-900 border-l-[4px]'} py-1 px-2 overflow-hidden cursor-pointer z-[35] shadow-md ring-1 ring-white/70 animate-in zoom-in-95 duration-200 appointment-card transition-all flex flex-col justify-start hover:z-[60] hover:scale-[1.05] hover:shadow-xl hover:ring-2 ${isBlocked ? 'hover:ring-slate-400' : 'hover:ring-indigo-500'} ${isPast ? 'opacity-60 grayscale-[0.5]' : ''} ${isDragging ? `z-[100] scale-105 shadow-2xl ${dragState.hasConflict ? 'ring-4 ring-red-500 bg-red-50 border-red-500' : 'ring-4 ring-indigo-400 opacity-90'} cursor-grabbing` : ''} ${isHighlighted ? 'pulse-highlight' : ''}`}
                                                    style={{
                                                        top: `${displayTop}px`,
                                                        height: `${Math.max(24, duration * 2)}px`,
                                                        left: `calc(${leftPct}% + 1px)`,
                                                        width: `calc(${widthPct}% - 2px)`,
                                                        transform: isDragging ? `translateX(${dragState.deltaX}px)` : 'none',
                                                        transition: isDragging ? 'none' : 'all 0.2s ease-out'
                                                    }}
                                                >
                                                    {duration >= 25 ? (
                                                        <div className="flex flex-col h-full gap-0">
                                                            <div className={`text-[10px] font-[900] uppercase tracking-wider mb-0.5 ${isBlocked ? 'text-slate-500' : 'text-indigo-400'}`}>
                                                                {isBlocked ? 'Blocked Time' : (services.find(s => s.id === apt.serviceId)?.name || 'Service')}
                                                            </div>
                                                            <div className={`text-sm font-[800] leading-tight ${isBlocked ? 'text-slate-800' : (isDragging && dragState.hasConflict ? 'text-red-900' : 'text-indigo-700')} truncate`}>
                                                                {isDragging && dragState.hasConflict && <span className="mr-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-red-500 text-white font-black animate-pulse">CONFLICT</span>}
                                                                {isBlocked ? (apt.clientName?.replace(/^Blocked - /, '') || 'No Reason') : apt.clientName}
                                                            </div>
                                                            <div className="flex items-center justify-between mt-auto pb-0.5">
                                                                <div className={`text-[10px] font-bold ${isBlocked ? 'text-slate-500' : 'text-indigo-600/90'} truncate`}>
                                                                    {isBlocked ? (staff.find(s => s.id === apt.staffId)?.name || 'All Staff') : (staff.find(s => s.id === apt.staffId)?.name || 'Staff')}
                                                                </div>
                                                                <div className={`text-[10px] font-black shrink-0 ml-2 ${isBlocked ? 'text-slate-700' : 'text-indigo-500'}`}>
                                                                    {formatTo12Hour(displayTime)} <span className="opacity-50 font-medium">({duration}m)</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 overflow-hidden h-full">
                                                            {duration >= 15 && (
                                                                <div className={`text-[10px] font-black leading-tight ${isBlocked ? 'text-slate-800' : 'text-indigo-700'} truncate shrink-0`}>
                                                                    {isBlocked ? 'BLOCKED' : apt.clientName}
                                                                </div>
                                                            )}
                                                            <div className={`text-[9px] font-bold leading-tight ${isBlocked ? 'text-slate-500' : 'text-indigo-400/90'} truncate`}>
                                                                {formatTo12Hour(displayTime)} ({duration}m)
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* BUFFFER VISUALIZATION */}
                                                {(apt.bufferMinutes || 0) > 0 && (
                                                    <div
                                                        className="absolute z-20 opacity-30 pointer-events-none transition-all"
                                                        style={{
                                                            top: `${displayTop + (duration * 2)}px`,
                                                            height: `${(apt.bufferMinutes || 0) * 2}px`,
                                                            left: `calc(${leftPct}% + 4px)`,
                                                            width: `calc(${widthPct}% - 8px)`,
                                                            transform: isDragging ? `translateX(${dragState.deltaX}px)` : 'none',
                                                            background: isDragging && dragState.hasConflict
                                                                ? 'repeating-linear-gradient(45deg, #ef4444, #ef4444 4px, transparent 4px, transparent 8px)'
                                                                : 'repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 4px, transparent 4px, transparent 8px)',
                                                            borderRadius: '0 0 4px 4px',
                                                            transition: isDragging ? 'none' : 'all 0.2s ease-out'
                                                        }}
                                                    />
                                                )}
                                            </React.Fragment>
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
                                        <div key={member.id} className={`flex-1 ${staff.length > 4 ? 'min-w-[120px]' : 'min-w-[160px]'} border-l border-gray-300 relative first:border-l-0 group h-full transition-all duration-300`}>
                                            {hours.map((h, i) => (
                                                <div key={h} className="absolute w-full border-t border-gray-300 h-px z-0" style={{ top: `${i * 120}px` }} onClick={() => handleGridClick(h, member.id)}></div>
                                            ))}

                                            {memberAppointments.map(apt => {
                                                const [h, m] = apt.timeSlot.split(':').map(Number);
                                                const service = services.find(s => s.id === apt.serviceId);
                                                const duration = apt.durationMinutes || service?.durationMinutes || 60;
                                                const topPx = ((h * 60) + m - (minHour * 60)) * 2;
                                                const aptDate = new Date(`${apt.date}T${apt.timeSlot}`);
                                                const isPast = aptDate < now;

                                                const isDragging = dragState?.id === apt.id;
                                                const displayTop = isDragging ? dragState.currentTop : topPx;
                                                const displayTime = isDragging ? dragState.currentTimeSlot : apt.timeSlot; // Use displayTime

                                                const isBlocked = apt.clientName?.toLowerCase().startsWith('blocked') || apt.clientId === 'blocked@internal.system';

                                                const isHighlighted = highlightedAptId === apt.id;

                                                return (
                                                    <React.Fragment key={apt.id}>
                                                        {/* PHANTOM / GHOST CARD (Original Position) */}
                                                        {isDragging && (
                                                            <div
                                                                className={`absolute left-0.5 right-0.5 rounded-[6px] ${isBlocked ? 'bg-slate-50 border-slate-200 text-slate-300 border-l-[3px]' : `${colorScheme.bg} ${colorScheme.border} border-l-[4px]`} py-1 px-2 opacity-30 z-10 pointer-events-none`}
                                                                style={{
                                                                    top: `${topPx}px`,
                                                                    height: `${Math.max(24, duration * 2)}px`
                                                                }}
                                                            >
                                                                <div className="text-[10px] font-bold opacity-50 uppercase tracking-tighter truncate">Original</div>
                                                            </div>
                                                        )}

                                                        <div
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
                                                            className={`absolute left-0.5 right-0.5 rounded-[6px] ${isBlocked ? 'bg-slate-100 border-slate-400 text-slate-900 border-l-[3px]' : `${colorScheme.bg} ${colorScheme.border} border-l-[4px]`} py-1 px-2 overflow-hidden z-[35] shadow-md ring-1 ring-white/70 animate-in zoom-in-95 appointment-card transition-all flex flex-col justify-start hover:z-[60] hover:scale-[1.05] hover:shadow-xl hover:ring-2 ${isBlocked ? 'hover:ring-slate-400' : 'hover:ring-indigo-500'} ${isPast ? 'opacity-60 grayscale-[0.5]' : ''} ${isDragging ? `z-[100] scale-105 shadow-2xl ${dragState.hasConflict ? 'ring-4 ring-red-500 bg-red-50 border-red-500' : 'ring-4 ring-indigo-400 opacity-90'} cursor-grabbing` : ''} ${isHighlighted ? 'pulse-highlight' : ''}`}
                                                            style={{
                                                                top: `${displayTop}px`,
                                                                height: `${Math.max(24, duration * 2)}px`,
                                                                transform: isDragging ? `translateX(${dragState.deltaX}px)` : 'none',
                                                                transition: isDragging ? 'none' : 'all 0.2s ease-out'
                                                            }}
                                                        >
                                                            {duration >= 25 ? (
                                                                <div className="flex flex-col h-full gap-0">
                                                                    <div className={`text-[10px] font-[900] uppercase tracking-wider mb-0.5 ${isBlocked ? 'text-slate-500' : colorScheme.text} opacity-75`}>
                                                                        {isBlocked ? 'Blocked Time' : (service?.name || 'Service')}
                                                                    </div>
                                                                    <div className={`text-sm font-[800] leading-tight ${isBlocked ? 'text-slate-800' : colorScheme.text} truncate`}>
                                                                        {isDragging && dragState.hasConflict && <span className="mr-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-red-500 text-white font-black animate-pulse">CONFLICT</span>}
                                                                        {isBlocked ? (apt.clientName?.replace(/^Blocked - /, '') || 'No Reason') : apt.clientName}
                                                                    </div>
                                                                    <div className="flex items-center justify-between mt-auto pb-0.5">
                                                                        <div className={`text-[10px] font-bold ${isBlocked ? 'text-slate-500' : colorScheme.text} opacity-90 truncate`}>
                                                                            {isBlocked ? (member.name || 'All Staff') : member.name}
                                                                        </div>
                                                                        <div className={`text-[10px] font-black shrink-0 ml-2 ${isBlocked ? 'text-slate-700' : colorScheme.text} opacity-80`}>
                                                                            {formatTo12Hour(displayTime)} <span className="opacity-50 font-medium">({duration}m)</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 overflow-hidden h-full">
                                                                    {duration >= 15 && (
                                                                        <div className={`text-[10px] font-black leading-tight ${isBlocked ? 'text-slate-800' : colorScheme.text} truncate shrink-0`}>
                                                                            {isBlocked ? 'BLOCKED' : apt.clientName}
                                                                        </div>
                                                                    )}
                                                                    <div className={`text-[9px] font-bold leading-tight ${isBlocked ? 'text-slate-500' : colorScheme.text} opacity-75 truncate`}>
                                                                        {formatTo12Hour(displayTime)} ({duration}m)
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* RESIZE HANDLE */}
                                                            {!isPast && (
                                                                <div
                                                                    className="absolute bottom-0 left-0 w-full h-3 cursor-ns-resize z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                                                    onPointerDown={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        const card = e.currentTarget.parentElement as HTMLDivElement;
                                                                        card.setPointerCapture(e.pointerId);

                                                                        const initialHeight = duration * 2;

                                                                        setResizeState({
                                                                            id: apt.id,
                                                                            initialHeight,
                                                                            startY: e.clientY,
                                                                            currentHeight: initialHeight
                                                                        });
                                                                    }}
                                                                    onPointerUp={(e) => {
                                                                        e.stopPropagation();
                                                                        const card = e.currentTarget.parentElement as HTMLDivElement;
                                                                        try { card.releasePointerCapture(e.pointerId); } catch (err) { }
                                                                        handleResizeEnd(e);
                                                                    }}
                                                                >
                                                                    <div className={`w-8 h-1 rounded-full ${colorScheme.bg.replace('bg-', 'bg-').replace('50', '400/50')}`}></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* BUFFER VISUALIZATION */}
                                                        {(apt.bufferMinutes || 0) > 0 && (
                                                            <div
                                                                className="absolute left-1 right-1 opacity-30 z-20 pointer-events-none transition-all"
                                                                style={{
                                                                    top: `${displayTop + (duration * 2)}px`,
                                                                    height: `${(apt.bufferMinutes || 0) * 2}px`,
                                                                    transform: isDragging ? `translateX(${dragState.deltaX}px)` : 'none',
                                                                    background: isDragging && dragState.hasConflict
                                                                        ? 'repeating-linear-gradient(45deg, #ef4444, #ef4444 4px, transparent 4px, transparent 8px)'
                                                                        : 'repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 4px, transparent 4px, transparent 8px)',
                                                                    borderRadius: '0 0 4px 4px',
                                                                    transition: isDragging ? 'none' : 'all 0.2s ease-out'
                                                                }}
                                                            />
                                                        )}
                                                    </React.Fragment>
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

            {/* Helper for Centered Filter Label */}
            {(() => {
                const selectedStaffForFilter = staff.find(s => s.id === filterStaffId);
                const filterLabel = filterStaffId === 'ALL' ? 'All Staff' : selectedStaffForFilter?.name || 'Unknown';

                return null; // This is a placeholder for logic, I'll use filterLabel below
            })()}

            {/* STICKY HEADER WRAPPER */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md transition-all border-b border-gray-100">
                {/* MAIN HEADER */}
                <header className="pt-6 pb-2 px-5 flex flex-col shrink-0 touch-none">
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
                    <div className="flex items-center justify-between mt-1 gap-2">
                        {/* LEFT: TITLE & TODAY */}
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                            <h1 className="text-[24px] sm:text-[30px] font-black tracking-tight text-gray-900 leading-tight truncate">
                                {calendarLevel === 'day' ? format(selectedDate, 'EEEE') : calendarLevel === 'month' ? format(selectedDate, 'MMMM') : getYear(selectedDate)}
                            </h1>
                            {(!isSameDay(selectedDate, new Date()) || calendarLevel !== 'day') && (
                                <button
                                    className="text-[11px] sm:text-sm font-semibold text-indigo-600 bg-indigo-100/50 px-2 sm:px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors shrink-0"
                                    onClick={() => {
                                        setDirection('forward');
                                        setCalendarLevel('day');
                                        setSelectedDate(new Date());
                                        setTimeout(() => scrollToTime(), 100);
                                    }}
                                >
                                    Today
                                </button>
                            )}
                        </div>

                        {/* CENTER: STAFF IDENTITY (FLEX CENTERED) */}
                        {showStaffFilter && (
                            <div className="flex-shrink-0 z-[60]">
                                <div className="relative">
                                    <button
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className={`flex items-center gap-1 px-2 py-1.5 rounded-full transition-all duration-200 active:scale-95 ${isFilterOpen ? 'bg-indigo-100/80 text-indigo-700' : 'hover:bg-gray-100 text-gray-900'}`}
                                    >
                                        <span className="text-[15px] sm:text-[17px] font-black tracking-tight truncate max-w-[80px] sm:max-w-[150px]">
                                            {filterStaffId === 'ALL' ? 'All Staff' : staff.find(s => s.id === filterStaffId)?.name || 'Unknown'}
                                        </span>
                                        <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isFilterOpen ? 'rotate-90' : ''}`} />
                                    </button>

                                    {isFilterOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)}></div>
                                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-white/40 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <div className="p-1">
                                                    <div
                                                        className={`px-4 py-3 text-sm font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 cursor-pointer mb-1 transition-colors ${filterStaffId === 'ALL' ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-500'}`}
                                                        onClick={() => { setFilterStaffId('ALL'); setIsFilterOpen(false); }}
                                                    >
                                                        All Staff
                                                    </div>
                                                    <div className="h-px bg-gray-100 mx-2 mb-1"></div>
                                                    {staff.map(s => (
                                                        <div
                                                            key={s.id}
                                                            className={`px-4 py-3 text-sm font-bold rounded-xl hover:bg-gray-50 cursor-pointer transition-colors ${filterStaffId === s.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-700'}`}
                                                            onClick={() => { setFilterStaffId(s.id); setIsFilterOpen(false); }}
                                                        >
                                                            {s.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* RIGHT: ACTION BUTTONS (FLEX END) */}
                        <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2.5">
                            {/* JUMP TO DATE PICKER */}
                            <div className="relative group">
                                <button
                                    className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 transition-all duration-200 rounded-full ${isDatePickerOpen ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
                                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                >
                                    <CalendarIcon className="w-4 h-4" />
                                    <span className="text-[11px] font-black uppercase tracking-widest hidden xl:block">Quick View</span>
                                </button>

                                {isDatePickerOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsDatePickerOpen(false)}></div>
                                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in zoom-in-95 duration-200 origin-top-right">
                                            <div className="flex items-center justify-between mb-4">
                                                <button onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                                    <ChevronLeft className="w-5 h-5 text-gray-400" />
                                                </button>
                                                <div className="text-sm font-black text-gray-900 tracking-tight">
                                                    {format(selectedDate, 'MMMM yyyy')}
                                                </div>
                                                <button onClick={() => setSelectedDate(addMonths(selectedDate, 1))} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                                    <div key={i} className="text-[10px] font-bold text-gray-400 uppercase">{d}</div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-7 gap-1">
                                                {(() => {
                                                    const start = startOfMonth(selectedDate);
                                                    const daysInMonth = getDaysInMonth(selectedDate);
                                                    const startDay = getDay(start);

                                                    const days = [];
                                                    for (let i = 0; i < startDay; i++) days.push(<div key={`pad-${i}`} />);

                                                    for (let d = 1; d <= daysInMonth; d++) {
                                                        const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d);
                                                        const isSelected = isSameDay(date, selectedDate);
                                                        const isToday = isSameDay(date, new Date());

                                                        days.push(
                                                            <button
                                                                key={d}
                                                                onClick={() => {
                                                                    setSelectedDate(date);
                                                                    setIsDatePickerOpen(false);
                                                                    if (calendarLevel !== 'day') setCalendarLevel('day');
                                                                }}
                                                                className={`h-8 w-8 rounded-full text-xs font-bold transition-all ${isSelected
                                                                    ? 'bg-indigo-600 text-white shadow-md scale-110'
                                                                    : isToday
                                                                        ? 'text-indigo-600 bg-indigo-50'
                                                                        : 'text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                {d}
                                                            </button>
                                                        );
                                                    }
                                                    return days;
                                                })()}
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between gap-2">
                                                <button
                                                    onClick={() => { setSelectedDate(new Date()); setIsDatePickerOpen(false); setCalendarLevel('day'); }}
                                                    className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex-1"
                                                >
                                                    Today
                                                </button>
                                                <button
                                                    onClick={() => { setCalendarLevel('month'); setIsDatePickerOpen(false); }}
                                                    className="text-[11px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-1"
                                                >
                                                    Month View
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>




                            <button
                                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-[#007AFF] text-white rounded-full transition-all duration-200 hover:bg-blue-600 active:scale-95 shadow-lg shadow-blue-500/20"
                                onClick={() => onSelectSlot(selectedDate, `${minHour.toString().padStart(2, '0')}:00`)}
                            >
                                <Plus className="w-4 h-4" strokeWidth={3} />
                                <span className="text-[11px] font-black uppercase tracking-widest hidden xl:block">Add New</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* DAY SPECIFIC DATE HEADER */}
                {calendarLevel === 'day' && (
                    <div
                        className="flex flex-col select-none touch-none pb-4"
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
