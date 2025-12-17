import React from 'react';
import { Service } from '@/types';
import { Clock, ChevronRight } from 'lucide-react';

interface ServiceSelectionProps {
    services: Service[];
    onSelect: (service: Service) => void;
}

export default function ServiceSelection({ services, onSelect }: ServiceSelectionProps) {
    return (
        <div className="p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Select a Service</h2>
                <div className="text-sm text-gray-500 font-medium">Step 1 of 4</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                    <button
                        key={service.id}
                        onClick={() => onSelect(service)}
                        className="flex items-start p-4 text-left border rounded-xl hover:border-primary-500 hover:bg-primary-50/50 transition-all group"
                    >
                        {/* Service Image (Optional) */}
                        {service.imageUrl && (
                            <img src={service.imageUrl} alt={service.name} className="w-16 h-16 rounded-lg object-cover bg-gray-100 mr-4" />
                        )}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">{service.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-2 leading-relaxed">{service.description}</p>

                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full w-fit">
                                <Clock className="w-3.5 h-3.5" />
                                {service.durationMinutes} mins
                            </div>
                        </div>
                        <div className="ml-auto flex flex-col items-end justify-between h-full">
                            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm">
                                ${service.price}
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                                    <Clock className="w-3.5 h-3.5" />
                                    {service.durationMinutes} mins
                                </div>
                                <span className="text-primary-600 text-sm font-bold flex items-center group-hover:translate-x-1 transition-transform">
                                    Select <ChevronRight className="w-4 h-4 ml-1" />
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
