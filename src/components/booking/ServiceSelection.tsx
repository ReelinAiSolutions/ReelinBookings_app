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

            <div className="space-y-12">
                {Object.entries(
                    services.reduce((acc, service) => {
                        const category = service.category || 'Other';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(service);
                        return acc;
                    }, {} as Record<string, Service[]>)
                ).sort(([a], [b]) => {
                    if (a === 'Other') return 1;
                    if (b === 'Other') return -1;
                    return a.localeCompare(b);
                }).map(([category, categoryServices]) => (
                    <div key={category}>
                        {/* Only show header if there are actually multiple categories or if the single category isn't just "Other"/Blank */}
                        {(Object.keys(services.reduce((acc, s) => { const c = s.category || 'Other'; if (!acc[c]) acc[c] = []; acc[c].push(s); return acc; }, {} as Record<string, any>)).length > 1 || category !== 'Other') && (
                            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-6 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-primary-600"></span>
                                {category === 'Other' ? 'General Services' : category}
                            </h3>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {categoryServices.map((service, index) => (
                                <button
                                    key={service.id}
                                    onClick={() => onSelect(service)}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    className="group relative flex flex-col text-left p-8 w-full min-h-[200px] bg-white rounded-[2.5rem] border-2 border-transparent transition-all duration-300 hover:border-primary-500 hover:shadow-2xl hover:shadow-primary-600/20 active:scale-[0.98] ring-1 ring-gray-100/50 hover:ring-0"
                                >
                                    {/* 1. Subtle Selection Gradient (only on hover) */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]" />

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start w-full mb-6">
                                            <div className="flex-1 mr-6">
                                                <h3 className="text-2xl md:text-3xl font-black text-gray-900 group-hover:text-primary-600 transition-colors tracking-tight leading-none mb-3">
                                                    {service.name}
                                                </h3>
                                                <p className="text-base font-medium text-gray-500 line-clamp-2 leading-relaxed group-hover:text-gray-600 transition-colors">
                                                    {service.description}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 bg-gray-50 px-5 py-3 rounded-2xl text-lg font-black text-gray-900 border border-gray-100 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-500 transition-all duration-300 group-hover:scale-110 shadow-sm">
                                                ${service.price}
                                            </div>
                                        </div>

                                        <div className="mt-auto flex items-center justify-between w-full pt-6 border-t border-gray-50 group-hover:border-primary-100 transition-colors">
                                            <div className="flex items-center gap-2.5 text-sm font-bold text-gray-400 group-hover:text-primary-700 transition-colors bg-gray-50 px-4 py-2 rounded-xl group-hover:bg-primary-50 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-primary-200/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                                <Clock className="w-4 h-4 relative z-10" />
                                                <span className="relative z-10">{service.durationMinutes} mins</span>
                                            </div>
                                            <span className="text-base font-black text-gray-300 group-hover:text-primary-600 flex items-center transition-all duration-300 group-hover:translate-x-2">
                                                Select <ChevronRight className="w-6 h-6 ml-1" strokeWidth={3} />
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
