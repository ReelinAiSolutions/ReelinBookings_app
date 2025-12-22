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
        <div className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
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
                <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
                        {service.name}
                    </h3>
                </div>
            </div>

            {/* Card Content */}
            <div className="p-4 space-y-3">
                {/* Price and Duration */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-gray-900">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-xl font-bold">{service.price}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">{service.durationMinutes} min</span>
                    </div>
                </div>

                {/* Description */}
                {service.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {service.description}
                    </p>
                )}

                {/* Additional Info */}
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {service.bufferTimeMinutes && service.bufferTimeMinutes > 0 && (
                        <span className="px-2 py-1 bg-gray-100 rounded-full">
                            +{service.bufferTimeMinutes}min buffer
                        </span>
                    )}
                    {service.depositRequired && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                            ${service.depositAmount} deposit
                        </span>
                    )}
                    {service.maxCapacity && service.maxCapacity > 1 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            Max {service.maxCapacity} people
                        </span>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                        onClick={() => onEdit(service)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(service)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
