import React from 'react';
import { LucideIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface AnalyticsSectionHeaderProps {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    isOpen: boolean;
    onToggle: () => void;
    color?: 'green' | 'blue' | 'purple' | 'orange' | 'yellow' | 'teal' | 'indigo' | 'pink' | 'emerald';
}

const colorMap = {
    green: {
        gradient: 'from-green-500 to-emerald-600',
        glow: 'shadow-green-500/20',
        fallback: 'bg-green-600'
    },
    blue: {
        gradient: 'from-blue-500 to-cyan-600',
        glow: 'shadow-blue-500/20',
        fallback: 'bg-blue-600'
    },
    purple: {
        gradient: 'from-purple-500 to-pink-600',
        glow: 'shadow-purple-500/20',
        fallback: 'bg-purple-600'
    },
    orange: {
        gradient: 'from-orange-500 to-red-600',
        glow: 'shadow-orange-500/20',
        fallback: 'bg-orange-600'
    },
    yellow: {
        gradient: 'from-yellow-400 to-orange-500',
        glow: 'shadow-yellow-500/20',
        fallback: 'bg-yellow-500'
    },
    teal: {
        gradient: 'from-teal-400 to-emerald-500',
        glow: 'shadow-teal-500/20',
        fallback: 'bg-teal-500'
    },
    indigo: {
        gradient: 'from-indigo-500 to-blue-600',
        glow: 'shadow-indigo-500/20',
        fallback: 'bg-indigo-600'
    },
    pink: {
        gradient: 'from-pink-500 to-rose-600',
        glow: 'shadow-pink-500/20',
        fallback: 'bg-pink-600'
    },
    emerald: {
        gradient: 'from-emerald-500 to-teal-600',
        glow: 'shadow-emerald-500/20',
        fallback: 'bg-emerald-600'
    }
};

export default function AnalyticsSectionHeader({
    title,
    subtitle,
    icon: Icon,
    isOpen,
    onToggle,
    color = 'blue'
}: AnalyticsSectionHeaderProps) {
    const config = colorMap[color] || colorMap.blue;
    const { gradient, glow, fallback } = config;

    return (
        <button
            onClick={onToggle}
            className="group w-full flex items-center justify-between p-5 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-lg transition-all duration-200 mb-4"
        >
            <div className="flex items-center gap-4 text-left">
                {/* Icon with Gradient & Glow */}
                <div className="relative group/icon">
                    {/* Glow Layer */}
                    <div className={`absolute inset-[-4px] bg-gradient-to-br ${gradient} rounded-xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-200`} />

                    {/* Icon Container with Fallback Background and Colored Shadow */}
                    <div className={`relative p-3 bg-gradient-to-br ${gradient} ${fallback} rounded-xl shadow-md ${glow} transition-transform duration-200 group-hover:scale-110`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>

                {/* Text */}
                <div className="text-left">
                    <h3 className="text-lg font-bold text-gray-900">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-sm text-gray-500 font-medium mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {/* Toggle Icon */}
            <div className={`p-2 rounded-lg transition-all duration-200 ${isOpen ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                }`}>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5" />
                ) : (
                    <ChevronDown className="w-5 h-5" />
                )}
            </div>
        </button>
    );
}
