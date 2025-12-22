'use client';

import React from 'react';

interface BrandingInjectorProps {
    primaryColor?: string | null;
}

// Simple helper to adjust color brightness or mix with white/black
// Since we don't have a library, we do it with basic hex math.
const adjustColor = (hex: string, percent: number) => {
    // Percent > 0: Lighten (Mix with White)
    // Percent < 0: Darken (Mix with Black)
    // Percent range: -1.0 to 1.0

    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    if (percent > 0) {
        // Lighten: Target is 255
        r = Math.round(r + (255 - r) * percent);
        g = Math.round(g + (255 - g) * percent);
        b = Math.round(b + (255 - b) * percent);
    } else {
        // Darken: Target is 0
        const p = -percent; // make positive for calc
        r = Math.round(r * (1 - p));
        g = Math.round(g * (1 - p));
        b = Math.round(b * (1 - p));
    }

    const toHex = (n: number) => {
        const h = Math.max(0, Math.min(255, n)).toString(16);
        return h.length === 1 ? '0' + h : h;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export default function BrandingInjector({ primaryColor }: BrandingInjectorProps) {
    if (!primaryColor) return null;

    // Calculate variations in JS to support older devices (iOS Safari < 16.2)
    // that do not support css 'color-mix'.
    // matches: color-mix(in srgb, var(--brand-primary), white 92%) -> very light (92% white, 8% color)
    const lightColor = adjustColor(primaryColor, 0.92);

    // matches: color-mix(in srgb, var(--brand-primary), black 15%) -> slightly dark (15% black)
    const darkColor = adjustColor(primaryColor, -0.15);

    const css = `
        :root {
            --brand-primary: ${primaryColor} !important;
            --brand-primary-light: ${lightColor} !important;
            --brand-primary-dark: ${darkColor} !important;
            
            --primary-50: ${lightColor} !important;
            --primary-600: ${primaryColor} !important;
            --primary-700: ${darkColor} !important;
            
            /* Ensure ring/focus colors match */
            --ring: ${primaryColor} !important;
        }
    `;

    return (
        <style dangerouslySetInnerHTML={{ __html: css }} />
    );
}
