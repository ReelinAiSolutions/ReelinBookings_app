import React from 'react';
import { Service } from '@/types';
import { Clock, DollarSign, Edit2, Trash2, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';

interface ServiceCardProps {
    service: Service;
    onEdit: (service: Service) => void;
    onDelete: (service: Service) => void;
}

export default function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
    const hasImage = service.imageUrl && service.imageUrl.trim() !== '';
    const categoryColor = service.categoryColor || '#A855F7';

    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
        <div className="group relative bg-white rounded-[40px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_rgba(168,85,247,0.15)] hover:-translate-y-2 hover:border-[#A855F7]/30">
            {/* Dark Premium Header */}
            <div className="h-24 relative overflow-hidden bg-gradient-to-br from-[#1a0b2e] to-[#2e1065]">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#d946ef]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-[#d946ef]/20 transition-colors" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#A855F7]/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none group-hover:bg-[#A855F7]/20 transition-colors" />

                {/* Visibility Indicator (Top Right) */}
                <div className="absolute top-4 right-4 z-10">
                    {service.isVisible === false ? (
                        <div className="p-2 bg-gray-900/50 backdrop-blur-md rounded-full border border-white/10">
                            <EyeOff className="w-4 h-4 text-gray-400" />
                        </div>
                    ) : (
                        <div className="p-2 bg-emerald-500/20 backdrop-blur-md rounded-full border border-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-4 h-4 text-emerald-400" />
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Image/Icon Layer */}
            <div className="absolute top-10 left-8 z-10">
                <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-[2rem] blur-md transform group-hover:scale-110 transition-transform duration-500" />
                    <div className="w-20 h-20 rounded-[2rem] border-4 border-white shadow-2xl overflow-hidden relative z-10 bg-white group-hover:scale-105 transition-transform duration-500">
                        {hasImage ? (
                            <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                        ) : (
                            <div
                                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
                                style={{
                                    /* Optional: Use category color for subtle tint */
                                    background: categoryColor ? `linear-gradient(135deg, ${hexToRgba(categoryColor, 0.1)}, ${hexToRgba(categoryColor, 0.05)})` : undefined
                                }}
                            >
                                <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-[#A855F7] transition-colors" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="pt-12 px-8 pb-8">
                {/* Title & Category */}
                <div className="mb-6">
                    {service.category && (
                        <span
                            className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] mb-2"
                            style={{
                                color: categoryColor,
                                backgroundColor: hexToRgba(categoryColor, 0.1)
                            }}
                        >
                            {service.category}
                        </span>
                    )}
                    <h3 className="text-2xl font-black text-gray-900 leading-tight tracking-tight group-hover:text-[#d946ef] transition-colors line-clamp-2">
                        {service.name}
                    </h3>
                </div>

                {/* Price & Specs Row */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1">
                        <span className="text-3xl font-black text-gray-900 tracking-tighter">${service.price}</span>
                    </div>
                    <div className="h-8 w-px bg-gray-100"></div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-4 h-4 text-gray-300" />
                        <span className="text-xs font-bold uppercase tracking-wider">{service.durationMinutes}m</span>
                    </div>
                </div>

                {/* Description */}
                <div className="mb-8 min-h-[3rem]">
                    {service.description ? (
                        <p className="text-xs font-bold text-gray-400 line-clamp-3 leading-relaxed">
                            {service.description}
                        </p>
                    ) : (
                        <p className="text-xs font-bold text-gray-200 italic">No description provided</p>
                    )}
                </div>

                {/* Action Footer */}
                <div className="flex items-center gap-2 pt-6 border-t border-gray-50">
                    {service.bufferTimeMinutes && service.bufferTimeMinutes > 0 && (
                        <span className="px-2 py-0.5 bg-[#F3E8FF]/50 text-[#A855F7] text-[10px] font-black uppercase tracking-widest rounded-md border border-[#A855F7]/20">
                            +{service.bufferTimeMinutes}m buffer
                        </span>
                    )}
                    {service.depositRequired && (
                        <span className="px-2 py-0.5 bg-amber-50/50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-amber-100/50">
                            ${service.depositAmount} deposit
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-8 pt-0">
                <button
                    onClick={() => onEdit(service)}
                    className="flex-1 flex items-center justify-center gap-2 h-12 bg-white border border-gray-200 text-gray-900 rounded-[18px] text-[10px] font-black uppercase tracking-widest hover:bg-[#F3E8FF] hover:border-[#A855F7]/50 hover:text-[#d946ef] transition-all active:scale-95"
                >
                    <Edit2 className="w-4 h-4" />
                    Edit
                </button>
                <button
                    onClick={() => onDelete(service)}
                    className="w-full flex items-center justify-center gap-2 h-12 bg-red-50 text-red-500 rounded-[18px] hover:bg-red-500 hover:text-white transition-all active:scale-95 border border-transparent hover:shadow-lg hover:shadow-red-200"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
