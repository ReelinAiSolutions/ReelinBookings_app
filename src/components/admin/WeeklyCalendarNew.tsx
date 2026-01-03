import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Plus, Search, Calendar as CalendarIcon, Users, BarChart3, Settings, ChevronDown, ChevronRight, X, Clock, MapPin, Bell, Sparkles, TrendingUp, DollarSign, UserPlus } from 'lucide-react';

const PulseStyle = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes gravityPulse {
            0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
            70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 10px rgba(124, 58, 237, 0); }
            100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
        }
        .live-pulse {
            animation: gravityPulse 2s infinite ease-in-out;
        }
    `}} />
);

// @ts-ignore
export default function PreviewCalendar({ hideNav = false, onTabChange }: { hideNav?: boolean, onTabChange?: (tab: 'calendar' | 'stats' | 'settings') => void }) {

    // -- STATE --
    const [calendarLevel, setCalendarLevel] = useState<'day' | 'month' | 'year'>('day');
    const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
    const [selectedDate, setSelectedDate] = useState<number>(27);
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [startTime, setStartTime] = useState(15); // 3 PM
    const [endTime, setEndTime] = useState(16); // 4 PM

    const [mockEvents, setMockEvents] = useState([
        { id: 1, title: 'Haircut', start: 15, duration: 1, col: 0, staffId: 1, type: 'personal', day: 27 },
        { id: 2, title: 'Check-in', start: 9, duration: 0.5, col: 0, staffId: 1, type: 'personal', day: 27 },
        { id: 3, title: 'Consultation', start: 10, duration: 1, col: 0, staffId: 2, type: 'personal', day: 15 },
        { id: 4, title: 'Meeting', start: 11, duration: 1, col: 0, staffId: 3, type: 'personal', day: 21 },
        { id: 5, title: 'Break', start: 13, duration: 1, col: 0, staffId: 1, type: 'personal', day: 21 },
        { id: 6, title: 'Review', start: 14, duration: 1, col: 0, staffId: 1, type: 'personal', day: 21 },
    ]);

    // Swipe State
    const touchStart = useRef<number | null>(null);
    const touchEnd = useRef<number | null>(null);
    const minSwipeDistance = 50;

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // -- SCROLL START --
    useEffect(() => {
        if (calendarLevel === 'day' && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 800; // Scroll to ~1:30 PM
        }
    }, [calendarLevel]);

    // -- CONSTANTS --
    const hours = Array.from({ length: 24 }).map((_, i) => i);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const weekDates = [21, 22, 23, 24, 25, 26, 27];

    // -- ANIMATION CLASS --
    const getAnimClass = () => {
        return direction === 'forward'
            ? 'animate-in zoom-in-90 fade-in duration-300'
            : 'animate-in zoom-out-105 fade-in duration-300';
    };

    // -- SWIPE HANDLERS (Day View) --
    const onTouchStart = (e: React.TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            if (selectedDate < 27) {
                setSlideDirection('left');
                setSelectedDate(prev => prev + 1);
            }
        }
        if (isRightSwipe) {
            if (selectedDate > 21) {
                setSlideDirection('right');
                setSelectedDate(prev => prev - 1);
            }
        }
    };

    // -- HANDLERS --
    const handleGridClick = (hour: number, staffIndex: number = 0) => {
        setStartTime(hour);
        setEndTime(hour + 1);
        setIsModalOpen(true);
    };

    const handleSaveBooking = () => {
        const newEvent = {
            id: Math.random(),
            title: 'New Appointment',
            start: startTime,
            duration: endTime - startTime,
            col: 0,
            staffId: 1,
            type: 'new',
            day: selectedDate
        };
        setMockEvents([...mockEvents, newEvent]);
        setIsModalOpen(false);
    };

    const staffMembers = [
        { id: 1, name: 'Sarah', color: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700' },
        { id: 2, name: 'Mike', color: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700' },
        { id: 3, name: 'Jessica', color: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-700' },
        { id: 4, name: 'David', color: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700' },
        { id: 5, name: 'Emily', color: 'bg-fuchsia-50', border: 'border-fuchsia-500', text: 'text-fuchsia-700' },
        { id: 6, name: 'Chris', color: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700' },
        { id: 7, name: 'Amanda', color: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-700' },
        { id: 8, name: 'Tom', color: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700' },
        { id: 9, name: 'Olivia', color: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-700' },
        { id: 10, name: 'James', color: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-700' },
    ];

    // -- RENDERERS --

    const renderNewBookingModal = () => (
        <div className="absolute inset-0 z-[100] flex flex-col bg-[#F2F2F7]">
            {/* Header - Solid Background */}
            <div className="flex justify-between items-center px-6 pt-10 pb-4 bg-[#F2F2F7]/95 backdrop-blur-xl border-b border-gray-200 shrink-0 sticky top-0 z-20">
                <button onClick={() => setIsModalOpen(false)} className="text-[#7C3AED] text-[17px] hover:opacity-70 transition-opacity">Cancel</button>
                <span className="font-bold text-[17px] text-black">New Event</span>
                <button onClick={handleSaveBooking} className="font-bold text-[#7C3AED] text-[17px] hover:opacity-70 transition-opacity">Add</button>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-10">

                {/* Title & Location Group */}
                <div className="bg-white mt-4 mx-4 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <input
                            type="text"
                            placeholder="Client Name / Title"
                            className="w-full text-[17px] font-medium placeholder-gray-400 bg-transparent outline-none text-black"
                            autoFocus
                        />
                    </div>
                    <div className="px-4 py-3">
                        <input
                            type="text"
                            placeholder="Location or Video Call"
                            className="w-full text-[17px] placeholder-gray-400 bg-transparent outline-none text-black"
                        />
                    </div>
                </div>

                {/* Timing Group */}
                <div className="bg-white mt-4 mx-4 rounded-xl overflow-hidden shadow-sm border border-gray-100 p-4">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[17px] font-semibold text-black">All-day</span>
                        <div className="w-12 h-7 bg-gray-200 rounded-full relative cursor-auto transition-colors">
                            <div className="w-6 h-6 bg-white rounded-full shadow absolute top-0.5 left-0.5"></div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-1 border-t border-gray-50 pt-3">
                            <span className="text-[17px] text-black">Starts</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[17px] text-black font-medium">Dec 27</span>
                                <span className="bg-gray-100 px-2 py-1 rounded-lg text-[15px] font-medium">3:00 PM</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-gray-50 pt-3">
                            <span className="text-[17px] text-black">Ends</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[17px] text-black font-medium">Dec 27</span>
                                <span className="bg-gray-100 px-2 py-1 rounded-lg text-[15px] font-medium">4:00 PM</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Interaction */}
                    <div className="mt-6">
                        <div className="flex justify-between px-2 mb-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">2 PM</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">3 PM</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">4 PM</span>
                        </div>
                        <div className="h-14 bg-gray-50 rounded-2xl border border-gray-100 relative flex items-center justify-center p-2">
                            <div className="flex-1 max-w-[140px] h-9 bg-purple-50 border-[1.5px] border-purple-400 rounded-xl flex items-center justify-center shadow-sm">
                                <span className="text-[11px] font-bold text-purple-600">New Event</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meta Selection Group */}
                <div className="bg-white mt-4 mx-4 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                    {[
                        { label: 'Service', value: 'Haircut', color: null },
                        { label: 'Staff Member', value: 'Sarah', color: 'bg-purple-500' },
                        { label: 'Calendar', value: 'Personal', color: 'bg-[#7C3AED]' },
                        { label: 'Alert', value: 'None', color: null },
                    ].map((item, i, arr) => (
                        <div key={item.label} className={`flex justify-between items-center py-3.5 px-4 ${i !== arr.length - 1 ? 'border-b border-gray-100' : ''} active:bg-gray-50 transition-colors`}>
                            <span className="text-[17px] text-black">{item.label}</span>
                            <div className="flex items-center gap-2 text-[#8E8E93]">
                                {item.color && <div className={`w-2 h-2 rounded-full ${item.color}`}></div>}
                                <span className="text-[17px] truncate max-w-[120px]">{item.value}</span>
                                <ChevronRight className="w-4 h-4 opacity-40" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Notes Group */}
                <div className="bg-white mt-4 mx-4 rounded-xl overflow-hidden shadow-sm border border-gray-100 p-4 min-h-[120px]">
                    <textarea
                        placeholder="Notes / URL"
                        className="w-full h-full text-[17px] placeholder-gray-400 bg-transparent outline-none resize-none text-black"
                    ></textarea>
                </div>

            </div>
        </div>
    );

    const renderYearBlock = (year: number) => (
        <div key={year} className="mb-12">
            <h2 className={`text-3xl font-bold px-4 mb-4 border-b border-gray-50/0 ${year === 2025 ? 'text-purple-600' : 'text-gray-900'}`}>{year}</h2>
            <div className="grid grid-cols-3 gap-x-2 gap-y-6 px-2">
                {months.map((m, i) => {
                    const offset = (i * 3) % 7;
                    const days = 31;
                    return (
                        <div
                            key={m}
                            className="flex flex-col gap-1 cursor-pointer active:bg-gray-50 rounded-lg p-1 transition-colors"
                            onClick={() => { setDirection('forward'); setCalendarLevel('month'); }}
                        >
                            <h3 className={`text-[13px] font-bold pl-0.5 ${i === 11 && year === 2025 ? 'text-purple-600' : 'text-gray-900'}`}>{m}</h3>
                            <div className="grid grid-cols-7 gap-y-[2px] gap-x-0 pointer-events-none">
                                {Array.from({ length: offset }).map((_, k) => <div key={`e-${k}`} className="w-full h-[10px]"></div>)}
                                {Array.from({ length: days }).map((_, d) => {
                                    const dayNum = d + 1;
                                    const isToday = year === 2025 && i === 11 && dayNum === 27;
                                    return (
                                        <div key={d} className={`w-full h-[10px] flex items-center justify-center text-[7px] font-medium leading-none ${isToday ? 'bg-purple-600 text-white rounded-full' : 'text-gray-800'}`}>
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

    const renderYearView = () => (
        <div className={`flex-1 overflow-y-auto bg-white pb-20 pt-2 ${getAnimClass()}`}>
            {renderYearBlock(2025)}
            <div className="h-px bg-gray-100 mx-4 mb-8"></div>
            {renderYearBlock(2026)}
            <div className="h-px bg-gray-100 mx-4 mb-8"></div>
            {renderYearBlock(2027)}
        </div>
    );

    const renderMonthBlock = (monthName: string, year: number, daysInMonth: number, startDayOffset: number) => (
        <div key={monthName} className="mb-8">
            <h3 className="sticky top-[33px] bg-white/95 backdrop-blur-sm py-2 px-4 text-xl font-bold text-gray-900 z-10 border-b border-gray-50/50">
                {monthName} <span className="text-gray-400 font-normal ml-1">{year}</span>
            </h3>
            <div className="grid grid-cols-7 auto-rows-fr">
                {Array.from({ length: startDayOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-14 border-b border-gray-50 border-r border-gray-50 bg-gray-50/5"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dayEvents = mockEvents.filter(e => e.day === dayNum && monthName === 'December');
                    const eventCount = dayEvents.length;

                    return (
                        <div
                            key={i}
                            className="h-16 border-b border-gray-50 border-r border-gray-50 relative cursor-pointer active:bg-gray-50 transition-colors"
                            onClick={() => { setDirection('forward'); setCalendarLevel('day'); setSelectedDate(dayNum); }}
                        >
                            <span className={`absolute top-1 left-1/2 -translate-x-1/2 text-sm font-medium ${monthName === 'December' && dayNum === 27 ? 'bg-[#7C3AED] text-white w-7 h-7 rounded-full flex items-center justify-center shadow-sm -mt-0.5' : 'text-gray-900'}`}>
                                {dayNum}
                            </span>

                            {/* Smart Booking Indicator */}
                            {eventCount > 0 && (
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center">
                                    {eventCount === 1 ? (
                                        <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                    ) : (
                                        <div className="flex items-center gap-[1px] px-1 py-0.5 rounded-full bg-gray-100/80">
                                            <div className="w-1 h-1 rounded-full bg-[#7C3AED]"></div>
                                            <span className="text-[9px] font-black text-[#7C3AED] leading-none mb-[0.5px] tracking-tight">{eventCount}</span>
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

    const renderMonthView = () => (
        <div className={`flex-1 overflow-y-auto bg-white ${getAnimClass()}`}>
            <div className="grid grid-cols-7 border-b border-gray-100 pb-2 pt-2 sticky top-0 bg-white z-20 shadow-sm">
                {weekDays.map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
                ))}
            </div>

            <div className="pb-20 pt-2">
                {renderMonthBlock('December', 2025, 31, 1)}
                {renderMonthBlock('January', 2026, 31, 4)}
                {renderMonthBlock('February', 2026, 28, 0)}
            </div>
        </div>
    );

    // -- DAY VIEW --
    const renderDayView = () => (
        <div
            ref={scrollContainerRef}
            className={`flex-1 overflow-auto bg-white relative ${getAnimClass()}`}
            style={{ scrollBehavior: 'smooth' }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {viewMode === 'team' && (
                <div className="flex w-fit sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
                    <div className="w-16 shrink-0 sticky left-0 z-50 bg-white border-r border-gray-50"></div>
                    {staffMembers.map(staff => (
                        <div key={staff.id} className="min-w-[150px] w-[150px] shrink-0 text-center border-l border-gray-50 first:border-l-0 py-2 bg-white">
                            <div className="flex items-center justify-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${staff.color.replace('bg-', 'bg-').replace('50', '500')}`}></div>
                                <div className="text-xs font-bold text-gray-900 truncate px-1">{staff.name}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative w-fit flex" style={{ height: '1600px', minWidth: viewMode === 'team' ? '100%' : 'auto' }}>
                <div className="w-16 shrink-0 border-r border-gray-50 bg-white z-30 sticky left-0 h-full select-none">
                    {hours.map((h, i) => (
                        <div key={h} className="absolute w-16 text-right pr-2" style={{ top: `${i * 60}px` }}>
                            <span className="text-[10px] font-medium text-gray-400 relative -top-2">
                                {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? 'Noon' : `${h - 12} PM`}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex relative items-start">
                    {viewMode === 'personal' ? (
                        <div
                            key={selectedDate}
                            className={`w-full relative min-w-[300px] ${slideDirection === 'left' ? 'animate-in slide-in-from-right duration-300' : slideDirection === 'right' ? 'animate-in slide-in-from-left duration-300' : ''}`}
                            style={{ height: '1600px' }}
                        >
                            {hours.map((h, i) => (
                                <div key={h} className="absolute w-full border-t border-gray-100 h-px z-0" style={{ top: `${i * 60}px` }} onClick={() => handleGridClick(h)}></div>
                            ))}
                            {selectedDate === 27 && (
                                <div className="absolute w-full z-30 pointer-events-none" style={{ top: `847px` }}>
                                    <div className="w-full h-[1px] bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.4)]"></div>
                                    <div className="absolute -left-1 -translate-y-1/2 w-3 h-3 rounded-full bg-[#7C3AED] live-pulse border-2 border-white shadow-sm"></div>
                                </div>
                            )}
                            {mockEvents.filter(e => (e.type === 'personal' || e.type === 'new')).map(event => (
                                <div
                                    key={event.id}
                                    onClick={(e) => { e.stopPropagation(); alert(`Open: ${event.title}`); }}
                                    className="absolute left-2 right-2 rounded-[4px] bg-purple-50 border-l-[3px] border-purple-500 p-2 text-purple-900 overflow-hidden cursor-pointer z-10 shadow-sm animate-in zoom-in-95 duration-200"
                                    style={{ top: `${event.start * 60}px`, height: `${event.duration * 60}px` }}
                                >
                                    <div className="text-sm font-bold leading-tight text-purple-700">{event.title}</div>
                                    <div className="text-xs text-purple-500 mt-0.5">
                                        {event.start > 12 ? event.start - 12 : event.start}:00 {event.start >= 12 ? 'PM' : 'AM'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {staffMembers.map((staff, idx) => (
                                <div key={staff.id} className="w-[150px] shrink-0 border-l border-gray-50 relative first:border-l-0 group h-full">
                                    {hours.map(h => (
                                        <div key={h} className="absolute w-full border-t border-gray-100/50 h-px z-0" style={{ top: `${h * 60}px` }} onClick={() => handleGridClick(h, idx)}></div>
                                    ))}
                                    {mockEvents.filter(e => e.staffId === staff.id).map(event => (
                                        <div
                                            key={event.id}
                                            onClick={(e) => { e.stopPropagation(); alert(`Open: ${event.title}`); }}
                                            className={`absolute left-1 right-1 rounded-[3px] ${staff.color} border-l-[3px] ${staff.border} p-1.5 overflow-hidden z-10 shadow-sm animate-in zoom-in-95`}
                                            style={{ top: `${event.start * 60 + (event.title === 'New Booking' ? 10 : 0)}px`, height: `${event.duration * 60}px` }}
                                        >
                                            <div className={`text-xs font-bold leading-tight ${staff.text}`}>{event.title}</div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full bg-white text-gray-900 flex flex-col font-sans overflow-hidden select-none relative">
            <PulseStyle />
            {/* Modal Overlay */}
            {isModalOpen && renderNewBookingModal()}

            {/* MAIN HEADER - REFINED TO MATCH MOCKUP */}
            <header className="pt-6 pb-2 px-5 bg-[#F2F2F7]/90 backdrop-blur-md sticky top-0 z-50 flex flex-col shrink-0 transition-all">
                {/* Row 1: Back Link */}
                <div className="h-6 flex items-start">
                    {calendarLevel === 'month' && (
                        <div className="flex items-center gap-1 text-purple-600 cursor-pointer active:opacity-50" onClick={() => { setDirection('backward'); setCalendarLevel('year'); }}>
                            <ChevronLeft className="w-5 h-5 -ml-1.5" strokeWidth={2.5} />
                            <span className="text-[17px] font-normal">2025</span>
                        </div>
                    )}
                    {calendarLevel === 'day' && (
                        <div className="flex items-center gap-1 text-purple-600 cursor-pointer active:opacity-50" onClick={() => { setDirection('backward'); setCalendarLevel('month'); }}>
                            <ChevronLeft className="w-5 h-5 -ml-1.5" strokeWidth={2.5} />
                            <span className="text-[17px] font-normal">Month</span>
                        </div>
                    )}
                </div>

                {/* Row 2: Title & Primary Actions */}
                <div className="flex items-end justify-between mt-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-[30px] font-black tracking-tight text-gray-900 leading-tight">
                            {calendarLevel === 'day' ? `Saturday` : calendarLevel === 'month' ? 'December' : '2025'}
                        </h1>
                        <button
                            className="text-sm font-semibold text-purple-600 bg-purple-100/50 px-3 py-1 rounded-full hover:bg-purple-100 transition-colors mb-1.5"
                            onClick={() => { setDirection('forward'); setCalendarLevel('day'); setSelectedDate(27); }}
                        >
                            Today
                        </button>
                    </div>

                    <div className="flex items-center gap-2.5 mb-2">
                        {calendarLevel === 'day' && (
                            <button
                                className="text-purple-600"
                                onClick={() => setViewMode(prev => prev === 'personal' ? 'team' : 'personal')}
                            >
                                <Users className="w-6 h-6" strokeWidth={2} />
                            </button>
                        )}
                        <CalendarIcon className="w-6 h-6 text-purple-600" strokeWidth={2} />
                        <button
                            className="text-purple-600"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus className="w-6 h-6" strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </header>



            {/* DAY SPECIFIC DATE HEADER - REFINED */}
            {calendarLevel === 'day' && (
                <div className="bg-[#F2F2F7] border-b border-gray-200/50 pb-3 shrink-0 z-40 pt-2 transition-all">
                    <div className="flex justify-between px-5 mb-2">
                        {weekDays.map((day, i) => (
                            <div key={i} className="w-10 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between px-5 text-[17px]">
                        {weekDates.map((date) => {
                            const isSelected = selectedDate === date;
                            const isToday = date === 27;
                            return (
                                <div
                                    key={date}
                                    className="w-10 flex flex-col items-center justify-center cursor-pointer"
                                    onClick={() => setSelectedDate(date)}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${isSelected
                                        ? 'bg-[#7C3AED] text-white shadow-sm'
                                        : isToday
                                            ? 'text-[#7C3AED]'
                                            : 'text-gray-900 bg-transparent'
                                        }`}>
                                        {date}
                                    </div>
                                    {isToday && !isSelected && <div className="w-1 h-1 rounded-full bg-[#7C3AED] mt-1"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            {calendarLevel === 'year' && renderYearView()}
            {calendarLevel === 'month' && renderMonthView()}
            {calendarLevel === 'day' && renderDayView()}

            {/* MOCK TAB BAR */}
            {
                !hideNav && (
                    <div className="h-[83px] bg-white border-t border-gray-200 flex items-start justify-around pt-3 shrink-0 pb-8 sticky bottom-0 z-50">
                        <div className="flex flex-col items-center gap-1 text-purple-600 cursor-pointer" onClick={() => onTabChange?.('calendar')}>
                            <CalendarIcon className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col items-center gap-1 text-gray-400 cursor-pointer transition-colors" onClick={() => onTabChange?.('stats')}>
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col items-center gap-1 text-gray-400 cursor-pointer transition-colors" onClick={() => onTabChange?.('settings')}>
                            <Settings className="w-6 h-6" />
                        </div>
                    </div>
                )
            }

        </div >
    );
}
