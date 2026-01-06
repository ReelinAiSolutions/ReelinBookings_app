'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function DarkModeToggle() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDark = () => {
        const newDark = !isDark;
        if (newDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            // Update theme-color meta tag dynamically
            document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#000000');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            // Update theme-color meta tag dynamically
            document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
        }
        setIsDark(newDark);
    };

    // Also update on initial mount
    useEffect(() => {
        if (isDark) {
            document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#000000');
        } else {
            document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
        }
    }, [isDark]);

    return (
        <button
            onClick={toggleDark}
            className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
            aria-label="Toggle Dark Mode"
        >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>
    );
}
