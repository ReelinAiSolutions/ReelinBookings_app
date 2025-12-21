import React from 'react';
import { Service } from '@/types';
import { Clock, ChevronRight } from 'lucide-react';

interface ServiceSelectionProps {
    services: Service[];
    onSelect: (service: Service) => void;
}

export default function ServiceSelection({ services, onSelect }: ServiceSelectionProps) {
    return (
        <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Select a Service</h2>
                    <p className="text-gray-500 mt-1">Choose the perfect experience for you.</p>
                </div>
                <div className="hidden md:block text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">Step 1 of 4</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                    <button
                        key={service.id}
                        onClick={() => onSelect(service)}
                        className="group relative flex flex-col text-left p-6 w-full h-full bg-white border border-gray-100 rounded-2xl hover:border-transparent hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:ring-2 hover:ring-primary-500/20 transition-all duration-300"
                    >
                        <div className="flex justify-between items-start w-full mb-4">
                            <div className="flex-1 mr-4">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{service.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mt-1 leading-relaxed">{service.description}</p>
                            </div>
                            <div className="flex-shrink-0 bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-black text-gray-900 border border-gray-100 group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
                                ${service.price}
                            </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between w-full pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                <Clock className="w-3.5 h-3.5" />
                                {service.durationMinutes} mins
                            </div>
                            <span className="text-sm font-bold text-gray-300 group-hover:text-primary-600 flex items-center transition-colors">
                                Select <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
