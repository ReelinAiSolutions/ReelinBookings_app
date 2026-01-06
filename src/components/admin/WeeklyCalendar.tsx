import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import AgendaView from './AgendaView';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MoreHorizontal, User, Users, AlignJustify, Grid, Plus, Filter, CalendarCheck, CalendarX, Info, X, Search } from 'lucide-react';
import { Appointment, Service, Staff, Organization, AppointmentStatus } from '@/types';
import { addDays, format, startOfWeek, isSameDay, getDay, getDaysInMonth, startOfMonth, startOfYear, addMonths, addYears, getYear, setYear, setMonth, subMonths, subYears, eachMonthOfInterval, endOfYear, isBefore, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// -- EMPTY STATE COMPONENT --
const EmptyState = ({ onAction, mode = 'day' }: { onAction: () => void, mode?: 'day' | 'team' }) => (
    <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white/50 dark:bg-black/50 backdrop-blur-[2px] z-[5] animate-in fade-in zoom-in duration-500 ${mode === 'team' ? 'min-h-[600px]' : ''}`}>
        <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/20 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-sm ring-1 ring-primary-100 dark:ring-primary-500/20 rotate-3 group hover:rotate-6 transition-transform">
            <CalendarCheck className="w-12 h-12 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-3 px-4 leading-tight">
            Schedule is Clear
        </h3>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg max-w-[320px] mb-10 leading-relaxed">
            No bookings today. Time to focus on growth or take a well-deserved breather.
        </p>
        <button
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            className="group relative flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-[1.5rem] font-bold text-lg hover:bg-black dark:hover:bg-gray-100 transition-all hover:scale-[1.03] active:scale-[0.98] shadow-xl"
        >
            <span>Create Booking</span>
            <div className="w-6 h-6 bg-white/20 dark:bg-black/10 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Plus className="w-4 h-4" />
            </div>
        </button>

        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary-200/20 dark:bg-primary-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-40 right-10 w-48 h-48 bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
    </div>
);

const PulseStyle = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes gravityPulse {
            0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 var(--primary-600); }
            70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 10px transparent; }
            100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 transparent; }
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
            border: 2px solid var(--primary-600) !important;
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
    holidays?: string[];
    userThemeColor?: string; // New prop for personal branding
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
    deltaY: number;
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
    currentStaffId,
    holidays = [],
    userThemeColor
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
    const [zoomDirection, setZoomDirection] = useState<'in' | 'out'>('in');

    const viewVariants = {
        enter: (direction: 'in' | 'out') => ({
            scale: direction === 'in' ? 0.95 : 1.05,
            opacity: 0,
        }),
        center: {
            scale: 1,
            opacity: 1,
            transition: { duration: 0.3, ease: "easeInOut" } as any
        },
        exit: (direction: 'in' | 'out') => ({
            scale: direction === 'in' ? 1.05 : 0.95,
            opacity: 0,
            transition: { duration: 0.2, ease: "easeInOut" } as any
        })
    };

    // -- URL DEEP LINKING LOGIC --
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const aptId = params.get('appointmentId');

        if (aptId) {
            const targetApt = appointments.find(a => a.id === aptId);
            if (targetApt) {
                // 1. Switch Date
                const aptDate = new Date(targetApt.date + 'T12:00:00');
                setSelectedDate(aptDate);

                // 2. Ensure Visibility (Switch to Team View / ALL if it's someone else's)
                if (filterStaffId !== 'ALL' && targetApt.staffId !== filterStaffId) {
                    setFilterStaffId('ALL');
                    setViewMode('team');
                }

                // 3. Highlight
                setHighlightedAptId(aptId);
                setTimeout(() => setHighlightedAptId(null), 10000);

                // 4. Scroll after date switch and layout
                const [h] = targetApt.timeSlot.split(':').map(Number);
                setTimeout(() => {
                    scrollToTime(h);
                }, 500);

                // 5. Remove param from URL
                const newUrl = window.location.pathname + (window.location.search.replace(/(\?|&)appointmentId=[^&]+/, '').replace(/^&/, '?'));
                window.history.replaceState({}, '', newUrl || '/');
            }
        }
    }, [appointments.length > 0]);

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

    // -- DYNAMIC COLOR PALETTE --
    // Updated to match the "Card Vibe" (More saturated, less pastel/washed out)
    const PREMIUM_PALETTE = [
        { bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-600', dotText: 'text-white' },
        { bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/20', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-600', dotText: 'text-white' },
        { bg: 'bg-fuchsia-50 dark:bg-fuchsia-500/10', border: 'border-fuchsia-200 dark:border-fuchsia-500/20', text: 'text-fuchsia-700 dark:text-fuchsia-300', dot: 'bg-fuchsia-600', dotText: 'text-white' },
        { bg: 'bg-pink-50 dark:bg-pink-500/10', border: 'border-pink-200 dark:border-pink-500/20', text: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-600', dotText: 'text-white' },
        { bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-600', dotText: 'text-white' },
        { bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-600', dotText: 'text-white' },
        { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-600', dotText: 'text-white' },
        { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-600', dotText: 'text-white' },
        { bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-200 dark:border-sky-500/20', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-600', dotText: 'text-white' },
        { bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-200 dark:border-cyan-500/20', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-600', dotText: 'text-white' },
        { bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-600', dotText: 'text-white' },
        { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-600', dotText: 'text-white' },
    ];

    // creating a determinstic hash for consistency across renders
    const getColor = (id: string | undefined): { bg: string, border: string, text: string, dot: string, dotText?: string, style?: any, dotStyle?: any } => {
        if (!id) return { ...PREMIUM_PALETTE[0], dotText: '' };

        // 1. Personal Branding Override (If applicable)
        if (currentStaffId && id === currentStaffId && userThemeColor) {
            // Using style injection to support ANY arbitrary hex color from the picker
            // We use opacity versions for bg/border to match the palette system
            return {
                bg: '', // Handled by style
                border: '', // Handled by style
                text: '', // Handled by style
                dot: '', // Handled by style
                style: {
                    backgroundColor: `${userThemeColor}10`, // 5-10% opacity for bg
                    borderColor: `${userThemeColor}40`,     // 20-30% opacity for border
                    borderLeftColor: userThemeColor,        // 100% for accent border
                    color: userThemeColor,                  // 100% for text
                },
                dotStyle: {
                    backgroundColor: userThemeColor,
                    color: '#fff'
                }
            };
        }

        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % PREMIUM_PALETTE.length;
        return PREMIUM_PALETTE[index];
    };

    // For backwards compatibility with loops using idx
    const getColorByIndex = (idx: number) => PREMIUM_PALETTE[idx % PREMIUM_PALETTE.length];

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
                if (el && scrollContainerRef.current) {
                    const offsetTop = el.offsetTop - 20; // 20px buffer
                    scrollContainerRef.current.scrollTo({ top: offsetTop, behavior: 'auto' });
                }
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
            deltaY: 0,
            hasConflict: false
        });
    };



    const handlePointerUp = async (e: React.PointerEvent) => {
        if (!dragState) return;
        const { id, currentTop, originalStaffId, currentStaffId } = dragState;

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
        const totalMinutes = (currentTop / 2) + (minHour * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const newTimeSlot = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        // Find the appointment
        const apt = appointments.find(a => a.id === id);
        const finalStaffId = currentStaffId || originalStaffId;

        if (apt && (apt.timeSlot !== newTimeSlot || finalStaffId !== originalStaffId) && onAppointmentUpdate) {
            try {
                // Support horizontal (staff) reassignment
                const currentAptDate = new Date(`${apt.date}T00:00:00`);
                await onAppointmentUpdate(apt, currentAptDate, newTimeSlot, finalStaffId);
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
            // Fix: querySelector returns the first column, which is ALREADY the column width.
            const firstColumn = scrollContainerRef.current.querySelector('.flex-1.relative');
            const columnWidth = firstColumn ? firstColumn.clientWidth : ((containerRect.width - timeColumnWidth) / staff.length);

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

    // -- MEMOIZED LAYOUT CALCULATIONS --
    const dailyLayoutData = React.useMemo(() => {
        if (calendarLevel !== 'day' || viewMode !== 'personal') return [];

        const dayAppointments = getAppointmentsForDate(selectedDate);
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
            const overlappingEvents = sortedApts.filter(a => {
                const aStart = getMinutes(a.timeSlot);
                const aService = services.find(s => s.id === a.serviceId);
                const aDuration = a.durationMinutes || aService?.durationMinutes || 60;
                const aEnd = aStart + aDuration;
                return (start < aEnd - 0.1 && end > aStart + 0.1);
            });

            // Column logic
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
            const widthPct = 98 / totalCols;
            const leftPct = (colIndex * widthPct);

            return { apt, widthPct, leftPct };
        });
    }, [calendarLevel, selectedDate, appointments, viewMode, filterStaffId, services]); // Dependencies

    // -- RENDERERS --

    const renderYearBlock = (year: number) => (
        <div key={year} id={`year-${year}`} className="mb-8 last:mb-0">
            {/* Apple style: Clean, left-aligned year title with thin divider */}
            <div className="px-5 mb-4">
                <h2 className={`text-3xl font-bold tracking-tight ${year === getYear(selectedDate) ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>
                    {year}
                </h2>
                <div className="h-px bg-gray-100 dark:bg-gray-800 mt-2 w-full"></div>
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
                                setZoomDirection('in');
                                setDirection('forward');
                                setCalendarLevel('month');
                                setSelectedDate(monthDate);
                            }}
                        >
                            {/* Shortened month name: J, F, M... or Jan, Feb... Apple uses Full but we can use tiny bold */}
                            <h3 className={`text-[13px] font-bold px-1 ${isSelectedMonth ? 'text-primary-600' : 'text-gray-900 dark:text-gray-100 uppercase tracking-tight'}`}>
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
                                            className={`aspect-square flex items-center justify-center text-[11px] font-medium rounded-full transition-colors ${isToday
                                                ? 'bg-primary-600! text-white shadow-sm'
                                                : 'text-gray-700 dark:text-gray-400'
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
                className={`flex-1 overflow-y-auto bg-white dark:bg-black pb-24 ${getAnimClass()} scrollbar-hide`}
                onScroll={(e) => handleInfiniteScroll(e, 'year')}
            >
                {renderedYears.map((year, i) => (
                    <React.Fragment key={year}>
                        {renderYearBlock(year)}
                        {i < renderedYears.length - 1 && <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4 mb-8"></div>}
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
                <h3 className="sticky top-0 bg-white/95 dark:bg-black/95 backdrop-blur-md py-4 px-6 text-2xl font-bold text-gray-900 dark:text-white z-10 border-b border-gray-100 dark:border-sidebar-border flex items-baseline gap-2">
                    {monthName} <span className="text-gray-400 font-normal text-xl">{year}</span>
                </h3>
                <div className="grid grid-cols-7 auto-rows-fr border-l border-gray-100 dark:border-sidebar-border pt-4">
                    {/* Empty cells for start of month */}
                    {Array.from({ length: startDayOffset }).map((_, i) => (
                        <div key={`empty-${i}`} className="min-h-[120px] bg-gray-50/30 dark:bg-white/5 border-b border-r border-gray-100 dark:border-sidebar-border" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const cellDate = new Date(year, date.getMonth(), dayNum);
                        const dayAppointments = getAppointmentsForDate(cellDate);
                        const eventCount = dayAppointments.filter(apt => {
                            const isBlocked = apt.status === 'BLOCKED' ||
                                (apt as any).isBlocked ||
                                apt.clientName?.toLowerCase().startsWith('blocked') ||
                                apt.clientId === 'blocked@internal.system';
                            return !isBlocked;
                        }).length;
                        const isSelectedDay = isSameDay(cellDate, selectedDate);
                        const isTodayDay = isSameDay(cellDate, new Date());

                        return (
                            <div
                                key={i}
                                className={`min-h-[120px] border-b border-r border-gray-100 dark:border-sidebar-border p-2 transition-colors relative group
                                    ${isTodayDay ? 'bg-primary-50/30 dark:bg-primary-900/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}
                                    ${isBefore(cellDate, new Date()) && !isTodayDay ? 'bg-gray-50/50 dark:bg-black/40' : ''}
                                `}
                                onClick={() => {
                                    setZoomDirection('in');
                                    setDirection('forward');
                                    setCalendarLevel('day');
                                    setSelectedDate(cellDate);
                                }}
                            >
                                <span className={`
                                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1
                                    ${isTodayDay ? 'bg-primary-600! text-white shadow-sm' : isBefore(cellDate, new Date()) && !isTodayDay ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}
                                `}>
                                    {dayNum}
                                </span>

                                {eventCount > 0 && (
                                    <div className="flex justify-start pl-1 mt-1">
                                        <span className="text-xs font-black text-white bg-primary-600 dark:bg-primary-500 px-2 py-0.5 rounded-full shadow-sm ring-1 ring-white dark:ring-black min-w-[20px] text-center">
                                            {eventCount}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                    }
                </div >
            </div >
        );

    };

    const renderMonthView = () => (
        <div
            ref={scrollContainerRef}
            className={`flex-1 overflow-y-auto bg-white dark:bg-black ${getAnimClass()} scrollbar-hide pb-24`}
            onScroll={(e) => handleInfiniteScroll(e, 'month')}
        >


            <div className="pb-24">
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
                className={`flex-1 overflow-auto bg-white dark:bg-black relative ${getAnimClass()} scrollbar-hide pb-24 lg:pb-0`}
                style={{ scrollBehavior: 'smooth' }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div className="min-w-full w-fit flex flex-col relative">
                    {viewMode === 'team' && (
                        <div className="sticky top-0 z-[45] bg-white dark:bg-sidebar border-b border-gray-300 dark:border-sidebar-border shadow-sm flex h-14">
                            <div className="w-[48px] lg:w-[80px] shrink-0 sticky left-0 z-50 bg-white dark:bg-sidebar h-full"></div>
                            <div className="flex-1 flex min-w-0 h-full">
                                {staff.map((member) => {
                                    const colorScheme = getColor(member.id);
                                    return (
                                        <div key={member.id} className={`flex-1 ${staff.length > 4 ? 'min-w-[120px]' : 'min-w-[160px]'} border-l border-gray-300 dark:border-sidebar-border bg-white dark:bg-sidebar relative group h-full flex items-center`}>
                                            <div className="flex items-center gap-3 px-4 w-full">
                                                {/* Avatar / Circle - Now uses consistent color logic */}
                                                {member.avatar ? (
                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 shrink-0">
                                                        <Image src={member.avatar} alt={member.name} fill className="object-cover" unoptimized />
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm ${colorScheme.dot}`}
                                                        style={colorScheme.dotStyle}
                                                    >
                                                        <span className={colorScheme.dotText || 'text-white'}>
                                                            {member.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider truncate">{member.name}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Grid Row */}
                    <div className="relative flex" style={{ height: `${hours.length * 120}px` }}>
                        {/* Time labels rail */}
                        <div className="w-[48px] lg:w-[80px] shrink-0 bg-white dark:bg-black z-[40] sticky left-0 h-full select-none">
                            {hours.map((h, i) => (
                                <React.Fragment key={h}>
                                    <div className="absolute w-[48px] lg:w-[80px] text-right pr-2 lg:pr-4" style={{ top: `${i * 120}px` }}>
                                        <span className="text-[10px] font-black text-gray-900 dark:text-gray-400 relative -top-2">
                                            {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? 'Noon' : `${h - 12} PM`}
                                        </span>
                                    </div>
                                    {h < maxHour && (
                                        <>
                                            <div className="absolute w-[48px] lg:w-[80px] text-right pr-2 lg:pr-4" style={{ top: `${i * 120 + 30}px` }}>
                                                <span className="text-[8px] font-medium text-gray-400 dark:text-gray-600 opacity-50 relative -top-1.5">:15</span>
                                            </div>
                                            <div className="absolute w-[48px] lg:w-[80px] text-right pr-2 lg:pr-4" style={{ top: `${i * 120 + 60}px` }}>
                                                <span className="text-[8px] font-bold text-gray-400 dark:text-gray-600 opacity-80 relative -top-1.5">:30</span>
                                            </div>
                                            <div className="absolute w-[48px] lg:w-[80px] text-right pr-2 lg:pr-4" style={{ top: `${i * 120 + 90}px` }}>
                                                <span className="text-[8px] font-medium text-gray-400 dark:text-gray-600 opacity-50 relative -top-1.5">:45</span>
                                            </div>
                                        </>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Shared Current Time Indicator (Absolute positioned relative to parent) */}
                        {currentTimeTopPx !== -1 && (
                            <div className="absolute left-0 right-0 z-[38] pointer-events-none" style={{ top: `${currentTimeTopPx}px` }}>
                                <div className="w-full h-[1.5px] bg-primary-600 shadow-[0_0_8px_var(--primary-600)]"></div>
                                <div className="absolute -left-1 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-primary-600 live-pulse border-2 border-white shadow-sm"></div>
                            </div>
                        )}

                        {viewMode === 'personal' ? (
                            <div className="flex-1 min-w-0 relative h-[calc(100%+96px)] border-l border-gray-300 dark:border-white/5">
                                {isDayEmpty && <EmptyState onAction={() => onSelectSlot(selectedDate, `${minHour.toString().padStart(2, '0')}:00`)} />}
                                {hours.map((h, i) => (
                                    <div key={h} className="absolute w-full border-t border-gray-300 dark:border-white/5 h-px z-0" style={{ top: `${i * 120}px` }} onClick={() => handleGridClick(h)}></div>
                                ))}

                                {dailyLayoutData.map(({ apt, widthPct, leftPct }) => {
                                    const service = services.find(s => s.id === apt.serviceId);
                                    const duration = apt.durationMinutes || service?.durationMinutes || 60;
                                    const [h, m] = apt.timeSlot.split(':').map(Number);
                                    const topPx = ((h * 60) + m - (minHour * 60)) * 2;
                                    const isPast = new Date(`${apt.date}T${apt.timeSlot}`) < now;
                                    const isDragging = dragState?.id === apt.id;
                                    const displayTop = isDragging ? dragState.currentTop : topPx;
                                    const displayTime = isDragging ? dragState.currentTimeSlot : apt.timeSlot;
                                    const isBlocked = apt.clientName?.toLowerCase().startsWith('blocked') || apt.clientId === 'blocked@internal.system';
                                    const colorKey = colorMode === 'service' ? apt.serviceId : apt.staffId;
                                    const colorScheme = getColor(colorKey);

                                    return (
                                        <React.Fragment key={apt.id}>
                                            <div
                                                onPointerDown={(e) => handlePointerDown(e, apt, topPx)}
                                                onPointerMove={handlePointerMove}
                                                onPointerUp={handlePointerUp}
                                                onClick={(e) => {
                                                    if (isDraggingRef.current) { e.stopPropagation(); return; }
                                                    if (!isDragging) { e.stopPropagation(); onAppointmentClick(apt); }
                                                }}
                                                className={`absolute rounded-[12px] ${isBlocked ? 'bg-slate-100 border-slate-400 text-slate-900 border-l-[3px]' : `${colorScheme.bg} ${colorScheme.border} ${colorScheme.text} border-l-[4px]`} py-1 px-2 z-[35] shadow-md ring-1 ring-white/70 animate-in zoom-in-95 appointment-card transition-all flex flex-col justify-start hover:z-[60] hover:scale-[1.05] hover:shadow-xl ${isPast ? 'opacity-60 grayscale-[0.5]' : ''} ${isDragging ? 'z-[100] scale-105 shadow-2xl ring-4 ring-primary-300 opacity-90 cursor-grabbing' : ''}`}
                                                style={{
                                                    top: `${displayTop}px`,
                                                    height: `${Math.max(44, duration * 2)}px`,
                                                    left: `calc(${leftPct}% + 1px)`,
                                                    width: `calc(${widthPct}% - 2px)`,
                                                    transition: isDragging ? 'none' : 'all 0.2s ease-out',
                                                    ...(colorScheme.style || {}) // Apply style override for personal branding
                                                }}
                                            >
                                                <div className="flex flex-col h-full overflow-hidden">
                                                    <div className="text-[10px] font-black opacity-70 uppercase tracking-tighter truncate">
                                                        {isBlocked ? 'Blocked' : (service?.name || 'Service')}
                                                    </div>
                                                    <div className="text-[12px] font-black leading-tight truncate">
                                                        {isBlocked ? (apt.clientName?.replace(/^Blocked - /, '') || 'Reason') : apt.clientName}
                                                    </div>
                                                    <div className="mt-auto flex items-center justify-between text-[10px] font-bold">
                                                        <span>{formatTo12Hour(displayTime)}</span>
                                                        <span className="opacity-50">{duration}m</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex-1 flex min-w-0">
                                {staff.map((member) => {
                                    const memberAppointments = dayAppointments.filter(apt => apt.staffId === member.id);
                                    return (
                                        <div key={member.id} className={`flex-1 ${staff.length > 4 ? 'min-w-[120px]' : 'min-w-[160px]'} border-l border-gray-300 dark:border-sidebar-border relative h-full transition-shadow`}>
                                            {hours.map((h, i) => (
                                                <div key={h} className="absolute w-full border-t border-gray-300 dark:border-white/5 h-px z-0" style={{ top: `${i * 120}px` }} onClick={() => handleGridClick(h, member.id)}></div>
                                            ))}

                                            {memberAppointments.map(apt => {
                                                const service = services.find(s => s.id === apt.serviceId);
                                                const duration = apt.durationMinutes || service?.durationMinutes || 60;
                                                const [h, m] = apt.timeSlot.split(':').map(Number);
                                                const topPx = ((h * 60) + m - (minHour * 60)) * 2;
                                                const isPast = new Date(`${apt.date}T${apt.timeSlot}`) < now;
                                                const isDragging = dragState?.id === apt.id;
                                                const displayTop = isDragging ? dragState.currentTop : topPx;
                                                const displayTime = isDragging ? dragState.currentTimeSlot : apt.timeSlot;
                                                const isBlocked = apt.clientName?.toLowerCase().startsWith('blocked') || apt.clientId === 'blocked@internal.system';
                                                const colorKey = colorMode === 'service' ? apt.serviceId : apt.staffId;
                                                const colorScheme = getColor(colorKey);

                                                return (
                                                    <React.Fragment key={apt.id}>
                                                        <div
                                                            onPointerDown={(e) => handlePointerDown(e, apt, topPx)}
                                                            onPointerMove={handlePointerMove}
                                                            onPointerUp={handlePointerUp}
                                                            onClick={(e) => {
                                                                if (isDraggingRef.current) { e.stopPropagation(); return; }
                                                                if (!isDragging) { e.stopPropagation(); onAppointmentClick(apt); }
                                                            }}
                                                            className={`absolute left-0.5 right-0.5 rounded-[8px] ${isBlocked ? 'bg-slate-100 border-slate-400 text-slate-900 border-l-[3px]' : `${colorScheme.bg} ${colorScheme.border} ${colorScheme.text} border-l-[4px]`} py-1 px-2 z-[35] shadow-md ring-1 ring-white/70 animate-in zoom-in-95 appointment-card transition-all flex flex-col justify-start hover:z-[60] hover:scale-[1.05] hover:shadow-xl ${isPast ? 'opacity-60 grayscale-[0.5]' : ''} ${isDragging ? 'z-[100] scale-105 shadow-2xl ring-4 ring-primary-300 opacity-90 cursor-grabbing' : ''}`}
                                                            style={{
                                                                top: `${displayTop}px`,
                                                                height: `${Math.max(44, duration * 2)}px`,
                                                                transition: isDragging ? 'none' : 'all 0.2s ease-out',
                                                                transform: isDragging ? `translateX(${dragState?.deltaX || 0}px)` : undefined,
                                                                zIndex: isDragging ? 50 : undefined,
                                                                ...(colorScheme.style || {}) // Apply style override for personal branding
                                                            }}
                                                        >
                                                            <div className="flex flex-col h-full overflow-hidden">
                                                                <div className="text-[9px] font-black opacity-70 uppercase tracking-tighter truncate">
                                                                    {isBlocked ? 'Blocked' : (apt.serviceName || service?.name || 'Service')}
                                                                </div>
                                                                <div className="text-[11px] font-black leading-tight truncate">
                                                                    {isBlocked ? (apt.clientName?.replace(/^Blocked - /, '') || 'Reason') : apt.clientName}
                                                                </div>
                                                                <div className="mt-auto text-[9px] font-bold flex justify-between">
                                                                    <span>{formatTo12Hour(displayTime)}</span>
                                                                    <span className="opacity-50">{duration}m</span>
                                                                </div>
                                                            </div>
                                                        </div>
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
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
            <PulseStyle />

            {/* Helper for Centered Filter Label */}
            {(() => {
                const selectedStaffForFilter = staff.find(s => s.id === filterStaffId);
                const filterLabel = filterStaffId === 'ALL' ? 'All Staff' : selectedStaffForFilter?.name || 'Unknown';

                return null; // This is a placeholder for logic, I'll use filterLabel below
            })()}

            {/* --- Main Header --- */}
            <div className="sticky top-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-md transition-all border-b border-gray-100 dark:border-white/10">
                <header className="py-2 sm:py-3 px-4 flex items-center justify-between shrink-0 touch-none gap-2 min-h-[56px] max-w-[95%] mx-auto w-full">

                    {/* LEFT: NAVIGATION */}
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        {calendarLevel !== 'day' && calendarLevel !== 'year' && (
                            <div
                                onClick={() => {
                                    if (calendarLevel === 'month') {
                                        setZoomDirection('out'); // Back out
                                        setCalendarLevel('year');
                                    }
                                }}
                                className="flex items-center text-primary-600 font-medium cursor-pointer hover:bg-primary-50 px-2 py-1 rounded-md transition-colors -ml-2"
                            >
                                <ChevronLeft className="w-5 h-5 -ml-1.5" strokeWidth={2.5} />
                                <span className="text-[17px] font-normal">{calendarLevel === 'month' ? getYear(selectedDate) : 'Back'}</span>
                            </div>
                        )}
                        {calendarLevel === 'day' && (
                            <div
                                onClick={() => {
                                    setZoomDirection('out'); // Back out
                                    setCalendarLevel('month');
                                }}
                                className="flex items-center text-primary-600 font-medium cursor-pointer hover:bg-primary-50 px-2 py-1 rounded-md transition-colors -ml-2 shrink-0"
                            >
                                <ChevronLeft className="w-5 h-5 -ml-1.5" strokeWidth={2.5} />
                                <span className="text-[17px] font-normal">Month</span>
                            </div>
                        )}

                        {/* TODAY BUTTON (Hidden if today is selected/not day view maybe, or just keep it compact) */}
                        {(!isSameDay(selectedDate, new Date()) || calendarLevel !== 'day') && (
                            <button
                                className="text-[11px] sm:text-xs font-bold text-primary-600 bg-primary-100/50 px-2 py-1 rounded-full hover:bg-primary-100 transition-colors shrink-0"
                                onClick={() => {
                                    setZoomDirection('in');
                                    setCalendarLevel('day');
                                    setSelectedDate(new Date());
                                    setTimeout(() => scrollToTime(), 100);
                                }}
                            >
                                Today
                            </button>
                        )}
                    </div>

                    {/* CENTER: STAFF IDENTITY */}
                    {showStaffFilter && (
                        <div className="flex-shrink-0 z-[60]">
                            <div className="relative">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 ${isFilterOpen ? 'bg-primary-600/10 ring-2 ring-primary-600 text-primary-600' : 'bg-primary-600/5 hover:bg-primary-600/10 text-primary-600'}`}
                                >
                                    <span className="text-sm sm:text-base font-black tracking-tight truncate max-w-[80px] sm:max-w-[150px]">
                                        {filterStaffId === 'ALL' ? 'All Staff' : staff.find(s => s.id === filterStaffId)?.name || 'Unknown'}
                                    </span>
                                    <ChevronRight className={`w-3.5 h-3.5 text-primary-600 transition-transform duration-200 ${isFilterOpen ? 'rotate-90' : ''}`} strokeWidth={2.5} />
                                </button>

                                {isFilterOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)}></div>
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-white/90 dark:bg-card/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-white/40 dark:border-white/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <div className="p-1">
                                                <div
                                                    className={`px-4 py-3 text-sm font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer mb-1 transition-colors ${filterStaffId === 'ALL' ? 'text-primary-600 bg-primary-50/50 dark:bg-primary-900/10' : 'text-gray-500 dark:text-gray-400'}`}
                                                    onClick={() => { setFilterStaffId('ALL'); setIsFilterOpen(false); }}
                                                >
                                                    All Staff
                                                </div>
                                                <div className="h-px bg-gray-100 dark:bg-white/10 mx-2 mb-1"></div>
                                                {staff.map(s => (
                                                    <div
                                                        key={s.id}
                                                        className={`px-4 py-2.5 flex items-center gap-3 text-sm font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors ${filterStaffId === s.id ? 'text-primary-600 bg-primary-50/50 dark:bg-primary-900/10' : 'text-gray-700 dark:text-gray-200'}`}
                                                        onClick={() => { setFilterStaffId(s.id); setIsFilterOpen(false); }}
                                                    >
                                                        {s.avatar ? (
                                                            <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 shrink-0">
                                                                <Image src={s.avatar} alt={s.name} width={24} height={24} className="object-cover" unoptimized />
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] shrink-0">
                                                                <User className="w-3.5 h-3.5 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <span>{s.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* RIGHT: ACTION BUTTONS */}
                    <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2.5">
                        {/* QUICK VIEW */}
                        <div className="relative group">
                            <button
                                className={`flex items-center gap-1.5 p-1.5 sm:px-2 py-1.5 transition-all duration-200 rounded-full ${isDatePickerOpen ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
                                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                            >
                                <CalendarIcon className="w-5 h-5" />
                            </button>

                            {isDatePickerOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsDatePickerOpen(false)}></div>
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-card rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 p-4 z-50 animate-in zoom-in-95 duration-200 origin-top-right">
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
                                                                if (calendarLevel !== 'day') {
                                                                    setZoomDirection('in'); // Set zoom direction for navigating in
                                                                    setCalendarLevel('day');
                                                                }
                                                            }}
                                                            className={`h-8 w-8 rounded-full text-xs font-bold transition-all ${isSelected
                                                                ? 'bg-primary-600 text-white shadow-md scale-110'
                                                                : isToday
                                                                    ? 'text-primary-600 bg-primary-50'
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
                                    </div>
                                </>
                            )}
                        </div>

                        {/* ADD BUTTON */}
                        <button
                            className="flex items-center justify-center w-10 h-10 bg-primary-600 text-white rounded-full transition-all duration-200 hover:bg-primary-700 active:scale-90 shadow-lg shadow-primary-600/20"
                            onClick={() => onSelectSlot(selectedDate, `${minHour.toString().padStart(2, '0')}:00`)}
                        >
                            <Plus className="w-6 h-6" strokeWidth={3} />
                        </button>
                    </div>
                </header >

                {/* DAY SPECIFIC DATE HEADER */}
                {
                    calendarLevel === 'day' && (
                        <div
                            className="flex flex-col select-none touch-none pb-1 relative group max-w-[95%] mx-auto w-full"
                            onTouchStart={onHeaderTouchStart}
                            onTouchMove={onHeaderTouchMove}
                            onTouchEnd={onHeaderTouchEnd}
                        >
                            {/* DESKTOP NAV BUTTONS */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedDate(addDays(selectedDate, -7)); }}
                                className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -ml-3 w-8 h-8 items-center justify-center text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all z-10"
                            >
                                <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedDate(addDays(selectedDate, 7)); }}
                                className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 -mr-3 w-8 h-8 items-center justify-center text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all z-10"
                            >
                                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                            </button>

                            <div className="flex justify-between px-4 mb-0.5">
                                {weekDayLabels.map((day, i) => (
                                    <div key={i} className="w-10 text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between px-4 text-[16px]">
                                {weekDates.map((date) => {
                                    const isSelected = isSameDay(date, selectedDate);
                                    const isToday = isSameDay(date, new Date());
                                    return (
                                        <div
                                            key={date.toISOString()}
                                            className="w-10 flex flex-col items-center justify-center cursor-pointer"
                                            onClick={() => setSelectedDate(date)}
                                        >
                                            {holidays.includes(format(date, 'yyyy-MM-dd')) ? (
                                                <div className="flex flex-col items-center gap-1.5 animate-in slide-in-from-top-2 duration-700">
                                                    <div className="w-10 h-10 bg-red-50 dark:bg-black rounded-2xl flex items-center justify-center border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                                        <CalendarX className="w-5 h-5 text-red-600 dark:text-red-500" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-[0.2em]">Closed</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all ${isSelected
                                                        ? 'bg-primary-600 text-white shadow-sm'
                                                        : isToday
                                                            ? 'text-primary-600 dark:text-primary-400'
                                                            : 'text-gray-900 dark:text-gray-200 bg-transparent'
                                                        }`}>
                                                        {format(date, 'd')}
                                                    </div>
                                                    {isToday && !isSelected && <div className="w-1 h-1 rounded-full bg-primary-600 dark:bg-primary-400 mt-0.5"></div>}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div >
                    )
                }

                {/* MONTH VIEW WEEKDAY HEADERS (Moved from scroll container) */}
                {
                    calendarLevel === 'month' && (
                        <div className="grid grid-cols-7 pb-1.5 pt-1 bg-white dark:bg-black select-none border-b border-gray-100 dark:border-white/10">
                            {weekDayLabels.map((d, i) => (
                                <div key={i} className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{d}</div>
                            ))}
                        </div>
                    )
                }



            </div>
            {/*MAIN CONTENT AREA*/}
            <AnimatePresence mode="popLayout" custom={zoomDirection}>
                {calendarLevel === 'year' && (
                    <motion.div
                        key="year"
                        custom={zoomDirection}
                        variants={viewVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-black"
                    >
                        {renderYearView()}
                    </motion.div>
                )}
                {calendarLevel === 'month' && (
                    <motion.div
                        key="month"
                        custom={zoomDirection}
                        variants={viewVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-black"
                    >
                        {renderMonthView()}
                    </motion.div>
                )}
                {calendarLevel === 'day' && (
                    <motion.div
                        key="day"
                        custom={zoomDirection}
                        variants={viewVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-black"
                    >
                        {renderDayView()}
                    </motion.div>
                )}
            </AnimatePresence>

        </div >
    );
}
