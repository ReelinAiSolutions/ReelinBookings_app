import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ComparisonChartProps {
    title: string;
    periodAData: any[];
    periodBData: any[];
    dataKey: string;
    periodALabel?: string;
    periodBLabel?: string;
    periodAColor?: string;
    periodBColor?: string;
    formatValue?: (value: number) => string;
}

export default function ComparisonChart({
    title,
    periodAData,
    periodBData,
    dataKey,
    periodALabel = 'Period A',
    periodBLabel = 'Period B',
    periodAColor = '#3B82F6', // Blue
    periodBColor = '#A855F7', // Purple
    formatValue = (val) => val.toString()
}: ComparisonChartProps) {
    // Merge data for side-by-side comparison
    const mergedData = periodAData.map((item, index) => ({
        name: item.name,
        periodA: item[dataKey],
        periodB: periodBData[index]?.[dataKey] || 0
    }));

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4">{title}</h4>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span className="text-xs font-semibold text-gray-600">{periodALabel}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                    <span className="text-xs font-semibold text-gray-600">{periodBLabel}</span>
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mergedData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            tickFormatter={formatValue}
                        />
                        <Tooltip
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={formatValue}
                        />
                        <Bar dataKey="periodA" fill={periodAColor} radius={[8, 8, 0, 0]} maxBarSize={30} name={periodALabel} />
                        <Bar dataKey="periodB" fill={periodBColor} radius={[8, 8, 0, 0]} maxBarSize={30} name={periodBLabel} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
