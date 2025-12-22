import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    gradient: string;
    growth?: number;
    trend?: 'up' | 'down' | 'neutral';
    subtitle?: string;
    delay?: number;
    onClick?: () => void;
}

export default function StatCard({
    title,
    value,
    icon: Icon,
    gradient,
    growth,
    trend,
    subtitle,
    delay = 0,
    onClick
}: StatCardProps) {
    const getTrendColor = () => {
        if (!trend) return '';
        return trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
    };

    const getTrendBg = () => {
        if (!trend) return '';
        return trend === 'up' ? 'bg-green-50' : trend === 'down' ? 'bg-red-50' : 'bg-gray-50';
    };

    return (
        <div
            onClick={onClick}
            className={`group relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 ${onClick ? 'cursor-pointer' : ''}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />

            {/* Decorative Circle */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />

            {/* Content */}
            <div className="relative p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {title}
                        </p>
                    </div>
                    <div className={`p-3 bg-gradient-to-br ${gradient} rounded-xl shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
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
