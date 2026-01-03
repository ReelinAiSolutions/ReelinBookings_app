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
    const categoryColor = service.categoryColor || '#3B82F6';

    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
        <div className="group relative bg-white rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-500 hover:shadow-[0_32px_64px_rgba(0,0,0,0.08)] hover:-translate-y-2">
            {/* Image or Gradient Header */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                {hasImage ? (
                    <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                            background: `linear-gradient(135deg, ${hexToRgba(categoryColor, 0.9)}, ${hexToRgba(categoryColor, 0.4)})`
                        }}
                    >
                        <ImageIcon className="w-16 h-16 text-white/30" />
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Category Badge */}
                {service.category && (
                    <div
                        className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white backdrop-blur-sm"
                        style={{ backgroundColor: hexToRgba(categoryColor, 0.9) }}
                    >
                        {service.category}
                    </div>
                )}

                {/* Visibility Indicator */}
                <div className="absolute top-3 right-3">
                    {service.isVisible === false ? (
                        <div className="p-1.5 bg-gray-900/80 backdrop-blur-sm rounded-full">
                            <EyeOff className="w-4 h-4 text-white" />
                        </div>
                    ) : (
                        <div className="p-1.5 bg-green-500/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>

                {/* Service Name on Image */}
                <div className="absolute bottom-4 left-6 right-6">
                    <h3 className="text-xl font-black text-white leading-tight line-clamp-2 drop-shadow-md">
                        {service.name}
                    </h3>
                </div>
            </div>

            {/* Card Content */}
            <div className="p-8 space-y-4">
                {/* Price and Duration */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-gray-900">
                        <span className="text-2xl font-black tracking-tight">${service.price}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full text-gray-500 font-bold text-[10px] uppercase tracking-widest border border-gray-100">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.durationMinutes} MIN</span>
                    </div>
                </div>

                {/* Description */}
                {service.description ? (
                    <p className="text-xs font-bold text-gray-400 line-clamp-2 leading-relaxed">
                        {service.description}
                    </p>
                ) : (
                    <p className="text-xs font-bold text-gray-200 italic">No description provided</p>
                )}

                {/* Additional Info */}
                <div className="flex flex-wrap gap-2 pt-2">
                    {service.bufferTimeMinutes && service.bufferTimeMinutes > 0 && (
                        <span className="px-2 py-0.5 bg-indigo-50/50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-100/50">
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
                    className="flex-1 flex items-center justify-center gap-2 h-12 bg-white border border-gray-200 text-gray-900 rounded-[18px] text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
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
