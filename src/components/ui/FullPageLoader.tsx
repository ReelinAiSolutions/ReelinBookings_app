import React from 'react';
import { Zap } from 'lucide-react';

export default function FullPageLoader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white h-[100dvh] w-screen overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 -left-20 w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-multiply animate-pulse" />
            <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none opacity-50 mix-blend-multiply animate-pulse delay-700" />

            <div className="relative flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500">
                {/* Logo Container with Pulsing Ring */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-[2rem] blur-xl opacity-20 animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-gray-900 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-purple-500/20 ring-4 ring-white">
                        <Zap className="w-10 h-10 text-white fill-white animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                    </div>
                </div>

                {/* Text and Loading Bar */}
                <div className="flex flex-col items-center gap-3">
                    <h2 className="text-sm font-black text-gray-900 tracking-[0.2em] uppercase">Reelin Bookings</h2>

                    {/* Minimalist Progress Bar */}
                    <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-600 to-blue-600 w-1/3 animate-[loading_1s_ease-in-out_infinite] rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
