import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ComparisonStatCardProps {
    title: string;
    periodAValue: string | number;
    periodBValue: string | number;
    icon: LucideIcon;
    gradient: string;
    periodALabel?: string;
    periodBLabel?: string;
    delay?: number;
}

export default function ComparisonStatCard({
    title,
    periodAValue,
    periodBValue,
    icon: Icon,
    gradient,
    periodALabel = 'Period A',
    periodBLabel = 'Period B',
    delay = 0
}: ComparisonStatCardProps) {
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
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />

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

                {/* Values Comparison */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Period A */}
                    <div className="space-y-1">
                        <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block">
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
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isPositive ? 'bg-green-50' : diff < 0 ? 'bg-red-50' : 'bg-gray-50'
                        }`}>
                        <svg
                            className={`w-5 h-5 ${isPositive ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600'
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
                            <span className={`text-sm font-bold ${isPositive ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600'
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
