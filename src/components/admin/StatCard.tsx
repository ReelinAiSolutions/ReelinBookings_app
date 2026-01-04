import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color?: 'green' | 'blue' | 'purple' | 'orange' | 'yellow' | 'teal' | 'indigo' | 'pink' | 'emerald';
    growth?: number;
    trend?: 'up' | 'down' | 'neutral';
    subtitle?: string;
    delay?: number;
    onClick?: () => void;
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

export default function StatCard({
    title,
    value,
    icon: Icon,
    color = 'blue',
    growth,
    trend,
    subtitle,
    delay = 0,
    onClick
}: StatCardProps) {
    const config = colorMap[color] || colorMap.blue;
    const { gradientStyle, glowVal, fallback } = config;

    // Use inline style for shadow to support older mobile browsers that might fail on Tailwind opacity syntax
    const shadowStyle = {
        boxShadow: `0 10px 15px -3px rgba(${glowVal}, 0.2), 0 4px 6px -2px rgba(${glowVal}, 0.1)`
    };

    const getTrendColor = () => {
        if (!trend) return '';
        return trend === 'up' ? 'text-[#16a34a]' : trend === 'down' ? 'text-[#dc2626]' : 'text-[#4b5563]'; // green-600, red-600, gray-600
    };

    const getTrendBg = () => {
        if (!trend) return '';
        return trend === 'up' ? 'bg-[#f0fdf4]' : trend === 'down' ? 'bg-[#fef2f2]' : 'bg-[#f9fafb]'; // green-50, red-50, gray-50
    };

    return (
        <div
            onClick={onClick}
            className={`group relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 ${onClick ? 'cursor-pointer' : ''}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Gradient Background */}
            <div
                className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
                style={gradientStyle}
            />

            {/* Decorative Circle */}
            <div
                className="absolute -right-8 -top-8 w-32 h-32 opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"
                style={gradientStyle}
            />

            {/* Content */}
            <div className="relative p-5 md:p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider truncate">
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
                            className={`relative p-2.5 md:p-3 ${fallback} rounded-xl border border-white/20 transition-transform duration-300 group-hover/icon:scale-110`}
                            style={{ ...shadowStyle, ...gradientStyle }}
                        >
                            <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Value */}
                <div>
                    <h3 className="text-4xl font-black text-gray-900 tracking-tight">
                        {value}
                    </h3>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    {growth !== undefined && trend ? (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${getTrendBg()}`}>
                            <svg
                                className={`w-4 h-4 ${getTrendColor()}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {trend === 'up' ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                ) : trend === 'down' ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                )}
                            </svg>
                            <span className={`text-sm font-bold ${getTrendColor()}`}>
                                {Math.abs(growth).toFixed(0)}%
                            </span>
                        </div>
                    ) : (
                        <div />
                    )}
                    {subtitle && (
                        <span className="text-xs text-gray-500 font-medium">
                            {subtitle}
                        </span>
                    )}
                </div>
            </div>

            {/* Shine Effect on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </div>
        </div>
    );
}
