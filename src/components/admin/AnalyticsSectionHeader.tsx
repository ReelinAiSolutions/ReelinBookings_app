import React from 'react';
import { LucideIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface AnalyticsSectionHeaderProps {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    isOpen: boolean;
    onToggle: () => void;
    gradient: string;
}

export default function AnalyticsSectionHeader({
    title,
    subtitle,
    icon: Icon,
    isOpen,
    onToggle,
    gradient
}: AnalyticsSectionHeaderProps) {
    return (
        <button
            onClick={onToggle}
            className="group w-full flex items-center justify-between p-5 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-lg transition-all duration-200 mb-4"
        >
            <div className="flex items-center gap-4">
                {/* Icon with Gradient */}
                <div className={`p-3 bg-gradient-to-br ${gradient} rounded-xl shadow-md group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-6 h-6 text-white" />
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
