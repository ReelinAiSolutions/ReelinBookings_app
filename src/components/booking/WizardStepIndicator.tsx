import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
    id: number;
    label: string;
    desc: string;
}

interface WizardStepIndicatorProps {
    currentStep: number;
    steps: Step[];
}

export default function WizardStepIndicator({ currentStep, steps }: WizardStepIndicatorProps) {
    return (
        <>
            {/* Progress Sidebar (Desktop) */}
            <div className="hidden lg:block w-72 shrink-0 sticky top-32 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl shadow-gray-900/5 border border-white/50 relative overflow-hidden group/card hover:shadow-primary-900/10 transition-all duration-500 ring-1 ring-gray-900/5">
                    {/* Decorative gradient blob */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-500/10 to-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none animate-pulse"></div>

                    <h3 className="font-black text-gray-900 mb-8 text-xl tracking-tight relative z-10">Your Journey</h3>
                    <div className="space-y-0 relative z-10">
                        {/* Connecting Line - Gradient */}
                        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary-200 via-gray-200 to-transparent -z-10 rounded-full"></div>

                        {steps.map((step, idx) => (
                            <div key={step.id} className="flex gap-4 py-4 group cursor-default">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 relative z-10 ${idx < currentStep
                                    ? 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-lg shadow-primary-500/30 scale-100 ring-2 ring-white'
                                    : idx === currentStep
                                        ? 'bg-white text-primary-600 shadow-2xl shadow-primary-500/30 scale-110 ring-[3px] ring-primary-500 border-2 border-transparent translate-x-1'
                                        : 'bg-white border-2 border-gray-100 text-gray-300 scale-90 grayscale'
                                    }`}>
                                    {idx < currentStep ? <Check className="w-5 h-5" /> : <span className="font-black text-sm">{idx + 1}</span>}

                                    {/* Active Pulse Ring - Stronger */}
                                    {idx === currentStep && (
                                        <div className="absolute -inset-2 rounded-full border-2 border-primary-500/20 animate-ping"></div>
                                    )}
                                </div>
                                <div className={`pt-2 transition-all duration-500 ${idx === currentStep ? 'translate-x-2' : ''}`}>
                                    <p className={`text-sm font-black transition-colors duration-300 ${idx <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                                    <p className={`text-xs font-bold mt-0.5 transition-colors duration-300 ${idx === currentStep ? 'text-primary-600' : 'text-gray-400'}`}>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Progress (Horizontal) */}
            <div className="lg:hidden w-full py-3 bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-100/50 shadow-sm transition-all duration-500">
                <div className="flex justify-between items-center max-w-sm mx-auto relative px-6">
                    {/* Connecting Background Line - Smoother & thinner */}
                    <div className="absolute left-10 right-10 top-4 h-0.5 bg-gray-100 -z-10 rounded-full"></div>

                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex flex-col items-center group relative cursor-default">
                            {/* Glowing Ring Container */}
                            <div className={`relative w-8 h-8 flex items-center justify-center rounded-full text-[10px] font-black transition-all duration-500 z-10 ${idx < currentStep
                                ? 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-lg shadow-primary-500/30 scale-100 ring-2 ring-white'
                                : idx === currentStep
                                    ? 'bg-white text-primary-600 shadow-xl shadow-primary-500/20 scale-125 ring-2 ring-primary-500 transform -translate-y-0.5'
                                    : 'bg-white border border-gray-100 text-gray-300 shadow-sm scale-90'
                                }`}>
                                {idx < currentStep ? <Check className="w-3.5 h-3.5" /> : idx + 1}

                                {/* Active Pulse Ring */}
                                {idx === currentStep && (
                                    <div className="absolute inset-0 rounded-full border border-primary-500/30 animate-ping"></div>
                                )}
                            </div>

                            {/* Label */}
                            <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 transition-all duration-300 ${idx === currentStep
                                ? 'text-primary-700 translate-y-0 opacity-100'
                                : idx < currentStep
                                    ? 'text-gray-400 translate-y-0 opacity-70'
                                    : 'text-gray-300 translate-y-0.5 opacity-0' // Hide future labels for cleaner look
                                }`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
