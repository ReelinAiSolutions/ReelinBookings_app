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
            {/* Progress Sidebar (Desktop) - Simplified to content only */}
            <div className="hidden lg:block animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                <h3 className="font-black text-gray-400 mb-2 text-[9px] uppercase tracking-[0.2em] pl-1">Your Journey</h3>

                <div className="relative pl-3 border-l-[1.5px] border-gray-100 space-y-2">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="relative pl-6 group">
                            {/* Dot */}
                            <div className={`absolute -left-[7.5px] top-1 w-3 h-3 rounded-full border-[3px] transition-all duration-500 ${idx <= currentStep
                                ? 'bg-white border-primary-600 shadow-lg shadow-primary-500/20 scale-110'
                                : 'bg-gray-100 border-white ring-1 ring-gray-100/50'
                                }`}></div>

                            <div className={`transition-all duration-500 ${idx === currentStep ? 'translate-x-1' : ''}`}>
                                <p className={`text-sm font-black transition-colors duration-300 leading-none ${idx <= currentStep ? 'text-gray-900' : 'text-gray-300'}`}>
                                    {step.label}
                                </p>
                                {idx === currentStep && (
                                    <p className="text-[9px] font-bold text-primary-600 mt-1 animate-in fade-in slide-in-from-left-1">
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
                <div className="px-6 pt-3 pb-1">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step {currentStep + 1} of {steps.length}</span>
                        <span className="text-[10px] font-bold text-primary-600">{steps[currentStep].label}</span>
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
