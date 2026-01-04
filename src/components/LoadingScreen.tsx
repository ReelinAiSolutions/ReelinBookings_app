import React from 'react';
import Image from 'next/image';

export default function LoadingScreen() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                {/* Reelin Logo */}
                <div className="relative">
                    <Image
                        src="/icon-180.png"
                        alt="Reelin Bookings"
                        width={80}
                        height={80}
                        className="animate-pulse"
                    />
                </div>

                {/* Loading Text */}
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">Reelin Bookings</h2>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
