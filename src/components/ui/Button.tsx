import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full";

    const variants = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20 focus:ring-primary-500 border border-transparent",
        secondary: "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm focus:ring-gray-200",
        outline: "border-2 border-gray-200 bg-transparent text-gray-700 hover:border-primary-600 hover:text-primary-600 focus:ring-primary-500",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20 focus:ring-red-500",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    };

    const sizes = {
        sm: "px-4 py-1.5 text-xs tracking-wide",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3.5 text-base"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed transform-none' : 'active:scale-95'} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
            ) : null}
            {children}
        </button>
    );
};
