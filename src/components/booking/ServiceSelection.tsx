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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {services.map((service, index) => (
                    <button
                        key={service.id}
                        onClick={() => onSelect(service)}
                        style={{ animationDelay: `${index * 100}ms` }}
                        className="group relative flex flex-col text-left p-6 w-full min-h-[220px] bg-white rounded-[2rem] border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary-600/30 hover:border-primary-500 overflow-hidden ring-1 ring-transparent hover:ring-primary-400/50"
                    >
                        {/* Premium Glow Gradient Background on Hover - Stronger */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"></div>

                        <div className="relative z-10 flex justify-between items-start w-full mb-4">
                            <div className="flex-1 mr-4">
                                <h3 className="text-xl md:text-2xl font-black text-gray-900 group-hover:text-primary-700 transition-colors tracking-tight leading-tight">{service.name}</h3>
                                <p className="text-sm md:text-base font-medium text-gray-500 line-clamp-2 mt-3 leading-relaxed group-hover:text-gray-600 transition-colors">{service.description}</p>
                            </div>
                            <div className="flex-shrink-0 bg-white px-4 py-2.5 rounded-2xl text-base font-black text-gray-900 shadow-sm border border-gray-100 group-hover:bg-primary-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary-600/30 group-hover:border-primary-500 transition-all duration-300 transform group-hover:scale-110">
                                ${service.price}
                            </div>
                        </div>

                        <div className="mt-auto relative z-10 flex items-center justify-between w-full pt-6 border-t border-gray-100 group-hover:border-primary-200 transition-colors">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 group-hover:text-primary-700 transition-colors bg-gray-50 px-3 py-1.5 rounded-lg group-hover:bg-primary-50">
                                <Clock className="w-3.5 h-3.5" />
                                {service.durationMinutes} mins
                            </div>
                            <span className="text-sm font-black text-gray-300 group-hover:text-primary-600 flex items-center transition-all duration-300 group-hover:translate-x-2">
                                Select <ChevronRight className="w-5 h-5 ml-1" />
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
