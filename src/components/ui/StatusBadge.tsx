import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

const badgeVariants = cva(
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
    {
        variants: {
            status: {
                confirmed: "bg-green-50 text-green-700 border-green-200",
                pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
                cancelled: "bg-red-50 text-red-700 border-red-200",
                completed: "bg-blue-50 text-blue-700 border-blue-200",
                archived: "bg-gray-50 text-gray-600 border-gray-200",
            },
        },
        defaultVariants: {
            status: "pending",
        },
    }
);

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement>, Omit<VariantProps<typeof badgeVariants>, 'status'> {
    status: string;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
    const normalizedStatus = status.toLowerCase();

    // Map string status to variant
    const variant = (
        ['confirmed', 'pending', 'cancelled', 'completed', 'archived'].includes(normalizedStatus)
            ? normalizedStatus
            : 'pending'
    ) as VariantProps<typeof badgeVariants>['status'];

    const icons = {
        confirmed: <CheckCircle2 className="w-3.5 h-3.5" />,
        cancelled: <XCircle className="w-3.5 h-3.5" />,
        pending: <Clock className="w-3.5 h-3.5" />,
        completed: <CheckCircle2 className="w-3.5 h-3.5" />,
        archived: <AlertCircle className="w-3.5 h-3.5" />
    };

    return (
        <span className={cn(badgeVariants({ status: variant }), className)} {...props}>
            {icons[variant || 'pending']}
            <span className="capitalize">{normalizedStatus}</span>
        </span>
    );
}
