import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ComparisonStatCardProps {
    title: string;
    periodAValue: string | number;
    periodBValue: string | number;
    icon: LucideIcon;
    color?: 'green' | 'blue' | 'purple' | 'orange' | 'yellow' | 'teal' | 'indigo' | 'pink' | 'emerald';
    periodALabel?: string;
    periodBLabel?: string;
    delay?: number;
}

const colorMap = {
    green: {
        gradientStyle: { background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)' },
        glowVal: '34, 197, 94', // #22c55e
        fallback: 'bg-[#22c55e]'
    },
    blue: {
        gradientStyle: { background: 'linear-gradient(135deg, #a855f7 0%, #7C3AED 100%)' },
        glowVal: '168, 85, 247', // #a855f7
        fallback: 'bg-primary-600'
    },
    purple: {
        gradientStyle: { background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' },
        glowVal: '124, 58, 237', // #7C3AED
        fallback: 'bg-primary-500'
    },
    orange: {
        gradientStyle: { background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' },
        glowVal: '249, 115, 22', // #f97316
        fallback: 'bg-[#f97316]'
    },
    yellow: {
        gradientStyle: { background: 'linear-gradient(135deg, #eab308 0%, #f97316 100%)' },
        glowVal: '234, 179, 8', // #eab308
        fallback: 'bg-[#eab308]'
    },
    teal: {
        gradientStyle: { background: 'linear-gradient(135deg, #2dd4bf 0%, #10b981 100%)' },
        glowVal: '45, 212, 191', // #2dd4bf
        fallback: 'bg-[#2dd4bf]'
    },
    indigo: {
        gradientStyle: { background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' },
        glowVal: '79, 70, 229', // #4F46E5
        fallback: 'bg-primary-500'
    },
    pink: {
        gradientStyle: { background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)' },
        glowVal: '236, 72, 153', // #ec4899
        fallback: 'bg-[#ec4899]'
    },
    emerald: {
        gradientStyle: { background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)' },
        glowVal: '16, 185, 129', // #10b981
        fallback: 'bg-[#10b981]'
    }
};

export default function ComparisonStatCard({
    title,
    periodAValue,
    periodBValue,
    icon: Icon,
    color = 'blue',
    periodALabel = 'Period A',
    periodBLabel = 'Period B',
    delay = 0
}: ComparisonStatCardProps) {
    const config = colorMap[color] || colorMap.blue;
    const { gradientStyle, glowVal, fallback } = config;

    // Use inline style for shadow to support older mobile browsers
    const shadowStyle = {
        boxShadow: `0 10px 15px -3px rgba(${glowVal}, 0.2), 0 4px 6px -2px rgba(${glowVal}, 0.1)`
    };

    // Calculate difference
    const numA = typeof periodAValue === 'string' ? parseFloat(periodAValue.replace(/[^0-9.-]/g, '')) : periodAValue;
    const numB = typeof periodBValue === 'string' ? parseFloat(periodBValue.replace(/[^0-9.-]/g, '')) : periodBValue;
    const diff = numA - numB;
    const percentDiff = numB !== 0 ? ((diff / numB) * 100) : 0;
    const isPositive = diff > 0;

    return (
        <div
            className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Gradient Background */}
            <div
                className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
                style={gradientStyle}
            />

            {/* Content */}
            <div className="relative p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex-1 text-left">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {title}
                        </p>
                    </div>
                    <div className="relative group/icon flex-shrink-0">
                        {/* Glow Layer */}
                        <div
                            className="absolute inset-[-6px] rounded-xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"
                            style={gradientStyle}
                        />

                        {/* Icon Container with Fallback Background and Colored Shadow */}
                        <div
                            className={`relative p-3 ${fallback} rounded-xl border border-white/20 transition-transform duration-300 group-hover/icon:scale-110`}
                            style={{ ...shadowStyle, ...gradientStyle }}
                        >
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Values Comparison */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Period A */}
                    <div className="space-y-1">
                        <div className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-md inline-block">
                            Period A
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                            {periodAValue}
                        </h3>
                    </div>

                    {/* Period B */}
                    <div className="space-y-1">
                        <div className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-md inline-block">
                            Period B
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                            {periodBValue}
                        </h3>
                    </div>
                </div>

                {/* Difference */}
                <div className="pt-2 border-t border-gray-100">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isPositive ? 'bg-[#f0fdf4]' : diff < 0 ? 'bg-[#fef2f2]' : 'bg-[#f9fafb]'
                        }`}>
                        <svg
                            className={`w-5 h-5 ${isPositive ? 'text-[#16a34a]' : diff < 0 ? 'text-[#dc2626]' : 'text-[#4b5563]'
                                }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {isPositive ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            ) : diff < 0 ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                            )}
                        </svg>
                        <div className="flex-1">
                            <span className={`text-sm font-bold ${isPositive ? 'text-[#16a34a]' : diff < 0 ? 'text-[#dc2626]' : 'text-[#4b5563]'
                                }`}>
                                {isPositive ? '+' : ''}{Math.abs(percentDiff).toFixed(1)}%
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                                {isPositive ? 'higher' : diff < 0 ? 'lower' : 'same'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shine Effect on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </div>
        </div>
    );
}
