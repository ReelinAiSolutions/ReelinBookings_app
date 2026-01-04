'use client';

import React, { useState } from 'react';
import PreviewDashboard from '@/components/design-preview/PreviewDashboard';
import PreviewCalendar from '@/components/design-preview/PreviewCalendar';

export default function DesignPreviewPage() {
    const [theme, setTheme] = useState<'current' | 'premium' | 'apple-calendar' | 'desktop-standard'>('premium');
    const [dashTab, setDashTab] = useState<'calendar' | 'stats' | 'settings'>('calendar');

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Control Bar */}
            <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-50 flex items-center justify-between shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-900">Design Lab</h1>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setTheme('premium')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${theme === 'premium' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Mobile Dash
                            </button>
                            <button
                                onClick={() => setTheme('desktop-standard')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${theme === 'desktop-standard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Desktop
                            </button>
                            <button
                                onClick={() => setTheme('apple-calendar')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${theme === 'apple-calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Calendar
                            </button>
                        </div>
                    </div>

                    {(theme === 'premium' || theme === 'desktop-standard') && (
                        <div className="flex items-center gap-2 bg-indigo-50 p-1 rounded-lg border border-indigo-100">
                            <button
                                onClick={() => setDashTab('calendar')}
                                className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${dashTab === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400 hover:text-indigo-600'}`}
                            >
                                View: Calendar
                            </button>
                            <button
                                onClick={() => setDashTab('stats')}
                                className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${dashTab === 'stats' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400 hover:text-indigo-600'}`}
                            >
                                View: Stats
                            </button>
                            <button
                                onClick={() => setDashTab('settings')}
                                className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${dashTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400 hover:text-indigo-600'}`}
                            >
                                View: Settings
                            </button>
                        </div>
                    )}
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-full">
                    <span>Live Preview • localhost:3000/design-preview</span>
                </div>
            </div>

            {/* Device Wrapper */}
            <div className={`flex-1 flex items-center justify-center p-8 overflow-hidden transition-colors duration-500 ${theme === 'apple-calendar' || theme === 'desktop-standard' ? 'bg-[#1a1a1a]' : 'bg-gray-100/50'}`}>
                {theme === 'desktop-standard' ? (
                    // DESKTOP MONITOR FRAME
                    <div className="relative scale-[0.45] md:scale-[0.65] lg:scale-[0.85] transition-transform duration-300 origin-center">
                        <div className="absolute -top-16 left-0 w-full text-center text-sm font-bold text-gray-500 uppercase tracking-widest">
                            27&quot; 5K Retina Display
                        </div>
                        {/* Monitor Bezel */}
                        <div className="w-[1280px] h-[720px] bg-[#111] rounded-2xl p-4 shadow-2xl border border-[#333] relative">
                            {/* Camera */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#333]"></div>
                            {/* Screen Area */}
                            <div className="w-full h-full bg-white rounded-lg overflow-hidden relative shadow-inner">
                                <PreviewDashboard theme="premium" externalTab={dashTab} />
                            </div>
                        </div>
                        {/* Monitor Stand */}
                        <div className="relative w-full flex justify-center">
                            <div className="w-48 h-24 bg-gradient-to-b from-[#b8b8b8] to-[#999] opacity-90" style={{ clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)' }}></div>
                        </div>
                        <div className="w-full flex justify-center -mt-2">
                            <div className="w-56 h-3 bg-[#a8a8a8] rounded-full shadow-lg"></div>
                        </div>
                    </div>
                ) : (
                    // MOBILE PHONE FRAMES
                    <div className="flex gap-8 md:gap-16">
                        {/* Device 1 */}
                        <div className="relative">
                            <div className="absolute -top-12 left-0 w-full text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                                {theme === 'current' ? 'Baseline' : theme === 'premium' ? 'Proposed V2' : 'New Standard'}
                            </div>
                            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl relative ring-4 ring-gray-200/50">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-50"></div>

                                {/* Screen */}
                                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                                    {theme === 'apple-calendar' ? (
                                        <PreviewCalendar />
                                    ) : (
                                        <PreviewDashboard theme={theme as any} externalTab={dashTab} isMobile={true} />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Compare (Desktop Only) - Show 'Current' for reference if we are looking at premium */}
                        {theme === 'premium' && (
                            <div className="hidden xl:block relative opacity-60 scale-90">
                                <div className="absolute -top-12 left-0 w-full text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                                    Current Design (Ref)
                                </div>
                                <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-xl relative grayscale">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-50"></div>
                                    <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative pointer-events-none">
                                        <PreviewDashboard theme="current" isMobile={true} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
