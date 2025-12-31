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
            <div className="hidden lg:block w-72 shrink-0 sticky top-32 animate-in fade-in slide-in-from-left-4 duration-700 delay-100 px-6">
                <h3 className="font-black text-gray-300 mb-8 text-sm uppercase tracking-widest pl-2">Your Journey</h3>

                <div className="relative pl-4 border-l-2 border-gray-100 space-y-8">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="relative pl-8 group">
                            {/* Dot */}
                            <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 transition-all duration-500 ${idx <= currentStep
                                    ? 'bg-white border-primary-600 shadow-lg shadow-primary-500/30 scale-110'
                                    : 'bg-gray-100 border-white ring-1 ring-gray-100'
                                }`}></div>

                            <div className={`transition-all duration-500 ${idx === currentStep ? 'translate-x-2' : ''}`}>
                                <p className={`text-xl font-black transition-colors duration-300 leading-none ${idx <= currentStep ? 'text-gray-900' : 'text-gray-300'}`}>
                                    {step.label}
                                </p>
                                {idx === currentStep && (
                                    <p className="text-sm font-bold text-primary-600 mt-2 animate-in fade-in slide-in-from-left-2">
                                        {step.desc}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Progress (Horizontal) - Simplified & Cleaner */}
            <div className="lg:hidden w-full bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 transition-all duration-500 supports-[backdrop-filter]:bg-white/80">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Step {currentStep + 1} of {steps.length}</span>
                        <span className="text-xs font-bold text-primary-600">{steps[currentStep].label}</span>
                    </div>
                    {/* Minimal Progress Bar */}
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-600 transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </>
    );
}
