'use client';

import { useEffect } from 'react';
import '@iframe-resizer/child';

export default function ResizeListener() {
    useEffect(() => {
        // The import automatically initializes the listener.
        // We can add custom configuration here if needed, but defaults are usually fine.
    }, []);

    return null;
}
